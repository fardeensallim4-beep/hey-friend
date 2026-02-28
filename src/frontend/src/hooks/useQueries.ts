import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type {
  Contact,
  Conversation,
  ConversationSummary,
  Gender,
  MediaType,
  Message,
  MessageStatus,
  Reaction,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch {
        // User may not have a role yet (first visit before init completes)
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1_500,
  });
}

export function useUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 60_000,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      phoneNumber: string;
      displayName: string;
      gender: Gender;
      address: string;
      dateOfBirth: bigint;
      profilePicture: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.registerUser(
        data.phoneNumber,
        data.displayName,
        data.gender,
        data.address,
        data.dateOfBirth,
        data.profilePicture,
      );
      // Poll until the profile is available (canister may need a moment to propagate)
      for (let attempt = 0; attempt < 8; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        const profile = await actor.getCallerUserProfile();
        if (profile) return profile;
      }
      // Final attempt — if still null, invalidate and let the query refetch
      return null;
    },
    onSuccess: (profile) => {
      if (profile) {
        // Seed cache directly so the app transitions without a round-trip
        qc.setQueryData(["callerProfile"], profile);
      }
      // Always invalidate to ensure freshness
      void qc.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useUpdateUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      displayName: string;
      gender: Gender;
      address: string;
      profilePicture: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateUser(
        data.displayName,
        data.gender,
        data.address,
        data.profilePicture,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

// ─── Search Users ────────────────────────────────────────────────────────────

export function useSearchUsers(query: string) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      const isPhone = /^\+?[\d\s\-()]+$/.test(query.trim());
      if (isPhone) {
        return actor.searchUsersByPhoneNumber(query.trim());
      }
      return actor.searchUsersByDisplayName(query.trim());
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
    staleTime: 10_000,
  });
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export function useContacts() {
  const { actor, isFetching } = useActor();
  return useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getContacts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useAddContact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { phoneNumber: string; contactLabel: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.addContact(data.phoneNumber, data.contactLabel);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useRemoveContact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.removeContact(phoneNumber);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export function useConversations() {
  const { actor, isFetching } = useActor();
  return useQuery<ConversationSummary[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5_000,
    staleTime: 2_000,
  });
}

export function useConversation(id: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Conversation | null>({
    queryKey: ["conversation", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getConversation(id);
    },
    enabled: !!actor && !isFetching && !!id,
    staleTime: 30_000,
  });
}

export function useCreateConversation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      isGroup: boolean;
      members: Principal[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createConversation(
        data.name,
        data.description,
        data.isGroup,
        data.members,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useLeaveConversation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.leaveConversation(conversationId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!actor || !conversationId) return [];
      return actor.getMessages(conversationId, BigInt(100), BigInt(0));
    },
    enabled: !!actor && !isFetching && !!conversationId,
    refetchInterval: 3_000,
    staleTime: 1_000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      content: string;
      mediaType: MediaType;
      media: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.sendMessage(
        data.conversationId,
        data.content,
        data.mediaType,
        data.media,
      );
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateMessageStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      messageId: string;
      status: MessageStatus;
      conversationId: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateMessageStatus(data.messageId, data.status);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { messageId: string; conversationId: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteMessage(data.messageId);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
    },
  });
}

export function useMarkConversationAsRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.markConversationAsRead(conversationId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export function useReactions(messageId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Reaction[]>({
    queryKey: ["reactions", messageId],
    queryFn: async () => {
      if (!actor || !messageId) return [];
      return actor.getReactions(messageId);
    },
    enabled: !!actor && !isFetching && !!messageId,
    staleTime: 5_000,
  });
}

export function useAddReaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { messageId: string; emoji: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addReaction(data.messageId, data.emoji);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["reactions", variables.messageId],
      });
    },
  });
}

export function useRemoveReaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reactionId: string; messageId: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.removeReaction(data.reactionId);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["reactions", variables.messageId],
      });
    },
  });
}

// ─── Unread Count ────────────────────────────────────────────────────────────

export function useTotalUnread() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalUnread"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalUnread();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5_000,
    staleTime: 3_000,
  });
}

// ─── Group Members ────────────────────────────────────────────────────────────

export function useAddMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { conversationId: string; member: Principal }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.addMember(data.conversationId, data.member);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      conversationId: string;
      member: Principal;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.removeMember(data.conversationId, data.member);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
    },
  });
}

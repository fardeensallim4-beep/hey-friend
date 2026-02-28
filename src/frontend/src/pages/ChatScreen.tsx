import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, LogOut, MoreVertical, UserPlus, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ExternalBlob, MediaType } from "../backend";
import type { ConversationSummary, UserProfile } from "../backend.d";
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageComposer } from "../components/chat/MessageComposer";
import { UserAvatar } from "../components/shared/Avatar";
import { useI18n } from "../contexts/I18nContext";
import {
  useConversation,
  useLeaveConversation,
  useMarkConversationAsRead,
  useMessages,
  useSendMessage,
} from "../hooks/useQueries";

interface Props {
  summary: ConversationSummary;
  currentProfile: UserProfile;
  onBack: () => void;
}

function getConversationName(
  summary: ConversationSummary,
  _currentProfile: UserProfile,
): string {
  if (summary.conversation.isGroup) return summary.conversation.name;
  return summary.conversation.name || "Unknown";
}

export function ChatScreen({ summary, currentProfile, onBack }: Props) {
  const { t } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationAsRead();
  const leaveConversation = useLeaveConversation();

  const conversationId = summary.conversation.id;
  const { data: messages, isLoading, isError } = useMessages(conversationId);
  const { data: conversation } = useConversation(conversationId);

  const conversationName = getConversationName(summary, currentProfile);
  const isGroup = summary.conversation.isGroup;

  // Mark as read when conversation opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: markAsRead is stable
  useEffect(() => {
    markAsRead.mutate(conversationId);
  }, [conversationId]);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: bottomRef is stable
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = useCallback(
    async (
      content: string,
      mediaType: MediaType,
      media: ExternalBlob | null,
    ) => {
      await sendMessage.mutateAsync({
        conversationId,
        content,
        mediaType,
        media,
      });
    },
    [sendMessage, conversationId],
  );

  const handleLeave = useCallback(async () => {
    try {
      await leaveConversation.mutateAsync(conversationId);
      onBack();
      toast.success("Left the group");
    } catch {
      toast.error("Failed to leave group");
    }
  }, [leaveConversation, conversationId, onBack]);

  // Group messages by date
  const groupedMessages = (() => {
    if (!messages?.length) return [];
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = "";

    for (const msg of messages) {
      const msgDate = new Date(
        Number(msg.timestamp) / 1_000_000,
      ).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        let label = msgDate;
        if (msgDate === today) label = t.chat.today;
        else if (msgDate === yesterday) label = t.chat.yesterday;
        groups.push({ date: label, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  })();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden rounded-xl -ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <UserAvatar name={conversationName} blob={undefined} size="md" online />

        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-foreground truncate leading-tight">
            {conversationName}
          </h2>
          <p className="text-xs text-primary">
            {isGroup
              ? `${conversation?.members.length ?? 0} ${t.chat.members}`
              : t.chat.online}
          </p>
        </div>

        {isGroup && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                {t.chat.addMember}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void handleLeave()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.chat.leaveGroup}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="min-h-full p-2">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loading
                  key={i}
                  className={`flex ${i % 3 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <Skeleton
                    className={`h-12 rounded-2xl ${
                      i % 3 === 0 ? "w-40" : "w-52"
                    }`}
                  />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">
                {t.errors.loadingMessages}
              </p>
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm text-center px-8">
                {isGroup
                  ? `Say hi to everyone in ${conversationName}! 👋`
                  : `Start a conversation with ${conversationName}! 👋`}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {group.date}
                    </span>
                  </div>

                  {group.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={
                        msg.sender.toString() === currentProfile.id.toString()
                      }
                      isGroup={isGroup}
                      senderName={
                        isGroup
                          ? `User ${msg.sender.toString().slice(0, 6)}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ))}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <MessageComposer onSend={handleSend} disabled={sendMessage.isPending} />
    </div>
  );
}

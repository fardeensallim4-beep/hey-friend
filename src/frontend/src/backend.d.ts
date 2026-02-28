import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserProfile {
    id: Principal;
    displayName: string;
    dateOfBirth: bigint;
    createdAt: bigint;
    address: string;
    gender: Gender;
    phoneNumber: string;
    profilePicture?: ExternalBlob;
}
export interface Reaction {
    id: string;
    messageId: string;
    userId: Principal;
    emoji: string;
    timestamp: bigint;
}
export interface Contact {
    displayName: string;
    owner: Principal;
    contactLabel: string;
    phoneNumber: string;
}
export interface Message {
    id: string;
    media?: ExternalBlob;
    status: MessageStatus;
    content: string;
    sender: Principal;
    conversationId: string;
    timestamp: bigint;
    mediaType: MediaType;
}
export interface Conversation {
    id: string;
    members: Array<Principal>;
    isGroup: boolean;
    name: string;
    createdAt: bigint;
    description: string;
}
export interface ConversationSummary {
    lastMessage?: Message;
    conversation: Conversation;
    unreadCount: bigint;
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum MediaType {
    gif = "gif",
    audio = "audio",
    video = "video",
    voice = "voice",
    text = "text",
    emoji = "emoji",
    image = "image",
    sticker = "sticker"
}
export enum MessageStatus {
    deleted = "deleted",
    read = "read",
    sent = "sent",
    received = "received"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addContact(phoneNumber: string, contactLabel: string): Promise<void>;
    addMember(conversationId: string, member: Principal): Promise<void>;
    addReaction(messageId: string, emoji: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createConversation(name: string, description: string, isGroup: boolean, members: Array<Principal>): Promise<string>;
    deleteMessage(messageId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContacts(): Promise<Array<Contact>>;
    getConversation(conversationId: string): Promise<Conversation>;
    getConversations(): Promise<Array<ConversationSummary>>;
    getMessages(conversationId: string, limit: bigint, offset: bigint): Promise<Array<Message>>;
    getProfile(): Promise<UserProfile>;
    getReactions(messageId: string): Promise<Array<Reaction>>;
    getTotalUnread(): Promise<bigint>;
    getUnreadCounts(): Promise<Array<[string, bigint]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    leaveConversation(conversationId: string): Promise<void>;
    markConversationAsRead(conversationId: string): Promise<void>;
    registerUser(phoneNumber: string, displayName: string, gender: Gender, address: string, dateOfBirth: bigint, profilePicture: ExternalBlob | null): Promise<void>;
    removeContact(phoneNumber: string): Promise<void>;
    removeMember(conversationId: string, member: Principal): Promise<void>;
    removeReaction(reactionId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchUsersByDisplayName(name: string): Promise<Array<UserProfile>>;
    searchUsersByPhoneNumber(phoneNumber: string): Promise<Array<UserProfile>>;
    sendMessage(conversationId: string, content: string, mediaType: MediaType, media: ExternalBlob | null): Promise<string>;
    updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>;
    updateUser(displayName: string, gender: Gender, address: string, profilePicture: ExternalBlob | null): Promise<void>;
}

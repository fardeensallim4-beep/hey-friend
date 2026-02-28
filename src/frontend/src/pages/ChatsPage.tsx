import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  EyeOff,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Unlock,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ConversationSummary, UserProfile } from "../backend.d";
import { UserAvatar } from "../components/shared/Avatar";
import { useI18n } from "../contexts/I18nContext";
import {
  useConversations,
  useCreateConversation,
  useSearchUsers,
} from "../hooks/useQueries";

interface Props {
  onSelectConversation: (summary: ConversationSummary) => void;
  currentProfile: UserProfile;
}

type FilterTab = "all" | "unread" | "groups";

const LOCKED_CHATS_KEY = "heyfriend_locked_chats";

function getLockedChats(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCKED_CHATS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setLockedChats(ids: string[]) {
  localStorage.setItem(LOCKED_CHATS_KEY, JSON.stringify(ids));
}

const STATUS_EXCLUDED_KEY = "heyfriend_status_excluded";

function getStatusExcluded(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STATUS_EXCLUDED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveStatusExcluded(ids: string[]) {
  localStorage.setItem(STATUS_EXCLUDED_KEY, JSON.stringify(ids));
}

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (diff < oneDayMs) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 7 * oneDayMs) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Status Row ────────────────────────────────────────────────────────────────

const statusContacts = [
  { id: "s1", name: "Alice", color: "from-pink-500 to-rose-400" },
  { id: "s2", name: "Bob", color: "from-blue-500 to-cyan-400" },
  { id: "s3", name: "Carol", color: "from-emerald-500 to-teal-400" },
  { id: "s4", name: "David", color: "from-amber-500 to-orange-400" },
  { id: "s5", name: "Emma", color: "from-purple-500 to-violet-400" },
];

function StatusRow({ currentProfile }: { currentProfile: UserProfile }) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [excluded, setExcluded] = useState<string[]>(getStatusExcluded);

  const toggleExclude = (id: string) => {
    setExcluded((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      saveStatusExcluded(next);
      return next;
    });
  };

  const hasExclusions = excluded.length > 0;

  return (
    <>
      <div className="px-2 py-2.5">
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {/* My Status */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              type="button"
              className="relative w-14 h-14 group"
              onClick={() =>
                toast("Status feature coming soon", { icon: "✨" })
              }
            >
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/50 group-hover:border-primary/70 transition-colors flex items-center justify-center overflow-hidden">
                <UserAvatar
                  name={currentProfile.displayName}
                  blob={currentProfile.profilePicture}
                  size="lg"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                <Plus className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
              {hasExclusions && (
                <div className="absolute top-0 left-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                  <EyeOff className="w-2 h-2 text-white" />
                </div>
              )}
            </button>
            <div className="flex items-center gap-0.5">
              <span className="text-[0.6rem] font-medium text-muted-foreground max-w-[40px] truncate">
                My Status
              </span>
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                title="Status privacy"
              >
                <Settings className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Contact statuses - only show non-excluded */}
          {statusContacts
            .filter((c) => !excluded.includes(c.id))
            .map((contact) => (
              <button
                key={contact.id}
                type="button"
                className="flex flex-col items-center gap-1 flex-shrink-0 group"
                onClick={() => toast(`${contact.name}'s status`, { icon: "👁️" })}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full p-0.5 bg-gradient-to-br",
                    contact.color,
                  )}
                >
                  <div className="w-full h-full rounded-full bg-background p-0.5">
                    <UserAvatar name={contact.name} size="lg" />
                  </div>
                </div>
                <span className="text-[0.6rem] font-medium text-muted-foreground max-w-[52px] truncate">
                  {contact.name}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Status Privacy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              Who can see my status
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Uncheck contacts to exclude them
            </p>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {statusContacts.map((contact) => {
              const isExcluded = excluded.includes(contact.id);
              return (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/60 transition-colors"
                >
                  <Checkbox
                    id={`status-${contact.id}`}
                    checked={!isExcluded}
                    onCheckedChange={() => toggleExclude(contact.id)}
                  />
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full p-0.5 bg-gradient-to-br flex-shrink-0",
                      contact.color,
                    )}
                  >
                    <div className="w-full h-full rounded-full bg-background p-0.5">
                      <UserAvatar name={contact.name} size="sm" />
                    </div>
                  </div>
                  <Label
                    htmlFor={`status-${contact.id}`}
                    className="flex-1 cursor-pointer text-sm font-medium"
                  >
                    {contact.name}
                  </Label>
                  {isExcluded && (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
          {excluded.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
              {excluded.length} contact{excluded.length > 1 ? "s" : ""} excluded
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Lock Action Sheet ─────────────────────────────────────────────────────────

function LockActionSheet({
  open,
  onClose,
  conversationId,
  conversationName,
  isLocked,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName: string;
  isLocked: boolean;
  onToggle: (id: string, lock: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[320px] rounded-2xl p-0 overflow-hidden">
        <div className="px-4 pt-4 pb-2 border-b border-border">
          <p className="font-semibold text-sm text-center text-foreground truncate">
            {conversationName}
          </p>
        </div>
        <div className="py-1">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-colors"
            onClick={() => {
              onToggle(conversationId, !isLocked);
              onClose();
              toast(
                isLocked
                  ? `"${conversationName}" unlocked`
                  : `"${conversationName}" locked`,
                { icon: isLocked ? "🔓" : "🔒" },
              );
            }}
          >
            {isLocked ? (
              <Unlock className="h-4 w-4 text-amber-500" />
            ) : (
              <Lock className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-medium">
              {isLocked ? "Unlock Chat" : "Lock Chat"}
            </span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-colors"
            onClick={onClose}
          >
            <span className="text-sm text-muted-foreground">Cancel</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── PIN Dialog ────────────────────────────────────────────────────────────────

const CORRECT_PIN = "1234";

function PinDialog({
  open,
  onClose,
  onSuccess,
  conversationName,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  conversationName: string;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(["", "", "", ""]);
      setError(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(false);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-check when all 4 filled
    const filledDigits = [...newDigits];
    if (filledDigits.every((d) => d !== "")) {
      const pin = filledDigits.join("");
      if (pin === CORRECT_PIN) {
        onSuccess();
        onClose();
      } else {
        setError(true);
        setDigits(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[320px] rounded-2xl">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="font-display text-center">
              Chat Locked
            </DialogTitle>
            <p className="text-xs text-muted-foreground text-center">
              Enter PIN to open "{conversationName}"
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            {digits.map((digit, i) => (
              <input
                // biome-ignore lint/suspicious/noArrayIndexKey: pin input positions are stable
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  "w-12 h-12 text-center text-xl font-bold rounded-xl border-2 bg-muted/50 focus:outline-none transition-colors",
                  error
                    ? "border-destructive text-destructive"
                    : digit
                      ? "border-primary text-foreground"
                      : "border-border text-foreground",
                )}
              />
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-center text-sm text-destructive font-medium"
              >
                Incorrect PIN
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Conversation Item ──────────────────────────────────────────────────────────

function ConversationItem({
  summary,
  onClick,
  isActive,
  isLocked,
  onLongPress,
}: {
  summary: ConversationSummary;
  onClick: () => void;
  isActive?: boolean;
  isLocked: boolean;
  onLongPress: () => void;
}) {
  const unread = Number(summary.unreadCount);
  const lastMsg = summary.lastMessage;
  const name = summary.conversation.name || "Unnamed";
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startPress = useCallback(() => {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress();
    }, 600);
  }, [onLongPress]);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (didLongPress.current) return;
    onClick();
  }, [onClick]);

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onMouseMove={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-colors text-left group select-none",
        isActive && "bg-primary/10",
      )}
    >
      <div className="relative flex-shrink-0">
        <UserAvatar
          name={name}
          size="md"
          online={!summary.conversation.isGroup}
        />
        {summary.conversation.isGroup && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <Users className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                "font-medium text-sm truncate",
                unread > 0
                  ? "text-foreground font-semibold"
                  : "text-foreground",
              )}
            >
              {name}
            </span>
            {isLocked && (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {lastMsg && (
            <span className="text-[0.65rem] text-muted-foreground flex-shrink-0 ml-2">
              {formatTimestamp(lastMsg.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate flex-1">
            {isLocked
              ? "🔒 Messages are locked"
              : lastMsg
                ? lastMsg.content.length > 35
                  ? `${lastMsg.content.slice(0, 35)}…`
                  : lastMsg.content
                : "No messages yet"}
          </span>
          {unread > 0 && (
            <Badge className="ml-2 h-5 min-w-[20px] flex items-center justify-center rounded-full px-1.5 bg-primary text-primary-foreground text-xs flex-shrink-0">
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── New Chat Dialog ────────────────────────────────────────────────────────────

function NewChatDialog({
  open,
  onClose,
  currentProfile,
  onConversationCreated,
}: {
  open: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onConversationCreated: (id: string) => void;
}) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);

  const { data: searchResults, isFetching } = useSearchUsers(searchQuery);
  const createConversation = useCreateConversation();

  const filteredResults = useMemo(
    () =>
      (searchResults ?? [])
        .filter((u) => u.id.toString() !== currentProfile.id.toString())
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName, undefined, {
            sensitivity: "base",
          }),
        ),
    [searchResults, currentProfile.id],
  );

  const toggleUser = (user: UserProfile) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id.toString() === user.id.toString());
      if (exists)
        return prev.filter((u) => u.id.toString() !== user.id.toString());
      if (!isGroup) return [user];
      return [...prev, user];
    });
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    if (isGroup && !groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      const name = isGroup ? groupName : selectedUsers[0].displayName;

      const id = await createConversation.mutateAsync({
        name,
        description: groupDesc,
        isGroup,
        members: selectedUsers.map((u) => u.id),
      });

      onConversationCreated(id);
      onClose();
      toast.success(
        isGroup ? `Group "${name}" created!` : `Chat with ${name} started!`,
      );
    } catch {
      toast.error("Failed to create conversation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isGroup ? t.chat.createGroup : t.chat.newChat}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group toggle */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="isGroup"
              checked={isGroup}
              onCheckedChange={(c) => {
                setIsGroup(!!c);
                if (!c) setSelectedUsers((p) => p.slice(0, 1));
              }}
            />
            <Label htmlFor="isGroup" className="cursor-pointer">
              {t.chat.createGroup}
            </Label>
          </div>

          {/* Group name */}
          <AnimatePresence>
            {isGroup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Input
                  placeholder={t.chat.groupNamePlaceholder}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="rounded-xl"
                />
                <Textarea
                  placeholder={t.chat.groupDescPlaceholder}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.chat.searchUsers}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <button
                  type="button"
                  key={u.id.toString()}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                >
                  {u.displayName}
                  <span className="text-primary/60">×</span>
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          <div className="max-h-52 overflow-y-auto space-y-1">
            {isFetching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((user) => {
                const isSelected = selectedUsers.some(
                  (u) => u.id.toString() === user.id.toString(),
                );
                return (
                  <button
                    type="button"
                    key={user.id.toString()}
                    onClick={() => toggleUser(user)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-colors",
                      isSelected && "bg-primary/10",
                    )}
                  >
                    <UserAvatar
                      name={user.displayName}
                      blob={user.profilePicture}
                      size="sm"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.phoneNumber}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-primary text-xs font-medium">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            ) : searchQuery.trim() ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t.chat.noResults}
              </p>
            ) : null}
          </div>

          <Button
            onClick={() => void handleCreate()}
            disabled={
              createConversation.isPending || selectedUsers.length === 0
            }
            className="w-full rounded-xl"
          >
            {createConversation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isGroup ? t.chat.createGroupBtn : t.chat.newChat}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── ChatsPage ──────────────────────────────────────────────────────────────────

export function ChatsPage({ onSelectConversation, currentProfile }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  // Lock state
  const [lockedChats, setLockedChatsState] = useState<string[]>(getLockedChats);
  const [lockSheetConvId, setLockSheetConvId] = useState<string | null>(null);
  const [pinDialogConvId, setPinDialogConvId] = useState<string | null>(null);
  const [pendingConversation, setPendingConversation] =
    useState<ConversationSummary | null>(null);

  const { data: conversations, isLoading, isError } = useConversations();

  const toggleLock = useCallback((id: string, lock: boolean) => {
    setLockedChatsState((prev) => {
      const next = lock ? [...prev, id] : prev.filter((x) => x !== id);
      setLockedChats(next);
      return next;
    });
  }, []);

  const baseFiltered = useMemo(
    () =>
      conversations?.filter((s) =>
        s.conversation.name.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [conversations, search],
  );

  const filtered = useMemo(() => {
    if (filterTab === "unread")
      return baseFiltered.filter((s) => Number(s.unreadCount) > 0);
    if (filterTab === "groups")
      return baseFiltered.filter((s) => s.conversation.isGroup);
    return baseFiltered;
  }, [baseFiltered, filterTab]);

  const lockSheetConversation = useMemo(
    () =>
      lockSheetConvId
        ? (conversations?.find((c) => c.conversation.id === lockSheetConvId) ??
          null)
        : null,
    [lockSheetConvId, conversations],
  );

  const pinDialogConversation = useMemo(
    () =>
      pinDialogConvId
        ? (conversations?.find((c) => c.conversation.id === pinDialogConvId) ??
          null)
        : null,
    [pinDialogConvId, conversations],
  );

  const handleSelect = (summary: ConversationSummary) => {
    const id = summary.conversation.id;
    if (lockedChats.includes(id)) {
      setPinDialogConvId(id);
      setPendingConversation(summary);
      return;
    }
    setActiveId(id);
    onSelectConversation(summary);
  };

  const handlePinSuccess = () => {
    if (pendingConversation) {
      setActiveId(pendingConversation.conversation.id);
      onSelectConversation(pendingConversation);
      setPendingConversation(null);
    }
    setPinDialogConvId(null);
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "groups", label: "Groups" },
  ];

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/hey-friend-logo-transparent.dim_120x120.png"
              alt="HEY FRIEND"
              className="w-7 h-7 object-contain"
            />
            <h1 className="font-display text-xl font-bold text-foreground">
              HEY <span className="text-primary">FRIEND</span>
            </h1>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.chat.searchChats}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl text-sm bg-muted border-transparent"
          />
        </div>
      </div>

      {/* Status Row */}
      <div className="border-b border-border/60">
        <StatusRow currentProfile={currentProfile} />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-2 border-b border-border/40">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all",
              filterTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground border border-border",
            )}
          >
            {tab.label}
            {tab.id === "unread" &&
              baseFiltered.filter((s) => Number(s.unreadCount) > 0).length >
                0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-white text-[0.55rem] font-bold">
                  {baseFiltered.filter((s) => Number(s.unreadCount) > 0).length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loading
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center p-4">
            <p className="text-muted-foreground text-sm">
              {t.errors.loadingConversations}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">
                {filterTab === "unread"
                  ? "No unread messages"
                  : filterTab === "groups"
                    ? "No group chats yet"
                    : t.chat.noChats}
              </p>
              <p className="text-sm text-muted-foreground">
                {filterTab === "all" ? t.chat.noChatsDesc : ""}
              </p>
            </div>
            {filterTab === "all" && (
              <Button
                onClick={() => setNewChatOpen(true)}
                className="rounded-xl"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t.chat.newChat}
              </Button>
            )}
          </div>
        ) : (
          filtered.map((summary) => (
            <ConversationItem
              key={summary.conversation.id}
              summary={summary}
              onClick={() => handleSelect(summary)}
              isActive={activeId === summary.conversation.id}
              isLocked={lockedChats.includes(summary.conversation.id)}
              onLongPress={() => setLockSheetConvId(summary.conversation.id)}
            />
          ))
        )}
      </div>

      {/* Circular Floating Action Button */}
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setNewChatOpen(true)}
        className="absolute bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center text-primary-foreground"
        aria-label="New chat"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <NewChatDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        currentProfile={currentProfile}
        onConversationCreated={(id) => {
          const found = conversations?.find((c) => c.conversation.id === id);
          if (found) handleSelect(found);
        }}
      />

      {/* Lock Action Sheet */}
      {lockSheetConversation && (
        <LockActionSheet
          open={!!lockSheetConvId}
          onClose={() => setLockSheetConvId(null)}
          conversationId={lockSheetConversation.conversation.id}
          conversationName={lockSheetConversation.conversation.name}
          isLocked={lockedChats.includes(lockSheetConversation.conversation.id)}
          onToggle={toggleLock}
        />
      )}

      {/* PIN Dialog */}
      {pinDialogConversation && (
        <PinDialog
          open={!!pinDialogConvId}
          onClose={() => {
            setPinDialogConvId(null);
            setPendingConversation(null);
          }}
          onSuccess={handlePinSuccess}
          conversationName={pinDialogConversation.conversation.name}
        />
      )}
    </div>
  );
}

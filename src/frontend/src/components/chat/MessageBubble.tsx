import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { Copy, Mic, Play, Smile, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { MediaType, MessageStatus } from "../../backend";
import type { Message } from "../../backend.d";
import { useI18n } from "../../contexts/I18nContext";
import {
  useAddReaction,
  useDeleteMessage,
  useReactions,
} from "../../hooks/useQueries";

interface Props {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  isGroup?: boolean;
}

function MessageStatusDots({ status }: { status: MessageStatus }) {
  if (status === MessageStatus.sent) {
    return (
      <span className="inline-flex items-center" title="Sent">
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 inline-block" />
      </span>
    );
  }
  if (status === MessageStatus.received) {
    return (
      <span className="inline-flex items-center" title="Received">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
      </span>
    );
  }
  if (status === MessageStatus.read) {
    return (
      <span className="inline-flex items-center gap-0.5" title="Read">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
      </span>
    );
  }
  return null;
}

function MediaContent({ message }: { message: Message }) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    message.media ? message.media.getDirectURL() : null,
  );

  if (message.mediaType === MediaType.text) {
    return null;
  }

  if (message.mediaType === MediaType.emoji) {
    return <p className="text-4xl leading-none">{message.content}</p>;
  }

  if (message.mediaType === MediaType.sticker) {
    return <p className="text-5xl leading-none">{message.content}</p>;
  }

  if (message.mediaType === MediaType.image && imageUrl) {
    return (
      <div className="max-w-[240px] rounded-xl overflow-hidden">
        <img
          src={imageUrl}
          alt="Shared media attachment"
          className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onError={() => setImageUrl(null)}
        />
      </div>
    );
  }

  if (message.mediaType === MediaType.video && imageUrl) {
    return (
      <div className="max-w-[240px] rounded-xl overflow-hidden relative group">
        <video src={imageUrl} className="w-full">
          <track kind="captions" />
        </video>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-5 w-5 text-gray-800 ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  if (
    message.mediaType === MediaType.audio ||
    message.mediaType === MediaType.voice
  ) {
    return (
      <div className="flex items-center gap-3 min-w-[160px]">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Mic className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          {/* Waveform visualization */}
          <div className="flex items-center gap-0.5 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable waveform display
                key={i}
                className="w-1 rounded-full bg-current opacity-40"
                style={{
                  height: `${20 + Math.sin(i * 0.8) * 10 + Math.random() * 8}px`,
                }}
              />
            ))}
          </div>
          <p className="text-xs opacity-60 mt-0.5">Voice note</p>
        </div>
        {imageUrl && (
          <audio src={imageUrl} className="hidden" controls>
            <track kind="captions" />
          </audio>
        )}
      </div>
    );
  }

  if (message.mediaType === MediaType.gif) {
    return (
      <div className="max-w-[200px]">
        <img
          src={message.content}
          alt="GIF"
          className="rounded-xl w-full"
          loading="lazy"
        />
      </div>
    );
  }

  return null;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function ReactionsBar({
  messageId,
  isOwn,
}: { messageId: string; isOwn: boolean }) {
  const { data: reactions } = useReactions(messageId);
  const addReaction = useAddReaction();

  if (!reactions?.length) return null;

  // Group by emoji
  const grouped = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className={cn(
        "flex items-center gap-1 mt-1 flex-wrap",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {Object.entries(grouped).map(([emoji, count]) => (
        <button
          type="button"
          key={emoji}
          onClick={() => addReaction.mutate({ messageId, emoji })}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted border border-border text-xs hover:bg-accent transition-colors"
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-muted-foreground">{count}</span>}
        </button>
      ))}
    </div>
  );
}

export function MessageBubble({ message, isOwn, senderName, isGroup }: Props) {
  const { t } = useI18n();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const addReaction = useAddReaction();
  const deleteMessage = useDeleteMessage();

  const timestamp = new Date(Number(message.timestamp) / 1_000_000);
  const timeStr = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleReact = useCallback(
    (emoji: string) => {
      addReaction.mutate({ messageId: message.id, emoji });
      setShowReactionPicker(false);
    },
    [addReaction, message.id],
  );

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
  }, [message.content]);

  const handleDelete = useCallback(() => {
    deleteMessage.mutate({
      messageId: message.id,
      conversationId: message.conversationId,
    });
  }, [deleteMessage, message.id, message.conversationId]);

  if (message.status === MessageStatus.deleted) {
    return (
      <div className={cn("flex mb-2", isOwn ? "justify-end" : "justify-start")}>
        <p className="text-xs text-muted-foreground italic px-3 py-1.5">
          This message was deleted
        </p>
      </div>
    );
  }

  const isMediaOnly =
    message.mediaType !== MediaType.text &&
    message.mediaType !== MediaType.emoji &&
    message.mediaType !== MediaType.sticker;
  const hasText = message.content && message.mediaType === MediaType.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex mb-2 px-2 group",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] flex flex-col",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Sender name for group chats */}
        {isGroup && !isOwn && senderName && (
          <span className="text-xs font-semibold text-primary mb-1 ml-2">
            {senderName}
          </span>
        )}

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "relative px-3 py-2 rounded-2xl shadow-message cursor-context-menu",
                isOwn
                  ? "bubble-out rounded-br-sm message-bubble-out"
                  : "bubble-in rounded-bl-sm message-bubble-in",
                isMediaOnly && "p-1 bg-transparent shadow-none",
              )}
            >
              {/* Media content */}
              {message.mediaType !== MediaType.text && (
                <MediaContent message={message} />
              )}

              {/* Text content */}
              {hasText && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              )}

              {/* Emoji/Sticker standalone */}
              {(message.mediaType === MediaType.emoji ||
                message.mediaType === MediaType.sticker) && (
                <MediaContent message={message} />
              )}

              {/* Time + Status */}
              <div
                className={cn(
                  "flex items-center gap-1 mt-1",
                  isOwn ? "justify-end" : "justify-start",
                )}
              >
                <span
                  className={cn(
                    "text-[0.65rem] leading-none",
                    isOwn ? "opacity-70" : "text-muted-foreground",
                  )}
                >
                  {timeStr}
                </span>
                {isOwn && <MessageStatusDots status={message.status} />}
              </div>

              {/* Reaction picker trigger */}
              <button
                type="button"
                onClick={() => setShowReactionPicker((p) => !p)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 p-1 rounded-full bg-background border border-border shadow-xs opacity-0 group-hover:opacity-100 transition-opacity z-10",
                  isOwn ? "-left-8" : "-right-8",
                )}
              >
                <Smile className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {/* Quick reaction picker */}
              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 8 }}
                    className={cn(
                      "absolute bottom-full mb-2 z-20 flex items-center gap-1 bg-popover border border-border rounded-full px-2 py-1.5 shadow-float",
                      isOwn ? "right-0" : "left-0",
                    )}
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="text-xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuItem onClick={() => setShowReactionPicker(true)}>
              <Smile className="h-4 w-4 mr-2" />
              {t.chat.react}
            </ContextMenuItem>
            {hasText && (
              <ContextMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {t.chat.copy}
              </ContextMenuItem>
            )}
            {isOwn && (
              <ContextMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.chat.delete}
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {/* Reactions */}
        <ReactionsBar messageId={message.id} isOwn={isOwn} />
      </div>
    </motion.div>
  );
}

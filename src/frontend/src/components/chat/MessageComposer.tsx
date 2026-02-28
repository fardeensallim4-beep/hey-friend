import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Image,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Smile,
  Sticker,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, MediaType } from "../../backend";
import { useI18n } from "../../contexts/I18nContext";

interface Props {
  onSend: (
    content: string,
    mediaType: MediaType,
    media: ExternalBlob | null,
  ) => Promise<void>;
  disabled?: boolean;
}

const EMOJI_LIST = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😢",
  "😡",
  "🎉",
  "❤️",
  "👍",
  "👎",
  "🙌",
  "🔥",
  "💯",
  "🌟",
  "🎵",
  "🍕",
  "🐶",
  "🌺",
  "😊",
  "😅",
  "🤣",
  "😇",
  "🥳",
  "😴",
  "🤯",
  "😱",
  "🤗",
  "😋",
  "👋",
  "✌️",
  "🤞",
  "💪",
  "🙏",
  "👏",
  "🫶",
  "💕",
  "💔",
  "⭐",
];

const GIF_URLS = [
  "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif",
  "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/3oz8xRF0v9WMAUVLNK/giphy.gif",
  "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
];

const STICKER_LIST = [
  "🌈",
  "🦋",
  "🌸",
  "⭐",
  "🎊",
  "🎁",
  "💖",
  "🌻",
  "🦄",
  "🎀",
  "🍀",
  "🌙",
  "☀️",
  "🌊",
  "🏆",
  "🎯",
  "💎",
  "🍭",
  "🌴",
  "🦊",
];

export function MessageComposer({ onSend, disabled }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [_audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-resize textarea
  // biome-ignore lint/correctness/useExhaustiveDependencies: textareaRef is a stable ref
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = useCallback(async () => {
    if (disabled || sending) return;

    const trimmed = text.trim();

    if (!trimmed && !selectedFile) return;

    setSending(true);
    try {
      if (selectedFile) {
        const bytes = new Uint8Array(await selectedFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        const isVideo = selectedFile.type.startsWith("video/");
        const isAudio = selectedFile.type.startsWith("audio/");
        const mediaType = isVideo
          ? MediaType.video
          : isAudio
            ? MediaType.audio
            : MediaType.image;

        await onSend(selectedFile.name, mediaType, blob);
        setSelectedFile(null);
      } else {
        await onSend(trimmed, MediaType.text, null);
        setText("");
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [disabled, sending, text, selectedFile, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleEmojiClick = useCallback(
    async (emoji: string) => {
      setEmojiOpen(false);
      setSending(true);
      try {
        await onSend(emoji, MediaType.emoji, null);
      } finally {
        setSending(false);
      }
    },
    [onSend],
  );

  const handleStickerClick = useCallback(
    async (sticker: string) => {
      setStickerOpen(false);
      setSending(true);
      try {
        await onSend(sticker, MediaType.sticker, null);
      } finally {
        setSending(false);
      }
    },
    [onSend],
  );

  const handleGifClick = useCallback(
    async (url: string) => {
      setGifOpen(false);
      setSending(true);
      try {
        await onSend(url, MediaType.gif, null);
      } finally {
        setSending(false);
      }
    },
    [onSend],
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mr.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const bytes = new Uint8Array(await audioBlob.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        setSending(true);
        try {
          await onSend("Voice note", MediaType.voice, blob);
        } finally {
          setSending(false);
        }
        for (const track of stream.getTracks()) track.stop();
      };

      mr.start();
      setMediaRecorder(mr);
      setAudioChunks(chunks);
      setRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  }, [onSend]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setRecordingTime(0);
    setMediaRecorder(null);
    setAudioChunks([]);
  }, [mediaRecorder]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setRecordingTime(0);
    setMediaRecorder(null);
    setAudioChunks([]);
  }, [mediaRecorder]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Recording UI
  if (recording) {
    return (
      <div className="flex items-center gap-3 p-3 bg-background border-t border-border">
        <button
          type="button"
          onClick={cancelRecording}
          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-500">
            {t.chat.recording} {formatTime(recordingTime)}
          </span>
        </div>
        <Button onClick={stopRecording} size="sm" className="rounded-xl px-4">
          <Send className="h-4 w-4 mr-1" />
          {t.chat.send}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background">
      {/* File preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-muted"
          >
            <span className="text-sm text-foreground flex-1 truncate">
              {selectedFile.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="preview"
                  className="h-12 rounded-lg object-cover"
                />
              ) : (
                selectedFile.name
              )}
            </span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 p-3">
        {/* Emoji */}
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            >
              <Smile className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" side="top" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              Emoji
            </p>
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => void handleEmojiClick(emoji)}
                  className="text-xl p-1 rounded-lg hover:bg-accent transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* GIF */}
        <Popover open={gifOpen} onOpenChange={setGifOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            >
              <span className="text-xs font-bold font-display">GIF</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" side="top" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              GIFs
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GIF_URLS.map((url, i) => (
                <button
                  type="button"
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                  key={i}
                  onClick={() => void handleGifClick(url)}
                  className="rounded-lg overflow-hidden hover:opacity-90 transition-opacity aspect-video"
                >
                  <img
                    src={url}
                    alt={`GIF ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sticker */}
        <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            >
              <Sticker className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2" side="top" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              Stickers
            </p>
            <div className="grid grid-cols-5 gap-2">
              {STICKER_LIST.map((sticker) => (
                <button
                  type="button"
                  key={sticker}
                  onClick={() => void handleStickerClick(sticker)}
                  className="text-3xl p-1 rounded-lg hover:bg-accent transition-colors"
                >
                  {sticker}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* File attach */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="p-2 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.typeMessage}
            disabled={disabled || !!selectedFile}
            rows={1}
            className="resize-none min-h-[44px] max-h-[120px] rounded-2xl border-border focus-visible:ring-primary py-2.5 px-4 text-sm leading-relaxed pr-4"
          />
        </div>

        {/* Voice / Send */}
        {text.trim() || selectedFile ? (
          <Button
            onClick={() => void handleSend()}
            disabled={disabled || sending}
            size="icon"
            className="rounded-2xl h-11 w-11 flex-shrink-0 shadow-message"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        ) : (
          <button
            type="button"
            onMouseDown={() => void startRecording()}
            onMouseUp={stopRecording}
            onTouchStart={() => void startRecording()}
            onTouchEnd={stopRecording}
            disabled={disabled}
            className="p-2.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 rounded-2xl hover:bg-accent"
            title={t.chat.voiceNote}
          >
            {recording ? (
              <MicOff className="h-5 w-5 text-red-500" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

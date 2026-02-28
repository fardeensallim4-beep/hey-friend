import {
  AvatarFallback,
  AvatarImage,
  Avatar as ShadAvatar,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface BlobLike {
  getDirectURL(): string;
}

interface UserAvatarProps {
  name: string;
  blob?: BlobLike | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  online?: boolean;
}

const sizeMap = {
  xs: "h-6 w-6 text-[0.55rem]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getColorFromName(name: string) {
  const colors = [
    "bg-teal-500",
    "bg-emerald-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({
  name,
  blob,
  size = "md",
  className,
  online,
}: UserAvatarProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const url = blob.getDirectURL();
    setBlobUrl(url);
  }, [blob]);

  const initials = getInitials(name || "?");
  const colorClass = getColorFromName(name || "");

  return (
    <div className={cn("relative inline-block flex-shrink-0", className)}>
      <ShadAvatar className={cn(sizeMap[size])}>
        {blobUrl && <AvatarImage src={blobUrl} alt={name} />}
        <AvatarFallback
          className={cn("text-white font-semibold font-display", colorClass)}
        >
          {initials}
        </AvatarFallback>
      </ShadAvatar>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            size === "xs"
              ? "h-1.5 w-1.5"
              : size === "sm"
                ? "h-2 w-2"
                : "h-2.5 w-2.5",
            online ? "bg-emerald-400" : "bg-muted-foreground",
          )}
        />
      )}
    </div>
  );
}

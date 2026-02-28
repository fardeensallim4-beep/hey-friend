import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { UserAvatar } from "../components/shared/Avatar";

interface Props {
  currentProfile: UserProfile;
}

type CallType = "incoming" | "outgoing" | "missed";

interface CallRecord {
  id: string;
  name: string;
  type: CallType;
  timestamp: string;
  duration?: string;
  isVideo?: boolean;
}

interface QuickDialContact {
  id: string;
  name: string;
}

const quickDialContacts: QuickDialContact[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
  { id: "3", name: "Charlie" },
  { id: "4", name: "Diana" },
  { id: "5", name: "Ethan" },
  { id: "6", name: "Fiona" },
];

const mockCallHistory: CallRecord[] = [
  {
    id: "c1",
    name: "Alice Johnson",
    type: "incoming",
    timestamp: "Today, 2:30 PM",
    duration: "4m 22s",
  },
  {
    id: "c2",
    name: "Bob Smith",
    type: "outgoing",
    timestamp: "Today, 11:05 AM",
    duration: "12m 08s",
    isVideo: true,
  },
  {
    id: "c3",
    name: "Charlie Brown",
    type: "missed",
    timestamp: "Today, 9:15 AM",
  },
  {
    id: "c4",
    name: "Diana Prince",
    type: "outgoing",
    timestamp: "Yesterday",
    duration: "1m 45s",
  },
  {
    id: "c5",
    name: "Ethan Hunt",
    type: "incoming",
    timestamp: "Yesterday",
    duration: "8m 33s",
    isVideo: true,
  },
  {
    id: "c6",
    name: "Alice Johnson",
    type: "missed",
    timestamp: "Mon, 3:44 PM",
  },
  {
    id: "c7",
    name: "Fiona Green",
    type: "outgoing",
    timestamp: "Mon, 10:20 AM",
    duration: "5m 10s",
  },
  {
    id: "c8",
    name: "Bob Smith",
    type: "incoming",
    timestamp: "Sun, 7:00 PM",
    duration: "20m 01s",
  },
];

function CallTypeIcon({ type }: { type: CallType }) {
  if (type === "incoming")
    return <PhoneIncoming className="h-4 w-4 text-sky-500" />;
  if (type === "outgoing")
    return <PhoneOutgoing className="h-4 w-4 text-emerald-500" />;
  return <PhoneMissed className="h-4 w-4 text-destructive" />;
}

function callTypeLabel(type: CallType): string {
  if (type === "incoming") return "Incoming";
  if (type === "outgoing") return "Outgoing";
  return "Missed";
}

function callTypeColor(type: CallType): string {
  if (type === "incoming") return "text-sky-500";
  if (type === "outgoing") return "text-emerald-500";
  return "text-destructive";
}

export function CallsPage({ currentProfile: _currentProfile }: Props) {
  const handleCallAgain = (name: string) => {
    toast(`Calling ${name}...`, {
      icon: "📞",
      duration: 2500,
    });
  };

  const handleQuickDial = (name: string) => {
    toast(`Calling ${name}...`, {
      icon: "📞",
      duration: 2500,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl font-bold text-foreground">
            Calls
          </h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-9 gap-1.5 text-xs"
              onClick={() =>
                toast("Video call feature coming soon", { icon: "🎥" })
              }
            >
              <Video className="h-4 w-4" />
              Video
            </Button>
            <Button
              size="sm"
              variant="default"
              className="rounded-xl h-9 gap-1.5 text-xs"
              onClick={() =>
                toast("New call feature coming soon", { icon: "📞" })
              }
            >
              <Phone className="h-4 w-4" />
              New Call
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Quick Dial */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Dial
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
            {quickDialContacts.map((contact, i) => (
              <motion.button
                key={contact.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleQuickDial(contact.name)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div className="relative">
                  <div className="ring-2 ring-primary/20 ring-offset-2 ring-offset-background rounded-full group-hover:ring-primary/60 transition-all">
                    <UserAvatar name={contact.name} size="lg" online={true} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Phone className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors max-w-[52px] truncate">
                  {contact.name.split(" ")[0]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent
          </p>
        </div>

        {/* Call History */}
        <div className="space-y-0.5">
          {mockCallHistory.map((call, i) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 + 0.2 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors group"
            >
              <div className="relative flex-shrink-0">
                <UserAvatar name={call.name} size="md" />
                {call.isVideo && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary/90 flex items-center justify-center">
                    <Video className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold truncate",
                    call.type === "missed"
                      ? "text-destructive"
                      : "text-foreground",
                  )}
                >
                  {call.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <CallTypeIcon type={call.type} />
                  <span className={cn("text-xs", callTypeColor(call.type))}>
                    {callTypeLabel(call.type)}
                  </span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {call.timestamp}
                  </span>
                  {call.duration && (
                    <>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-xs text-muted-foreground">
                        {call.duration}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full w-9 h-9 text-primary hover:bg-primary/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleCallAgain(call.name)}
                aria-label={`Call ${call.name} again`}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Footer space for floating nav */}
        <div className="h-6" />
      </div>
    </div>
  );
}

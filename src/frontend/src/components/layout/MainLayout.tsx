import { cn } from "@/lib/utils";
import { Bell, MessageCircle, Phone, Settings, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ConversationSummary, UserProfile } from "../../backend.d";
import { useI18n } from "../../contexts/I18nContext";
import { useConversations, useTotalUnread } from "../../hooks/useQueries";
import { CallsPage } from "../../pages/CallsPage";
import { ChatScreen } from "../../pages/ChatScreen";
import { ChatsPage } from "../../pages/ChatsPage";
import { ContactsPage } from "../../pages/ContactsPage";
import { SettingsPage } from "../../pages/SettingsPage";
import { UserAvatar } from "../shared/Avatar";

type Tab = "chats" | "contacts" | "calls" | "settings";

interface Props {
  profile: UserProfile;
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-destructive text-[0.6rem] text-white flex items-center justify-center px-0.5 font-bold leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function MainLayout({ profile }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("chats");
  const [activeConversation, setActiveConversation] =
    useState<ConversationSummary | null>(null);

  const { data: totalUnread } = useTotalUnread();
  const { data: conversations } = useConversations();
  const unreadCount = Number(totalUnread ?? 0);

  // Toast on new messages
  useEffect(() => {
    if (!conversations) return;
    const convWithUnread = conversations.filter(
      (c) => Number(c.unreadCount) > 0,
    );
    if (convWithUnread.length > 0 && !activeConversation) {
      // Could notify here if needed
    }
  }, [conversations, activeConversation]);

  const handleSelectConversation = (summary: ConversationSummary) => {
    setActiveConversation(summary);
    setTab("chats");
  };

  const navItems = [
    {
      id: "chats" as Tab,
      icon: MessageCircle,
      label: t.nav.chats,
      badge: unreadCount,
    },
    {
      id: "contacts" as Tab,
      icon: Users,
      label: t.nav.contacts,
      badge: 0,
    },
    {
      id: "calls" as Tab,
      icon: Phone,
      label: "Calls",
      badge: 0,
    },
    {
      id: "settings" as Tab,
      icon: Settings,
      label: t.nav.settings,
      badge: 0,
    },
  ];

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (newTab !== "chats") setActiveConversation(null);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-80 lg:w-96 border-r border-border bg-sidebar flex-shrink-0">
        {/* Sidebar nav tabs */}
        <div className="flex border-b border-sidebar-border">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                "relative flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors",
                tab === item.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent",
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                <NotificationBadge count={item.badge} />
              </div>
              <span className="text-[0.65rem]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {tab === "chats" && (
              <motion.div
                key="chats"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <ChatsPage
                  onSelectConversation={handleSelectConversation}
                  currentProfile={profile}
                />
              </motion.div>
            )}
            {tab === "contacts" && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <ContactsPage
                  currentProfile={profile}
                  onStartChat={handleSelectConversation}
                />
              </motion.div>
            )}
            {tab === "calls" && (
              <motion.div
                key="calls"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <CallsPage currentProfile={profile} />
              </motion.div>
            )}
            {tab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <SettingsPage profile={profile} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: show conversation if selected, else show tab content */}
        <div className="flex-1 overflow-hidden md:block">
          <AnimatePresence mode="wait">
            {activeConversation ? (
              <motion.div
                key={activeConversation.conversation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                <ChatScreen
                  summary={activeConversation}
                  currentProfile={profile}
                  onBack={() => setActiveConversation(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full hidden md:flex flex-col items-center justify-center gap-6 text-center p-8"
              >
                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <img
                    src="/assets/generated/hey-friend-logo-transparent.dim_120x120.png"
                    alt="HEY FRIEND"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    Welcome to <span className="text-primary">HEY FRIEND</span>
                  </h2>
                  <p className="text-muted-foreground max-w-xs">
                    {t.appTagline}. Select a conversation to start chatting.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={profile.displayName}
                    blob={profile.profilePicture}
                    size="sm"
                  />
                  <span className="text-sm text-muted-foreground">
                    Signed in as{" "}
                    <span className="text-foreground font-medium">
                      {profile.displayName}
                    </span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile tab pages (hidden on desktop) */}
          <div className="md:hidden h-full overflow-hidden pb-24">
            <AnimatePresence mode="wait">
              {activeConversation ? null : (
                <motion.div
                  key={tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {tab === "chats" && (
                    <ChatsPage
                      onSelectConversation={handleSelectConversation}
                      currentProfile={profile}
                    />
                  )}
                  {tab === "contacts" && (
                    <ContactsPage
                      currentProfile={profile}
                      onStartChat={handleSelectConversation}
                    />
                  )}
                  {tab === "calls" && <CallsPage currentProfile={profile} />}
                  {tab === "settings" && <SettingsPage profile={profile} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile Floating Circular Bottom Nav ── */}
        <nav
          className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
          aria-label="Main navigation"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: 0.1,
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-full backdrop-blur-md bg-card/90 border border-border/60 shadow-2xl"
          >
            {navItems.map((item) => {
              const isActive = tab === item.id && !activeConversation;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isActive && "scale-110",
                    )}
                  />
                  <NotificationBadge count={item.badge} />
                </button>
              );
            })}
          </motion.div>
        </nav>
      </main>
    </div>
  );
}

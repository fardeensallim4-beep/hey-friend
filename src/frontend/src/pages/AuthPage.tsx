import { Button } from "@/components/ui/button";
import { Globe, Loader2, MessageCircle, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "../contexts/I18nContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function AuthPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();
  const { t } = useI18n();

  return (
    <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 -right-16 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-float">
                <img
                  src="/assets/generated/hey-friend-logo-transparent.dim_120x120.png"
                  alt="HEY FRIEND"
                  className="w-14 h-14 object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-background flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-1">
            HEY <span className="text-primary">FRIEND</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {t.auth.loginSubtitle}
          </p>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { icon: MessageCircle, label: "Group Chats" },
            { icon: Shield, label: "Secure" },
            { icon: Globe, label: "Worldwide" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-card rounded-3xl border border-border p-6 shadow-message-lg"
        >
          <h2 className="font-display text-xl font-semibold text-foreground mb-1">
            {t.auth.loginTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in securely to start messaging
          </p>

          <Button
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            size="lg"
            className="w-full font-display font-semibold text-base h-12 rounded-2xl"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.auth.signingIn}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {t.auth.loginButton}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Your identity is private and secure
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 text-xs text-muted-foreground text-center"
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </motion.p>
    </div>
  );
}

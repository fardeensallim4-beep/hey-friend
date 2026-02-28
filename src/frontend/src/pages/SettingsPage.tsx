import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Camera,
  ChevronRight,
  Edit3,
  Globe,
  Info,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Palette,
  Phone,
  Sparkles,
  Sun,
  Upload,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, Gender } from "../backend";
import type { UserProfile } from "../backend.d";
import { UserAvatar } from "../components/shared/Avatar";
import { type Language, useI18n } from "../contexts/I18nContext";
import { type Theme, useTheme } from "../contexts/ThemeContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUpdateUser } from "../hooks/useQueries";

interface Props {
  profile: UserProfile;
}

function ThemeButton({
  value,
  current,
  onClick,
  icon,
  label,
}: {
  value: Theme;
  current: Theme;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all text-xs font-medium",
        current === value
          ? "border-primary bg-primary/10 text-primary"
          : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function SettingsPage({ profile }: Props) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { clear, isLoggingIn } = useInternetIdentity();
  const updateUser = useUpdateUser();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [address, setAddress] = useState(profile.address);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    try {
      let profilePicture: ExternalBlob | null = null;
      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        profilePicture = ExternalBlob.fromBytes(bytes);
      }

      await updateUser.mutateAsync({
        displayName,
        gender,
        address,
        profilePicture,
      });

      toast.success("Profile updated successfully");
      setEditing(false);
      setAvatarFile(null);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleLogout = () => {
    clear();
    toast.info("Logged out");
  };

  const LANG_OPTIONS: { value: Language; label: string }[] = [
    { value: "en", label: t.settings.langEn },
    { value: "sw", label: t.settings.langSw },
    { value: "ar", label: t.settings.langAr },
    { value: "zh", label: t.settings.langZh },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <h2 className="font-display text-xl font-bold text-foreground">
          {t.settings.title}
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">
              {t.settings.profile}
            </h3>
          </div>

          {/* Hidden file input — always mounted */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleAvatarChange(e);
              if (!editing) setEditing(true);
            }}
          />

          {!editing ? (
            <div className="flex items-center gap-4">
              {/* Always-tappable avatar with camera overlay */}
              <button
                type="button"
                className="relative flex-shrink-0 group"
                onClick={() => fileRef.current?.click()}
                title="Change profile picture"
              >
                <UserAvatar
                  name={profile.displayName}
                  blob={profile.profilePicture}
                  size="lg"
                />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-message opacity-90 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-3.5 w-3.5 text-white" />
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {profile.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.phoneNumber}
                </p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {profile.gender} · {profile.address || "No address"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-xl flex-shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                {t.settings.editProfile}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Avatar in edit mode */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <UserAvatar
                      name={profile.displayName}
                      blob={profile.profilePicture}
                      size="lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-message"
                  >
                    <Upload className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {t.registration.changePhoto}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t.registration.displayName}
                </Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t.registration.gender}
                </Label>
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as Gender)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Gender.male}>
                      {t.registration.genderMale}
                    </SelectItem>
                    <SelectItem value={Gender.female}>
                      {t.registration.genderFemale}
                    </SelectItem>
                    <SelectItem value={Gender.other}>
                      {t.registration.genderOther}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t.registration.address}
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => void handleSaveProfile()}
                  disabled={updateUser.isPending}
                  className="flex-1 rounded-xl"
                >
                  {updateUser.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t.settings.saveProfile}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    setDisplayName(profile.displayName);
                    setGender(profile.gender);
                    setAddress(profile.address);
                  }}
                  className="rounded-xl"
                >
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Theme */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">
              {t.settings.theme}
            </h3>
          </div>
          <div className="flex gap-2">
            <ThemeButton
              value="light"
              current={theme}
              onClick={() => setTheme("light")}
              icon={<Sun className="h-5 w-5" />}
              label={t.settings.themeLight}
            />
            <ThemeButton
              value="dark"
              current={theme}
              onClick={() => setTheme("dark")}
              icon={<Moon className="h-5 w-5" />}
              label={t.settings.themeDark}
            />
            <ThemeButton
              value="pink"
              current={theme}
              onClick={() => setTheme("pink")}
              icon={<Sparkles className="h-5 w-5" />}
              label={t.settings.themePink}
            />
          </div>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">
              {t.settings.language}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LANG_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setLang(option.value)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                  lang === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 text-muted-foreground",
                )}
              >
                <span>{option.label}</span>
                {lang === option.value && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Service Info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">
              {t.settings.serviceInfo}
            </h3>
          </div>

          <div className="space-y-3">
            <a
              href="mailto:fardeensallim4@gmail.com"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t.settings.email}
                </p>
                <p className="text-sm font-medium">fardeensallim4@gmail.com</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <a
              href="tel:+255793183645"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t.settings.contact}
                </p>
                <p className="text-sm font-medium">+255 793 183 645</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>HEY FRIEND v1.0.0</span>
            <Badge variant="secondary" className="text-xs rounded-full">
              ICP Powered
            </Badge>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingIn}
            className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/50"
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {t.settings.logout}
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-4 px-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}

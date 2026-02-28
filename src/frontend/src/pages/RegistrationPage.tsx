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
import { cn } from "@/lib/utils";
import { Calendar, Loader2, MapPin, Phone, Upload, User } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, Gender } from "../backend";
import { CountryCodeSelector } from "../components/shared/CountryCodeSelector";
import { useI18n } from "../contexts/I18nContext";
import { useRegisterUser } from "../hooks/useQueries";

export function RegistrationPage() {
  const { t } = useI18n();
  const registerUser = useRegisterUser();

  const [dialCode, setDialCode] = useState("+255");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneNumber = `${dialCode}${phoneLocal.replace(/\s/g, "")}`;

    if (!phoneLocal.trim() || !displayName || !gender || !dob) {
      toast.error(
        "Please fill in all required fields (Name, Phone, Gender, Date of Birth)",
      );
      return;
    }

    try {
      setUploading(true);
      let profilePicture: ExternalBlob | null = null;

      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        profilePicture = ExternalBlob.fromBytes(bytes);
      }

      const dobTimestamp = BigInt(new Date(dob).getTime()) * BigInt(1_000_000);

      await registerUser.mutateAsync({
        phoneNumber,
        displayName,
        gender: gender as Gender,
        address,
        dateOfBirth: dobTimestamp,
        profilePicture,
      });

      toast.success("Account created successfully! Welcome to HEY FRIEND 🎉");
    } catch (err) {
      console.error(err);
      toast.error(t.errors.registration);
    } finally {
      setUploading(false);
    }
  };

  const isPending = registerUser.isPending || uploading;

  return (
    <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-message">
            <img
              src="/assets/generated/hey-friend-logo-transparent.dim_120x120.png"
              alt="HEY FRIEND"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t.registration.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.registration.subtitle}
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border p-6 shadow-message-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative group"
              >
                <div
                  className={cn(
                    "w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    avatarPreview ? "border-primary" : "",
                  )}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary">
                      <Upload className="h-6 w-6" />
                      <span className="text-[0.65rem] font-medium">Photo</span>
                    </div>
                  )}
                </div>
                {avatarPreview && (
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                {avatarPreview
                  ? t.registration.changePhoto
                  : t.registration.uploadPhoto}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="displayName"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <User className="h-3.5 w-3.5 text-primary" />
                {t.registration.displayName} *
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.registration.displayNamePlaceholder}
                required
                className="h-11 rounded-xl"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-3.5 w-3.5 text-primary" />
                {t.registration.phoneNumber} *
              </Label>
              <div className="flex gap-2">
                <CountryCodeSelector value={dialCode} onChange={setDialCode} />
                <Input
                  type="tel"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  placeholder={t.registration.phonePlaceholder}
                  required
                  className="h-11 rounded-xl flex-1"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {t.registration.gender} *
              </Label>
              <Select
                value={gender}
                onValueChange={(v) => setGender(v as Gender)}
                required
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={t.registration.selectGender} />
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

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {t.registration.dateOfBirth} *
              </Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                max={new Date().toISOString().split("T")[0]}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {t.registration.address}
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.registration.addressPlaceholder}
                className="h-11 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full h-12 rounded-2xl font-display font-semibold text-base mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.registration.registering}
                </>
              ) : (
                t.registration.register
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

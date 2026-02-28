import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Contact, ConversationSummary, UserProfile } from "../backend.d";
import { UserAvatar } from "../components/shared/Avatar";
import { CountryCodeSelector } from "../components/shared/CountryCodeSelector";
import { useI18n } from "../contexts/I18nContext";
import {
  useAddContact,
  useContacts,
  useCreateConversation,
  useRemoveContact,
} from "../hooks/useQueries";

interface Props {
  currentProfile: UserProfile;
  onStartChat?: (summary: ConversationSummary) => void;
}

function AddContactDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [dialCode, setDialCode] = useState("+255");
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const addContact = useAddContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = `${dialCode}${phone.replace(/\s/g, "")}`;
    if (!phoneNumber || !label) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await addContact.mutateAsync({ phoneNumber, contactLabel: label });
      toast.success("Contact added successfully");
      onClose();
      setPhone("");
      setLabel("");
    } catch {
      toast.error("Failed to add contact");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {t.contacts.addContact}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t.contacts.phoneNumber}
            </Label>
            <div className="flex gap-2">
              <CountryCodeSelector value={dialCode} onChange={setDialCode} />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.contacts.phonePlaceholder}
                required
                className="flex-1 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.contacts.label}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t.contacts.labelPlaceholder}
              required
              className="rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={addContact.isPending}
            className="w-full rounded-xl"
          >
            {addContact.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.contacts.saving}
              </>
            ) : (
              t.contacts.save
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({
  contact,
  onMessage,
  onRemove,
}: {
  contact: Contact;
  onMessage: () => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-colors group"
      >
        <UserAvatar name={contact.contactLabel} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {contact.contactLabel}
          </p>
          <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onMessage}
            className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
            title={t.contacts.message}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title={t.contacts.remove}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {contact.contactLabel} from your contacts?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {t.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onRemove}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {t.contacts.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ContactsPage({ currentProfile, onStartChat }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const removeContact = useRemoveContact();
  const createConversation = useCreateConversation();

  const { data: contacts, isLoading, isError } = useContacts();

  const filtered = useMemo(
    () =>
      contacts?.filter(
        (c) =>
          c.contactLabel.toLowerCase().includes(search.toLowerCase()) ||
          c.phoneNumber.includes(search),
      ) ?? [],
    [contacts, search],
  );

  const handleRemove = (phoneNumber: string) => {
    removeContact.mutate(phoneNumber, {
      onSuccess: () => toast.success("Contact removed"),
      onError: () => toast.error("Failed to remove contact"),
    });
  };

  const handleMessage = async (contact: Contact) => {
    try {
      const id = await createConversation.mutateAsync({
        name: contact.contactLabel,
        description: "",
        isGroup: false,
        members: [contact.owner],
      });
      if (onStartChat) {
        onStartChat({
          conversation: {
            id,
            name: contact.contactLabel,
            isGroup: false,
            members: [currentProfile.id, contact.owner],
            createdAt: BigInt(Date.now()) * BigInt(1_000_000),
            description: "",
          },
          unreadCount: BigInt(0),
        });
      }
    } catch {
      toast.error("Failed to start conversation");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold text-foreground">
            {t.contacts.title}
          </h2>
          <Button
            size="icon"
            variant="default"
            onClick={() => setAddOpen(true)}
            className="rounded-xl h-9 w-9 shadow-message"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.contacts.searchContacts}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl text-sm bg-muted border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loading
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm">
              {t.errors.loadingContacts}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">
                {t.contacts.noContacts}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.contacts.noContactsDesc}
              </p>
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              className="rounded-xl"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t.contacts.addContact}
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((contact) => (
              <ContactCard
                key={contact.phoneNumber}
                contact={contact}
                onMessage={() => void handleMessage(contact)}
                onRemove={() => handleRemove(contact.phoneNumber)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <AddContactDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { fetchContacts, updateProfile, uploadImage, upsertContacts } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/moj-profil")({
  head: () => ({
    meta: [
      { title: "Moj profil — Rukotvorine" },
      {
        name: "description",
        content:
          "Uredi svoj javni profil tvorca: ime radionice, priču o radu, lokaciju, fotografiju i kontakt podatke.",
      },
      { property: "og:title", content: "Moj profil — Rukotvorine" },
      { property: "og:description", content: "Uredi javni profil i kontakt podatke." },
    ],
  }),
  component: MyProfilePage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Ime mora imati najmanje 2 znaka.").max(80),
  bio: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(80).optional(),
  public_contact: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
});

function MyProfilePage() {
  const { user, profile } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const { data: contacts } = useQuery({
    queryKey: ["contacts", userId],
    enabled: !!userId,
    queryFn: () => fetchContacts(userId),
  });

  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
    public_contact: "",
    phone: "",
    avatar_url: "" as string,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      name: profile.name ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      public_contact: profile.public_contact ?? "",
      avatar_url: profile.avatar_url ?? "",
    }));
  }, [profile]);

  useEffect(() => {
    if (contacts) setForm((prev) => ({ ...prev, phone: contacts.phone ?? "" }));
  }, [contacts]);

  async function handleAvatar(file: File | undefined) {
    if (!file || !userId) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Slika je veća od 4 MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage("avatars", userId, file);
      setForm((prev) => ({ ...prev, avatar_url: url }));
      toast.success("Fotografija je dodata. Ne zaboravite da sačuvate.");
    } catch {
      toast.error("Otpremanje fotografije nije uspelo.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setSaving(true);
    try {
      await updateProfile(userId, {
        name: form.name.trim(),
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        avatar_url: form.avatar_url || null,
        public_contact: form.public_contact.trim() || null,
      });
      await upsertContacts(userId, {
        email: contacts?.email ?? user?.email ?? null,
        phone: form.phone.trim() || null,
      });
      queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["contacts", userId] });
      toast.success("Profil je sačuvan.");
    } catch {
      toast.error("Čuvanje profila nije uspelo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl">Moj profil</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Ime, priča o radu i fotografija su javni. Telefon i email ostaju privatni — vidite ih samo
        vi.
      </p>

      <form onSubmit={submit} className="mt-8 max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">Javni profil</h2>
          <div className="mt-5 flex items-center gap-5">
            <Avatar className="size-20 border border-border">
              {form.avatar_url ? <AvatarImage src={form.avatar_url} alt={form.name} /> : null}
              <AvatarFallback className="text-xl">
                {(form.name || "K").slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : null}
              Promeni fotografiju
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatar(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Ime ili naziv radionice</Label>
              <Input
                id="name"
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="location">Lokacija</Label>
              <Input
                id="location"
                value={form.location}
                maxLength={80}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="public_contact">Javni kontakt (opciono)</Label>
              <Input
                id="public_contact"
                value={form.public_contact}
                maxLength={120}
                onChange={(e) => setForm({ ...form, public_contact: e.target.value })}
                className="mt-2"
                placeholder="npr. Instagram @radionica"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bio">O meni / o radu</Label>
              <Textarea
                id="bio"
                rows={6}
                value={form.bio}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="mt-2"
                placeholder="Kako ste počeli, koje tehnike koristite, šta vas inspiriše…"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">Privatni podaci</h2>
          <p className="mt-1 text-sm text-muted-foreground">Vidljivo samo vama.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input value={contacts?.email ?? user?.email ?? ""} disabled className="mt-2" />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={form.phone}
                maxLength={40}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={saving || uploading}>
          {saving ? "Čuvanje…" : "Sačuvaj profil"}
        </Button>
      </form>
    </div>
  );
}

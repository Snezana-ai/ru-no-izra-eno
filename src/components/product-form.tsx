import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, STATUS_OPTIONS } from "@/lib/marketplace";
import { uploadImage } from "@/lib/queries";

export type ProductFormValues = {
  name: string;
  short_description: string;
  description: string;
  price: number;
  category: string;
  location: string;
  status: string;
  images: string[];
};

const schema = z.object({
  name: z.string().trim().min(3, "Naziv mora imati najmanje 3 znaka.").max(120),
  short_description: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0, "Cena ne može biti negativna.").max(10_000_000),
  category: z.string().min(1, "Izaberite kategoriju."),
  location: z.string().trim().max(80).optional(),
  status: z.string().min(1),
});

export function ProductForm({
  userId,
  initial,
  submitLabel,
  onSubmit,
}: {
  userId: string;
  initial?: Partial<ProductFormValues>;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initial?.name ?? "",
    short_description: initial?.short_description ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    category: initial?.category ?? CATEGORIES[0]!.slug,
    location: initial?.location ?? "",
    status: initial?.status ?? "dostupno",
    images: initial?.images ?? [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 4)) {
        if (file.size > 6 * 1024 * 1024) {
          toast.error(`Slika ${file.name} je veća od 6 MB.`);
          continue;
        }
        urls.push(await uploadImage("product-images", userId, file));
      }
      set("images", [...values.images, ...urls].slice(0, 6));
      if (urls.length) toast.success("Slike su dodate.");
    } catch {
      toast.error("Otpremanje slike nije uspelo.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">Osnovni podaci</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Naziv proizvoda</Label>
            <Input
              id="name"
              value={values.name}
              maxLength={120}
              onChange={(e) => set("name", e.target.value)}
              className="mt-2"
              placeholder="npr. Vezeni stolnjak sa motivima ruža"
            />
          </div>
          <div>
            <Label htmlFor="price">Cena (RSD)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Kategorija</Label>
            <Select value={values.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Lokacija</Label>
            <Input
              id="location"
              value={values.location}
              maxLength={80}
              onChange={(e) => set("location", e.target.value)}
              className="mt-2"
              placeholder="npr. Novi Sad"
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={values.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="short">Kratak opis</Label>
            <Input
              id="short"
              value={values.short_description}
              maxLength={160}
              onChange={(e) => set("short_description", e.target.value)}
              className="mt-2"
              placeholder="Jedna rečenica koja opisuje proizvod"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="desc">Detaljan opis</Label>
            <Textarea
              id="desc"
              rows={6}
              value={values.description}
              maxLength={2000}
              onChange={(e) => set("description", e.target.value)}
              className="mt-2"
              placeholder="Materijali, dimenzije, vreme izrade, održavanje…"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">Fotografije</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dodajte do 6 slika. Prva slika je glavna.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {values.images.map((src) => (
            <div key={src} className="relative size-24 overflow-hidden rounded-xl border border-border">
              <img src={src} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => set("images", values.images.filter((i) => i !== src))}
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1"
                aria-label="Ukloni sliku"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary">
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="size-5" />
                Dodaj
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={saving || uploading}>
        {saving ? "Čuvanje…" : submitLabel}
      </Button>
    </form>
  );
}

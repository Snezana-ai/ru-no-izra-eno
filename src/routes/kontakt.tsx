import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — Rukotvorine" },
      {
        name: "description",
        content:
          "Pošaljite nam predloge, pitanja i komentare o platformi za ručne radove. Vaše sugestije nam pomažu da platformu učinimo boljom.",
      },
      { property: "og:title", content: "Kontakt — Rukotvorine" },
      {
        property: "og:description",
        content: "Pišite nam — predlozi i povratne informacije su uvek dobrodošli.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Unesite ime.").max(80, "Ime je predugačko."),
  email: z.string().trim().email("Unesite ispravnu email adresu.").max(160),
  message: z.string().trim().min(10, "Poruka mora imati najmanje 10 znakova.").max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    toast.success("Poruka je poslata. Hvala na predlogu!");
  }

  return (
    <div className="container-page py-14">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl">Kontakt</h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Imate predlog, primedbu ili ideju kako platforma može bolje da pomogne domaćim
            tvorcima? Pišite nam — svaka povratna informacija nam znači.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-5 text-sm">
            <Mail className="size-5 text-primary" />
            <span>podrska@rukotvorine.rs</span>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-8">
          <div className="space-y-5">
            <div>
              <Label htmlFor="name">Ime</Label>
              <Input
                id="name"
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2"
              />
              {errors["name"] ? (
                <p className="mt-1 text-xs text-destructive">{errors["name"]}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                maxLength={160}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2"
              />
              {errors["email"] ? (
                <p className="mt-1 text-xs text-destructive">{errors["email"]}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="message">Poruka</Label>
              <Textarea
                id="message"
                rows={6}
                value={form.message}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2"
              />
              {errors["message"] ? (
                <p className="mt-1 text-xs text-destructive">{errors["message"]}</p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="w-full">
              Pošalji poruku
            </Button>
            {sent ? (
              <p className="text-center text-sm text-muted-foreground">
                Hvala! Odgovorićemo u najkraćem roku.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

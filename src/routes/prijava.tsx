import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

type AuthSearch = { mode?: "prijava" | "registracija" | undefined };

export const Route = createFileRoute("/prijava")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search["mode"] === "registracija" ? "registracija" : "prijava",
  }),
  head: () => ({
    meta: [
      { title: "Prijava i registracija — Rukotvorine" },
      {
        name: "description",
        content:
          "Napravi besplatan račun i počni da prodaješ ručne radove ili se prijavi da nastaviš razgovore sa tvorcima.",
      },
      { property: "og:title", content: "Prijava i registracija — Rukotvorine" },
      {
        property: "og:description",
        content: "Jedan račun za kupovinu i prodaju ručnih radova.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Unesite ispravnu email adresu.").max(160);
const passwordSchema = z.string().min(6, "Šifra mora imati najmanje 6 znakova.").max(72);

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isRegister = mode === "registracija";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/kontrolna-tabla" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]!.message);
      return;
    }
    if (!parsedPassword.success) {
      toast.error(parsedPassword.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: parsedEmail.data,
          password: parsedPassword.data,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name.trim().slice(0, 80) },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Poslali smo vam email za potvrdu. Potvrdite adresu pa se prijavite.");
          toast.success("Registracija uspešna — proverite email.");
        } else {
          toast.success("Dobro došli!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data,
          password: parsedPassword.data,
        });
        if (error) throw error;
        toast.success("Uspešna prijava.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Došlo je do greške.";
      toast.error(
        message.includes("Invalid login credentials")
          ? "Neispravan email ili šifra."
          : message.includes("already registered")
            ? "Račun sa ovom adresom već postoji."
            : message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Prijava preko Google računa nije uspela.");
        return;
      }
      if (result.redirected) return;
      toast.success("Uspešna prijava.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-3xl">{isRegister ? "Napravi račun" : "Prijava"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRegister
            ? "Jedan račun za kupovinu i prodaju. Prvih 5 proizvoda je besplatno."
            : "Prijavite se da nastavite razgovore i upravljate proizvodima."}
        </p>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-7 w-full"
          onClick={googleSignIn}
          disabled={busy}
        >
          Nastavi sa Google računom
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ILI EMAIL
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-5">
          {isRegister ? (
            <div>
              <Label htmlFor="name">Ime ili naziv radionice</Label>
              <Input
                id="name"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                placeholder="npr. Milica Jovanović"
              />
            </div>
          ) : null}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              maxLength={160}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="password">Šifra</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              maxLength={72}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Obrada…" : isRegister ? "Registruj se" : "Prijavi se"}
          </Button>
        </form>

        {info ? <p className="mt-4 text-sm text-muted-foreground">{info}</p> : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? "Već imate račun? " : "Nemate račun? "}
          <Link
            to="/prijava"
            search={{ mode: isRegister ? "prijava" : "registracija" }}
            className="text-primary underline-offset-4 hover:underline"
          >
            {isRegister ? "Prijavite se" : "Registrujte se"}
          </Link>
        </p>
      </div>
    </div>
  );
}

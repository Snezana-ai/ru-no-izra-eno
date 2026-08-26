import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, Package, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { fetchConversations, fetchMyProducts } from "@/lib/queries";
import {
  FREE_PRODUCTS,
  PACK_PRICE,
  PACK_SIZE,
  firstImage,
  formatPrice,
  planForCount,
  statusLabel,
} from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/kontrolna-tabla")({
  head: () => ({
    meta: [
      { title: "Kontrolna tabla — Rukotvorine" },
      {
        name: "description",
        content: "Pregled tvojih proizvoda, poruka i statusa pretplate na platformi za ručne radove.",
      },
      { property: "og:title", content: "Kontrolna tabla — Rukotvorine" },
      { property: "og:description", content: "Upravljaj svojim oglasima i porukama." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const userId = user?.id ?? "";

  const { data: products } = useQuery({
    queryKey: ["my-products", userId],
    enabled: !!userId,
    queryFn: () => fetchMyProducts(userId),
  });
  const { data: conversations } = useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    queryFn: () => fetchConversations(userId),
  });

  const list = products ?? [];
  const published = list.filter((p) => p.status !== "nacrt").length;
  const plan = planForCount(published);
  const unread = (conversations ?? []).reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="container-page py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Dobro došli</p>
          <h1 className="font-display text-4xl">{profile?.name ?? "Korisnik"}</h1>
        </div>
        <Button asChild size="lg">
          <Link to="/dodaj-proizvod">
            <Plus className="mr-1 size-4" /> Dodaj proizvod
          </Link>
        </Button>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={<Package className="size-5 text-primary" />}
          label="Objavljeni proizvodi"
          value={String(published)}
        />
        <StatCard
          icon={<MessageCircle className="size-5 text-primary" />}
          label="Nepročitane poruke"
          value={String(unread)}
        />
        <StatCard
          icon={<Wallet className="size-5 text-primary" />}
          label="Mesečna pretplata"
          value={plan.monthlyPrice === 0 ? "0 RSD" : formatPrice(plan.monthlyPrice)}
        />
      </div>

      <section className="mt-10 rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Vaš plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prvih {FREE_PRODUCTS} proizvoda je besplatno, potom {PACK_PRICE} RSD mesečno za svakih{" "}
              {PACK_SIZE} dodatnih proizvoda.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {plan.planLabel}
          </Badge>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span>
              {published} / {plan.allowance} iskorišćenih mesta
            </span>
            <span className="text-muted-foreground">
              {plan.monthlyPrice === 0
                ? "Bez naplate"
                : `${formatPrice(plan.monthlyPrice)} mesečno`}
            </span>
          </div>
          <Progress
            value={Math.min(100, (published / Math.max(plan.allowance, 1)) * 100)}
            className="mt-3"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            {published < plan.allowance
              ? `Možete objaviti još ${plan.allowance - published} proizvoda u okviru trenutnog plana.`
              : `Sledeći objavljeni proizvod aktivira dodatni paket (+${PACK_SIZE} mesta za ${PACK_PRICE} RSD mesečno).`}
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" /> Naplata je u MVP verziji simulirana —
            nema stvarnog zaduženja.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Najnoviji proizvodi</h2>
          <Button asChild variant="link">
            <Link to="/moji-proizvodi">Svi moji proizvodi</Link>
          </Button>
        </div>
        {list.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-xl">Još nemate proizvode</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Objavite prvi rad — prvih {FREE_PRODUCTS} je besplatno.
            </p>
            <Button asChild className="mt-5">
              <Link to="/dodaj-proizvod">Dodaj proizvod</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {list.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to="/proizvod/$id"
                params={{ id: p.id }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <img
                  src={firstImage(p)}
                  alt={p.name}
                  loading="lazy"
                  className="size-16 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(p.price)}</p>
                </div>
                <Badge variant="outline">{statusLabel(p.status)}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}

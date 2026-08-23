import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Heart, MessageCircle, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES } from "@/lib/marketplace";
import { fetchProducts } from "@/lib/queries";
import heroImage from "/images/hero-handmade.jpg?url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rukotvorine — otkrij i deli jedinstvene ručne radove" },
      {
        name: "description",
        content:
          "Marketplace koji povezuje tvorce ručnih radova, male radionice i vlasnike jedinstvenih predmeta sa kupcima. Objavi proizvode besplatno i dogovori prodaju direktno.",
      },
      { property: "og:title", content: "Rukotvorine — marketplace ručnih radova" },
      {
        property: "og:description",
        content:
          "Otkrij keramiku, vez, drvo i nakit domaćih majstora. Prvih 5 proizvoda objavljuješ besplatno.",
      },
    ],
  }),
  component: HomePage,
});

const WHY = [
  {
    icon: Store,
    title: "Jednostavno predstavljanje",
    text: "Napravi profil i objavi proizvod za par minuta, bez sopstvene web prodavnice.",
  },
  {
    icon: MessageCircle,
    title: "Direktna komunikacija",
    text: "Kupac i prodavac se dogovaraju kroz interne poruke, bez posrednika.",
  },
  {
    icon: Heart,
    title: "Podrška malim tvorcima",
    text: "Prvih 5 proizvoda je besplatno, a dalje su uslovi simbolični.",
  },
  {
    icon: ShieldCheck,
    title: "Autentični proizvodi",
    text: "Svaki komad je ručni rad — jedinstven, sa pričom i imenom autora.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Napravi profil",
    text: "Registruj se i predstavi sebe i svoje ručne radove.",
  },
  {
    n: "2",
    title: "Objavi proizvode",
    text: "Dodaj fotografije, opise i cene u dinarima.",
  },
  {
    n: "3",
    title: "Poveži se sa kupcima",
    text: "Komuniciraj direktno i dogovori kupovinu i dostavu.",
  },
];

function HomePage() {
  const { data: products } = useQuery({
    queryKey: ["products", { sort: "najnovije" }],
    queryFn: () => fetchProducts({ sort: "najnovije" }),
  });

  const featured = (products ?? []).slice(0, 8);

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-primary uppercase">
              <Sparkles className="size-3.5" /> Domaći ručni radovi
            </span>
            <h1 className="mt-6 font-display text-4xl leading-[1.1] text-balance-pretty sm:text-5xl lg:text-6xl">
              Otkrij i podeli jedinstvene ručne radove
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Mesto gde tvorci ručnih radova, mala preduzeća i vlasnici jedinstvenih predmeta
              predstavljaju svoje proizvode i povezuju se direktno sa kupcima.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/proizvodi">
                  Istraži proizvode <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/prijava" search={{ mode: "registracija" }}>
                  Počni da prodaješ
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="Majstorica oblikuje glinu na vitlu u sunčanoj radionici"
              width={1600}
              height={1104}
              className="aspect-[4/3] w-full rounded-3xl border border-border object-cover shadow-[var(--shadow-lift)]"
            />
            <div className="absolute -bottom-6 left-6 hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-soft)] sm:block">
              <p className="font-display text-2xl text-primary">5 proizvoda</p>
              <p className="text-xs text-muted-foreground">objavljuješ potpuno besplatno</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-page py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Izdvojeni proizvodi</h2>
            <p className="mt-2 text-muted-foreground">Sveže objavljeni radovi domaćih majstora.</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/proizvodi">
              Svi proizvodi <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
              ))
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-border bg-secondary/30 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="font-display text-3xl">Kategorije</h2>
          <p className="mt-2 text-muted-foreground">Pronađi ono što tražiš po vrsti rukotvorine.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to="/proizvodi"
                search={{ kategorija: c.slug }}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-base group-hover:text-primary">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page py-16 lg:py-20">
        <h2 className="font-display text-3xl">Kako funkcioniše</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-7">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display">
                {s.n}
              </span>
              <h3 className="mt-5 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="border-t border-border bg-secondary/40 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="font-display text-3xl">Zašto Rukotvorine?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl border border-border bg-card p-6">
                <w.icon className="size-6 text-primary" />
                <h3 className="mt-4 font-display text-lg">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start gap-4 rounded-3xl border border-border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-2xl">Spremni da počnete?</h3>
              <p className="mt-1 text-muted-foreground">
                Objavite svoj prvi ručni rad danas — bez troškova.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/prijava" search={{ mode: "registracija" }}>
                Počni da prodaješ
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

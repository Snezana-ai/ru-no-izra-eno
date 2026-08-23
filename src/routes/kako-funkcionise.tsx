import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_PRODUCTS, PACK_PRICE, PACK_SIZE } from "@/lib/marketplace";

export const Route = createFileRoute("/kako-funkcionise")({
  head: () => ({
    meta: [
      { title: "Kako funkcioniše — Rukotvorine" },
      {
        name: "description",
        content:
          "Tri koraka do prodaje ručnih radova: napravi profil, objavi proizvode i poveži se sa kupcima. Prvih 5 proizvoda je besplatno.",
      },
      { property: "og:title", content: "Kako funkcioniše — Rukotvorine" },
      {
        property: "og:description",
        content: "Od registracije do dogovora o kupovini i dostavi — objašnjeno u tri koraka.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div className="container-page py-14">
      <h1 className="font-display text-4xl">Kako funkcioniše</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Platforma je namerno jednostavna: prodavac predstavlja proizvod, kupac se javlja, a
        kupovinu i dostavu dogovarate direktno.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            n: "1",
            t: "Napravi profil",
            d: "Registruj se i predstavi sebe, svoju radionicu i način na koji radiš.",
          },
          {
            n: "2",
            t: "Objavi proizvode",
            d: "Dodaj fotografije, kratak i detaljan opis, cenu u dinarima i lokaciju.",
          },
          {
            n: "3",
            t: "Poveži se sa kupcima",
            d: "Odgovaraj na poruke i dogovori plaćanje i dostavu koja vam oboma odgovara.",
          },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-card p-7">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary font-display text-primary-foreground">
              {s.n}
            </span>
            <h2 className="mt-5 font-display text-xl">{s.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-7">
          <h2 className="font-display text-2xl">Dogovor direktno</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Kupac i prodavac kroz poruke dogovaraju način plaćanja i dostavu — kurirska služba,
            lično preuzimanje ili plaćanje pouzećem.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7">
          <h2 className="font-display text-2xl">Online plaćanje</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Opcija online plaćanja postoji na stranici proizvoda. U ovoj MVP verziji je prikazana
            kao prototip toka, bez stvarne naplate.
          </p>
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-border bg-secondary/40 p-8">
        <h2 className="font-display text-2xl">Cenovnik za prodavce</h2>
        <ul className="mt-5 space-y-3 text-sm">
          <li className="flex gap-3">
            <Check className="mt-0.5 size-4 text-primary" />
            <span>
              Prvih <strong>{FREE_PRODUCTS} proizvoda</strong> je potpuno besplatno.
            </span>
          </li>
          <li className="flex gap-3">
            <Check className="mt-0.5 size-4 text-primary" />
            <span>
              Nakon toga <strong>{PACK_PRICE} RSD mesečno</strong> za svakih dodatnih {PACK_SIZE}{" "}
              proizvoda.
            </span>
          </li>
          <li className="flex gap-3">
            <Check className="mt-0.5 size-4 text-primary" />
            <span>Trenutno stanje i iskorišćenost paketa vidiš u kontrolnoj tabli.</span>
          </li>
        </ul>
        <Button asChild className="mt-7">
          <Link to="/prijava" search={{ mode: "registracija" }}>
            Otvori nalog
          </Link>
        </Button>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/marketplace";

export const Route = createFileRoute("/kategorije")({
  head: () => ({
    meta: [
      { title: "Kategorije ručnih radova — Rukotvorine" },
      {
        name: "description",
        content:
          "Pregledaj kategorije: tekstil i vez, keramika, drvo, nakit, dekoracija, tradicionalne rukotvorine i ručno rađeni pokloni.",
      },
      { property: "og:title", content: "Kategorije ručnih radova — Rukotvorine" },
      {
        property: "og:description",
        content: "Sve kategorije domaćih ručnih radova na jednom mestu.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <div className="container-page py-14">
      <h1 className="font-display text-4xl">Kategorije</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Kategorije pomažu kupcima da brže nađu ono što traže, a prodavcima da svoj rad predstave
        pravoj publici.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to="/proizvodi"
            search={{ kategorija: c.slug }}
            className="group rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary/50"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <c.icon className="size-5" />
            </span>
            <h2 className="mt-5 font-display text-xl group-hover:text-primary">{c.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

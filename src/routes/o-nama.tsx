import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/o-nama")({
  head: () => ({
    meta: [
      { title: "O nama — Rukotvorine" },
      {
        name: "description",
        content:
          "Rukotvorine su digitalno mesto gde tvorci ručnih radova i vlasnici jedinstvenih predmeta predstavljaju svoj rad i nalaze kupce.",
      },
      { property: "og:title", content: "O nama — Rukotvorine" },
      {
        property: "og:description",
        content:
          "Vidljivost ručnih radova, direktna komunikacija i podrška malim proizvođačima i tradicionalnim zanatima.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="container-page py-14">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl">O platformi</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Rukotvorine postoje da bi tvorci ručnih radova i vlasnici jedinstvenih, nasleđenih ili
          vintage predmeta dobili jednostavno digitalno mesto na kom mogu da predstave svoj rad i
          povežu se sa potencijalnim kupcima.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Mnogi majstori nemaju sopstvenu internet prodavnicu, a njihovi proizvodi zaslužuju
          publiku. Zato je platforma osmišljena tako da objavljivanje proizvoda traje nekoliko
          minuta, a razgovor sa kupcem počinje jednim klikom.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {[
          {
            t: "Vidljivost ručnih radova",
            d: "Velike fotografije i čist prikaz stavljaju proizvod u prvi plan.",
          },
          {
            t: "Direktna komunikacija",
            d: "Bez posrednika — kupac i prodavac se dogovaraju sami.",
          },
          {
            t: "Podrška malim proizvođačima",
            d: "Besplatan početak i simbolične cene za veće ponude.",
          },
          {
            t: "Očuvanje tradicionalnih zanata",
            d: "Prostor za vez, tkanje, keramiku, rezbariju i narodne motive.",
          },
        ].map((i) => (
          <div key={i.t} className="rounded-2xl border border-border bg-card p-7">
            <h2 className="font-display text-xl">{i.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/proizvodi">Istraži proizvode</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/kontakt">Pošalji predlog</Link>
        </Button>
      </div>
    </div>
  );
}

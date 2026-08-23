import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { CATEGORIES } from "@/lib/marketplace";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sprout className="size-5" />
            </span>
            <span className="font-display text-xl">Rukotvorine</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Mesto gde tvorci ručnih radova, male radionice i vlasnici jedinstvenih predmeta
            predstavljaju svoje proizvode i povezuju se direktno sa kupcima.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wide uppercase">Platforma</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/proizvodi" className="hover:text-primary">
                Istraži proizvode
              </Link>
            </li>
            <li>
              <Link to="/kategorije" className="hover:text-primary">
                Kategorije
              </Link>
            </li>
            <li>
              <Link to="/kako-funkcionise" className="hover:text-primary">
                Kako funkcioniše
              </Link>
            </li>
            <li>
              <Link to="/o-nama" className="hover:text-primary">
                O nama
              </Link>
            </li>
            <li>
              <Link to="/kontakt" className="hover:text-primary">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wide uppercase">Popularne kategorije</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/proizvodi"
                  search={{ kategorija: c.slug }}
                  className="hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-page border-t border-border py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Rukotvorine · Studentski MVP projekat
      </div>
    </footer>
  );
}

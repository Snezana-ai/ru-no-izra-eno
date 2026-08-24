import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES } from "@/lib/marketplace";
import { fetchProducts } from "@/lib/queries";

type ProductSearch = {
  q?: string;
  kategorija?: string;
  minCena?: number;
  maxCena?: number;
  sort?: "najnovije" | "cena-rastuce" | "cena-opadajuce";
};

export const Route = createFileRoute("/proizvodi")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    const sort = search.sort;
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    return {
      q: typeof search.q === "string" && search.q ? search.q : undefined,
      kategorija:
        typeof search.kategorija === "string" && search.kategorija ? search.kategorija : undefined,
      minCena: search.minCena === undefined ? undefined : num(search.minCena),
      maxCena: search.maxCena === undefined ? undefined : num(search.maxCena),
      sort:
        sort === "cena-rastuce" || sort === "cena-opadajuce" || sort === "najnovije"
          ? sort
          : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Istraži proizvode — Rukotvorine" },
      {
        name: "description",
        content:
          "Pretraži i filtriraj ručno rađene proizvode po kategoriji i ceni: keramika, vez, drvo, nakit i dekoracija domaćih majstora.",
      },
      { property: "og:title", content: "Istraži proizvode — Rukotvorine" },
      {
        property: "og:description",
        content: "Ručni radovi domaćih majstora — filtriraj po kategoriji, ceni i novini.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/proizvodi" });
  const [term, setTerm] = useState(search.q ?? "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setTerm(search.q ?? "");
  }, [search.q]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => fetchProducts(search),
  });

  function update(next: Partial<ProductSearch>) {
    navigate({ search: (prev) => ({ ...prev, ...next }) });
  }

  const products = data ?? [];
  const hasFilters =
    !!search.q || !!search.kategorija || search.minCena !== undefined || search.maxCena !== undefined;

  return (
    <div className="container-page py-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl">Istraži proizvode</h1>
        <p className="mt-3 text-muted-foreground">
          Jedinstveni ručni radovi domaćih tvoraca. Pretraži po nazivu ili filtriraj po kategoriji i
          ceni.
        </p>
      </header>

      <form
        className="mt-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: term.trim() || undefined });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value.slice(0, 80))}
            placeholder="Pretraži proizvode, npr. keramika, vez, drvo…"
            className="h-11 pl-9"
            aria-label="Pretraga proizvoda"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="h-11">
            Pretraži
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 sm:hidden"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </form>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} sm:block`}>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Filteri</h2>
              {hasFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate({
                      search: { sort: search.sort },
                    })
                  }
                >
                  <X className="mr-1 size-3.5" /> Očisti
                </Button>
              ) : null}
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <Label className="text-xs tracking-wide uppercase">Kategorija</Label>
                <Select
                  value={search.kategorija ?? "sve"}
                  onValueChange={(v) => update({ kategorija: v === "sve" ? undefined : v })}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Sve kategorije" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sve">Sve kategorije</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="min" className="text-xs tracking-wide uppercase">
                    Cena od
                  </Label>
                  <Input
                    id="min"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="mt-2"
                    value={search.minCena ?? ""}
                    onChange={(e) =>
                      update({ minCena: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max" className="text-xs tracking-wide uppercase">
                    Cena do
                  </Label>
                  <Input
                    id="max"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="mt-2"
                    value={search.maxCena ?? ""}
                    onChange={(e) =>
                      update({ maxCena: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs tracking-wide uppercase">Sortiranje</Label>
                <Select
                  value={search.sort ?? "najnovije"}
                  onValueChange={(v) => update({ sort: v as ProductSearch["sort"] })}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="najnovije">Najnovije</SelectItem>
                    <SelectItem value="cena-rastuce">Najniža cena</SelectItem>
                    <SelectItem value="cena-opadajuce">Najviša cena</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </aside>

        <section>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Učitavanje…" : `${products.length} proizvoda`}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
                ))
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {!isLoading && products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="font-display text-xl">Nema rezultata</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pokušajte sa drugim pojmom ili očistite filtere.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchProfile, fetchSellerProducts } from "@/lib/queries";
import { firstImage, formatPrice } from "@/lib/marketplace";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/prodavac/$id")({
  head: () => ({
    meta: [
      { title: "Profil prodavca — Rukotvorine" },
      {
        name: "description",
        content:
          "Profil tvorca ručnih radova: biografija, lokacija, opis rada i svi objavljeni proizvodi.",
      },
      { property: "og:title", content: "Profil prodavca — Rukotvorine" },
      {
        property: "og:description",
        content: "Saznaj više o tvorcu i pogledaj sve njegove ručne radove.",
      },
    ],
  }),
  component: SellerProfilePage,
});

function SellerProfilePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetchProfile(id),
  });
  const { data: products } = useQuery({
    queryKey: ["seller-products", id],
    queryFn: () => fetchSellerProducts(id),
  });

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl">Profil nije pronađen</h1>
        <Button asChild className="mt-6">
          <Link to="/proizvodi">Nazad na proizvode</Link>
        </Button>
      </div>
    );
  }

  const list = products ?? [];

  return (
    <div className="container-page py-12">
      <section className="rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="size-24 border border-border">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
            ) : null}
            <AvatarFallback className="text-2xl">{profile.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-3xl">{profile.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {profile.location ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" /> {profile.location}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Package className="size-4 text-primary" /> {list.length} objavljenih proizvoda
              </span>
            </div>
            {profile.bio ? (
              <div className="mt-5">
                <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
                  O tvorcu
                </h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              </div>
            ) : null}
            {profile.public_contact ? (
              <p className="mt-4 text-sm">
                <span className="text-muted-foreground">Kontakt: </span>
                {profile.public_contact}
              </p>
            ) : null}
          </div>
          {user && user.id !== profile.id ? (
            <Button asChild>
              <Link to="/poruke" search={{ sa: profile.id }}>
                Kontaktiraj prodavca
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Proizvodi</h2>
        {list.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Ovaj korisnik još nije objavio proizvode.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => (
              <Link
                key={p.id}
                to="/proizvod/$id"
                params={{ id: p.id }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]"
              >
                <img
                  src={firstImage(p)}
                  alt={p.name}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="p-5">
                  <h3 className="font-display text-base leading-snug">{p.name}</h3>
                  <p className="mt-2 text-primary">{formatPrice(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

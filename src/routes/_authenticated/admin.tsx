import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, Eye, EyeOff, ShieldCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAdminProducts,
  fetchAdminUsers,
  setProductHidden,
  setUserBlocked,
} from "@/lib/admin";
import { categoryName, firstImage, formatPrice, statusLabel } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administracija — Rukotvorine" },
      {
        name: "description",
        content: "Administratorski panel za upravljanje korisnicima i proizvodima na platformi.",
      },
      { property: "og:title", content: "Administracija — Rukotvorine" },
      { property: "og:description", content: "Upravljanje korisnicima i proizvodima." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, adminLoading } = useAuth();

  if (adminLoading) {
    return (
      <div className="container-page py-12">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-3xl">Nemate pristup ovoj stranici</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ova stranica je dostupna samo administratorima platforme.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Vrati se na početnu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-4xl">Administracija</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Osnovno upravljanje korisnicima i objavljenim proizvodima.
          </p>
        </div>
      </header>

      <Tabs defaultValue="korisnici" className="mt-8">
        <TabsList>
          <TabsTrigger value="korisnici">Korisnici</TabsTrigger>
          <TabsTrigger value="proizvodi">Proizvodi</TabsTrigger>
        </TabsList>
        <TabsContent value="korisnici" className="mt-6">
          <UsersSection />
        </TabsContent>
        <TabsContent value="proizvodi" className="mt-6">
          <ProductsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
  });

  const mutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => setUserBlocked(id, blocked),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(vars.blocked ? "Korisnik je blokiran." : "Korisnik je ponovo aktivan.");
    },
    onError: () => toast.error("Izmena statusa korisnika nije uspela."),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  const users = data ?? [];

  return (
    <div className="grid gap-3">
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nema registrovanih korisnika.</p>
      ) : null}
      {users.map((u) => (
        <div
          key={u.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/prodavac/$id"
                params={{ id: u.id }}
                className="font-display text-lg hover:text-primary"
              >
                {u.name}
              </Link>
              {u.is_blocked ? (
                <Badge variant="destructive">Blokiran</Badge>
              ) : (
                <Badge variant="secondary">Aktivan</Badge>
              )}
              {u.is_demo ? <Badge variant="outline">Demo</Badge> : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {u.email ?? "e-pošta nije dostupna"}
            </p>
          </div>
          <Button
            variant={u.is_blocked ? "outline" : "destructive"}
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: u.id, blocked: !u.is_blocked })}
          >
            {u.is_blocked ? (
              <>
                <Undo2 className="mr-1 size-4" /> Aktiviraj
              </>
            ) : (
              <>
                <Ban className="mr-1 size-4" /> Blokiraj
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}

function ProductsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchAdminProducts,
  });

  const mutation = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => setProductHidden(id, hidden),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(vars.hidden ? "Proizvod je sakriven." : "Proizvod je vraćen na platformu.");
    },
    onError: () => toast.error("Izmena proizvoda nije uspela."),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  const products = data ?? [];

  return (
    <div className="grid gap-3">
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nema proizvoda na platformi.</p>
      ) : null}
      {products.map((p) => (
        <div
          key={p.id}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"
        >
          <img
            src={firstImage(p)}
            alt={p.name}
            loading="lazy"
            className="size-20 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/proizvod/$id"
                params={{ id: p.id }}
                className="font-display text-lg hover:text-primary"
              >
                {p.name}
              </Link>
              {p.is_hidden ? (
                <Badge variant="destructive">Sakriven</Badge>
              ) : (
                <Badge variant="secondary">{statusLabel(p.status)}</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.seller?.name ?? "Nepoznat prodavac"} · {categoryName(p.category)} ·{" "}
              {formatPrice(p.price)}
            </p>
          </div>
          <Button
            variant={p.is_hidden ? "outline" : "destructive"}
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: p.id, hidden: !p.is_hidden })}
          >
            {p.is_hidden ? (
              <>
                <Eye className="mr-1 size-4" /> Vrati
              </>
            ) : (
              <>
                <EyeOff className="mr-1 size-4" /> Sakrij
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}

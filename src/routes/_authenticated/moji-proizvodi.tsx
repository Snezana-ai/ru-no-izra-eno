import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { deleteProduct, fetchMyProducts, updateProduct } from "@/lib/queries";
import {
  STATUS_OPTIONS,
  categoryName,
  firstImage,
  formatDate,
  formatPrice,
  planForCount,
} from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/moji-proizvodi")({
  head: () => ({
    meta: [
      { title: "Moji proizvodi — Rukotvorine" },
      {
        name: "description",
        content: "Uredi, promeni status ili obriši svoje objavljene ručne radove na jednom mestu.",
      },
      { property: "og:title", content: "Moji proizvodi — Rukotvorine" },
      { property: "og:description", content: "Upravljanje tvojim oglasima ručnih radova." },
    ],
  }),
  component: MyProductsPage,
});

function MyProductsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["my-products", userId],
    enabled: !!userId,
    queryFn: () => fetchMyProducts(userId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateProduct(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products", userId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Status je izmenjen.");
    },
    onError: () => toast.error("Izmena statusa nije uspela."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products", userId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Proizvod je obrisan.");
    },
    onError: () => toast.error("Brisanje nije uspelo."),
  });

  const list = products ?? [];
  const plan = planForCount(list.filter((p) => p.status !== "nacrt").length);

  return (
    <div className="container-page py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Moji proizvodi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {plan.planLabel} · {plan.published} / {plan.allowance} mesta ·{" "}
            {plan.monthlyPrice === 0 ? "bez naplate" : `${formatPrice(plan.monthlyPrice)} mesečno`}
          </p>
        </div>
        <Button asChild>
          <Link to="/dodaj-proizvod">
            <Plus className="mr-1 size-4" /> Novi proizvod
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-display text-xl">Nemate objavljene proizvode</p>
          <Button asChild className="mt-5">
            <Link to="/dodaj-proizvod">Dodaj prvi proizvod</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {list.map((p) => (
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
                <Link
                  to="/proizvod/$id"
                  params={{ id: p.id }}
                  className="font-display text-lg hover:text-primary"
                >
                  {p.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {categoryName(p.category)} · {formatPrice(p.price)} · {formatDate(p.created_at)}
                </p>
                {p.status === "nacrt" ? (
                  <Badge variant="outline" className="mt-2">
                    Nacrt (ne ulazi u obračun)
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={p.status}
                  onValueChange={(status) => statusMutation.mutate({ id: p.id, status })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button asChild variant="outline" size="icon" aria-label="Uredi">
                  <Link to="/uredi-proizvod/$id" params={{ id: p.id }}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Obriši">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Obrisati proizvod?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Proizvod „{p.name}" biće trajno uklonjen sa platforme.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Otkaži</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>
                        Obriši
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

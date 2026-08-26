import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProductForm } from "@/components/product-form";
import { useAuth } from "@/hooks/use-auth";
import { createProduct, fetchMyProducts } from "@/lib/queries";
import { FREE_PRODUCTS, PACK_PRICE, PACK_SIZE, formatPrice, planForCount } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/dodaj-proizvod")({
  head: () => ({
    meta: [
      { title: "Dodaj proizvod — Rukotvorine" },
      {
        name: "description",
        content:
          "Objavi novi ručni rad: naziv, opis, cena u dinarima, kategorija i fotografije proizvoda.",
      },
      { property: "og:title", content: "Dodaj proizvod — Rukotvorine" },
      { property: "og:description", content: "Objavi svoj ručni rad u nekoliko koraka." },
    ],
  }),
  component: AddProductPage,
});

function AddProductPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const { data: products } = useQuery({
    queryKey: ["my-products", userId],
    enabled: !!userId,
    queryFn: () => fetchMyProducts(userId),
  });

  const published = (products ?? []).filter((p) => p.status !== "nacrt").length;
  const plan = planForCount(published);
  const willExceed = published >= plan.allowance;

  return (
    <div className="container-page py-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl">Dodaj proizvod</h1>
        <p className="mt-3 text-muted-foreground">
          Dobar naslov, jasne fotografije i opis materijala najviše pomažu kupcima da se odluče.
        </p>
      </header>

      <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-5 text-sm">
        {willExceed ? (
          <p>
            Iskoristili ste {published} od {plan.allowance} mesta. Objavljivanje ovog proizvoda
            aktivira dodatni paket: +{PACK_SIZE} mesta za {PACK_PRICE} RSD mesečno (naplata je u
            MVP verziji simulirana).
          </p>
        ) : (
          <p>
            Prvih {FREE_PRODUCTS} proizvoda je besplatno. Trenutno: {published} / {plan.allowance}{" "}
            mesta ·{" "}
            {plan.monthlyPrice === 0 ? "bez naplate" : `${formatPrice(plan.monthlyPrice)} mesečno`}.
          </p>
        )}
      </div>

      <div className="mt-8 max-w-3xl">
        {userId ? (
          <ProductForm
            userId={userId}
            initial={{ location: profile?.location ?? "" }}
            submitLabel="Objavi proizvod"
            onSubmit={async (values) => {
              try {
                const created = await createProduct(userId, {
                  name: values.name.trim(),
                  short_description: values.short_description.trim() || null,
                  description: values.description.trim() || null,
                  price: values.price,
                  category: values.category,
                  location: values.location.trim() || null,
                  status: values.status,
                  images: values.images,
                });
                queryClient.invalidateQueries({ queryKey: ["my-products", userId] });
                queryClient.invalidateQueries({ queryKey: ["products"] });
                toast.success("Proizvod je objavljen.");
                navigate({ to: "/proizvod/$id", params: { id: created.id } });
              } catch {
                toast.error("Objavljivanje nije uspelo. Pokušajte ponovo.");
              }
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

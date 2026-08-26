import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProductForm } from "@/components/product-form";
import { useAuth } from "@/hooks/use-auth";
import { fetchProduct, updateProduct } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/uredi-proizvod/$id")({
  head: () => ({
    meta: [
      { title: "Uredi proizvod — Rukotvorine" },
      {
        name: "description",
        content: "Izmeni opis, cenu, status i fotografije svog objavljenog ručnog rada.",
      },
      { property: "og:title", content: "Uredi proizvod — Rukotvorine" },
      { property: "og:description", content: "Ažuriraj podatke o svom ručnom radu." },
    ],
  }),
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!product || !user || product.seller_id !== user.id) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl">Nemate pristup ovom proizvodu</h1>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl">Uredi proizvod</h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm
          userId={user.id}
          submitLabel="Sačuvaj izmene"
          initial={{
            name: product.name,
            short_description: product.short_description ?? "",
            description: product.description ?? "",
            price: Number(product.price),
            category: product.category,
            location: product.location ?? "",
            status: product.status,
            images: product.images,
          }}
          onSubmit={async (values) => {
            try {
              await updateProduct(product.id, {
                name: values.name.trim(),
                short_description: values.short_description.trim() || null,
                description: values.description.trim() || null,
                price: values.price,
                category: values.category,
                location: values.location.trim() || null,
                status: values.status,
                images: values.images,
              });
              queryClient.invalidateQueries({ queryKey: ["product", product.id] });
              queryClient.invalidateQueries({ queryKey: ["my-products", user.id] });
              queryClient.invalidateQueries({ queryKey: ["products"] });
              toast.success("Izmene su sačuvane.");
              navigate({ to: "/moji-proizvodi" });
            } catch {
              toast.error("Čuvanje izmena nije uspelo.");
            }
          }}
        />
      </div>
    </div>
  );
}

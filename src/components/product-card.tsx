import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  categoryName,
  firstImage,
  formatPrice,
  statusLabel,
  type ProductWithSeller,
} from "@/lib/marketplace";

export function ProductCard({ product }: { product: ProductWithSeller }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]">
      <Link
        to="/proizvod/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={firstImage(product)}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.status !== "dostupno" ? (
          <Badge variant="secondary" className="absolute top-3 left-3">
            {statusLabel(product.status)}
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {categoryName(product.category)}
        </span>
        <h3 className="font-display text-lg leading-snug">
          <Link to="/proizvod/$id" params={{ id: product.id }} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{product.seller?.name ?? "Prodavac"}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-lg text-primary">{formatPrice(product.price)}</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/proizvod/$id" params={{ id: product.id }}>
              Pogledaj
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

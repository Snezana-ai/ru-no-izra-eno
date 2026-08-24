import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, MapPin, MessageCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { fetchProduct, fetchSellerProducts, sendMessage } from "@/lib/queries";
import {
  categoryName,
  DEFAULT_INQUIRY,
  firstImage,
  formatDate,
  formatPrice,
  statusLabel,
} from "@/lib/marketplace";

export const Route = createFileRoute("/proizvod/$id")({
  head: () => ({
    meta: [
      { title: "Proizvod — Rukotvorine" },
      {
        name: "description",
        content:
          "Detalji ručno rađenog proizvoda: opis, cena u dinarima, lokacija i profil tvorca. Kontaktiraj prodavca direktno.",
      },
      { property: "og:title", content: "Proizvod — Rukotvorine" },
      {
        property: "og:description",
        content: "Ručni rad domaćeg majstora — pogledaj detalje i javi se prodavcu.",
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_INQUIRY);
  const [sending, setSending] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  const { data: otherProducts } = useQuery({
    queryKey: ["seller-products", product?.seller_id],
    enabled: !!product?.seller_id,
    queryFn: () => fetchSellerProducts(product!.seller_id),
  });

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl">Proizvod nije pronađen</h1>
        <Button asChild className="mt-6">
          <Link to="/proizvodi">Nazad na proizvode</Link>
        </Button>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [firstImage(product)];
  const seller = product.seller;
  const isOwner = user?.id === product.seller_id;

  function openInquiry() {
    if (!user) {
      navigate({ to: "/prijava", search: { mode: "prijava" } });
      return;
    }
    setMessage(`${DEFAULT_INQUIRY}\n\nProizvod: ${product!.name} (${formatPrice(product!.price)})`);
    setInquiryOpen(true);
  }

  async function submitInquiry() {
    if (!user || !product) return;
    if (message.trim().length < 5) {
      toast.error("Poruka je previše kratka.");
      return;
    }
    setSending(true);
    try {
      await sendMessage({
        senderId: user.id,
        receiverId: product.seller_id,
        productId: product.id,
        body: message.trim().slice(0, 1000),
      });
      setInquiryOpen(false);
      toast.success("Poruka je poslata prodavcu.");
      navigate({ to: "/poruke", search: { sa: product.seller_id } });
    } catch {
      toast.error("Poruka nije poslata. Pokušajte ponovo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-page py-12">
      <nav className="text-sm text-muted-foreground">
        <Link to="/proizvodi" className="hover:text-primary">
          Proizvodi
        </Link>
        <span className="px-2">/</span>
        <Link
          to="/proizvodi"
          search={{ kategorija: product.category }}
          className="hover:text-primary"
        >
          {categoryName(product.category)}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border border-border bg-muted">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {images.length > 1 ? (
            <div className="mt-4 flex gap-3">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActiveImage(i)}
                  className={`size-20 overflow-hidden rounded-xl border ${
                    i === activeImage ? "border-primary" : "border-border"
                  }`}
                  aria-label={`Slika ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{categoryName(product.category)}</Badge>
            <Badge variant={product.status === "dostupno" ? "default" : "outline"}>
              {statusLabel(product.status)}
            </Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 font-display text-3xl text-primary">{formatPrice(product.price)}</p>

          {product.short_description ? (
            <p className="mt-4 text-muted-foreground">{product.short_description}</p>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Lokacija</dt>
              <dd className="mt-1 flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                {product.location ?? "Nije navedeno"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Objavljeno</dt>
              <dd className="mt-1">{formatDate(product.created_at)}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {isOwner ? (
              <Button asChild>
                <Link to="/uredi-proizvod/$id" params={{ id: product.id }}>
                  Uredi proizvod
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={openInquiry}>
                  <MessageCircle className="mr-1 size-4" /> Zainteresovan/a sam
                </Button>
                <Button size="lg" variant="outline" onClick={openInquiry}>
                  Kontaktiraj prodavca
                </Button>
                <Button size="lg" variant="ghost" onClick={() => setPayOpen(true)}>
                  <CreditCard className="mr-1 size-4" /> Plati online
                </Button>
              </>
            )}
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Plaćanje i dostavu dogovarate direktno sa prodavcem — kurirska služba, lično
              preuzimanje ili pouzeće.
            </span>
          </div>

          {seller ? (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
                O tvorcu
              </h2>
              <div className="mt-4 flex items-start gap-4">
                <Avatar className="size-14 border border-border">
                  {seller.avatar_url ? (
                    <AvatarImage src={seller.avatar_url} alt={seller.name} />
                  ) : null}
                  <AvatarFallback>{seller.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-display text-lg">{seller.name}</p>
                  {seller.location ? (
                    <p className="text-sm text-muted-foreground">{seller.location}</p>
                  ) : null}
                  {seller.bio ? (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{seller.bio}</p>
                  ) : null}
                  <Button asChild variant="link" className="mt-1 h-auto p-0">
                    <Link to="/prodavac/$id" params={{ id: seller.id }}>
                      Pogledaj profil prodavca
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {product.description ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="font-display text-2xl">Opis</h2>
          <p className="mt-4 leading-relaxed whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>
        </section>
      ) : null}

      {otherProducts && otherProducts.filter((p) => p.id !== product.id).length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-2xl">Još od {seller?.name ?? "prodavca"}</h2>
          <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {otherProducts
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <Link
                  key={p.id}
                  to="/proizvod/$id"
                  params={{ id: p.id }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <img
                    src={firstImage(p)}
                    alt={p.name}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <p className="line-clamp-2 text-sm">{p.name}</p>
                    <p className="mt-1 text-sm text-primary">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Pošalji poruku prodavcu</DialogTitle>
            <DialogDescription>
              Poruka se prosleđuje kroz platformu. Dogovorite plaćanje i dostavu direktno.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            rows={6}
            aria-label="Tekst poruke"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInquiryOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={submitInquiry} disabled={sending}>
              {sending ? "Šalje se…" : "Pošalji poruku"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Online plaćanje (prototip)</DialogTitle>
            <DialogDescription>
              U ovoj MVP verziji online plaćanje je prikazano kao koncept, bez stvarne naplate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
            <div className="flex justify-between">
              <span>Proizvod</span>
              <span className="text-right">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Cena</span>
              <span>{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dostava</span>
              <span>po dogovoru sa prodavcem</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Zatvori
            </Button>
            <Button
              onClick={() => {
                setPayOpen(false);
                toast.success("Demo: plaćanje bi ovde bilo obrađeno i prodavac obavešten.");
              }}
            >
              Nastavi na plaćanje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

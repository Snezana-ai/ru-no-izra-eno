import {
  Scissors,
  CircleDot,
  TreeDeciduous,
  Gem,
  Flower2,
  Landmark,
  Shirt,
  Home,
  Gift,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type ProductStatus = "dostupno" | "rezervisano" | "prodato" | "nacrt";

export type Product = {
  id: string;
  seller_id: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price: number;
  category: string;
  images: string[];
  location: string | null;
  status: string;
  is_hidden?: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  public_contact: string | null;
  is_demo: boolean;
  is_blocked?: boolean;
  created_at: string;
};

export type ProductWithSeller = Product & { seller: Profile | null };

export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export const CATEGORIES: Category[] = [
  {
    slug: "tekstil-i-vez",
    name: "Tekstil i vez",
    description: "Vezeni stolnjaci, jastučnice i tkanine",
    icon: Scissors,
  },
  {
    slug: "keramika",
    name: "Keramika",
    description: "Posude, šolje i činije sa vitla",
    icon: CircleDot,
  },
  {
    slug: "drvo",
    name: "Proizvodi od drveta",
    description: "Rezbarije, kutije i ukrasi",
    icon: TreeDeciduous,
  },
  {
    slug: "nakit-i-modni-detalji",
    name: "Nakit i modni detalji",
    description: "Minđuše, ogrlice i torbe",
    icon: Gem,
  },
  {
    slug: "dekoracija",
    name: "Dekoracija",
    description: "Ukrasi za dom i venci",
    icon: Flower2,
  },
  {
    slug: "tradicionalne-rukotvorine",
    name: "Tradicionalne rukotvorine",
    description: "Suveniri i narodni motivi",
    icon: Landmark,
  },
  {
    slug: "odeca",
    name: "Odeća",
    description: "Pletenine i šivena odeća",
    icon: Shirt,
  },
  {
    slug: "kuca-i-dekoracija",
    name: "Kuća i uređenje",
    description: "Sitnice za kuhinju i dom",
    icon: Home,
  },
  {
    slug: "pokloni",
    name: "Ručno rađeni pokloni",
    description: "Poklon setovi i sitnice",
    icon: Gift,
  },
  {
    slug: "ostalo",
    name: "Ostalo",
    description: "Sve što ne staje u kategorije",
    icon: Sparkles,
  },
];

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "dostupno", label: "Dostupno" },
  { value: "rezervisano", label: "Rezervisano" },
  { value: "prodato", label: "Prodato" },
  { value: "nacrt", label: "Nacrt" },
];

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? "Ostalo";
}

export function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(price)} RSD`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export const FREE_PRODUCTS = 5;
export const PACK_SIZE = 10;
export const PACK_PRICE = 100;

export type PlanInfo = {
  published: number;
  allowance: number;
  monthlyPrice: number;
  packs: number;
  planLabel: string;
};

/** Prvih 5 proizvoda je besplatno, potom 100 RSD/mesec za svakih dodatnih 10. */
export function planForCount(published: number): PlanInfo {
  if (published <= FREE_PRODUCTS) {
    return {
      published,
      allowance: FREE_PRODUCTS,
      monthlyPrice: 0,
      packs: 0,
      planLabel: "Besplatan plan",
    };
  }
  const packs = Math.ceil((published - FREE_PRODUCTS) / PACK_SIZE);
  return {
    published,
    allowance: FREE_PRODUCTS + packs * PACK_SIZE,
    monthlyPrice: packs * PACK_PRICE,
    packs,
    planLabel: `Paket +${packs * PACK_SIZE} proizvoda`,
  };
}

export const PLACEHOLDER_IMAGE = "/images/prod-keramika-2.jpg";

export function firstImage(product: Pick<Product, "images">): string {
  return product.images?.[0] ?? PLACEHOLDER_IMAGE;
}

export const DEFAULT_INQUIRY =
  "Zdravo, zainteresovan/a sam za kupovinu ovog proizvoda. Da li je još dostupan?";

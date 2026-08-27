import { supabase } from "@/integrations/supabase/client";
import type { Product, Profile, ProductWithSeller } from "@/lib/marketplace";

const PUBLIC_STATUSES = ["dostupno", "rezervisano", "prodato"];

export type ProductFilters = {
  q?: string | undefined;
  kategorija?: string | undefined;
  minCena?: number | undefined;
  maxCena?: number | undefined;
  sort?: "najnovije" | "cena-rastuce" | "cena-opadajuce" | undefined;
};

async function attachSellers(products: Product[]): Promise<ProductWithSeller[]> {
  const ids = [...new Set(products.map((p) => p.seller_id))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  const byId = new Map((data as Profile[]).map((p) => [p.id, p]));
  return products.map((p) => ({ ...p, seller: byId.get(p.seller_id) ?? null }));
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductWithSeller[]> {
  let query = supabase.from("products").select("*").in("status", PUBLIC_STATUSES);

  if (filters.kategorija) query = query.eq("category", filters.kategorija);
  if (typeof filters.minCena === "number") query = query.gte("price", filters.minCena);
  if (typeof filters.maxCena === "number") query = query.lte("price", filters.maxCena);
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(
      `name.ilike.${term},short_description.ilike.${term},description.ilike.${term}`,
    );
  }

  if (filters.sort === "cena-rastuce") query = query.order("price", { ascending: true });
  else if (filters.sort === "cena-opadajuce") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(200);
  if (error) throw error;
  return attachSellers((data ?? []) as Product[]);
}

export async function fetchProduct(id: string): Promise<ProductWithSeller | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withSeller] = await attachSellers([data as Product]);
  return withSeller ?? null;
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function fetchSellerProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .in("status", PUBLIC_STATUSES)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchMyProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type Conversation = {
  partner: Profile;
  lastMessage: Message;
  unread: number;
  productId: string | null;
};

export async function fetchMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const messages = await fetchMessages(userId);
  if (messages.length === 0) return [];

  const partnerIds = [
    ...new Set(messages.map((m) => (m.sender_id === userId ? m.receiver_id : m.sender_id))),
  ];
  const { data, error } = await supabase.from("profiles").select("*").in("id", partnerIds);
  if (error) throw error;
  const profiles = new Map((data as Profile[]).map((p) => [p.id, p]));

  const map = new Map<string, Conversation>();
  for (const m of messages) {
    const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    const partner = profiles.get(partnerId);
    if (!partner) continue;
    const existing = map.get(partnerId);
    const unread = m.receiver_id === userId && !m.read_at ? 1 : 0;
    if (!existing) {
      map.set(partnerId, {
        partner,
        lastMessage: m,
        unread,
        productId: m.product_id,
      });
    } else {
      existing.lastMessage = m;
      existing.unread += unread;
      if (m.product_id) existing.productId = m.product_id;
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime(),
  );
}

export async function sendMessage(input: {
  senderId: string;
  receiverId: string;
  productId?: string | null;
  body: string;
}) {
  const { error } = await supabase.from("messages").insert({
    sender_id: input.senderId,
    receiver_id: input.receiverId,
    product_id: input.productId ?? null,
    body: input.body,
  });
  if (error) throw error;
}

export async function markConversationRead(userId: string, partnerId: string) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", userId)
    .eq("sender_id", partnerId)
    .is("read_at", null);
}

export async function uploadImage(bucket: string, userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError) throw signError;
  return data.signedUrl;
}

export type ProductInput = {
  name: string;
  short_description: string | null;
  description: string | null;
  price: number;
  category: string;
  location: string | null;
  status: string;
  images: string[];
};

export async function createProduct(sellerId: string, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({ ...input, seller_id: sellerId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export type ProfileInput = {
  name: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  public_contact: string | null;
};

export async function updateProfile(id: string, input: ProfileInput): Promise<void> {
  const { error } = await supabase.from("profiles").update(input).eq("id", id);
  if (error) throw error;
}

export type Contacts = { email: string | null; phone: string | null };

export async function fetchContacts(userId: string): Promise<Contacts | null> {
  const { data, error } = await supabase
    .from("profile_contacts")
    .select("email, phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Contacts | null) ?? null;
}

export async function upsertContacts(userId: string, input: Contacts): Promise<void> {
  const { error } = await supabase
    .from("profile_contacts")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id" });
  if (error) throw error;
}

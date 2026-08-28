import { supabase } from "@/integrations/supabase/client";
import type { Product, Profile } from "@/lib/marketplace";

export type AdminUser = Profile & { email: string | null };

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) return false;
  return data === true;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: contacts } = await supabase.from("profile_contacts").select("user_id, email");
  const emails = new Map((contacts ?? []).map((c) => [c.user_id, c.email]));

  return (profiles ?? []).map((p) => ({
    ...(p as Profile),
    email: emails.get(p.id) ?? null,
  }));
}

export async function setUserBlocked(userId: string, blocked: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_blocked: blocked })
    .eq("id", userId);
  if (error) throw error;
}

export type AdminProduct = Product & { seller: Profile | null };

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const products = (data ?? []) as Product[];

  const ids = [...new Set(products.map((p) => p.seller_id))];
  if (ids.length === 0) return [];
  const { data: sellers } = await supabase.from("profiles").select("*").in("id", ids);
  const byId = new Map(((sellers ?? []) as Profile[]).map((s) => [s.id, s]));
  return products.map((p) => ({ ...p, seller: byId.get(p.seller_id) ?? null }));
}

export async function setProductHidden(productId: string, hidden: boolean): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ is_hidden: hidden })
    .eq("id", productId);
  if (error) throw error;
}

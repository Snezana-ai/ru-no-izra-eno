import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchConversations,
  fetchMessages,
  fetchProfile,
  markConversationRead,
  sendMessage,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

type MessagesSearch = { sa?: string };

export const Route = createFileRoute("/_authenticated/poruke")({
  validateSearch: (search: Record<string, unknown>): MessagesSearch => ({
    sa: typeof search.sa === "string" && search.sa ? search.sa : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Poruke — Rukotvorine" },
      {
        name: "description",
        content:
          "Interna prepiska između kupaca i tvoraca: dogovori detalje, cenu i dostavu bez deljenja privatnih kontakata.",
      },
      { property: "og:title", content: "Poruke — Rukotvorine" },
      { property: "og:description", content: "Prepiska sa kupcima i prodavcima na jednom mestu." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { sa } = Route.useSearch();
  const navigate = useNavigate({ from: "/poruke" });
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const { data: conversations } = useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    queryFn: () => fetchConversations(userId),
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", userId],
    enabled: !!userId,
    queryFn: () => fetchMessages(userId),
  });

  const { data: partner } = useQuery({
    queryKey: ["profile", sa],
    enabled: !!sa,
    queryFn: () => fetchProfile(sa!),
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("messages-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId || !sa) return;
    markConversationRead(userId, sa).then(() => {
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
    });
  }, [userId, sa, queryClient]);

  const thread = useMemo(
    () =>
      (messages ?? []).filter(
        (m) =>
          (m.sender_id === sa && m.receiver_id === userId) ||
          (m.receiver_id === sa && m.sender_id === userId),
      ),
    [messages, sa, userId],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sa || draft.trim().length === 0) return;
    setSending(true);
    try {
      await sendMessage({ senderId: userId, receiverId: sa, body: draft.trim().slice(0, 1000) });
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    } catch {
      toast.error("Poruka nije poslata.");
    } finally {
      setSending(false);
    }
  }

  const list = conversations ?? [];

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl">Poruke</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Prepiska se vodi kroz platformu — kontakte delite samo ako želite.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-border bg-card">
          {list.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Još nema razgovora. Pošaljite poruku sa strane proizvoda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((c) => (
                <li key={c.partner.id}>
                  <button
                    onClick={() => navigate({ search: { sa: c.partner.id } })}
                    className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/60 ${
                      sa === c.partner.id ? "bg-secondary" : ""
                    }`}
                  >
                    <Avatar className="size-10 border border-border">
                      {c.partner.avatar_url ? (
                        <AvatarImage src={c.partner.avatar_url} alt={c.partner.name} />
                      ) : null}
                      <AvatarFallback>{c.partner.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{c.partner.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.lastMessage.body}
                      </span>
                    </span>
                    {c.unread > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {c.unread}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-card">
          {!sa ? (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground">
              Izaberite razgovor sa leve strane.
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-border p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-border">
                    {partner?.avatar_url ? (
                      <AvatarImage src={partner.avatar_url} alt={partner.name} />
                    ) : null}
                    <AvatarFallback>{partner?.name?.slice(0, 1) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-display">{partner?.name ?? "Korisnik"}</p>
                    {partner?.location ? (
                      <p className="text-xs text-muted-foreground">{partner.location}</p>
                    ) : null}
                  </div>
                </div>
                {partner ? (
                  <Button asChild variant="link" size="sm">
                    <Link to="/prodavac/$id" params={{ id: partner.id }}>
                      Profil
                    </Link>
                  </Button>
                ) : null}
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {thread.map((m) => {
                  const mine = m.sender_id === userId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <p
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {m.body}
                      </p>
                    </div>
                  );
                })}
                {thread.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Započnite razgovor prvom porukom.
                  </p>
                ) : null}
              </div>

              <form onSubmit={submit} className="flex items-end gap-3 border-t border-border p-4">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                  rows={2}
                  placeholder="Napišite poruku…"
                  aria-label="Nova poruka"
                />
                <Button type="submit" disabled={sending || !draft.trim()}>
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

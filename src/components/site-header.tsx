import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Početna" },
  { to: "/proizvodi", label: "Proizvodi" },
  { to: "/kategorije", label: "Kategorije" },
  { to: "/kako-funkcionise", label: "Kako funkcioniše" },
  { to: "/o-nama", label: "O nama" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (profile?.name ?? "K").slice(0, 1).toUpperCase();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sprout className="size-5" />
          </span>
          <span className="font-display text-xl tracking-tight">Rukotvorine</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary font-medium" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/poruke">Poruke</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/dodaj-proizvod">Dodaj proizvod</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-9 border border-border">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/kontrolna-tabla">Kontrolna tabla</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/moji-proizvodi">Moji proizvodi</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/poruke">Poruke</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/moj-profil">Moj profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>Odjava</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/prijava">Prijava</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/prijava" search={{ mode: "registracija" }}>
                  Počni da prodaješ
                </Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Meni"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/70 bg-background lg:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-sm text-foreground/80"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="mt-2 flex flex-col border-t border-border pt-2">
                <Link
                  to="/kontrolna-tabla"
                  onClick={() => setOpen(false)}
                  className="px-2 py-3 text-sm"
                >
                  Kontrolna tabla
                </Link>
                <Link to="/poruke" onClick={() => setOpen(false)} className="px-2 py-3 text-sm">
                  Poruke
                </Link>
                <Link
                  to="/dodaj-proizvod"
                  onClick={() => setOpen(false)}
                  className="px-2 py-3 text-sm"
                >
                  Dodaj proizvod
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

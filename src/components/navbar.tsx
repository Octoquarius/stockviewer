"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Ara" },
  { href: "/dashboard", label: "Takip Listem" },
  { href: "/notifications", label: "Bildirimlerim" },
];

export function Navbar() {
  const pathname = usePathname();
  const { tracked, rules } = useStore();
  const { user, configured, signOut } = useAuth();

  const count: Record<string, number> = {
    "/dashboard": tracked.length,
    "/notifications": rules.filter((r) => r.isActive).length,
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--background)]/80 border-b border-border/70">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-primary text-white shadow-sm shadow-primary/30">
            🛍️
          </span>
          <span>
            Stock<span className="text-primary">Viewer</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            const badge = count[l.href];
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "text-foreground/70 hover:text-foreground hover:bg-primary-soft"
                }`}
              >
                {l.label}
                {badge ? (
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs rounded-full ${
                      active ? "bg-white/25" : "bg-primary text-white"
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <span className="mx-1 w-px h-6 bg-border" />

          {user ? (
            <button
              onClick={() => signOut()}
              title={user.email ?? "Çıkış"}
              className="px-3 py-2 rounded-full text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-primary-soft"
            >
              Çıkış
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 rounded-full text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-primary-soft"
            >
              {configured ? "Giriş" : "Demo"}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

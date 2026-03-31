"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, LayoutDashboard, LogOut, Menu, ReceiptText, Scale, Tags, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./brand-mark";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const BASE_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monthly-plan", label: "Mensal", icon: CalendarDays },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/transactions", label: "Lançamentos", icon: ReceiptText },
  { href: "/comparison", label: "Comparação", icon: BarChart3 },
];

const REBALANCING_LINK = { href: "/rebalancing", label: "Carteira", icon: Scale };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [rebalancingAllowed, setRebalancingAllowed] = useState(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/rebalancing/access")
      .then((r) => r.json())
      .then((data) => setRebalancingAllowed(data.allowed === true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandaloneState = () => {
      const iosStandalone = "standalone" in window.navigator && window.navigator.standalone === true;
      setIsStandalonePwa(mediaQuery.matches || iosStandalone);
    };

    updateStandaloneState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateStandaloneState);
      return () => mediaQuery.removeEventListener("change", updateStandaloneState);
    }

    mediaQuery.addListener(updateStandaloneState);
    return () => mediaQuery.removeListener(updateStandaloneState);
  }, []);

  useEffect(() => {
    if (!isStandalonePwa || !isMobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen, isStandalonePwa]);

  const links = useMemo(() => {
    if (rebalancingAllowed) return [...BASE_LINKS, REBALANCING_LINK];
    return BASE_LINKS;
  }, [rebalancingAllowed]);

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className={["dark min-h-screen text-slate-100 md:pb-10", isStandalonePwa ? "pb-6" : "pb-24"].join(" ")}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8 2xl:px-10">
          <BrandMark dark />
          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Organize o mês e acompanhe o realizado.
            </div>
            <ThemeToggle />
            <button
              onClick={logout}
              className="secondary-button border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            {isStandalonePwa ? (
              <button
                type="button"
                aria-label={isMobileMenuOpen ? "Fechar navegação" : "Abrir navegação"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-pwa-drawer"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1760px] grid-cols-1 gap-5 px-4 py-5 sm:px-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-6 md:py-8 xl:grid-cols-[300px_minmax(0,1fr)] xl:px-8 2xl:gap-8 2xl:px-10">
        <aside className="glass-surface hidden h-fit overflow-hidden p-4 md:block">
          <div className="mb-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Visão atual</div>
            <div className="mt-2 text-lg font-semibold text-white">Painel financeiro</div>
            <p className="mt-1 text-sm text-slate-400">Mobile-first no iPhone, completo no desktop.</p>
          </div>
          <nav className="space-y-2">
            {links.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-[linear-gradient(135deg,rgba(56,189,248,0.25),rgba(139,92,246,0.28))] text-white shadow-lg shadow-cyan-950/30 ring-1 ring-white/10"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      active ? "bg-white/10" : "bg-slate-900/80 ring-1 ring-white/5",
                    ].join(" ")}
                  >
                    <Icon size={16} />
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <div className="font-medium">Ritmo do casal</div>
            <p className="mt-1 text-emerald-50/80">Mantenha orçamento, comparação e lançamentos sempre acessíveis.</p>
          </div>
          <button
            onClick={logout}
            className="secondary-button mt-4 w-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
          >
            <LogOut size={14} />
            Encerrar sessão
          </button>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>

      {isStandalonePwa && isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition duration-200 md:hidden"
          aria-hidden={false}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            id="mobile-pwa-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navegação principal"
            className="safe-top safe-bottom absolute inset-y-0 right-0 flex w-[min(86vw,22rem)] flex-col border-l border-white/10 bg-slate-950/95 px-4 py-4 shadow-2xl shadow-slate-950/70 transition-transform duration-200 translate-x-0"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Navegação</div>
                <div className="mt-2 text-lg font-semibold text-white">Tudo o que importa do mês</div>
                <p className="mt-1 text-sm text-slate-400">Acesso rápido sem ocupar a base da tela.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
              {links.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={[
                      "flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-[linear-gradient(135deg,rgba(56,189,248,0.24),rgba(139,92,246,0.26))] text-white shadow-lg shadow-cyan-950/20 ring-1 ring-white/10"
                        : "bg-white/[0.03] text-slate-300 hover:bg-white/8 hover:text-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-2xl",
                        active ? "bg-white/10" : "bg-slate-900/90 ring-1 ring-white/5",
                      ].join(" ")}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="flex-1">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                void logout();
              }}
              className="secondary-button mt-4 min-h-12 w-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      ) : !isStandalonePwa ? (
        <nav className="safe-bottom fixed inset-x-4 bottom-0 z-30 md:hidden">
          <div className={["glass-surface grid gap-2 px-3 py-3", links.length >= 6 ? "grid-cols-7" : "grid-cols-6"].join(" ")}>
            {links.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                    active ? "bg-white/10 text-white" : "text-slate-400",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-slate-400"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}


"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, LayoutDashboard, LogOut, ReceiptText, Tags } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./brand-mark";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monthly-plan", label: "Mensal", icon: CalendarDays },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/transactions", label: "Lançamentos", icon: ReceiptText },
  { href: "/comparison", label: "Comparação", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="dark min-h-screen pb-24 text-slate-100 md:pb-10">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
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
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-6 md:py-8">
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

      <nav className="safe-bottom fixed inset-x-4 bottom-0 z-30 md:hidden">
        <div className="glass-surface grid grid-cols-6 gap-2 px-3 py-3">
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
    </div>
  );
}


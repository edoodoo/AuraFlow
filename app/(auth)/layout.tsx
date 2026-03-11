import { BrandMark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden px-6 lg:block">
          <BrandMark />
          <div className="mt-10 max-w-xl">
            <div className="soft-label">AuraFlow no dia a dia</div>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">
              Controle financeiro compartilhado com visual de produto.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Uma experiência leve para login e onboarding, com base pronta para continuar no dashboard
              premium do app.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="light-panel p-5">
              <div className="soft-label">Resumo</div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">Mês claro</div>
              <p className="mt-2 text-sm text-slate-600">Visão organizada desde o primeiro acesso.</p>
            </div>
            <div className="light-panel p-5">
              <div className="soft-label">Casal</div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">Em sintonia</div>
              <p className="mt-2 text-sm text-slate-600">Cada lançamento com contexto e comparação.</p>
            </div>
            <div className="light-panel p-5">
              <div className="soft-label">Mobile</div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">Pronto para iPhone</div>
              <p className="mt-2 text-sm text-slate-600">Fluxos pensados para uso diário e toque.</p>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}


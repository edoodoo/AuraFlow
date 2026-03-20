export default function MaintenancePage() {
  return (
    <main className="dark min-h-screen px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <section className="glass-surface w-full p-8 text-center sm:p-10">
          <div className="soft-label text-slate-400">AuraFlow</div>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Site fora do ar</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Estamos realizando ajustes temporários para voltar com a experiência estável.
            Tente novamente em instantes.
          </p>
        </section>
      </div>
    </main>
  );
}

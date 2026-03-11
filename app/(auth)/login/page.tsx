"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="light-panel w-full max-w-md p-6 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <BrandMark compact />
        <span className="rounded-full bg-slate-950/5 px-3 py-1 text-xs font-medium text-slate-500">Entrar</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Entrar no AuraFlow</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Controle financeiro compartilhado do casal.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-300"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Senha</label>
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-300"
            required
          />
        </div>
        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
        <button disabled={loading} className="primary-button w-full">
          {loading ? "Entrando..." : "Entrar"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link className="text-slate-500 hover:text-slate-950 hover:underline" href="/forgot-password">
          Esqueci minha senha
        </Link>
        <Link className="font-semibold text-slate-950 hover:underline" href="/register">
          Criar conta
        </Link>
      </div>
    </div>
  );
}


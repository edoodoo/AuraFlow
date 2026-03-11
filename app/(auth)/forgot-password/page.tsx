"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      setMessage("Se o e-mail existir, enviamos um link de recuperação.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="light-panel w-full max-w-md p-6 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <BrandMark compact />
        <span className="rounded-full bg-slate-950/5 px-3 py-1 text-xs font-medium text-slate-500">Recuperação</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Informe o e-mail da sua conta para receber o link.</p>
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
        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
        {message && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        <button disabled={loading} className="primary-button w-full">
          {loading ? "Enviando..." : "Enviar link"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-slate-950 hover:underline">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}


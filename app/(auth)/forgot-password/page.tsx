"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
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
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="mb-1 text-2xl font-semibold">Recuperar senha</h1>
      <p className="mb-6 text-sm text-zinc-500">Informe o e-mail da sua conta.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-emerald-500">{message}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        <Link href="/login" className="font-medium hover:underline">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}


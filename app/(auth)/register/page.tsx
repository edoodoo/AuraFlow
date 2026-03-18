"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("Informe nome e sobrenome para continuar.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });
      if (signUpError) throw signUpError;
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="light-panel w-full max-w-md p-6 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <BrandMark compact />
        <span className="rounded-full bg-slate-950/5 px-3 py-1 text-xs font-medium text-slate-500">Criar conta</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Começar com o AuraFlow</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use e-mail e senha para criar sua conta compartilhada.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              type="text"
              placeholder="Eduardo"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-300"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Sobrenome</label>
            <input
              type="text"
              placeholder="Araujo"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-300"
              required
            />
          </div>
        </div>
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
            placeholder="Crie uma senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-300"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Confirmar senha</label>
          <input
            type="password"
            placeholder="Repita sua senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-sky-300"
            required
          />
        </div>
        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
        <button disabled={loading} className="primary-button w-full">
          {loading ? "Criando..." : "Criar conta"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Já possui conta?{" "}
        <Link className="font-semibold text-slate-950 hover:underline" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}


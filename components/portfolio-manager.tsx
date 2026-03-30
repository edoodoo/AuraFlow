"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type Asset = {
  id: string;
  ticker: string;
  label: string | null;
  target_pct: number;
  is_active: boolean;
};

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export function PortfolioManager({ onClose, onSaved }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New asset form
  const [newTicker, setNewTicker] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPct, setNewPct] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState("");

  const sumPct = assets.reduce((s, a) => s + Number(a.target_pct), 0);
  const isValid = Math.abs(sumPct - 100) < 0.01;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rebalancing/assets");
      const data = await res.json();
      setAssets(data.assets ?? []);
    } catch {
      setError("Erro ao carregar ativos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async () => {
    if (!newTicker.trim() || !newPct) return;
    const pct = parseFloat(newPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError("Percentual inválido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/rebalancing/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: newTicker.trim().toUpperCase(), label: newLabel.trim() || undefined, target_pct: pct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar.");
      setAssets((prev) => [...prev, data.asset]);
      setNewTicker("");
      setNewLabel("");
      setNewPct("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar ativo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const pct = parseFloat(editPct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError("Percentual inválido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rebalancing/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_pct: pct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar.");
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, target_pct: data.asset.target_pct } : a)));
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rebalancing/assets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover.");
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="glass-surface relative z-10 w-full max-w-lg rounded-t-3xl p-6 sm:rounded-3xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Gerenciar Portfólio</h2>
            <p className="mt-0.5 text-xs text-slate-400">Configure seus ativos e percentuais alvo</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Validation bar */}
        <div
          className={[
            "mb-4 rounded-2xl px-4 py-3 text-sm font-medium",
            isValid
              ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border border-amber-400/20 bg-amber-400/10 text-amber-300",
          ].join(" ")}
        >
          Soma dos alvos: <span className="font-bold">{sumPct.toFixed(1)}%</span>
          {!isValid && " — deve ser exatamente 100%"}
          {isValid && " ✓"}
        </div>

        {/* Asset list */}
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Carregando...</div>
        ) : (
          <div className="space-y-2">
            {assets.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-500">Nenhum ativo cadastrado.</div>
            )}
            {assets.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-white">{a.ticker}</span>
                    {a.label && <span className="text-xs text-slate-400 truncate">{a.label}</span>}
                  </div>
                </div>

                {editId === a.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editPct}
                      onChange={(e) => setEditPct(e.target.value)}
                      className="w-20 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                      autoFocus
                    />
                    <span className="text-slate-400">%</span>
                    <button
                      onClick={() => handleSaveEdit(a.id)}
                      disabled={saving}
                      className="rounded-xl bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-300 hover:bg-sky-500/30"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-xl px-2 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="min-w-[3rem] text-right text-sm font-semibold text-sky-400">
                      {Number(a.target_pct).toFixed(1)}%
                    </span>
                    <button
                      onClick={() => { setEditId(a.id); setEditPct(String(a.target_pct)); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={saving}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new asset form */}
        {showForm ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Ticker</label>
                <input
                  type="text"
                  placeholder="ex: VFV"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Alvo %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="ex: 65"
                  value={newPct}
                  onChange={(e) => setNewPct(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Label (opcional)</label>
              <input
                type="text"
                placeholder="ex: S&P 500"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={60}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving || !newTicker.trim() || !newPct}
                className="flex-1 rounded-xl bg-sky-500/20 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/30 disabled:opacity-40"
              >
                Adicionar
              </button>
              <button
                onClick={() => { setShowForm(false); setNewTicker(""); setNewLabel(""); setNewPct(""); }}
                className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-3 text-sm text-slate-400 hover:border-sky-500/30 hover:text-sky-400"
          >
            <Plus size={15} />
            Novo ativo
          </button>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Done button */}
        <button
          onClick={() => { onSaved(); onClose(); }}
          disabled={!isValid && assets.length > 0}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-sky-500/20 to-violet-500/20 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:from-sky-500/30 hover:to-violet-500/30 disabled:opacity-40"
        >
          Concluído
        </button>
      </div>
    </div>
  );
}

"use client";

type BrandMarkProps = {
  compact?: boolean;
  dark?: boolean;
};

export function BrandMark({ compact = false, dark = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "relative flex items-center justify-center overflow-hidden rounded-2xl",
          compact ? "h-10 w-10" : "h-12 w-12",
          dark
            ? "bg-white/10 ring-1 ring-white/10"
            : "bg-slate-950/5 ring-1 ring-slate-950/8",
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.9),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.9),transparent_60%),linear-gradient(135deg,rgba(14,165,233,0.95),rgba(139,92,246,0.9))]" />
        <span className="relative text-lg font-bold text-white">{compact ? "A" : "A"}</span>
      </div>
      <div>
        <div className={["font-semibold tracking-tight", dark ? "text-white" : "text-slate-950"].join(" ")}>
          AuraFlow
        </div>
        {!compact && (
          <div className={["text-xs", dark ? "text-slate-400" : "text-slate-500"].join(" ")}>
            Finanças em sintonia
          </div>
        )}
      </div>
    </div>
  );
}

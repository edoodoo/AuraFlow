"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode, useId } from "react";

export type AccordionSectionProps = {
  /** Stable id fragment for aria ids (e.g. section key). */
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  softLabel: string;
  title: string;
  helper: string;
  badge: ReactNode;
  children: ReactNode;
  heading?: "h2" | "h3";
  surfaceClassName?: string;
};

const collapseEase = [0.4, 0, 0.2, 1] as const;

export function AccordionSection({
  instanceId,
  open,
  onOpenChange,
  softLabel,
  title,
  helper,
  badge,
  children,
  heading = "h3",
  surfaceClassName = "glass-surface p-5 sm:p-6",
}: AccordionSectionProps) {
  const reactId = useId();
  const safeId = instanceId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const headerId = `${reactId}-hdr-${safeId}`;
  const panelId = `${reactId}-pnl-${safeId}`;

  const HeadingTag = heading;

  return (
    <div className={surfaceClassName}>
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-start justify-between gap-4 rounded-2xl border border-transparent text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <div className="min-w-0 flex-1">
          <div className="soft-label text-slate-400">{softLabel}</div>
          <HeadingTag className="mt-2 text-2xl font-semibold text-white">{title}</HeadingTag>
          <p className={open ? "mt-2 text-sm leading-6 text-slate-400" : "sr-only"}>{helper}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">{badge}</span>
          <span className="text-slate-300" aria-hidden>
            {open ? <ChevronUp size={22} strokeWidth={2} /> : <ChevronDown size={22} strokeWidth={2} />}
          </span>
        </span>
      </button>

      <motion.div
        initial={false}
        animate={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        transition={{ duration: 0.3, ease: collapseEase }}
        className="grid overflow-hidden"
      >
        <div className="min-h-0 overflow-hidden">
          <div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            aria-hidden={!open}
            inert={!open}
            className="pt-5"
          >
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

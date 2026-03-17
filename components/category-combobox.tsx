"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

type ComboboxOption = {
  value: string;
  label: string;
  keywords?: string;
};

type CategoryComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  noResultsText?: string;
  triggerId?: string;
  dataScope?: string;
  dataField?: string;
};

export function CategoryCombobox({
  value,
  onChange,
  options,
  placeholder = "Selecione a categoria",
  disabled = false,
  required = false,
  className,
  noResultsText = "Nenhuma categoria encontrada.",
  triggerId,
  dataScope,
  dataField,
}: CategoryComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const haystack = `${option.label} ${option.keywords ?? ""}`.toLocaleLowerCase("pt-BR");
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setHighlightedIndex(0);
    searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (highlightedIndex <= filteredOptions.length - 1) return;
    setHighlightedIndex(0);
  }, [filteredOptions.length, highlightedIndex]);

  const commitSelection = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className={[
          "flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm outline-none",
          "text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          "focus-visible:border-cyan-300/60 focus-visible:ring-4 focus-visible:ring-cyan-400/10",
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white/10",
          className ?? "",
        ].join(" ")}
        data-item-scope={dataScope}
        data-field={dataField}
      >
        <span className={selectedOption ? "text-slate-100" : "text-slate-400"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {required && <input tabIndex={-1} className="sr-only" value={value} onChange={() => undefined} required />}

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full rounded-[1.4rem] border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(filteredOptions.length - 1, 0)));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                }
                if (event.key === "Enter" && filteredOptions[highlightedIndex]) {
                  event.preventDefault();
                  commitSelection(filteredOptions[highlightedIndex].value);
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setIsOpen(false);
                  setQuery("");
                }
              }}
              placeholder="Buscar categoria"
              className="pl-9"
            />
          </div>

          <div className="mt-2 max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <div role="listbox" className="space-y-1">
                {filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => commitSelection(option.value)}
                      className={[
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                        isHighlighted ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5",
                      ].join(" ")}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check size={14} className="text-cyan-300" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl px-3 py-3 text-sm text-slate-400">{noResultsText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

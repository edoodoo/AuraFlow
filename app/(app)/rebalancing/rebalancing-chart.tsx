"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartEntry = {
  ticker: string;
  target: number;
  current: number;
  post: number;
};

type Props = {
  data: ChartEntry[];
};

export function RebalancingChart({ data }: Props) {
  const [accent, setAccent] = useState("#38bdf8");
  const [success, setSuccess] = useState("#22c55e");

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const a = style.getPropertyValue("--accent").trim();
    const s = style.getPropertyValue("--success").trim();
    if (a) setAccent(a);
    if (s) setSuccess(s);
  }, []);

  return (
    <div className="glass-surface p-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.08)" />
          <XAxis
            dataKey="ticker"
            tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, "auto"]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: "0.75rem",
              fontSize: 12,
              color: "#e2e8f0",
            }}
            formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name)]}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 12 }}
          />
          <Bar dataKey="target" name="Alvo" fill={accent} radius={[6, 6, 0, 0]} />
          <Bar dataKey="current" name="Atual" fill="rgba(148,163,184,0.30)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="post" name="Pós-aporte" fill={success} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

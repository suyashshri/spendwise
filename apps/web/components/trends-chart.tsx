"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

export interface TrendPoint {
  month: number;
  year: number;
  totalSpent: number;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Single series -> sequential/one hue per the dataviz skill's form table; no legend needed (the
// card title already says what's plotted), and a soft ~10% area wash under a 2px line rather than
// a saturated fill block.
export function TrendsChart({ data, currency = "INR" }: { data: TrendPoint[]; currency?: string }) {
  const chartData = data.map((d) => ({ ...d, label: `${MONTH_SHORT[d.month - 1]} ${String(d.year).slice(2)}` }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => (v === 0 ? "0" : formatCurrency(v, currency).replace(/\.00$/, ""))}
          width={72}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value, currency), "Spent"]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="totalSpent"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={{ r: 4, fill: "var(--primary)", stroke: "var(--popover)", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "var(--primary)", stroke: "var(--popover)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

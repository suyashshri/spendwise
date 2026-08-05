"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyticsSummary } from "@spendwise/shared";
import { formatCurrency } from "@/lib/format";

// "Before -> after per item" per the dataviz skill's form table: 1 hue, 2 shades — not two
// categorical hues, since these are the same categories at two points in time, not two different
// identities.
export function CompareChart({
  month1,
  month2,
  month1Label,
  month2Label,
  currency = "INR",
}: {
  month1: AnalyticsSummary;
  month2: AnalyticsSummary;
  month1Label: string;
  month2Label: string;
  currency?: string;
}) {
  const categories = new Set([...month1.byCategory.map((c) => c.category), ...month2.byCategory.map((c) => c.category)]);
  const data = Array.from(categories)
    .map((category) => ({
      category,
      [month1Label]: month1.byCategory.find((c) => c.category === category)?.amount ?? 0,
      [month2Label]: month2.byCategory.find((c) => c.category === category)?.amount ?? 0,
    }))
    .sort((a, b) => (b[month2Label] as number) - (a[month2Label] as number));

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No spending in either month.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="category"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => (v === 0 ? "0" : formatCurrency(v, currency).replace(/\.00$/, ""))}
          width={72}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value, currency)}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey={month1Label} fill="color-mix(in oklch, var(--primary), transparent 55%)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey={month2Label} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

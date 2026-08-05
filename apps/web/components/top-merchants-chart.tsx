"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

export interface TopMerchant {
  merchant: string;
  totalSpent: number;
  count: number;
}

// Comparing magnitude across merchants (not identity/category), so one hue per the dataviz
// skill's form table — no legend needed. Bars capped at 24px, 4px rounded end away from the
// baseline (radius on the right end only, since these run left-to-right from 0).
export function TopMerchantsChart({ data, currency = "INR" }: { data: TopMerchant[]; currency?: string }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No transactions in this period.</p>;
  }

  const chartData = [...data].sort((a, b) => a.totalSpent - b.totalSpent);

  return (
    <ResponsiveContainer width="100%" height={Math.max(chartData.length * 40, 120)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="merchant"
          axisLine={false}
          tickLine={false}
          width={110}
          tick={{ fill: "var(--foreground)", fontSize: 13 }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value: number, _name, item) => [
            `${formatCurrency(value, currency)} · ${item.payload.count} txns`,
            "Spent",
          ]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
        />
        <Bar dataKey="totalSpent" radius={[0, 6, 6, 0]} maxBarSize={22} label={{ position: "right", formatter: (v: number) => formatCurrency(v, currency), fill: "var(--muted-foreground)", fontSize: 12 }}>
          {chartData.map((entry) => (
            <Cell key={entry.merchant} fill="var(--primary)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

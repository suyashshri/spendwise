import { getCategoryMeta } from "@spendwise/shared";
import { formatCurrency } from "@/lib/format";

export interface CategoryBreakdown {
  category: string;
  amount: number;
}

/**
 * Horizontal labeled bar list, not a pie/donut — with 11 possible categories we're well past the
 * ~7-class ceiling where color alone stops being a safe identity channel (see dataviz skill:
 * "More than ~7 classes that all carry meaning -> a table (or table + chart), not more colors").
 * Every row carries its own icon + name label, so identity never depends on telling two similar
 * hues apart — the categories' own colors weren't validated for CVD separation when first picked
 * for the mobile app (see specifications/14-web-dashboard.md), and reusing them here without this
 * mitigation would repeat that gap.
 */
export function SpendingBreakdown({ data, currency = "INR" }: { data: CategoryBreakdown[]; currency?: string }) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const max = Math.max(...sorted.map((d) => d.amount), 1);

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No spending yet this month.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {sorted.map(({ category, amount }) => {
        const { icon, color } = getCategoryMeta(category);
        const width = (amount / max) * 100;
        return (
          <div key={category} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
              style={{ backgroundColor: `${color}26` }}
            >
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{category}</span>
                <span className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(amount, currency)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

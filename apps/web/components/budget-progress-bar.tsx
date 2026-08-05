import { formatCurrency } from "@/lib/format";

export function BudgetProgressBar({
  label,
  spent,
  limit,
  alertAt,
  currency = "INR",
}: {
  label: string;
  spent: number;
  limit: number;
  alertAt: number;
  currency?: string;
}) {
  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOverAlert = limit > 0 && (spent / limit) * 100 >= alertAt;
  const isOverLimit = spent > limit;

  const barColor = isOverLimit
    ? "bg-destructive"
    : isOverAlert
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{label}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

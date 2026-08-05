import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  delta,
  deltaGoodDirection = "down",
  icon,
}: {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  deltaGoodDirection?: "up" | "down";
  icon?: React.ReactNode;
}) {
  const deltaColor =
    !delta || delta.direction === "flat"
      ? "text-muted-foreground"
      : delta.direction === deltaGoodDirection
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-destructive";

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="text-[28px] font-semibold leading-none tracking-tight">{value}</p>
      {delta ? (
        <p className={cn("text-xs font-medium", deltaColor)}>
          {delta.direction === "up" ? "↑" : delta.direction === "down" ? "↓" : "→"} {delta.value}
        </p>
      ) : null}
    </div>
  );
}

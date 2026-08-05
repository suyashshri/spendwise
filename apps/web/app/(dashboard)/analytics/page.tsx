"use client";

import { useEffect, useState } from "react";
import type { AnalyticsSummary, AnalyticsTrendPoint, TopMerchant } from "@spendwise/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompareChart } from "@/components/compare-chart";
import { StatTile } from "@/components/stat-tile";
import { TopMerchantsChart } from "@/components/top-merchants-chart";
import { TrendsChart } from "@/components/trends-chart";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { currentMonthYear, formatCurrency, monthLabel } from "@/lib/format";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "INR";
  const { month, year } = currentMonthYear();
  const prevMonthDate = new Date(year, month - 2, 1);

  const [trends, setTrends] = useState<AnalyticsTrendPoint[]>([]);
  const [topMerchants, setTopMerchants] = useState<TopMerchant[]>([]);
  const [compare, setCompare] = useState<{ month1: AnalyticsSummary; month2: AnalyticsSummary; delta: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      api.get<AnalyticsTrendPoint[]>("/analytics/trends", { params: { months: 6 } }),
      api.get<TopMerchant[]>("/analytics/top-merchants", { params: { month, year, limit: 8 } }),
      // /api/analytics/compare takes one `year` shared by both months (see
      // specifications/03-api-endpoints.md) — doesn't support a December -> January comparison
      // across a year boundary. Not fixed here; a real gap, noted in
      // specifications/14-web-dashboard.md.
      api.get<{ month1: AnalyticsSummary; month2: AnalyticsSummary; delta: number }>("/analytics/compare", {
        params: { month1: prevMonthDate.getMonth() + 1, month2: month, year },
      }),
    ])
      .then(([trendsRes, merchantsRes, compareRes]) => {
        if (cancelled) return;
        setTrends(trendsRes.data);
        setTopMerchants(merchantsRes.data);
        setCompare(compareRes.data);
      })
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const thisMonthLabel = monthLabel(month, year);
  const prevMonthLabel = monthLabel(prevMonthDate.getMonth() + 1, prevMonthDate.getFullYear());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Trends, comparisons, and where your money actually goes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending over the last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendsChart data={trends} currency={currency} />
        </CardContent>
      </Card>

      {compare ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatTile label={prevMonthLabel} value={formatCurrency(compare.month1.totalSpent, currency)} />
            <StatTile
              label={thisMonthLabel}
              value={formatCurrency(compare.month2.totalSpent, currency)}
              delta={{
                value: `${formatCurrency(Math.abs(compare.delta), currency)} vs ${prevMonthLabel}`,
                direction: compare.delta === 0 ? "flat" : compare.delta > 0 ? "up" : "down",
              }}
              deltaGoodDirection="down"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {prevMonthLabel} vs {thisMonthLabel}, by category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompareChart
                month1={compare.month1}
                month2={compare.month2}
                month1Label={prevMonthLabel}
                month2Label={thisMonthLabel}
                currency={currency}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Top merchants this month</CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading || topMerchants.length > 0 ? (
            <TopMerchantsChart data={topMerchants} currency={currency} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

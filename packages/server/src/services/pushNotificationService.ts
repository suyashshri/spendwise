import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { Types } from "mongoose";
import { getCurrencyInfo } from "@spendwise/shared";
import { Budget } from "../models/Budget";
import { User } from "../models/User";
import { periodStart, type BudgetAlert } from "./budgetChecker";

const expo = new Expo();

function formatAmount(amount: number, currency: string): string {
  const { locale } = getCurrencyInfo(currency);
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Sends a push notification for each budget alert that hasn't already been notified this period —
 * `checkBudgetsForTransaction` (budgetChecker.ts) is a pure, idempotent computation that returns
 * every budget currently over its threshold on every call; without the dedup here, a user 10
 * transactions past their 80% mark would get 10 identical push notifications. Kept as a separate
 * step (not folded into checkBudgetsForTransaction) so that pure computation stays pure — this is
 * the one place with the side effects: reads/writes Budget.lastAlertSentAt, reads User.pushTokens,
 * calls Expo's push API.
 *
 * Never throws — a failed push send shouldn't fail the transaction save that triggered it. Ticket-
 * level errors (e.g. DeviceNotRegistered — the app was uninstalled) are handled by pruning that
 * token; receipt-level errors (Expo processes the ticket ~15-30 min later) are NOT polled for in
 * this pass — see specifications/16-push-notifications.md for what a follow-up would add.
 */
export async function sendBudgetAlertPushes(userId: Types.ObjectId, alerts: BudgetAlert[]): Promise<void> {
  if (alerts.length === 0) return;

  const user = await User.findById(userId).select("pushTokens currency");
  if (!user || user.pushTokens.length === 0) return;

  const validTokens = user.pushTokens.filter((token) => Expo.isExpoPushToken(token));
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = [];
  const budgetsToMark: Types.ObjectId[] = [];

  for (const alert of alerts) {
    const budget = await Budget.findById(alert.budgetId);
    if (!budget) continue;

    const start = periodStart(budget.period);
    const alreadyNotified = budget.lastAlertSentAt && budget.lastAlertSentAt >= start;
    if (alreadyNotified) continue;

    const label = alert.category === "Overall" ? "your overall budget" : `your ${alert.category} budget`;
    const title = alert.percentUsed >= 100 ? "Budget exceeded" : "Budget alert";
    const body = `You've used ${Math.round(alert.percentUsed)}% of ${label} (${formatAmount(alert.spent, user.currency)} of ${formatAmount(alert.limit, user.currency)}).`;

    for (const token of validTokens) {
      messages.push({ to: token, sound: "default", title, body, data: { type: "budget_alert", category: alert.category } });
    }
    budgetsToMark.push(budget._id);
  }

  if (messages.length === 0) return;

  const invalidTokens = new Set<string>();
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          invalidTokens.add(chunk[i].to as string);
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[push] failed to send a notification chunk", err);
    }
  }

  await Budget.updateMany({ _id: { $in: budgetsToMark } }, { $set: { lastAlertSentAt: new Date() } });

  if (invalidTokens.size > 0) {
    await User.updateOne({ _id: userId }, { $pullAll: { pushTokens: [...invalidTokens] } });
  }
}

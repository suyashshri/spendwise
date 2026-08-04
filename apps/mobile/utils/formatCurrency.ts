import { getCurrencyInfo } from '@spendwise/shared';

export function formatCurrency(amount: number, currency = 'INR'): string {
  // Digit grouping (e.g. INR's lakh/crore grouping vs. USD's thousands) is a property of the
  // locale, not the currency code, so this can't just use a single hardcoded locale for every
  // currency — see packages/shared/currencies.ts.
  const { locale } = getCurrencyInfo(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

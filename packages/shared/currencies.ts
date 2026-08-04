export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  /** BCP-47 locale used to format this currency with Intl.NumberFormat — currency-specific
   * digit grouping (e.g. INR's lakh/crore grouping) is a locale property, not a currency one. */
  locale: string;
}

// All confirmed available from the Frankfurter exchange rate API (api.frankfurter.dev) — see
// specifications/12-multi-currency.md. Keep in sync with what services/exchangeRateService.ts
// can actually fetch a rate for.
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-IE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CHF', symbol: 'Fr.', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'en-HK' },
];

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

const BY_CODE = new Map(SUPPORTED_CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyInfo(code: string): CurrencyInfo {
  return BY_CODE.get(code) ?? { code, symbol: code, name: code, locale: 'en-US' };
}

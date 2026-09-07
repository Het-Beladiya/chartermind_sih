/**
 * Currency Conversion and Formatting Utilities for CharterMind
 * Base exchange rate: 1 USD = 83.50 INR (standard benchmark for Indian maritime bulk trade)
 */

export const USD_TO_INR_RATE = 83.5;

export type CurrencyUnit = 'USD' | 'INR';

/**
 * Converts USD amount to INR
 */
export function toINR(usd: number): number {
  return usd * USD_TO_INR_RATE;
}

/**
 * Converts INR amount to USD
 */
export function toUSD(inr: number): number {
  return inr / USD_TO_INR_RATE;
}

/**
 * Formats a monetary total or budget value
 * In USD: $1,250,000 USD (or $1.25M)
 * In INR: ₹1,043.75 Lakhs or ₹10.44 Cr
 */
export function formatMoney(
  usdAmount: number,
  currency: CurrencyUnit,
  options?: {
    compact?: boolean;
    showUnit?: boolean;
    decimals?: number;
  }
): string {
  const showUnit = options?.showUnit ?? true;
  const compact = options?.compact ?? false;

  if (currency === 'INR') {
    const inrVal = toINR(usdAmount);
    
    if (compact) {
      if (inrVal >= 10000000) {
        return `₹${(inrVal / 10000000).toFixed(options?.decimals ?? 2)} Cr`;
      }
      if (inrVal >= 100000) {
        return `₹${(inrVal / 100000).toFixed(options?.decimals ?? 2)}L`;
      }
      return `₹${Math.round(inrVal).toLocaleString('en-IN')}`;
    }

    if (inrVal >= 10000000) {
      const cr = (inrVal / 10000000).toFixed(options?.decimals ?? 2);
      const lakhs = (inrVal / 100000).toFixed(2);
      return `₹${lakhs} Lakhs (₹${cr} Cr)`;
    }
    if (inrVal >= 100000) {
      return `₹${(inrVal / 100000).toFixed(options?.decimals ?? 2)} Lakhs`;
    }
    return `₹${Math.round(inrVal).toLocaleString('en-IN')}${showUnit ? ' INR' : ''}`;
  }

  // USD
  if (compact) {
    if (usdAmount >= 1000000) {
      return `$${(usdAmount / 1000000).toFixed(options?.decimals ?? 2)}M`;
    }
    if (usdAmount >= 1000) {
      return `$${(usdAmount / 1000).toFixed(options?.decimals ?? 1)}k`;
    }
    return `$${Math.round(usdAmount).toLocaleString()}`;
  }

  return `$${Math.round(usdAmount).toLocaleString()}${showUnit ? ' USD' : ''}`;
}

/**
 * Formats Freight Rate per Metric Ton
 * In USD: $21.50 / MT
 * In INR: ₹1,795 / MT
 */
export function formatFreightRate(
  rateUSD: number,
  currency: CurrencyUnit,
  options?: { showSlashMT?: boolean; decimals?: number }
): string {
  const suffix = options?.showSlashMT === false ? '' : ' / MT';
  
  if (currency === 'INR') {
    const inrRate = toINR(rateUSD);
    const formatted = inrRate >= 100
      ? Math.round(inrRate).toLocaleString('en-IN')
      : inrRate.toFixed(options?.decimals ?? 1);
    return `₹${formatted}${suffix}`;
  }

  return `$${rateUSD.toFixed(options?.decimals ?? 2)}${suffix}`;
}

/**
 * Formats Daily Rate (e.g. hire / demurrage rate)
 * In USD: $24,000 / day
 * In INR: ₹20.04L / day (or ₹20.04 Lakhs/day)
 */
export function formatDailyRate(
  dailyRateUSD: number,
  currency: CurrencyUnit,
  options?: { compact?: boolean }
): string {
  if (currency === 'INR') {
    const inrVal = toINR(dailyRateUSD);
    if (inrVal >= 100000) {
      return options?.compact
        ? `₹${(inrVal / 100000).toFixed(2)}L/day`
        : `₹${(inrVal / 100000).toFixed(2)} Lakhs/day`;
    }
    return `₹${Math.round(inrVal).toLocaleString('en-IN')}/day`;
  }

  return `$${dailyRateUSD.toLocaleString()}/day`;
}

/**
 * Formats Hourly Rate (e.g. bunker/wait rate)
 * In USD: $880 / hr
 * In INR: ₹73,480 / hr
 */
export function formatHourlyRate(
  hourlyRateUSD: number,
  currency: CurrencyUnit
): string {
  if (currency === 'INR') {
    const inrVal = toINR(hourlyRateUSD);
    return `₹${Math.round(inrVal).toLocaleString('en-IN')}/hr`;
  }

  return `$${hourlyRateUSD.toLocaleString()}/hr`;
}

/**
 * Formats Savings Callout
 * In USD: $45,000 USD (or ~$45k)
 * In INR: ₹37.58 Lakhs (or ~₹37.58L)
 */
export function formatSavings(
  savingsUSD: number,
  currency: CurrencyUnit,
  options?: { compact?: boolean }
): string {
  if (currency === 'INR') {
    const inrVal = toINR(savingsUSD);
    const lakhs = (inrVal / 100000).toFixed(2);
    return options?.compact ? `₹${lakhs}L` : `₹${lakhs} Lakhs`;
  }

  if (options?.compact) {
    if (savingsUSD >= 1000000) return `$${(savingsUSD / 1000000).toFixed(2)}M`;
    if (savingsUSD >= 1000) return `$${(savingsUSD / 1000).toFixed(1)}k`;
    return `$${Math.round(savingsUSD).toLocaleString()}`;
  }

  return `$${Math.round(savingsUSD).toLocaleString()} USD`;
}

/**
 * Returns dual currency formatted object for tooltips or secondary captions
 */
export function getDualCurrency(
  usdAmount: number,
  activeCurrency: CurrencyUnit
): {
  primary: string;
  secondary: string;
  usdText: string;
  inrText: string;
} {
  const inrVal = toINR(usdAmount);
  const usdText = `$${Math.round(usdAmount).toLocaleString()} USD`;
  
  let inrText = '';
  if (inrVal >= 10000000) {
    inrText = `₹${(inrVal / 100000).toFixed(2)} Lakhs (₹${(inrVal / 10000000).toFixed(2)} Cr)`;
  } else if (inrVal >= 100000) {
    inrText = `₹${(inrVal / 100000).toFixed(2)} Lakhs`;
  } else {
    inrText = `₹${Math.round(inrVal).toLocaleString('en-IN')}`;
  }

  return {
    primary: activeCurrency === 'INR' ? inrText : usdText,
    secondary: activeCurrency === 'INR' ? usdText : inrText,
    usdText,
    inrText,
  };
}

import { format } from "date-fns";

const BASE_URL = "https://api.frankfurter.app";

export interface CurrencyConversion {
  from: string;
  to: string;
  rates: Record<string, number>; // "YYYY-MM-DD" -> rate
}

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Fetch exchange rates for a set of dates from the Frankfurter API.
 * Returns a map of YYYY-MM-DD -> rate.
 *
 * The API only returns rates for banking days, so for weekends/holidays
 * we use the closest earlier available rate.
 */
export async function fetchExchangeRates(
  from: string,
  to: string,
  dates: Date[]
): Promise<CurrencyConversion> {
  if (from === to || dates.length === 0) {
    const rates: Record<string, number> = {};
    for (const d of dates) {
      rates[toDateKey(d)] = 1;
    }
    return { from, to, rates };
  }

  const uniqueDateKeys = [...new Set(dates.map(toDateKey))].sort();

  if (uniqueDateKeys.length === 1) {
    return fetchSingleDateRate(from, to, uniqueDateKeys[0]);
  }

  return fetchDateRangeRates(from, to, uniqueDateKeys);
}

async function fetchSingleDateRate(
  from: string,
  to: string,
  dateKey: string
): Promise<CurrencyConversion> {
  const res = await fetch(`${BASE_URL}/${dateKey}?from=${from}&to=${to}`);
  if (!res.ok) {
    // Fallback to latest if the specific date fails
    return fetchLatestRate(from, to, [dateKey]);
  }

  const data = await res.json();
  return {
    from,
    to,
    rates: { [dateKey]: data.rates[to] },
  };
}

async function fetchDateRangeRates(
  from: string,
  to: string,
  sortedDateKeys: string[]
): Promise<CurrencyConversion> {
  const startDate = sortedDateKeys[0];
  const endDate = sortedDateKeys[sortedDateKeys.length - 1];

  const res = await fetch(
    `${BASE_URL}/${startDate}..${endDate}?from=${from}&to=${to}`
  );

  if (!res.ok) {
    // Fallback to latest rate for all dates
    return fetchLatestRate(from, to, sortedDateKeys);
  }

  const data = await res.json();
  const apiRates: Record<string, Record<string, number>> = data.rates;
  const availableDates = Object.keys(apiRates).sort();

  const rates: Record<string, number> = {};

  for (const dateKey of sortedDateKeys) {
    if (apiRates[dateKey]) {
      rates[dateKey] = apiRates[dateKey][to];
    } else {
      // Find the closest earlier banking day
      const closest = availableDates
        .filter((d) => d <= dateKey)
        .pop();

      if (closest) {
        rates[dateKey] = apiRates[closest][to];
      } else {
        // Use the earliest available rate as fallback
        rates[dateKey] = apiRates[availableDates[0]][to];
      }
    }
  }

  return { from, to, rates };
}

async function fetchLatestRate(
  from: string,
  to: string,
  dateKeys: string[]
): Promise<CurrencyConversion> {
  const res = await fetch(`${BASE_URL}/latest?from=${from}&to=${to}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch exchange rate from ${from} to ${to}: ${res.status}`
    );
  }

  const data = await res.json();
  const rate: number = data.rates[to];

  const rates: Record<string, number> = {};
  for (const dateKey of dateKeys) {
    rates[dateKey] = rate;
  }

  return { from, to, rates };
}

/**
 * Apply a conversion rate to an amount, rounding to 2 decimal places.
 */
export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

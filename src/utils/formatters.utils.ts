export function formatCurrency(amount: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(
  dateInput: string | Date,
  opts?: Intl.DateTimeFormatOptions,
) {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat(
    undefined,
    opts ?? { year: "numeric", month: "short", day: "numeric" },
  ).format(d);
}

export function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

// Simple phone formatter that supports a few common countries.
// `phone` may contain spaces, dashes or parentheses. `country` is an ISO 3166-1 alpha-2 code or country calling code.
/**
 * Safe thousands-separator formatter for Ant Design InputNumber.
 * Replaces the ReDoS-vulnerable /\B(?=(\d{3})+(?!\d))/g pattern.
 */
export function formatInputNumber(v: string | number | undefined): string {
  const str = String(v ?? "");
  const [intRaw, decPart] = str.split(".");
  const negative = intRaw.startsWith("-");
  const absDigits = intRaw.replace(/[-,]/g, "");
  let grouped = "";
  for (let i = 0; i < absDigits.length; i++) {
    if (i > 0 && (absDigits.length - i) % 3 === 0) grouped += ",";
    grouped += absDigits[i];
  }
  const intFormatted = (negative ? "-" : "") + grouped;
  return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
}

/**
 * Safe parser for Ant Design InputNumber — strips $, spaces, and commas.
 * Replaces the vulnerable /\$\s?|(,*)/g pattern.
 */
export function parseInputNumber(v: string | undefined): number {
  return Number(String(v ?? "").replace(/[$\s,]/g, "") || 0);
}

export function formatPhone(
  phone: string | number | undefined,
  country: string = "US",
  countryCodes?: Record<string, string>,
) {
  if (!phone && phone !== 0) return "";
  let s = String(phone).trim();
  if (!s) return "";

  // preserve leading + and digits
  const leadingPlus = s.startsWith("+");
  s = s.replace(/[^0-9]/g, "");

  const fmtUS = (digits: string) => {
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    if (digits.length > 4) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return digits;
  };

  const fmtUK = (digits: string) => {
    // If starts with 44 or 0
    if (digits.startsWith("44")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    // mobile numbers: 10 digits (7xxxxxxxxx)
    if (digits.length === 10) {
      return `+44 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    }
    if (digits.length > 6) {
      return `+44 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return `+44 ${digits}`;
  };

  const fmtFR = (digits: string) => {
    if (digits.startsWith("33")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    // group as X XX XX XX XX — no regex needed, slice-based grouping is linear
    const first = digits.slice(0, 1);
    const chunks: string[] = [];
    for (let i = 1; i < digits.length; i += 2) chunks.push(digits.slice(i, i + 2));
    return `+33 ${[first, ...chunks].join(" ")}`.trim();
  };

  const fmtDE = (digits: string) => {
    if (digits.startsWith("49")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    // naive grouping
    if (digits.length > 6)
      return `+49 ${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `+49 ${digits}`;
  };

  const fmtES = (digits: string) => {
    if (digits.startsWith("34")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    return `+34 ${digits.replace(/(\d{3})(?=\d)/g, "$1 ")}`.trim();
  };

  const fmtMX = (digits: string) => {
    // Normalize: strip leading +, then country code if present
    if (digits.startsWith("52")) digits = digits.slice(2);
    // Some international mobile formats include a leading '1' after country code: 521XXXXXXXXXX
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+52 1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `+52 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    if (digits.length > 6) {
      return `+52 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return `+52 ${digits}`;
  };

  const code = country?.toUpperCase();
  let out = "";
  // Allow passing an ISO code (MX) or numeric calling code (52)
  let iso = code;
  if (!iso) iso = "US";
  if (/^\d+$/.test(iso)) {
    // numeric code provided, map to iso if possible (only when mapping supplied)
    if (countryCodes) {
      const match = Object.entries(countryCodes).find(
        ([, v]) => String(v) === iso,
      );
      if (match) iso = match[0];
    }
  }

  switch (iso) {
    case "GB":
    case "UK":
      out = fmtUK(s);
      break;
    case "MX":
      out = fmtMX(s);
      break;
    case "FR":
      out = fmtFR(s);
      break;
    case "DE":
      out = fmtDE(s);
      break;
    case "ES":
      out = fmtES(s);
      break;
    case "US":
    case "CA":
    default:
      out = fmtUS(s);
      break;
  }

  if (leadingPlus && !out.startsWith("+")) {
    return "+" + out;
  }
  return out;
}

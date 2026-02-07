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

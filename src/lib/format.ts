export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// "Rp 111,111.00" — comma thousands separator, dot decimal, 2 decimal
// places, as opposed to formatIDR's whole-rupiah id-ID formatting.
export function formatIDRDecimal(amount: number): string {
  return `Rp ${formatDecimal(amount)}`;
}

// "111,111.00" — same comma/dot formatting as formatIDRDecimal, without
// the "Rp" prefix, for use next to a separate "Rp/unit" label.
export function formatDecimal(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// "175,000" — comma thousands separator, no decimals.
export function formatNumberComma(amount: number): string {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

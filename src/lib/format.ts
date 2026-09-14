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
  return `Rp ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Rounded to the nearest rupiah — menu prices are always whole numbers,
// and a fractional discounted price would look wrong everywhere it's
// displayed (pricelist, order form, receipts).
export function getDiscountedPrice(
  price: number,
  discountPercent: number
): number {
  if (!discountPercent) return price;
  return Math.round(price * (1 - discountPercent / 100));
}

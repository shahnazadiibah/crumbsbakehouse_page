// Whole cakes (and other whole-item bakes, e.g. "Strawberry Tres Leches
// (Whole)") need careful handling in transit, so orders containing one are
// restricted to the delivery zones built for that. Matching is done by name
// substring rather than a hardcoded id so it still works if the rows get
// re-seeded or renamed — keep "whole" somewhere in the item's name.
export function isWholeCakeItem(itemName: string): boolean {
  return itemName.toLowerCase().includes("whole");
}

export function isMandatoryWholeCakeZone(zoneName: string): boolean {
  return zoneName.toLowerCase().includes("whole cake");
}

// Besides the dedicated whole-cake zone, self-arranged delivery is also
// safe for whole cakes since the customer (or the bakery itself, for
// pick-up) handles transport directly rather than a third-party rider.
export function isAllowedWholeCakeZone(zoneName: string): boolean {
  const name = zoneName.toLowerCase();
  return (
    isMandatoryWholeCakeZone(zoneName) ||
    name.includes("self order") ||
    name.includes("self pick up")
  );
}

// Same-day Grab Bike has a wider delivery window than the other options,
// so the order page shows a heads-up note when it's selected. Matched by
// substring so it still works if the zone gets re-seeded.
export function isSameDayBikeZone(zoneName: string): boolean {
  return zoneName.toLowerCase().includes("sameday");
}

// Self-arranged delivery options don't have a fixed pickup/handoff time, so
// the customer provides their own estimate.
export function requiresPickupTime(zoneName: string): boolean {
  const name = zoneName.toLowerCase();
  return name.includes("self pick up") || name.includes("self order");
}

// Groups menu items into product families for the bake list's ingredient
// breakdown. Falls back to the item's own name so a future product that
// doesn't match either family still gets its own section instead of being
// silently dropped.
export function getProductFamily(itemName: string): string {
  const name = itemName.toLowerCase();
  if (name.includes("banana")) return "Banana Bread";
  if (name.includes("carrot")) return "Carrot Cake";
  if (name.includes("tres leches")) return "Tres Leches Cake";
  return itemName;
}

// Whole cakes need careful handling in transit, so orders containing one
// are restricted to the delivery zone built for that ("Grab Instant Car").
// Matching is done by name substring rather than a hardcoded id so it still
// works if the rows get re-seeded — keep "whole" in the cake's name and
// "whole cake" in the zone's name if you rename either.
export function isWholeCakeItem(itemName: string): boolean {
  const name = itemName.toLowerCase();
  return name.includes("cake") && name.includes("whole");
}

export function isMandatoryWholeCakeZone(zoneName: string): boolean {
  return zoneName.toLowerCase().includes("whole cake");
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
  if (name.includes("banana bread")) return "Banana Bread";
  if (name.includes("carrot cake")) return "Carrot Cake";
  return itemName;
}

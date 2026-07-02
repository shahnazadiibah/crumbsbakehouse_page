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

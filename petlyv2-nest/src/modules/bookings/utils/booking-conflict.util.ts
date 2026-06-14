export function hasDateOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA <= endB && endA >= startB;
}


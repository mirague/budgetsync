export function daysSinceDate(d1: Date, d2 = new Date()) {
  const diff = Math.abs(d1.getTime() - d2.getTime())
  return diff / (1000 * 60 * 60 * 24)
}

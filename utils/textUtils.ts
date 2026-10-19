export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}
export function parseLocalizedPrice(value: string): number | undefined {
  const numericValue = value.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const price = Number.parseFloat(numericValue);
  return Number.isFinite(price) ? price : undefined;
}
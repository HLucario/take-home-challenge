export function formatToday(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA').format(date);
}

export function toDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date value: ${value}`);
  }
  return date;
}
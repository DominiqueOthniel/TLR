export function parseLocalDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const datePart = String(value).split('T')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function parseLocalDateMs(value: string | undefined | null): number {
  return parseLocalDate(value)?.getTime() ?? 0;
}

export function formatLocalDate(
  value: string | undefined | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseLocalDate(value);
  return date ? date.toLocaleDateString('fr-FR', options) : '';
}

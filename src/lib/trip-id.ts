export function formatTripDisplayId(id?: string | null): string {
  if (!id) return '-';

  const compactId = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const readablePart = (compactId || id.toUpperCase()).slice(-6);

  return `TR-${readablePart}`;
}

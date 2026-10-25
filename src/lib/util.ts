export function openExternal(url: string) {
  if (window.top !== window.self) window.open(url, '_blank');
  else window.location.href = url;
}

export const money = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });

export function errMsg(e: unknown, fallback = 'Something went wrong') {
  return e instanceof Error && e.message ? e.message : fallback;
}

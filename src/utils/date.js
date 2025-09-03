// Lightweight date helpers to avoid external dependency (dayjs)
// All dates handled as local dates (YYYY-MM-DD) strings.

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayStr() {
  return formatDate(new Date());
}

export function subtractDays(date, days) {
  const dt = new Date(date.getTime());
  dt.setDate(dt.getDate() - days);
  return dt;
}

export function diffDays(startStr, endStr) {
  const s = parseDate(startStr);
  const e = parseDate(endStr);
  const ms = e - s;
  return Math.floor(ms / 86400000);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function parseDate(str) {
  // str: YYYY-MM-DD
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function previousMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

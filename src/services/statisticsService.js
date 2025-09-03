import api from "../api/axiosConfig";

/**
 * GET /statistics/orders?start_date=YYYY-MM-DD&finish_date=YYYY-MM-DD
 * Returns: { status: true, data: [ {date, source:{telegram_bot, operators}, status:{rejected, received}} ] }
 */
export async function fetchOrderStatistics(params) {
  const { start_date, finish_date } = params;
  const res = await api.get("/statistics/orders", {
    params: { start_date, finish_date },
  });
  const arr = Array.isArray(res.data?.data) ? res.data.data : [];
  return arr.map((row) => ({
    date: row.date,
    telegram_bot: row.source?.telegram_bot ?? 0,
    operators: row.source?.operators ?? 0,
    rejected: row.status?.rejected ?? 0,
    received: row.status?.received ?? 0,
  }));
}

export function summarizeStats(rows) {
  return rows.reduce(
    (acc, r) => {
      acc.telegram_bot += r.telegram_bot;
      acc.operators += r.operators;
      acc.rejected += r.rejected;
      acc.received += r.received;
      return acc;
    },
    { telegram_bot: 0, operators: 0, rejected: 0, received: 0 }
  );
}

import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
// dayjs olib tashlandi; native util funksiyalar ishlatiladi
import {
  formatDate,
  todayStr,
  subtractDays,
  diffDays,
  startOfMonth,
  endOfMonth,
  previousMonth,
  parseDate,
} from "../utils/date";
// Lazy load (bundle kichraytirish uchun)
const ReactApexChart = lazy(() => import("react-apexcharts"));
import { Activity, Bot, Headset, CheckCircle2, XCircle } from "lucide-react";
import {
  fetchOrderStatistics,
  summarizeStats,
} from "../services/statisticsService";
import "./dashboard.scss";

function defaultRange() {
  const today = parseDate(todayStr());
  const finish = formatDate(today);
  const start = formatDate(subtractDays(today, 29));
  return { start, finish };
}

const Dashboard = () => {
  const dr = defaultRange();
  const [startDate, setStartDate] = useState(dr.start);
  const [finishDate, setFinishDate] = useState(dr.finish);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  async function load() {
    if (!startDate || !finishDate) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderStatistics({
        start_date: startDate,
        finish_date: finishDate,
      });
      setRows(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  }

  // Avtomatik yuklash: startDate yoki finishDate o'zgarsa statistikalar yangilanadi
  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [startDate, finishDate]);

  function setRange(type) {
    const now = parseDate(todayStr());
    if (type === "today") {
      const d = formatDate(now);
      setStartDate(d);
      setFinishDate(d);
    } else if (type === "7d") {
      setStartDate(formatDate(subtractDays(now, 6)));
      setFinishDate(formatDate(now));
    } else if (type === "30d") {
      setStartDate(formatDate(subtractDays(now, 29)));
      setFinishDate(formatDate(now));
    } else if (type === "thisMonth") {
      setStartDate(formatDate(startOfMonth(now)));
      setFinishDate(formatDate(now));
    } else if (type === "lastMonth") {
      const pm = previousMonth(now); // first day of previous month
      setStartDate(formatDate(pm));
      setFinishDate(formatDate(endOfMonth(pm)));
    }
  }

  // CSV eksport qilish talab qilinmaydi – funksional olib tashlandi

  const summary = useMemo(() => summarizeStats(rows), [rows]);
  const totalOrders = summary.received + summary.rejected;
  const acceptancePercent =
    totalOrders === 0 ? 0 : Math.round((summary.received / totalOrders) * 100);
  const rangeDays = diffDays(startDate, finishDate) + 1;

  const sourceChart = useMemo(() => {
    const categories = rows.map((r) => r.date);
    return {
      series: [
        { name: "Telegram bot", data: rows.map((r) => r.telegram_bot) },
        { name: "Operator", data: rows.map((r) => r.operators) },
      ],
      options: {
        chart: {
          type: "area",
          stacked: true,
          toolbar: { show: false },
          height: 340,
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        fill: {
          type: "gradient",
          gradient: { opacityFrom: 0.55, opacityTo: 0.1 },
        },
        xaxis: { categories, labels: { rotate: -45 } },
        yaxis: { labels: { formatter: (v) => Math.round(v) } },
        tooltip: { shared: true, intersect: false },
        legend: { position: "top" },
        colors: ["#ff6b00", "#0ea5e9"],
      },
    };
  }, [rows]);

  const statusChart = useMemo(() => {
    if (!rows.length) return { series: [], options: {} };
    const categories = rows.map((r) => r.date);
    const receivedArr = rows.map((r) => r.received);
    const rejectedArr = rows.map((r) => r.rejected);
    const rateArr = rows.map((r) => {
      const t = r.received + r.rejected;
      return t === 0 ? 0 : +((r.received / t) * 100).toFixed(1);
    });
    return {
      series: [
        { name: "Qabul qilingan", type: "column", data: receivedArr },
        { name: "Bekor qilingan", type: "column", data: rejectedArr },
        { name: "Acceptance %", type: "line", data: rateArr },
      ],
      options: {
        chart: { stacked: false, toolbar: { show: false }, height: 340 },
        stroke: { width: [0, 0, 3] },
        dataLabels: { enabled: false },
        xaxis: { categories, labels: { rotate: -45 } },
        yaxis: [
          { title: { text: "Soni" } },
          { show: false },
          { opposite: true, title: { text: "%" }, max: 100 },
        ],
        tooltip: { shared: true },
        legend: { position: "top" },
        colors: ["#16a34a", "#dc2626", "#2563eb"],
        plotOptions: { bar: { columnWidth: "60%" } },
      },
    };
  }, [rows]);

  const empty = !loading && !error && rows.length === 0;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="title-block">
          <h2>Dashboard</h2>
          <p className="subtitle">Buyurtmalar statistikasi</p>
        </div>
        <div className="range-summary">
          <span>
            {startDate} – {finishDate}
          </span>
          <span className="dot" />
          <span>{rangeDays} kun</span>
          <span className="dot" />
          <span>Jami: {totalOrders}</span>
        </div>
      </header>

      <section className="dashboard-toolbar">
        <div className="dates">
          <div className="field">
            <label>Boshlanish</label>
            <input
              type="date"
              value={startDate}
              max={finishDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Tugash</label>
            <input
              type="date"
              value={finishDate}
              min={startDate}
              max={todayStr()}
              onChange={(e) => setFinishDate(e.target.value)}
            />
          </div>
        </div>
        <div className="segmented" aria-label="Tez oraliqlar">
          <button
            onClick={() => {
              setRange("today");
            }}
          >
            Bugun
          </button>
          <button
            onClick={() => {
              setRange("7d");
            }}
          >
            7 kun
          </button>
          <button
            onClick={() => {
              setRange("30d");
            }}
          >
            30 kun
          </button>
          <button
            onClick={() => {
              setRange("thisMonth");
            }}
          >
            Joriy oy
          </button>
          <button
            onClick={() => {
              setRange("lastMonth");
            }}
          >
            O'tgan oy
          </button>
        </div>
        {error && <div className="error-inline">{error}</div>}
      </section>

      <div className="stat-cards">
        <div className="stat-card card-bot">
          <div className="ic">
            <Bot size={18} />
          </div>
          <div className="meta">
            <h4>Telegram bot</h4>
            <small>Davr bo'yicha</small>
          </div>
          <div className="value">{summary.telegram_bot}</div>
        </div>
        <div className="stat-card card-operator">
          <div className="ic">
            <Headset size={18} />
          </div>
          <div className="meta">
            <h4>Operator</h4>
            <small>Davr bo'yicha</small>
          </div>
          <div className="value">{summary.operators}</div>
        </div>
        <div className="stat-card card-received">
          <div className="ic">
            <CheckCircle2 size={18} />
          </div>
          <div className="meta">
            <h4>Qabul qilingan</h4>
            <small>Jami</small>
          </div>
          <div className="value">{summary.received}</div>
        </div>
        <div className="stat-card card-rejected">
          <div className="ic">
            <XCircle size={18} />
          </div>
          <div className="meta">
            <h4>Bekor qilingan</h4>
            <small>Jami</small>
          </div>
          <div className="value">{summary.rejected}</div>
        </div>
        <div className="stat-card card-acceptance">
          <div className="ic">
            <Activity size={18} />
          </div>
          <div className="meta">
            <h4>Acceptance</h4>
            <small>Umumiy</small>
          </div>
          <div className="value">{acceptancePercent}%</div>
          <div className="progress">
            <span style={{ width: acceptancePercent + "%" }} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h3>Manbalar bo'yicha buyurtmalar</h3>
          <div className="chart-wrap">
            {empty ? (
              <div className="empty-box">Ma'lumot yo'q</div>
            ) : (
              <Suspense
                fallback={<div className="loading-inline">Grafik...</div>}
              >
                <ReactApexChart
                  options={sourceChart.options}
                  series={sourceChart.series}
                  type="area"
                  height={320}
                />
              </Suspense>
            )}
          </div>
        </div>
        <div className="chart-box">
          <h3>Status bo'yicha</h3>
          <div className="chart-wrap">
            {empty ? (
              <div className="empty-box">Ma'lumot yo'q</div>
            ) : (
              <Suspense
                fallback={<div className="loading-inline">Grafik...</div>}
              >
                <ReactApexChart
                  options={statusChart.options}
                  series={statusChart.series}
                  type="line"
                  height={320}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

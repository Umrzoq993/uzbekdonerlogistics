import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import dayjs from "dayjs";
// Lazy load (bundle kichraytirish uchun)
const ReactApexChart = lazy(() => import("react-apexcharts"));
import { Activity, Bot, Headset, CheckCircle2, XCircle } from "lucide-react";
import {
  fetchOrderStatistics,
  summarizeStats,
} from "../services/statisticsService";
import "./dashboard.scss";

function defaultRange() {
  const finish = dayjs().format("YYYY-MM-DD");
  const start = dayjs().subtract(29, "day").format("YYYY-MM-DD");
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

  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  function setRange(type) {
    const today = dayjs();
    if (type === "today") {
      const d = today.format("YYYY-MM-DD");
      setStartDate(d);
      setFinishDate(d);
    } else if (type === "7d") {
      setStartDate(today.subtract(6, "day").format("YYYY-MM-DD"));
      setFinishDate(today.format("YYYY-MM-DD"));
    } else if (type === "30d") {
      setStartDate(today.subtract(29, "day").format("YYYY-MM-DD"));
      setFinishDate(today.format("YYYY-MM-DD"));
    } else if (type === "thisMonth") {
      setStartDate(today.startOf("month").format("YYYY-MM-DD"));
      setFinishDate(today.format("YYYY-MM-DD"));
    } else if (type === "lastMonth") {
      const lm = today.subtract(1, "month");
      setStartDate(lm.startOf("month").format("YYYY-MM-DD"));
      setFinishDate(lm.endOf("month").format("YYYY-MM-DD"));
    }
  }

  function exportCSV() {
    if (!rows.length) return;
    const header = [
      "date",
      "telegram_bot",
      "operators",
      "received",
      "rejected",
      "acceptance_percent",
    ];
    const lines = rows.map((r) => {
      const total = r.received + r.rejected;
      const ap = total === 0 ? 0 : +((r.received / total) * 100).toFixed(2);
      return [
        r.date,
        r.telegram_bot,
        r.operators,
        r.received,
        r.rejected,
        ap,
      ].join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_statistics_${startDate}_${finishDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const summary = useMemo(() => summarizeStats(rows), [rows]);
  const totalOrders = summary.received + summary.rejected;
  const acceptancePercent =
    totalOrders === 0 ? 0 : Math.round((summary.received / totalOrders) * 100);
  const rangeDays = dayjs(finishDate).diff(dayjs(startDate), "day") + 1;

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
              max={dayjs().format("YYYY-MM-DD")}
              onChange={(e) => setFinishDate(e.target.value)}
            />
          </div>
        </div>
        <div className="segmented" aria-label="Tez oraliqlar">
          <button
            onClick={() => {
              setRange("today");
              load();
            }}
          >
            Bugun
          </button>
          <button
            onClick={() => {
              setRange("7d");
              load();
            }}
          >
            7 kun
          </button>
          <button
            onClick={() => {
              setRange("30d");
              load();
            }}
          >
            30 kun
          </button>
          <button
            onClick={() => {
              setRange("thisMonth");
              load();
            }}
          >
            Joriy oy
          </button>
          <button
            onClick={() => {
              setRange("lastMonth");
              load();
            }}
          >
            O'tgan oy
          </button>
        </div>
        <div className="actions">
          <button onClick={load} disabled={loading}>
            {loading ? "..." : "Yuklash"}
          </button>
          <button
            className="btn-blue"
            onClick={exportCSV}
            disabled={!rows.length || loading}
          >
            CSV
          </button>
          {error && <span className="error-inline">{error}</span>}
        </div>
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

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchFlials, patchFlialActive } from "../services/flialsService";
import { MapPin } from "lucide-react";
import MapModal from "../components/MapModal";
import "./branches.scss";

const MOCK_MODE =
  (import.meta?.env?.VITE_ENABLE_FLIAL_ACTIVE_API ?? "") !== "true";

export default function Branches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = useMemo(() => searchParams.get("q") || "", [searchParams]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null); // MapModal
  const [saving, setSaving] = useState(() => new Set()); // toggle loader/disable

  const onChangeQ = (e) => {
    const val = e.target.value.trimStart();
    const next = new URLSearchParams(searchParams);
    if (!val) next.delete("q");
    else next.set("q", val);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const list = await fetchFlials();
        setRows(Array.isArray(list) ? list : []);
      } catch (e) {
        setErr(
          e?.response?.data?.detail ||
            e?.message ||
            "Filiallarni yuklab bo‘lmadi"
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const k = q.toLowerCase();
    return rows.filter(
      (f) =>
        String(f.id).includes(k) || (f.name || "").toLowerCase().includes(k)
    );
  }, [rows, q]);

  const openMap = (f) => {
    if (f?.latitude == null || f?.longitude == null) return;
    setSelected({
      id: f.id,
      latitude: f.latitude,
      longitude: f.longitude,
      title: f.name || `Filial #${f.id}`,
      coordinates: f.coordinates,
    });
  };
  const closeMap = () => setSelected(null);

  // Toggle (optimistik)
  const handleToggleActive = async (flial) => {
    const id = flial.id;
    const nextVal = !flial.is_active;

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: nextVal } : r))
    );
    const ns = new Set(saving);
    ns.add(id);
    setSaving(ns);

    try {
      const resp = await patchFlialActive(id, nextVal);
      if (resp && typeof resp.is_active === "boolean") {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, is_active: resp.is_active } : r
          )
        );
      }
      if (resp?.__local) {
        // ixtiyoriy: non-blocking xabar (console / toastr)
        console.info("Lokal rejimda saqlandi (API hali tayyor emas).");
      }
    } catch (e) {
      // Xato bo‘lsa UI ni qaytaramiz
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !nextVal } : r))
      );
      alert(
        e?.response?.data?.detail ||
          e?.message ||
          "Holatni o‘zgartirib bo‘lmadi"
      );
    } finally {
      const nx = new Set(saving);
      nx.delete(id);
      setSaving(nx);
    }
  };

  return (
    <div className="branches-page">
      <div className="branches-header">
        <div className="title-wrap">
          <h2>Filiallar</h2>
          {MOCK_MODE && (
            <div
              className="mock-banner"
              title="API tayyor bo‘lgach .env da VITE_ENABLE_FLIAL_ACTIVE_API=true qiling"
            >
              Demo: API hali tayyor emas, holat lokal saqlanmoqda
            </div>
          )}
        </div>

        <div className="actions">
          <label className="search">
            <span>Qidiruv</span>
            <input
              type="text"
              placeholder="ID yoki nomi..."
              value={q}
              onChange={onChangeQ}
            />
          </label>
        </div>
      </div>

      <div className="branches-body">
        {loading ? (
          <div className="state">Yuklanmoqda...</div>
        ) : err ? (
          <div className="state error">{String(err)}</div>
        ) : filtered.length === 0 ? (
          <div className="state">Ma’lumot yo‘q</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nomi</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Poligon</th>
                  <th>Bugun faolmi?</th>
                  <th>Xarita</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const hasGeo = f.latitude != null && f.longitude != null;
                  const pointsCount = Array.isArray(f.coordinates)
                    ? f.coordinates.length
                    : 0;
                  const isSaving = saving.has(f.id);
                  return (
                    <tr key={f.id}>
                      <td>{f.id}</td>
                      <td>
                        {f.name || "-"}
                        {!f.is_active && (
                          <span
                            className="tag tag--danger"
                            title="Bugun buyurtma qabul qilmaydi"
                          >
                            faol emas
                          </span>
                        )}
                      </td>
                      <td>{f.latitude ?? "-"}</td>
                      <td>{f.longitude ?? "-"}</td>
                      <td>
                        {pointsCount > 0 ? (
                          <span className="pill">{pointsCount} ta</span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        <label
                          className={`switch ${
                            isSaving ? "switch--loading" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!f.is_active}
                            disabled={isSaving}
                            onChange={() => handleToggleActive(f)}
                          />
                          <span className="slider" />
                        </label>
                      </td>

                      <td>
                        <button
                          className="icon-btn"
                          title={
                            hasGeo ? "Xaritada ko‘rish" : "Koordinata yo‘q"
                          }
                          disabled={!hasGeo}
                          onClick={() => openMap(f)}
                        >
                          <MapPin size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="branches-footer">
        <div className="page-info">
          Jami: <b>{rows.length}</b>, Ko‘rinayotgan: <b>{filtered.length}</b>
          {q ? (
            <>
              {" "}
              (Qidiruv: <b>{q}</b>)
            </>
          ) : null}
        </div>
      </div>

      <MapModal open={!!selected} onClose={closeMap} order={selected} />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Polygon,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import { fetchFlials, saveFlialPolygon } from "../services/flialsService";
import { toast } from "react-toastify";
import "./flial-polygons.scss";

// Leaflet default marker ikonlari
const DefaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER = [41.311081, 69.240562];
const DEFAULT_ZOOM = 12;

// —— Rang saqlash/oqish (per filial, localStorage) ——
const colorKey = (id) => `flial_poly_color_${id}`;
const weightKey = (id) => `flial_poly_weight_${id}`;
const opacityKey = (id) => `flial_poly_opacity_${id}`;
const loadColorCfg = (id, defaults) => {
  if (!id) return defaults;
  return {
    color: localStorage.getItem(colorKey(id)) || defaults.color,
    weight: Number(localStorage.getItem(weightKey(id)) || defaults.weight),
    fillOpacity: Number(
      localStorage.getItem(opacityKey(id)) || defaults.fillOpacity
    ),
  };
};
const saveColorCfg = (id, { color, weight, fillOpacity }) => {
  if (!id) return;
  if (color) localStorage.setItem(colorKey(id), color);
  if (Number.isFinite(weight))
    localStorage.setItem(weightKey(id), String(weight));
  if (Number.isFinite(fillOpacity))
    localStorage.setItem(opacityKey(id), String(fillOpacity));
};
const clearColorCfg = (id) => {
  if (!id) return;
  localStorage.removeItem(colorKey(id));
  localStorage.removeItem(weightKey(id));
  localStorage.removeItem(opacityKey(id));
};

// Tema: faol/nofoal uchun default ranglar
const defaultColorForFlial = (isActive) => (isActive ? "#2563eb" : "#9ca3af");
const defaultStyleForFlial = (isActive) => ({
  color: defaultColorForFlial(isActive),
  weight: 2.5,
  fillColor: isActive ? "#60a5fa" : "#d1d5db",
  fillOpacity: 0.25,
});

// O‘qilishi qulay bo‘lishi uchun style yasovchi
const makeStyle = ({ color, weight, fillOpacity }) => ({
  color,
  weight,
  fillColor: color,
  fillOpacity,
});

// Boshqa (read-only) filiallar uchun yengilroq ko‘rinish
const themeForOther = (color, isActive) => ({
  color: color || (isActive ? "#3b82f6" : "#9ca3af"),
  weight: 1.5,
  dashArray: isActive ? "6 4" : "2 4",
  fillColor: color || (isActive ? "#93c5fd" : "#e5e7eb"),
  fillOpacity: 0.12,
});

// Oddiy ray-casting algoritm: nuqta poligon ichidami?
function pointInPolygon(point, polygon) {
  const x = point[1]; // lng
  const y = point[0]; // lat
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1],
      yi = polygon[i][0];
    const xj = polygon[j][1],
      yj = polygon[j][0];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Geoman integratsiyasi va poligon boshqaruvi (faqat tanlangan filial uchun)
function GeomanPolygon({
  coords,
  setCoords,
  onDirtyChange,
  style,
  autoFit = false,
}) {
  const map = useMap();
  const layerRef = useRef(null);

  // Geoman controls + global options
  useEffect(() => {
    map.pm.addControls({
      position: "topright",
      drawCircle: false,
      drawCircleMarker: false,
      drawMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
      drawPolygon: true,
      cutPolygon: false,
      dragMode: false,
      editMode: true,
      removalMode: true,
      rotateMode: false,
    });

    map.pm.setGlobalOptions({
      allowSelfIntersection: false,
      snappable: true,
      snapDistance: 20,
    });

    const onCreate = (e) => {
      if (layerRef.current) {
        try {
          layerRef.current.remove();
        } catch {}
        layerRef.current = null;
      }
      layerRef.current = e.layer;
      if (layerRef.current.pm) layerRef.current.pm.enable();
      if (style) layerRef.current.setStyle(style);

      const latlngs =
        e.layer.getLatLngs()[0]?.map((ll) => [ll.lat, ll.lng]) || [];
      setCoords(latlngs);
      onDirtyChange(true);
    };

    const onEdit = (e) => {
      const target = e.layer || layerRef.current;
      if (!target) return;
      const ring = target.getLatLngs()[0] || [];
      const next = ring.map((ll) => [ll.lat, ll.lng]);
      setCoords(next);
      onDirtyChange(true);
      if (style && target.setStyle) target.setStyle(style);
    };

    const onRemove = () => {
      if (layerRef.current) {
        try {
          layerRef.current.remove();
        } catch {}
        layerRef.current = null;
      }
      setCoords([]);
      onDirtyChange(true);
    };

    map.on("pm:create", onCreate);
    map.on("pm:edit", onEdit);
    map.on("pm:remove", onRemove);

    return () => {
      map.pm.removeControls();
      map.off("pm:create", onCreate);
      map.off("pm:edit", onEdit);
      map.off("pm:remove", onRemove);
    };
  }, [map, setCoords, onDirtyChange, style]);

  // Tashqi coords o‘zgarganda layerni sinxronlash
  useEffect(() => {
    if (layerRef.current) {
      try {
        layerRef.current.remove();
      } catch {}
      layerRef.current = null;
    }
    if (coords && coords.length) {
      const poly = L.polygon(coords, style).addTo(map);
      layerRef.current = poly;
      if (poly.pm) poly.pm.enable();

      if (autoFit) {
        try {
          const bounds = poly.getBounds();
          if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        } catch {}
      }
    }
  }, [coords, map, style, autoFit]);

  return null;
}

// Barcha filiallar poligonlari + markerlarini chizish (read-only)
function AllOverlays({ flials, selectedId }) {
  return (
    <>
      {flials.map((f) => {
        const isSelected = String(f.id) === String(selectedId);
        const coords = Array.isArray(f.coordinates) ? f.coordinates : [];
        const cfg = loadColorCfg(
          f.id,
          defaultStyleForFlial(Boolean(f.is_active))
        );
        return (
          <Fragment key={`over-${f.id}`}>
            {coords.length >= 3 && (
              <Polygon
                positions={coords}
                pathOptions={
                  isSelected
                    ? makeStyle(cfg)
                    : themeForOther(cfg.color, Boolean(f.is_active))
                }
              />
            )}
            {f.latitude != null && f.longitude != null && (
              <Marker position={[Number(f.latitude), Number(f.longitude)]}>
                <Popup>
                  <div style={{ fontWeight: 600 }}>
                    {f.name || `Filial #${f.id}`}
                  </div>
                  <div>ID: {f.id}</div>
                  <div>Holat: {f.is_active ? "Faol" : "Faol emas"}</div>
                  <div style={{ marginTop: 6 }}>
                    Rang:{" "}
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: cfg.color,
                        border: "1px solid rgba(0,0,0,.1)",
                        verticalAlign: -2,
                        marginRight: 6,
                      }}
                    />
                    <code>{cfg.color}</code>
                  </div>
                </Popup>
              </Marker>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
import { Fragment } from "react";

// Barcha poligon va markerlarga qarab auto-fit
function FitAllBounds({ flials, selectedCoords }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([]);

    flials.forEach((f) => {
      const coords = Array.isArray(f.coordinates) ? f.coordinates : [];
      coords.forEach(([lat, lng]) => bounds.extend([lat, lng]));
      if (f.latitude != null && f.longitude != null) {
        bounds.extend([Number(f.latitude), Number(f.longitude)]);
      }
    });

    if (Array.isArray(selectedCoords) && selectedCoords.length) {
      selectedCoords.forEach(([lat, lng]) => bounds.extend([lat, lng]));
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [map, flials, selectedCoords]);

  return null;
}

// Xaritaga bosib test qilish uchun
function MapClickTester({ enabled, onClick }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => onClick([e.latlng.lat, e.latlng.lng]);
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [map, enabled, onClick]);
  return null;
}

export default function FlialPolygons() {
  const [flials, setFlials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const selectedFlial = useMemo(
    () => flials.find((f) => String(f.id) === String(selectedId)),
    [flials, selectedId]
  );

  // Tanlangan filial poligoni (koordinata)
  const [coords, setCoords] = useState([]); // [[lat,lng], ...]
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapKey, setMapKey] = useState(1);

  // Rang boshqaruvi
  const defaults = defaultStyleForFlial(Boolean(selectedFlial?.is_active));
  const [polyColor, setPolyColor] = useState(defaults.color);
  const [polyWeight, setPolyWeight] = useState(defaults.weight);
  const [polyOpacity, setPolyOpacity] = useState(defaults.fillOpacity);

  // Test nuqta
  const [testLat, setTestLat] = useState("");
  const [testLng, setTestLng] = useState("");
  const [testPoint, setTestPoint] = useState(null); // [lat,lng]
  const [testResult, setTestResult] = useState(null); // true/false/null
  const [clickTestEnabled, setClickTestEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const list = await fetchFlials();
        setFlials(list);
        if (list.length && !selectedId) {
          const first = list[0];
          setSelectedId(String(first.id));
          setCoords(Array.isArray(first.coordinates) ? first.coordinates : []);
          setDirty(false);
          // Rang konfiguratsiyasini yuklash
          const cfg = loadColorCfg(
            first.id,
            defaultStyleForFlial(Boolean(first.is_active))
          );
          setPolyColor(cfg.color);
          setPolyWeight(cfg.weight);
          setPolyOpacity(cfg.fillOpacity);
          setMapKey((k) => k + 1);
        }
      } catch (e) {
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "Fliallarni yuklab bo‘lmadi";
        setErr(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDirtyChange = (v) => setDirty(v);

  const handleSelectFlial = (e) => {
    const id = e.target.value;
    setSelectedId(id);

    const f = flials.find((x) => String(x.id) === String(id));
    const orig = Array.isArray(f?.coordinates) ? f.coordinates : [];
    setCoords(orig);
    setDirty(false);

    // Rang konfiguratsiyasini yuklash
    const cfg = loadColorCfg(id, defaultStyleForFlial(Boolean(f?.is_active)));
    setPolyColor(cfg.color);
    setPolyWeight(cfg.weight);
    setPolyOpacity(cfg.fillOpacity);

    setMapKey((k) => k + 1);
    setTestPoint(null);
    setTestResult(null);
  };

  const handleReset = () => {
    if (!selectedFlial) return;
    const orig = Array.isArray(selectedFlial.coordinates)
      ? selectedFlial.coordinates
      : [];
    setCoords(orig);
    setDirty(false);
    // Rangni defaultiga qaytarish (lekin saqlangan rangni o‘chirmaymiz)
    const cfg = loadColorCfg(
      selectedFlial.id,
      defaultStyleForFlial(Boolean(selectedFlial.is_active))
    );
    setPolyColor(cfg.color);
    setPolyWeight(cfg.weight);
    setPolyOpacity(cfg.fillOpacity);

    setMapKey((k) => k + 1);
    setTestPoint(null);
    setTestResult(null);
    toast.info("Poligon asl holatga qaytarildi");
  };

  const handleClear = () => {
    setCoords([]);
    setDirty(true);
    setMapKey((k) => k + 1);
    setTestPoint(null);
    setTestResult(null);
    toast.info("Poligon tozalandi");
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await saveFlialPolygon(selectedId, coords);
      setFlials((prev) =>
        prev.map((f) =>
          String(f.id) === String(selectedId)
            ? { ...f, coordinates: coords }
            : f
        )
      );
      setDirty(false);
      toast.success("Poligon saqlandi ✓");
    } catch (e) {
      toast.error(
        e?.response?.data?.detail || e?.message || "Poligonni saqlab bo‘lmadi"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStyle = () => {
    if (!selectedId) return;
    saveColorCfg(selectedId, {
      color: polyColor,
      weight: polyWeight,
      fillOpacity: polyOpacity,
    });
    toast.success("Poligon rangi saqlandi ✓");
    // Ko‘rinishni yangilash uchun mapKey ni o‘zgartirish shart emas; state yetarli
  };

  const handleResetStyle = () => {
    if (!selectedId) return;
    clearColorCfg(selectedId);
    const cfg = defaultStyleForFlial(Boolean(selectedFlial?.is_active));
    setPolyColor(cfg.color);
    setPolyWeight(cfg.weight);
    setPolyOpacity(cfg.fillOpacity);
    toast.info("Rang va qalinlik defaultga qaytarildi");
  };

  const runManualTest = () => {
    const lat = Number(testLat);
    const lng = Number(testLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.warn("Lat/Lng noto‘g‘ri");
      return;
    }
    setTestPoint([lat, lng]);
    if (coords?.length >= 3) {
      setTestResult(pointInPolygon([lat, lng], coords));
    } else {
      setTestResult(null);
    }
  };

  const handleMapClickTest = (pt) => {
    setTestPoint(pt);
    if (coords?.length >= 3) {
      setTestResult(pointInPolygon(pt, coords));
    } else {
      setTestResult(null);
    }
  };

  const mapCenter = useMemo(() => {
    if (coords?.length) return coords[0];
    if (selectedFlial?.latitude && selectedFlial?.longitude)
      return [Number(selectedFlial.latitude), Number(selectedFlial.longitude)];
    return DEFAULT_CENTER;
  }, [coords, selectedFlial]);

  // Tanlangan filial uchun amaldagi style
  const activeStyle = makeStyle({
    color: polyColor,
    weight: polyWeight,
    fillOpacity: polyOpacity,
  });

  return (
    <div className="flial-polygons-page">
      <div className="fp-header">
        <h2>Filial poligonlari</h2>

        <div className="fp-actions">
          <label className="select">
            <span>Filial</span>
            <select
              value={selectedId}
              onChange={handleSelectFlial}
              disabled={loading || !!err}
            >
              {flials.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name} {f.is_active ? "" : " · (faol emas)"}
                </option>
              ))}
            </select>
          </label>

          <div className="btns">
            <button
              className="btn"
              onClick={handleReset}
              disabled={!selectedId || saving}
            >
              Qayta yuklash
            </button>
            <button
              className="btn"
              onClick={handleClear}
              disabled={!selectedId || saving}
            >
              Tozalash
            </button>
            <button
              className="btn primary"
              onClick={handleSave}
              disabled={!selectedId || saving || !dirty}
              title={!dirty ? "O‘zgarish yo‘q" : "Saqlash"}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </div>

      <div className="fp-body">
        {loading ? (
          <div className="state">Yuklanmoqda...</div>
        ) : err ? (
          <div className="state error">{String(err)}</div>
        ) : !selectedId ? (
          <div className="state">Filial tanlang</div>
        ) : (
          <div className="map-and-side">
            <div className="map-wrap">
              <MapContainer
                key={mapKey}
                center={mapCenter}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom
                style={{ height: "80vh", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Barcha filiallar poligonlari + markerlari (read-only) */}
                <AllOverlays flials={flials} selectedId={selectedId} />

                {/* Tanlangan filial: mavjud poligon preview + Geoman editor */}
                {coords?.length > 0 && (
                  <Polygon positions={coords} pathOptions={activeStyle} />
                )}
                <GeomanPolygon
                  coords={coords}
                  setCoords={(c) => {
                    setCoords(c);
                    setDirty(true);
                  }}
                  onDirtyChange={onDirtyChange}
                  style={activeStyle}
                  autoFit={false}
                />

                {/* Barchasiga qarab fit */}
                <FitAllBounds flials={flials} selectedCoords={coords} />

                {/* Xarita bosish orqali test */}
                <MapClickTester
                  enabled={clickTestEnabled}
                  onClick={handleMapClickTest}
                />

                {/* Test marker */}
                {Array.isArray(testPoint) && testPoint.length === 2 && (
                  <Marker position={testPoint} />
                )}
              </MapContainer>

              <div className="hint">
                <b>Izoh:</b> Bir vaqtning o‘zida <u>bitta poligon</u> saqlanadi.
                Yangi chizsangiz, eski o‘chadi. Xarita barcha filial poligonlari
                va markerlarini qamrab turadi.
              </div>
            </div>

            <aside className="side">
              {/* Rang boshqaruvi */}
              <div className="group">
                <div className="group-title">Ko‘rinish (rang)</div>
                <div className="row">
                  <label className="color-field">
                    <span>Chiziq/To‘ldirish rangi</span>
                    <input
                      type="color"
                      value={polyColor}
                      onChange={(e) => setPolyColor(e.target.value)}
                      aria-label="Poligon rangi"
                    />
                    <code className="code">{polyColor}</code>
                  </label>
                </div>
                <div className="row sliders">
                  <label className="slider">
                    <span>Qalinlik: {polyWeight.toFixed(1)}</span>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      step="0.5"
                      value={polyWeight}
                      onChange={(e) => setPolyWeight(Number(e.target.value))}
                    />
                  </label>
                  <label className="slider">
                    <span>Shaffoflik: {polyOpacity.toFixed(2)}</span>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.01"
                      value={polyOpacity}
                      onChange={(e) => setPolyOpacity(Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="row">
                  <button className="btn" onClick={handleSaveStyle}>
                    Rangni saqlash
                  </button>
                  <button className="btn" onClick={handleResetStyle}>
                    Defaultga qaytarish
                  </button>
                </div>
              </div>

              <div className="group">
                <div className="group-title">Nuqta testi</div>
                <div className="row">
                  <label>
                    <span>Lat</span>
                    <input
                      type="number"
                      step="0.000001"
                      value={testLat}
                      onChange={(e) => setTestLat(e.target.value)}
                      placeholder="41.3..."
                    />
                  </label>
                  <label>
                    <span>Lng</span>
                    <input
                      type="number"
                      step="0.000001"
                      value={testLng}
                      onChange={(e) => setTestLng(e.target.value)}
                      placeholder="69.2..."
                    />
                  </label>
                </div>
                <div className="row">
                  <button
                    className="btn"
                    onClick={runManualTest}
                    disabled={coords.length < 3}
                  >
                    Tekshirish
                  </button>
                  <label className="chk">
                    <input
                      type="checkbox"
                      checked={clickTestEnabled}
                      onChange={(e) => setClickTestEnabled(e.target.checked)}
                    />
                    <span>Xaritaga bosib tekshirish</span>
                  </label>
                </div>

                <div className="result">
                  Holat:{" "}
                  {testResult == null ? (
                    <span className="badge">—</span>
                  ) : testResult ? (
                    <span className="badge badge--ok">Ichida</span>
                  ) : (
                    <span className="badge badge--bad">Tashqarida</span>
                  )}
                </div>
              </div>

              <div className="group">
                <div className="group-title">Poligon ma’lumoti</div>
                <div className="kv">
                  <div>Nuqtalar soni</div>
                  <div>
                    <b>{coords?.length || 0}</b>
                  </div>
                </div>
                <div className="kv">
                  <div>Filial holati</div>
                  <div>
                    <b>{selectedFlial?.is_active ? "Faol" : "Faol emas"}</b>
                  </div>
                </div>
                <div className="kv">
                  <div>Rang</div>
                  <div>
                    <span
                      className="color-dot"
                      style={{ background: polyColor }}
                      title={polyColor}
                    />
                    <code className="code">{polyColor}</code>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

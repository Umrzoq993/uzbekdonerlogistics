// src/pages/FlialPolygons.jsx
import { useEffect, useMemo, useRef, useState, Fragment } from "react";
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

// ======= Yordamchi normalizatorlar / signature =======
const EPS = 1e-6;
const round6 = (n) => Math.round(n * 1e6) / 1e6;

const samePt = (a, b) =>
  Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;

function normCoords(coords) {
  // coords: [[lat,lng], ...]
  if (!Array.isArray(coords)) return [];
  let arr = coords.map(([lat, lng]) => [round6(lat), round6(lng)]);
  if (arr.length > 1 && samePt(arr[0], arr[arr.length - 1])) {
    arr = arr.slice(0, -1);
  }
  return arr;
}
function sigFromCoords(coords) {
  return JSON.stringify(normCoords(coords));
}
function layerRingToCoords(layer) {
  try {
    const ring = layer.getLatLngs()[0] || [];
    return ring.map((ll) => [ll.lat, ll.lng]);
  } catch {
    return [];
  }
}

// ======= Leaflet default marker ikonlari =======
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

// Tema: faol/nofoal uchun default ranglar (tanlangan uchun)
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

// ======= DASTLABKI KO‘RINISH UCHUN TURFALANGAN RANGLAR (vivid) =======
const DISTINCT_COLORS = [
  "#FF1744",
  "#FF3D00",
  "#FF6D00",
  "#FFAB00",
  "#FFD600",
  "#C6FF00",
  "#76FF03",
  "#00E676",
  "#1DE9B6",
  "#00E5FF",
  "#00B0FF",
  "#2979FF",
  "#3F51FF",
  "#651FFF",
  "#AA00FF",
  "#D500F9",
  "#F50057",
  "#FF4081",
  "#FF8A80",
  "#FF6E40",
  "#FDD835",
  "#64DD17",
  "#00C853",
  "#00BFA5",
];
// id ga barqaror indeks (hash) — har doim bir xil rang berish uchun
function distinctColorById(id) {
  const s = String(id);
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % DISTINCT_COLORS.length;
  return DISTINCT_COLORS[idx];
}

// HEX -> {r,g,b}
function hexToRgb(hex) {
  const s = hex.replace("#", "");
  const v =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s.padStart(6, "0");
  const num = parseInt(v, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// Quyuqlashtirish (0..1), RGB ni ko‘paytirish bilan
function darken(hex, amount = 0.22) {
  const { r, g, b } = hexToRgb(hex);
  const k = Math.max(0, Math.min(1, 1 - amount));
  const rr = Math.round(r * k);
  const gg = Math.round(g * k);
  const bb = Math.round(b * k);
  return (
    "#" + [rr, gg, bb].map((x) => x.toString(16).padStart(2, "0")).join("")
  );
}

// Dash pattern to‘plami — id bo‘yicha har xil
const DASHES = ["6 4", "8 3", "4 3", "2 2", "10 4", "12 3", "5 2", "7 5"];
function dashById(id) {
  const s = String(id);
  let h = 3;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return DASHES[Math.abs(h) % DASHES.length];
}

// Boshqa (read-only) filiallar uchun ko‘rinish:
// — fillColor: bazaviy vivid rang
// — color (kontur): bazaviy rangning quyuqlashtirilgani
// — dashArray: id bo‘yicha farqli
function themeForOther(id, baseHex) {
  return {
    color: darken(baseHex, 0.22),
    weight: 1.8,
    dashArray: dashById(id),
    fillColor: baseHex,
    fillOpacity: 0.18,
    opacity: 1,
    lineJoin: "round",
    lineCap: "round",
  };
}

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

// ======= Geoman integratsiyasi va poligon boshqaruvi (faqat tanlangan filial) =======
function GeomanPolygon({
  coords,
  setCoords,
  onDirtyChange,
  style,
  autoFit = false,
}) {
  const map = useMap();
  const layerRef = useRef(null);
  const baselineSigRef = useRef("");

  // Controls + global options
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

    return () => {
      map.pm.removeControls();
    };
  }, [map]);

  const readNormFromLayer = () =>
    normCoords(layerRingToCoords(layerRef.current));
  const sigFromLayer = () => sigFromCoords(layerRingToCoords(layerRef.current));

  const bindLayerEvents = () => {
    if (!layerRef.current) return;
    const layer = layerRef.current;

    const markDirty = (commit) => {
      const nowSig = sigFromLayer();
      const changed = nowSig !== baselineSigRef.current;
      onDirtyChange?.(changed);
      if (commit) {
        const next = readNormFromLayer();
        setCoords((prev) =>
          sigFromCoords(prev) === sigFromCoords(next) ? prev : next
        );
      }
    };

    const onEdit = () => markDirty(false);
    const onVertex = () => markDirty(true);
    const onUpdate = () => markDirty(true);
    const onOther = () => markDirty(true);

    layer.on("pm:edit", onEdit);
    layer.on("pm:update", onUpdate);
    layer.on("pm:vertexadded", onVertex);
    layer.on("pm:vertexremoved", onVertex);
    layer.on("pm:markerdragend", onOther);
    layer.on("pm:cut", onOther);

    layer.on("remove", () => {
      layer.off("pm:edit", onEdit);
      layer.off("pm:update", onUpdate);
      layer.off("pm:vertexadded", onVertex);
      layer.off("pm:vertexremoved", onVertex);
      layer.off("pm:markerdragend", onOther);
      layer.off("pm:cut", onOther);
    });
  };

  useEffect(() => {
    const onCreate = (e) => {
      if (layerRef.current) {
        try {
          layerRef.current.remove();
        } catch {}
        layerRef.current = null;
      }
      layerRef.current = e.layer;
      layerRef.current.addTo(map);
      if (layerRef.current.pm)
        layerRef.current.pm.enable({
          allowSelfIntersection: false,
          snappable: true,
          snapDistance: 20,
        });
      if (style) layerRef.current.setStyle(style);

      const next = normCoords(layerRingToCoords(layerRef.current));
      baselineSigRef.current = sigFromCoords([]); // bo‘sh bazaga nisbatan
      onDirtyChange?.(true);
      setCoords(next);

      bindLayerEvents();
    };

    const onRemove = () => {
      if (layerRef.current) {
        try {
          layerRef.current.remove();
        } catch {}
        layerRef.current = null;
      }
      onDirtyChange?.(true);
      setCoords([]);
    };

    map.on("pm:create", onCreate);
    map.on("pm:remove", onRemove);
    return () => {
      map.off("pm:create", onCreate);
      map.off("pm:remove", onRemove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, style, setCoords, onDirtyChange]);

  // Tashqi coords o‘zgarganda layerni sinxronlash
  useEffect(() => {
    const nextNorm = normCoords(coords);
    const nextSig = sigFromCoords(nextNorm);

    if (layerRef.current) {
      const curSig = sigFromLayer();
      if (curSig === nextSig) {
        if (style) layerRef.current.setStyle(style);
        return;
      }
      try {
        layerRef.current.remove();
      } catch {}
      layerRef.current = null;
    }

    if (nextNorm && nextNorm.length) {
      const poly = L.polygon(nextNorm, style).addTo(map);
      layerRef.current = poly;
      if (poly.pm)
        poly.pm.enable({
          allowSelfIntersection: false,
          snappable: true,
          snapDistance: 20,
        });

      baselineSigRef.current = nextSig;
      onDirtyChange?.(false);

      if (autoFit) {
        try {
          const bounds = poly.getBounds();
          if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        } catch {}
      }

      bindLayerEvents();
    } else {
      baselineSigRef.current = sigFromCoords([]);
      onDirtyChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, map, style, autoFit]);

  useEffect(() => {
    if (layerRef.current && style) {
      try {
        layerRef.current.setStyle(style);
      } catch {}
    }
  }, [style]);

  return null;
}

// ======= Barcha filiallar poligonlari + markerlari (read-only) =======
function AllOverlays({ flials, selectedId }) {
  return (
    <>
      {flials.map((f) => {
        const isSelected = selectedId && String(f.id) === String(selectedId);
        const coords = Array.isArray(f.coordinates) ? f.coordinates : [];

        // Id bo‘yicha vivid rang:
        const vivid = distinctColorById(f.id);

        // LocalStorage’da saqlangan bo‘lsa, o‘shani ishlatamiz, aks holda vivid
        const cfg = loadColorCfg(f.id, {
          color: vivid,
          weight: 2.5,
          fillOpacity: 0.25,
        });

        const baseHex = cfg.color || vivid;
        const strokeHex = darken(baseHex, 0.22);

        const pathOptions = isSelected
          ? {
              color: strokeHex,
              weight: 3,
              dashArray: null,
              fillColor: baseHex,
              fillOpacity: 0.32,
              opacity: 1,
              lineJoin: "round",
              lineCap: "round",
            }
          : themeForOther(f.id, baseHex);

        return (
          <Fragment key={`over-${f.id}`}>
            {coords.length >= 3 && (
              <Polygon positions={coords} pathOptions={pathOptions} />
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
                        background: baseHex,
                        border: "1px solid rgba(0,0,0,.1)",
                        verticalAlign: -2,
                        marginRight: 6,
                      }}
                    />
                    <code>{baseHex}</code>
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

// ======= Barcha poligon va markerlarga qarab auto-fit =======
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

// ======= Xaritaga bosib test qilish =======
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

  // ❗ Dastlab hech narsa tanlanmagan
  const [selectedId, setSelectedId] = useState("");
  const selectedFlial = useMemo(
    () => flials.find((f) => String(f.id) === String(selectedId)),
    [flials, selectedId]
  );

  // Tanlangan filial poligoni (koord)
  const [coords, setCoords] = useState([]); // [[lat,lng], ...]
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapKey, setMapKey] = useState(1);

  // Rang boshqaruvi (tanlangan uchun)
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
        // ❗ Hech narsa tanlanmaydi: selectedId="" qoladi, coords=[]
        setCoords([]);
        setDirty(false);
        setMapKey((k) => k + 1); // map init refresh
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

  const onDirtyChange = (v) => setDirty(Boolean(v));

  const handleSelectFlial = (e) => {
    const id = e.target.value;
    setSelectedId(id);

    if (!id) {
      // ❗ Tanlovni bekor qilish: tahrirlash o‘chadi, hamma poligonlar barobar
      setCoords([]);
      setDirty(false);
      setMapKey((k) => k + 1);
      setTestPoint(null);
      setTestResult(null);
      return;
    }

    const f = flials.find((x) => String(x.id) === String(id));
    const orig = Array.isArray(f?.coordinates) ? f.coordinates : [];
    setCoords(orig);
    setDirty(false);

    // Rang konfiguratsiyasi (faqat tanlangan uchun)
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
    const payload = normCoords(coords);
    if (payload.length < 3) {
      toast.warn("Poligon uchun kamida 3 nuqta kerak.");
      return;
    }
    setSaving(true);
    try {
      await saveFlialPolygon(selectedId, payload);
      setFlials((prev) =>
        prev.map((f) =>
          String(f.id) === String(selectedId)
            ? { ...f, coordinates: payload }
            : f
        )
      );
      setDirty(false);
      setMapKey((k) => k + 1);
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

  // Tanlangan filial uchun amaldagi style (faqat tanlanganda ishlatiladi)
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
              {/* ❗ placeholder: dastlab hech narsa tanlanmagan */}
              <option value="">— Filial tanlang —</option>
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
              title={!selectedId ? "Filial tanlanmagan" : undefined}
            >
              Qayta yuklash
            </button>
            <button
              className="btn"
              onClick={handleClear}
              disabled={!selectedId || saving}
              title={!selectedId ? "Filial tanlanmagan" : undefined}
            >
              Tozalash
            </button>
            <button
              className="btn primary"
              onClick={handleSave}
              disabled={!selectedId || saving || !dirty}
              title={
                !selectedId
                  ? "Filial tanlanmagan"
                  : !dirty
                  ? "O‘zgarish yo‘q"
                  : "Saqlash"
              }
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

                {/* Tanlangan bo‘lsa — preview va editor */}
                {!!selectedId && coords?.length > 0 && (
                  <Polygon positions={coords} pathOptions={activeStyle} />
                )}
                {!!selectedId && (
                  <GeomanPolygon
                    coords={coords}
                    setCoords={setCoords}
                    onDirtyChange={onDirtyChange}
                    style={activeStyle}
                    autoFit={false}
                  />
                )}

                {/* Barchasiga qarab fit */}
                <FitAllBounds flials={flials} selectedCoords={coords} />

                {/* Xarita bosish orqali test */}
                <MapClickTester
                  enabled={!!selectedId && clickTestEnabled}
                  onClick={handleMapClickTest}
                />

                {/* Test marker */}
                {Array.isArray(testPoint) && testPoint.length === 2 && (
                  <Marker position={testPoint} />
                )}
              </MapContainer>

              <div className="hint">
                <b>Izoh:</b> Dastlab hech qaysi filial tanlanmagan — barcha
                poligonlar ko‘rinadi. Filial tanlasangiz, faqat o‘sha poligon
                tahrirlanadi va “Saqlash” faollashadi.
              </div>
            </div>

            <aside className="side">
              {/* Rang boshqaruvi — faqat tanlangan uchun ma’no kasb etadi */}
              <div className="group">
                <div className="group-title">Ko‘rinish (tanlangan poligon)</div>
                <div className="row">
                  <label className="color-field">
                    <span>Chiziq/To‘ldirish rangi</span>
                    <input
                      type="color"
                      value={polyColor}
                      onChange={(e) => setPolyColor(e.target.value)}
                      aria-label="Poligon rangi"
                      disabled={!selectedId}
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
                      disabled={!selectedId}
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
                      disabled={!selectedId}
                    />
                  </label>
                </div>
                <div className="row">
                  <button
                    className="btn"
                    onClick={handleSaveStyle}
                    disabled={!selectedId}
                  >
                    Rangni saqlash
                  </button>
                  <button
                    className="btn"
                    onClick={handleResetStyle}
                    disabled={!selectedId}
                  >
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
                      disabled={!selectedId}
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
                      disabled={!selectedId}
                    />
                  </label>
                </div>
                <div className="row">
                  <button
                    className="btn"
                    onClick={runManualTest}
                    disabled={!selectedId || coords.length < 3}
                  >
                    Tekshirish
                  </button>
                  <label className="chk">
                    <input
                      type="checkbox"
                      checked={!!selectedId && clickTestEnabled}
                      onChange={(e) => setClickTestEnabled(e.target.checked)}
                      disabled={!selectedId}
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
                    <b>
                      {selectedId
                        ? selectedFlial?.is_active
                          ? "Faol"
                          : "Faol emas"
                        : "—"}
                    </b>
                  </div>
                </div>
                {!!selectedId && (
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
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

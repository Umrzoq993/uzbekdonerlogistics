// src/components/MapModal.jsx
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "./mapmodal.scss";

// Leaflet default marker assets
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

/**
 * Backward-compatible API:
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - order: ANY (order yoki flial). Fieldlar ichkarida normalize qilinadi.
 *
 * Normalize qilingan shape:
 *  {
 *    id, title, latitude, longitude,
 *    address?, phone?, coordinates?: Array<[lat,lng]> | Array<{lat,lng}>
 *  }
 */
export default function MapModal({ open, onClose, order }) {
  // normalize (o‘sha-o‘sha)
  const model = useMemo(() => {
    if (!order) return null;
    const lat = order.latitude ?? order.lat;
    const lng = order.longitude ?? order.lng ?? order.lon;
    const title =
      order.title ||
      order.name ||
      order.flial_name ||
      (order.id != null ? `ID: ${order.id}` : "Joy");
    return {
      id: order.id ?? null,
      title,
      latitude: lat != null ? Number(lat) : null,
      longitude: lng != null ? Number(lng) : null,
      address: order.address ?? null,
      phone: order.phone ?? null,
      coordinates: Array.isArray(order.coordinates) ? order.coordinates : null,
      status: (order.status || "").toLowerCase(),
    };
  }, [order]);

  const hasGeo = !!(model?.latitude != null && model?.longitude != null);
  const position = hasGeo ? [model.latitude, model.longitude] : null;

  // Status -> rang
  const theme = useMemo(() => {
    switch (model?.status) {
      case "waiting":
        return { cls: "popup--waiting", color: "#f59e0b" }; // amber-500
      case "confirmed":
        return { cls: "popup--confirmed", color: "#10b981" }; // emerald-500
      case "rejected":
        return { cls: "popup--rejected", color: "#ef4444" }; // red-500
      case "onway":
        return { cls: "popup--onway", color: "#3b82f6" }; // blue-500
      case "received":
        return { cls: "popup--received", color: "#22c55e" }; // green-500
      default:
        return { cls: "popup--neutral", color: "#6b7280" }; // gray-500
    }
  }, [model?.status]);

  const polygonLatLngs = useMemo(() => {
    const list = model?.coordinates;
    if (!list || list.length === 0) return null;
    return list.map((p) =>
      Array.isArray(p)
        ? [Number(p[0]), Number(p[1])]
        : [Number(p.lat), Number(p.lng)]
    );
  }, [model]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const openInGMaps = () => {
    if (!position) return;
    const [lat, lng] = position;
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyCoords = async () => {
    if (!position) return;
    const [lat, lng] = position;
    try {
      await navigator.clipboard.writeText(`${lat}, ${lng}`);
      alert("Koordinata nusxalandi!");
    } catch {
      alert("Nusxalab bo‘lmadi");
    }
  };

  return !open ? null : (
    <div
      className="modal-root"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-title">{model?.title || "Xarita"}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {hasGeo ? (
            <MapContainer
              center={position}
              zoom={14}
              scrollWheelZoom
              style={{ height: "420px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {polygonLatLngs ? (
                <Polygon
                  positions={polygonLatLngs}
                  pathOptions={{ color: theme.color }}
                />
              ) : null}

              <Marker position={position}>
                <Popup minWidth={220}>
                  <div className={`popup ${theme.cls}`}>
                    <div className="popup-title">{model.title}</div>
                    {model.address ? (
                      <div className="popup-line">
                        <b>Manzil:</b> {model.address}
                      </div>
                    ) : null}
                    {model.phone ? (
                      <div className="popup-line">
                        <b>Telefon:</b> {model.phone}
                      </div>
                    ) : null}
                    <div className="popup-line">
                      <b>Koordinata:</b> {model.latitude?.toFixed?.(6)},{" "}
                      {model.longitude?.toFixed?.(6)}
                    </div>
                    {model.status ? (
                      <div className="popup-line">
                        <b>Status:</b> {model.status}
                      </div>
                    ) : null}
                    <div className="popup-actions">
                      <button className="btn" onClick={openInGMaps}>
                        Google Maps
                      </button>
                      <button className="btn" onClick={copyCoords}>
                        Nusxalash
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="state">Koordinata yo‘q</div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

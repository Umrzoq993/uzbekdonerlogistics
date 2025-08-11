import { useEffect, useMemo, useState } from "react";
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

export default function MapModal({ open, onClose, order }) {
  // Normalize
  const model = useMemo(() => {
    if (!order) return null;
    const lat = order.latitude ?? order.lat;
    const lng = order.longitude ?? order.lng ?? order.lon;

    const title =
      order.title ||
      order.name ||
      order.flial_name ||
      (order.id != null ? `ID: ${order.id}` : "Joy");

    const addressText =
      (typeof order.address === "string" ? order.address : null) ??
      order.address?.address_text ??
      order.address_text ??
      order.flial?.address_text ??
      order.flial_address ??
      null;

    const statusRaw =
      typeof order.status === "string"
        ? order.status
        : order.status?.status || "";

    return {
      id: order.id ?? null,
      title,
      latitude: lat != null ? Number(lat) : null,
      longitude: lng != null ? Number(lng) : null,
      address: addressText,
      phone: order.phone ?? null,
      coordinates: Array.isArray(order.coordinates) ? order.coordinates : null,
      status: (statusRaw || "").toLowerCase(),
    };
  }, [order]);

  const hasGeo = !!(model?.latitude != null && model?.longitude != null);
  const position = hasGeo ? [model.latitude, model.longitude] : null;

  // Status -> rang
  const theme = useMemo(() => {
    switch (model?.status) {
      case "waiting":
        return { cls: "popup--waiting", color: "#f59e0b" };
      case "confirmed":
        return { cls: "popup--confirmed", color: "#10b981" };
      case "rejected":
        return { cls: "popup--rejected", color: "#ef4444" };
      case "onway":
        return { cls: "popup--onway", color: "#3b82f6" };
      case "received":
        return { cls: "popup--received", color: "#22c55e" };
      default:
        return { cls: "popup--neutral", color: "#6b7280" };
    }
  }, [model?.status]);

  // Polygon (ixtiyoriy)
  const polygonLatLngs = useMemo(() => {
    const list = model?.coordinates;
    if (!list || list.length === 0) return null;
    return list.map((p) =>
      Array.isArray(p)
        ? [Number(p[0]), Number(p[1])]
        : [Number(p.lat), Number(p.lng)]
    );
  }, [model]);

  // ESC bilan yopish
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Footer manzilni kengaytirib/qatlab ko‘rsatish
  const [addrExpanded, setAddrExpanded] = useState(false);
  const isLongAddr = (model?.address?.length ?? 0) > 80;

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

  const copyAddress = async () => {
    if (!model?.address) return;
    try {
      await navigator.clipboard.writeText(model.address);
      alert("Manzil nusxalandi!");
    } catch {
      alert("Nusxalab bo‘lmadi");
    }
  };

  return (
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
          <div className="foot-left">
            <div className="foot-label">Manzil:</div>
            <div
              className={`foot-value ${addrExpanded ? "expanded" : "clamped"}`}
              title={model?.address || ""}
            >
              {model?.address || "—"}
            </div>

            {/* Faollashtirilgan manzil harakatlari (ixtiyoriy) */}
            {model?.address && (
              <div className="foot-mini-actions">
                {isLongAddr && (
                  <button
                    className="mini-link"
                    onClick={() => setAddrExpanded((v) => !v)}
                  >
                    {addrExpanded ? "Kamroq" : "Ko‘proq"}
                  </button>
                )}
                <button className="mini-link" onClick={copyAddress}>
                  Nusxalash
                </button>
              </div>
            )}
          </div>

          <div className="foot-actions">
            {hasGeo && (
              <>
                <button className="btn" onClick={openInGMaps}>
                  Google Maps
                </button>
                <button className="btn" onClick={copyCoords}>
                  Koordinatani nusxala
                </button>
              </>
            )}
            <button className="btn" onClick={onClose}>
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

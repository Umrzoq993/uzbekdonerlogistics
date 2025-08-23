// src/utils/pmDirty.js
const EPS = 1e-6;
const round6 = (n) => Math.round(n * 1e6) / 1e6;

function pointsEqual(a, b) {
  return Math.abs(a.lat - b.lat) < EPS && Math.abs(a.lng - b.lng) < EPS;
}

function normRing(ring) {
  // ring: LatLng[]
  if (!Array.isArray(ring)) return [];
  let arr = ring.map((p) => ({ lat: round6(p.lat), lng: round6(p.lng) }));
  // Ba’zi hollarda Leaflet halqani yopish uchun 1-nuqta oxirida ham turadi — olib tashlaymiz
  if (arr.length > 1 && pointsEqual(arr[0], arr[arr.length - 1])) {
    arr = arr.slice(0, -1);
  }
  return arr;
}

function normLatLngs(latlngs) {
  // Polygon: [ring[]], MultiPolygon: [ [ring[]], ... ]
  if (!Array.isArray(latlngs)) return [];
  const fst = latlngs[0];
  if (Array.isArray(fst) && Array.isArray(fst[0])) {
    // MultiPolygon (yoki Polygonning ichidagi halqalar to‘plami)
    return latlngs.map((rings) => rings.map(normRing));
  }
  if (Array.isArray(fst)) {
    // Polygon: [ring[]]
    return latlngs.map(normRing);
  }
  // Noma’lum holatlar uchun
  return [normRing(latlngs)];
}

export function signatureForLayer(layer) {
  try {
    const latlngs = layer.getLatLngs();
    const norm = normLatLngs(latlngs);
    return JSON.stringify(norm);
  } catch {
    return "";
  }
}

export function attachPmDirtyTracker(layer, onDirtyChange) {
  // baseline imzo
  layer._baselineSig = signatureForLayer(layer);
  layer._changed = false;

  const mark = () => {
    const now = signatureForLayer(layer);
    const changed = now !== layer._baselineSig;
    if (changed !== layer._changed) {
      layer._changed = changed;
      onDirtyChange?.(changed, layer);
    } else {
      // Ba’zi holatlarda baseline bilan bir xil bo‘lsa, changed=false bo‘lib qoladi
      onDirtyChange?.(layer._changed, layer);
    }
  };

  // Geoman hodisalarini tinglaymiz — har safar imzoni qayta tekshiramiz
  const evts = [
    "pm:edit",
    "pm:update",
    "pm:vertexadded",
    "pm:vertexremoved",
    "pm:markerdragend",
    "pm:cut",
  ];
  evts.forEach((e) => layer.on(e, mark));

  // Agar tashqi tomondan koordinata o‘zgarsa (masalan, API’dan qayta chizilsa)
  layer.on("remove", () => {
    // tozalik
    evts.forEach((e) => layer.off(e, mark));
  });

  return {
    resetBaseline() {
      layer._baselineSig = signatureForLayer(layer);
      layer._changed = false;
      onDirtyChange?.(false, layer);
    },
    isChanged() {
      return !!layer._changed;
    },
  };
}

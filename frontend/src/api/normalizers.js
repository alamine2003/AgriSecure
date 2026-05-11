// Transformations centralisées entre l'API backend et le frontend.
// DRF retourne DecimalField en string et les coordonnées en [lat, lng] (tableaux).
// Le frontend utilise des nombres et {lat, lng} (objets) pour Leaflet.

export function normalizePerimeter(raw) {
  return {
    ...raw,
    area_hectares: Number(raw.area_hectares) || 0,
    center_lat: raw.center_lat ? Number(raw.center_lat) : null,
    center_lng: raw.center_lng ? Number(raw.center_lng) : null,
    coordinates: (raw.coordinates || []).map(p =>
      Array.isArray(p) ? { lat: p[0], lng: p[1] } : p
    ),
  }
}

export function serializePerimeter(formData) {
  return {
    name: formData.name,
    description: formData.description || "",
    coordinates: (formData.coordinates || []).map(p =>
      Array.isArray(p) ? p : [p.lat, p.lng]
    ),
  }
}

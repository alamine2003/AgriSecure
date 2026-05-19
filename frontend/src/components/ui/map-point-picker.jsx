import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation } from 'lucide-react'

const MARKER_ICON = L.divIcon({
  html: `<div style="background:#f59e0b;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4)"></div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export const MapPointPicker = ({
  onSelect,
  centerLat = 14.4974,
  centerLng = -14.4524,
  initialZoom = 7,
  height = "260px",
  value = null,
}) => {
  const [selected, setSelected] = useState(value)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  // Initialiser la carte (Leaflet chargé via npm — pas de CDN)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [centerLat, centerLng],
      initialZoom
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    if (value?.lat && value?.lng) {
      markerRef.current = L.marker([value.lat, value.lng], { icon: MARKER_ICON }).addTo(map)
      map.setView([value.lat, value.lng], 13)
    }

    map.on('click', (e) => {
      const lat = Math.round(e.latlng.lat * 1000000) / 1000000
      const lng = Math.round(e.latlng.lng * 1000000) / 1000000
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { icon: MARKER_ICON }).addTo(map)
      }
      const pt = { lat, lng }
      setSelected(pt)
      onSelect?.(pt)
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Recentrer la carte quand centerLat/centerLng change (ex: sélection commune)
  useEffect(() => {
    if (!mapInstanceRef.current || !centerLat || !centerLng) return
    mapInstanceRef.current.setView([centerLat, centerLng], 13, { animate: true })
  }, [centerLat, centerLng])

  // Déplacer le marqueur si value change depuis l'extérieur
  useEffect(() => {
    if (!mapInstanceRef.current || !value?.lat || !value?.lng) return
    setSelected(value)
    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng])
    } else {
      markerRef.current = L.marker([value.lat, value.lng], { icon: MARKER_ICON }).addTo(mapInstanceRef.current)
    }
    mapInstanceRef.current.setView([value.lat, value.lng], 14, { animate: true })
  }, [value?.lat, value?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl overflow-hidden border border-border/50">
      <div ref={mapRef} style={{ height }} />

      {selected ? (
        <div className="px-3 py-2 bg-primary/5 border-t border-border/30 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">Position sélectionnée ·</span>{' '}
            Lat <span className="font-mono text-foreground">{selected.lat.toFixed(6)}</span>
            {' '}Lng <span className="font-mono text-foreground">{selected.lng.toFixed(6)}</span>
          </span>
        </div>
      ) : (
        <div className="px-3 py-2 bg-amber-500/5 border-t border-amber-500/20 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">Cliquez sur la carte pour positionner l'installation</span>
        </div>
      )}
    </div>
  )
}

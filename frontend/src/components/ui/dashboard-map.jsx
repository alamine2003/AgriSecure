import { useEffect, useRef, useState } from 'react'
import { MapPin, Camera, Layers } from 'lucide-react'

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    document.body.appendChild(script)
  })
}

export function DashboardMap({ perimeters = [], cameras = [], height = "400px", title, icon: Icon = MapPin }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadLeaflet().then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }

    const L = window.L

    const map = L.map(mapRef.current, { zoomControl: false }).setView([14.5, -14.5], 7)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB',
      maxZoom: 19,
    }).addTo(map)

    const bounds = []

    // Draw perimeters
    perimeters.forEach((p) => {
      if (!p.coordinates || p.coordinates.length < 3) return
      const latlngs = p.coordinates.map(c => [c.lat || c[0], c.lng || c[1]])
      bounds.push(...latlngs)

      const polygon = L.polygon(latlngs, {
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map)

      polygon.bindPopup(`
        <div style="font-family:system-ui;min-width:140px">
          <strong style="color:#f59e0b">${p.name}</strong><br/>
          <span style="font-size:12px;color:#666">${p.area_hectares || '?'} ha · ${p.commune || ''}</span>
        </div>
      `)
    })

    // Draw cameras
    cameras.forEach((cam) => {
      let lat, lng
      let linkedPerimeter = null

      if (cam.latitude && cam.longitude) { lat = cam.latitude; lng = cam.longitude }

      if (cam.perimeter) {
        linkedPerimeter = perimeters.find(p => p.id === cam.perimeter)
        if (!lat && linkedPerimeter && linkedPerimeter.coordinates && linkedPerimeter.coordinates.length > 0) {
          const coords = linkedPerimeter.coordinates
          lat = coords.reduce((s, c) => s + (c.lat || c[0]), 0) / coords.length
          lng = coords.reduce((s, c) => s + (c.lng || c[1]), 0) / coords.length
        }
      }

      if (!lat || !lng) return

      bounds.push([lat, lng])

      const isOnline = cam.status === 'online' || cam.is_active
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${isOnline ? '#f59e0b' : '#6b7280'};box-shadow:0 4px 12px ${isOnline ? 'rgba(245,158,11,0.4)' : 'rgba(0,0,0,0.3)'};cursor:pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)

      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <strong>${cam.name}</strong><br/>
          <span style="font-size:12px;color:${isOnline ? '#f59e0b' : '#999'}">${isOnline ? '● En ligne' : '○ Hors ligne'}</span><br/>
          <span style="font-size:11px;color:#888">${cam.location || ''}</span>
          ${linkedPerimeter ? `<br/><span style="font-size:11px;color:#f59e0b;margin-top:4px;display:inline-block">▶ ${linkedPerimeter.name} (${linkedPerimeter.area_hectares || '?'} ha)</span>` : ''}
        </div>
      `)

      // On click: zoom to linked perimeter
      marker.on('click', () => {
        if (linkedPerimeter && linkedPerimeter.coordinates && linkedPerimeter.coordinates.length >= 3) {
          const latlngs = linkedPerimeter.coordinates.map(c => [c.lat || c[0], c.lng || c[1]])
          map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60], maxZoom: 16 })
        }
      })
    })

    // Fit bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }

    mapInstanceRef.current = map

    return () => { map.remove(); mapInstanceRef.current = null }
  }, [ready, perimeters, cameras])

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {title && (
        <div className="border-b border-border/50 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-[11px] text-muted-foreground">
              {perimeters.length} périmètre(s) · {cameras.length} caméra(s)
            </p>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ height, width: '100%' }} className="relative z-0" />
    </div>
  )
}

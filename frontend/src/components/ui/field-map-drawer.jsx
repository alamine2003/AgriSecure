import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin, Navigation, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Edit2, Trash2, Save, X, Plus, Move, Square, Info
} from 'lucide-react'
import { findCommuneByGPS } from '@/data/senegalLocations'

// Vite ne bundle pas les icônes Leaflet automatiquement — fix requis
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

export const FieldMapDrawer = ({
  onSave,
  initialPolygon = [],
  initialCenter = { lat: 14.4974, lng: -14.4524 },
  initialZoom = 8,
  height = "600px",
  editMode = false
}) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEditing, setIsEditing] = useState(editMode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState(initialPolygon)
  const [area, setArea] = useState(0)
  const [center, setCenter] = useState(null)
  const [nearestCommune, setNearestCommune] = useState(null)


  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const polygonRef = useRef(null)
  const markersRef = useRef([])
  const isDrawingRef = useRef(false)
  const isEditingRef = useRef(editMode)
  const polygonPointsRef = useRef(initialPolygon)

  // Synchroniser les refs avec les états pour éviter les stale closures
  useEffect(() => { isDrawingRef.current = isDrawing }, [isDrawing])
  useEffect(() => { isEditingRef.current = isEditing }, [isEditing])
  useEffect(() => { polygonPointsRef.current = polygonPoints }, [polygonPoints])

  // Initialiser la carte (Leaflet chargé via npm — pas de CDN)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([initialCenter.lat, initialCenter.lng], initialZoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    if (initialPolygon.length > 0) {
      drawPolygonOnMap(map, initialPolygon)
      const normPoly = initialPolygon.map(p => Array.isArray(p) ? { lat: p[0], lng: p[1] } : p)
      const bounds = L.latLngBounds(normPoly.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    map.on('click', (e) => {
      if (isDrawingRef.current && !isEditingRef.current) {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng }
        setPolygonPoints(prev => {
          const updated = [...prev, newPoint]
          polygonPointsRef.current = updated
          return updated
        })
      }
    })

    mapInstanceRef.current = map

    // Recalculate on container resize (handles dialog open animation, flex resize, etc.)
    const observer = new ResizeObserver(() => { map.invalidateSize() })
    if (mapRef.current) observer.observe(mapRef.current)

    // Also force after short delay as initial fallback
    const t = setTimeout(() => map.invalidateSize(), 200)

    return () => {
      clearTimeout(t)
      observer.disconnect()
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Mettre à jour polygone quand points changent
  useEffect(() => {
    if (mapInstanceRef.current && polygonPoints.length > 0) {
      drawPolygonOnMap(mapInstanceRef.current, polygonPoints)
      calculateArea(polygonPoints)
      calculateCenter(polygonPoints)
    }
  }, [polygonPoints])

  const drawPolygonOnMap = (map, points) => {
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current)
    }
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []

    if (points.length === 0) return

    const normalized = points.map(p => Array.isArray(p) ? { lat: p[0], lng: p[1] } : p)

    normalized.forEach((point, index) => {
      let marker

      if (isEditing) {
        marker = L.marker([point.lat, point.lng], { draggable: true }).addTo(map)

        marker.on('drag', (e) => {
          const newPoints = [...polygonPointsRef.current]
          newPoints[index] = { lat: e.latlng.lat, lng: e.latlng.lng }
          polygonPointsRef.current = newPoints
          setPolygonPoints(newPoints)
        })

        marker.on('contextmenu', (e) => {
          e.originalEvent.preventDefault()
          if (polygonPointsRef.current.length > 3) {
            setPolygonPoints(prev => prev.filter((_, i) => i !== index))
          }
        })
      } else {
        marker = L.circleMarker([point.lat, point.lng], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map)
      }

      marker.bindTooltip(`Point ${index + 1}`, { permanent: false, direction: 'top' })
      markersRef.current.push(marker)
    })

    if (normalized.length >= 3) {
      const polygon = L.polygon(
        normalized.map(p => [p.lat, p.lng]),
        { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3, weight: 2.5 }
      ).addTo(map)
      polygonRef.current = polygon
    } else if (normalized.length === 2) {
      const polyline = L.polyline(
        normalized.map(p => [p.lat, p.lng]),
        { color: '#10b981', weight: 2.5 }
      ).addTo(map)
      polygonRef.current = polyline
    }
  }

  const calculateArea = (points) => {
    if (points.length < 3) { setArea(0); return }
    let a = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      a += points[i].lng * points[j].lat
      a -= points[j].lng * points[i].lat
    }
    a = Math.abs(a) / 2
    const latFactor = Math.cos((14 * Math.PI) / 180)
    const areaHectares = a * 111.32 * 111.32 * latFactor * 100
    setArea(areaHectares)
  }

  const calculateCenter = (points) => {
    if (points.length === 0) { setCenter(null); return }
    const sumLat = points.reduce((sum, p) => sum + p.lat, 0)
    const sumLng = points.reduce((sum, p) => sum + p.lng, 0)
    const centerPoint = { lat: sumLat / points.length, lng: sumLng / points.length }
    setCenter(centerPoint)
    setNearestCommune(findCommuneByGPS(centerPoint.lat, centerPoint.lng))
  }

  const startDrawing = () => {
    setIsDrawing(true)
    setIsEditing(false)
    setPolygonPoints([])
  }

  const startEditing = () => { setIsEditing(true); setIsDrawing(false) }
  const stopDrawingOrEditing = () => { setIsDrawing(false); setIsEditing(false) }

  const clearPolygon = () => {
    if (window.confirm('Effacer le périmètre ?')) {
      setPolygonPoints([])
      setArea(0)
      setCenter(null)
      setNearestCommune(null)
      if (polygonRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polygonRef.current)
      }
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current) mapInstanceRef.current.removeLayer(marker)
      })
      markersRef.current = []
    }
  }

  const undoLastPoint = () => {
    if (polygonPoints.length > 0) setPolygonPoints(prev => prev.slice(0, -1))
  }

  const closePolygon = () => {
    if (polygonPoints.length >= 3) { setIsDrawing(false) }
  }

  const handleSave = () => {
    if (polygonPoints.length < 3) { alert('Le périmètre doit avoir au moins 3 points'); return }
    if (onSave) {
      onSave({
        coordinates: polygonPoints,
        center,
        area_hectares: parseFloat(area.toFixed(2)),
        nearest_commune: nearestCommune
      })
    }
  }

  const zoomIn = () => mapInstanceRef.current?.zoomIn()
  const zoomOut = () => mapInstanceRef.current?.zoomOut()

  const fitBounds = () => {
    if (mapInstanceRef.current && polygonPoints.length > 0) {
      const bounds = L.latLngBounds(polygonPoints.map(p => [p.lat, p.lng]))
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

  const fillParent = height === '100%'

  return (
    <div className={`${fillParent ? 'flex flex-col h-full' : 'relative'} ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4 flex flex-col' : ''}`}>

      {/* Toolbar compact */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5 p-2 bg-card rounded-xl border border-border">
        <button
          onClick={startDrawing}
          disabled={isDrawing}
          className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all
            ${isDrawing ? 'bg-primary text-primary-foreground shadow' : 'border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'}`}
        >
          <Plus className="w-3.5 h-3.5" />
          {isDrawing ? 'Dessin en cours…' : 'Dessiner'}
        </button>

        {polygonPoints.length > 0 && !isDrawing && (
          <button
            onClick={isEditing ? stopDrawingOrEditing : startEditing}
            className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all
              ${isEditing ? 'bg-destructive text-destructive-foreground shadow' : 'border border-border hover:border-destructive/50 hover:bg-destructive/5 text-foreground'}`}
          >
            {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditing ? 'Terminer édition' : 'Modifier'}
          </button>
        )}

        {isDrawing && polygonPoints.length > 0 && (
          <button
            onClick={undoLastPoint}
            className="h-8 px-3 rounded-lg text-xs font-medium border border-border hover:border-amber-500/50 hover:bg-amber-500/5 text-foreground transition-all"
          >
            ← Annuler
          </button>
        )}

        {isDrawing && polygonPoints.length >= 3 && (
          <button
            onClick={closePolygon}
            className="h-8 px-3 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 shadow transition-all"
          >
            Terminer
          </button>
        )}

        {polygonPoints.length >= 3 && !isDrawing && !isEditing && (
          <button
            onClick={handleSave}
            className="h-8 px-3 rounded-lg text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Enregistrer
          </button>
        )}

        {polygonPoints.length > 0 && !isDrawing && !isEditing && (
          <button
            onClick={clearPolygon}
            className="h-8 px-3 rounded-lg text-xs font-medium border border-destructive/30 hover:border-destructive hover:bg-destructive/5 text-destructive transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted/50 transition-all" title="Zoom +">
            <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted/50 transition-all" title="Zoom -">
            <ZoomOut className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {polygonPoints.length > 0 && (
            <button onClick={fitBounds} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted/50 transition-all" title="Centrer">
              <Move className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <button onClick={toggleFullscreen} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted/50 transition-all" title={isFullscreen ? 'Réduire' : 'Plein écran'}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Hint dessin */}
      {(isDrawing || isEditing) && (
        <div className={`mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs
          ${isDrawing ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
          <Info className="w-3 h-3 shrink-0" />
          {isDrawing
            ? polygonPoints.length < 3
              ? `Cliquez sur la carte — encore ${3 - polygonPoints.length} point(s) requis`
              : 'Ajoutez des points ou cliquez "Terminer" pour fermer le périmètre'
            : 'Glissez les marqueurs pour déplacer les points · clic droit pour supprimer un point'}
        </div>
      )}

      {/* Carte */}
      <div
        ref={mapRef}
        className={`w-full rounded-xl border border-border overflow-hidden ${fillParent || isFullscreen ? 'flex-1 min-h-0' : ''}`}
        style={fillParent || isFullscreen ? undefined : { height }}
      />

      {/* Barre de statut compacte */}
      {polygonPoints.length > 0 && (
        <div className="mt-2 flex items-center gap-4 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="font-semibold text-foreground">{polygonPoints.length}</span> points
          </span>
          {area > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Square className="w-3 h-3 text-primary" />
              <span className="font-semibold text-foreground">{area.toFixed(2)}</span> ha
            </span>
          )}
          {nearestCommune && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Navigation className="w-3 h-3 text-primary" />
              {nearestCommune.name}, {nearestCommune.region}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import {
  MapPin, Navigation, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Edit2, Trash2, Save, X, Plus, Move, Square, Info
} from 'lucide-react'
import { findCommuneByGPS } from '@/data/senegalLocations'

/**
 * Composant Carte Interactive pour Dessiner des Périmètres Agricoles
 * Fonctionnalités:
 * - Dessiner polygone par clics
 * - Modifier polygone existant
 * - Zoomer/Dézoomer
 * - Calculer surface automatiquement
 * - Sauvegarder périmètre
 */
export const FieldMapDrawer = ({
  onSave,
  initialPolygon = [],
  initialCenter = { lat: 14.4974, lng: -14.4524 },
  initialZoom = 8,
  height = "600px",
  editMode = false
}) => {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEditing, setIsEditing] = useState(editMode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState(initialPolygon)
  const [area, setArea] = useState(0)
  const [center, setCenter] = useState(null)
  const [nearestCommune, setNearestCommune] = useState(null)
  const [showInfo, setShowInfo] = useState(true)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const polygonRef = useRef(null)
  const markersRef = useRef([])

  // Charger Leaflet
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setMapLoaded(true)
      document.body.appendChild(script)
    } else if (window.L) {
      setMapLoaded(true)
    }
  }, [])

  // Initialiser carte
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = window.L

    const map = L.map(mapRef.current, {
      zoomControl: false // On va créer nos propres contrôles
    }).setView([initialCenter.lat, initialCenter.lng], initialZoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Si polygone initial, l'afficher
    if (initialPolygon.length > 0) {
      drawPolygon(map, initialPolygon)
      const normPoly = initialPolygon.map(p => Array.isArray(p) ? { lat: p[0], lng: p[1] } : p)
      const bounds = L.latLngBounds(normPoly.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    // Gestion des clics pour dessiner
    map.on('click', (e) => {
      if (isDrawing && !isEditing) {
        handleMapClick(e.latlng)
      }
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [mapLoaded])

  // Mettre à jour polygone quand points changent
  useEffect(() => {
    if (mapInstanceRef.current && polygonPoints.length > 0) {
      drawPolygon(mapInstanceRef.current, polygonPoints)
      calculateArea(polygonPoints)
      calculateCenter(polygonPoints)
    }
  }, [polygonPoints])

  const handleMapClick = (latlng) => {
    const newPoint = { lat: latlng.lat, lng: latlng.lng }
    setPolygonPoints(prev => [...prev, newPoint])
  }

  const drawPolygon = (map, points) => {
    const L = window.L

    // Supprimer ancien polygone
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current)
    }

    // Supprimer anciens markers
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []

    if (points.length === 0) return

    const normalized = points.map(p => Array.isArray(p) ? { lat: p[0], lng: p[1] } : p)

    // Dessiner points
    normalized.forEach((point, index) => {
      let marker

      if (isEditing) {
        marker = L.marker([point.lat, point.lng], { draggable: true }).addTo(map)

        marker.on('drag', (e) => {
          const newPoints = [...polygonPoints]
          newPoints[index] = { lat: e.latlng.lat, lng: e.latlng.lng }
          setPolygonPoints(newPoints)
        })

        marker.on('contextmenu', (e) => {
          e.originalEvent.preventDefault()
          if (polygonPoints.length > 3) {
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

    // Dessiner polygone si au moins 3 points
    if (normalized.length >= 3) {
      const polygon = L.polygon(
        normalized.map(p => [p.lat, p.lng]),
        {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.2,
          weight: 2
        }
      ).addTo(map)

      polygonRef.current = polygon
    } else if (normalized.length === 2) {
      // Ligne si 2 points
      const polyline = L.polyline(
        normalized.map(p => [p.lat, p.lng]),
        { color: '#3b82f6', weight: 2 }
      ).addTo(map)

      polygonRef.current = polyline
    }
  }

  // Algorithme Shoelace pour calculer surface
  const calculateArea = (points) => {
    if (points.length < 3) {
      setArea(0)
      return
    }

    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].lng * points[j].lat
      area -= points[j].lng * points[i].lat
    }
    area = Math.abs(area) / 2

    // Conversion en hectares
    // 1 degré ≈ 111.32 km au niveau de l'équateur
    // Ajustement pour latitude moyenne du Sénégal (~14°)
    const latFactor = Math.cos((14 * Math.PI) / 180)
    const areaKm2 = area * 111.32 * 111.32 * latFactor
    const areaHectares = areaKm2 * 100

    setArea(areaHectares)
  }

  const calculateCenter = (points) => {
    if (points.length === 0) {
      setCenter(null)
      return
    }

    const sumLat = points.reduce((sum, p) => sum + p.lat, 0)
    const sumLng = points.reduce((sum, p) => sum + p.lng, 0)

    const centerPoint = {
      lat: sumLat / points.length,
      lng: sumLng / points.length
    }

    setCenter(centerPoint)

    // Trouver commune la plus proche
    const commune = findCommuneByGPS(centerPoint.lat, centerPoint.lng)
    setNearestCommune(commune)
  }

  const startDrawing = () => {
    setIsDrawing(true)
    setIsEditing(false)
    setPolygonPoints([])
    setShowInfo(true)
  }

  const startEditing = () => {
    setIsEditing(true)
    setIsDrawing(false)
  }

  const stopDrawingOrEditing = () => {
    setIsDrawing(false)
    setIsEditing(false)
  }

  const clearPolygon = () => {
    if (window.confirm('Effacer le périmètre?')) {
      setPolygonPoints([])
      setArea(0)
      setCenter(null)
      setNearestCommune(null)
      if (polygonRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polygonRef.current)
      }
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker)
        }
      })
      markersRef.current = []
    }
  }

  const undoLastPoint = () => {
    if (polygonPoints.length > 0) {
      setPolygonPoints(prev => prev.slice(0, -1))
    }
  }

  const closePolygon = () => {
    if (polygonPoints.length >= 3) {
      setIsDrawing(false)
      setShowInfo(false)
    }
  }

  const handleSave = () => {
    if (polygonPoints.length < 3) {
      alert('Le périmètre doit avoir au moins 3 points')
      return
    }

    if (onSave) {
      onSave({
        coordinates: polygonPoints,
        center: center,
        area_hectares: parseFloat(area.toFixed(2)),
        nearest_commune: nearestCommune
      })
    }
  }

  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn()
    }
  }

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut()
    }
  }

  const fitBounds = () => {
    if (mapInstanceRef.current && polygonPoints.length > 0) {
      const L = window.L
      const bounds = L.latLngBounds(polygonPoints.map(p => [p.lat, p.lng]))
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Square className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dessiner le Périmètre Agricole</h3>
            <p className="text-xs text-gray-600">
              {isDrawing ? 'Cliquez sur la carte pour ajouter des points' :
               isEditing ? 'Glissez les points pour modifier' :
               'Utilisez les outils ci-dessous'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all"
            title={isFullscreen ? "Réduire" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 p-3 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {/* Dessin */}
          <button
            onClick={startDrawing}
            disabled={isDrawing}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all
              ${isDrawing
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
          >
            <Plus className="w-4 h-4" />
            Nouveau Périmètre
          </button>

          {/* Edition */}
          {polygonPoints.length > 0 && !isDrawing && (
            <button
              onClick={isEditing ? stopDrawingOrEditing : startEditing}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all
                ${isEditing
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-white border-2 border-gray-300 hover:border-red-500 hover:bg-red-50'
                }`}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {isEditing ? 'Arrêter Édition' : 'Modifier'}
            </button>
          )}

          {/* Undo */}
          {isDrawing && polygonPoints.length > 0 && (
            <button
              onClick={undoLastPoint}
              className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 bg-white border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              Annuler Dernier Point
            </button>
          )}

          {/* Fermer polygone */}
          {isDrawing && polygonPoints.length >= 3 && (
            <button
              onClick={closePolygon}
              className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 bg-green-500 text-white hover:bg-green-600 shadow-lg transition-all"
            >
              Terminer
            </button>
          )}

          {/* Effacer */}
          {polygonPoints.length > 0 && !isDrawing && !isEditing && (
            <button
              onClick={clearPolygon}
              className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 bg-white border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Effacer
            </button>
          )}

          {/* Sauvegarder */}
          {polygonPoints.length >= 3 && !isDrawing && !isEditing && (
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg transition-all"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          )}

          {/* Divider */}
          <div className="w-px bg-gray-300 mx-2"></div>

          {/* Zoom */}
          <button
            onClick={zoomIn}
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            title="Zoom +"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={zoomOut}
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            title="Zoom -"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>

          {/* Fit bounds */}
          {polygonPoints.length > 0 && (
            <button
              onClick={fitBounds}
              className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
              title="Centrer sur périmètre"
            >
              <Move className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Info */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`px-3 py-2 rounded-lg border-2 transition-all ${
              showInfo
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white border-gray-300 hover:border-blue-500'
            }`}
            title="Afficher/Masquer infos"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carte */}
      <div
        ref={mapRef}
        className="w-full rounded-2xl border-2 border-gray-300 shadow-lg overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100vh - 250px)' : height }}
      />

      {/* Info Panel */}
      {showInfo && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Points */}
          <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Points du Périmètre
            </p>
            <p className="text-2xl font-bold text-blue-900">{polygonPoints.length}</p>
            {polygonPoints.length > 0 && polygonPoints.length < 3 && (
              <p className="text-xs text-blue-700 mt-1">Minimum 3 points requis</p>
            )}
          </div>

          {/* Surface */}
          <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
            <p className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
              <Square className="w-4 h-4" />
              Surface Calculée
            </p>
            <p className="text-2xl font-bold text-green-900">
              {area > 0 ? area.toFixed(2) : '0.00'} <span className="text-sm">ha</span>
            </p>
            {area > 0 && (
              <p className="text-xs text-green-700 mt-1">
                {(area * 10000).toFixed(0)} m²
              </p>
            )}
          </div>

          {/* Localisation */}
          <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
              <Navigation className="w-4 h-4" />
              Localisation
            </p>
            {nearestCommune ? (
              <div>
                <p className="text-sm font-bold text-purple-900">{nearestCommune.name}</p>
                <p className="text-xs text-purple-700">{nearestCommune.region}</p>
                {nearestCommune.distance && (
                  <p className="text-xs text-purple-600 mt-1">~{nearestCommune.distance} km</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-purple-700">Non défini</p>
            )}
          </div>
        </div>
      )}

      {/* Centre GPS */}
      {center && showInfo && (
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <p className="text-xs font-semibold text-indigo-900 mb-2">Centre du Périmètre (GPS)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-indigo-700">Latitude</p>
              <p className="text-sm font-mono font-bold text-indigo-900">
                {center.lat.toFixed(7)}
              </p>
            </div>
            <div>
              <p className="text-xs text-indigo-700">Longitude</p>
              <p className="text-sm font-mono font-bold text-indigo-900">
                {center.lng.toFixed(7)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {isDrawing && showInfo && (
        <div className="mt-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-xs text-yellow-900">
            <span className="font-semibold">💡 Instructions:</span>
            {' '}Cliquez sur la carte pour ajouter des points. Minimum 3 points pour former un périmètre.
            Cliquez sur "Terminer" pour finaliser le dessin.
          </p>
        </div>
      )}

      {isEditing && showInfo && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-900">
            <span className="font-semibold">✏️ Mode Édition:</span>
            {' '}Glissez les points pour les déplacer. Clic droit sur un point pour le supprimer (minimum 3 points).
          </p>
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  )
}

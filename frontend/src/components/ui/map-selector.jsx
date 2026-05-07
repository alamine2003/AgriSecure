import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Target, Maximize2, Minimize2 } from 'lucide-react'
import { SENEGAL_REGIONS, getAllCommunes, findCommuneByGPS } from '@/data/senegalLocations'

/**
 * Composant Carte Interactive avec Leaflet
 * Permet de cliquer sur la carte pour obtenir les coordonnées GPS
 * Affiche tous les markers des communes du Sénégal
 */
export const MapSelector = ({
  onLocationSelect,
  initialLat = 14.4974,  // Centre Sénégal
  initialLng = -14.4524,
  showCommunes = true,
  height = "500px"
}) => {
  const [selectedPosition, setSelectedPosition] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // Charger Leaflet dynamiquement
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      // Ajouter CSS Leaflet
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      // Ajouter JS Leaflet
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setMapLoaded(true)
      document.body.appendChild(script)
    } else if (window.L) {
      setMapLoaded(true)
    }
  }, [])

  // Initialiser la carte
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = window.L

    // Créer la carte
    const map = L.map(mapRef.current).setView([initialLat, initialLng], 8)

    // Ajouter tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    // Marker position sélectionnée
    let selectedMarker = null
    if (selectedPosition) {
      selectedMarker = L.marker([selectedPosition.lat, selectedPosition.lng], {
        icon: L.divIcon({
          className: 'custom-marker-selected',
          html: '<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })
      }).addTo(map)
    }

    // Ajouter markers des communes si demandé
    if (showCommunes) {
      const allCommunes = getAllCommunes()

      allCommunes.forEach(commune => {
        if (commune.gps) {
          const marker = L.circleMarker([commune.gps.lat, commune.gps.lng], {
            radius: 4,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
          }).addTo(map)

          marker.bindTooltip(`${commune.name}<br/><small>${commune.region}</small>`, {
            direction: 'top',
            offset: [0, -5]
          })

          marker.on('click', () => {
            handleMapClick({ lat: commune.gps.lat, lng: commune.gps.lng }, commune)
          })

          markersRef.current.push(marker)
        }
      })
    }

    // Clic sur la carte
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      handleMapClick({ lat, lng })

      // Mettre à jour marker sélection
      if (selectedMarker) {
        map.removeLayer(selectedMarker)
      }
      selectedMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker-selected',
          html: '<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })
      }).addTo(map)
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [mapLoaded, showCommunes])

  const handleMapClick = (position, commune = null) => {
    setSelectedPosition(position)

    // Si on a cliqué sur une commune connue
    if (commune) {
      if (onLocationSelect) {
        onLocationSelect({
          region: commune.region,
          commune: commune.name,
          department: commune.department,
          gps: position,
          source: 'map-commune-click'
        })
      }
    } else {
      // Sinon, chercher la commune la plus proche
      const nearestCommune = findCommuneByGPS(position.lat, position.lng)

      if (onLocationSelect) {
        onLocationSelect({
          region: nearestCommune?.region || '',
          commune: nearestCommune?.name || '',
          department: nearestCommune?.department || '',
          gps: position,
          source: 'map-click',
          nearest: nearestCommune
        })
      }
    }
  }

  const centerOnSenegal = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([14.4974, -14.4524], 8)
    }
  }

  const centerOnSelection = () => {
    if (mapInstanceRef.current && selectedPosition) {
      mapInstanceRef.current.setView([selectedPosition.lat, selectedPosition.lng], 12)
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Carte Interactive du Sénégal</h3>
            <p className="text-xs text-gray-600">
              Cliquez sur la carte pour sélectionner une position
            </p>
          </div>
        </div>

        {/* Boutons contrôle */}
        <div className="flex gap-2">
          <button
            onClick={centerOnSenegal}
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex items-center gap-2"
            title="Centrer sur le Sénégal"
          >
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Centrer</span>
          </button>
          {selectedPosition && (
            <button
              onClick={centerOnSelection}
              className="px-3 py-2 bg-blue-500 text-white border-2 border-blue-500 rounded-xl hover:bg-blue-600 transition-all duration-300 flex items-center gap-2"
              title="Aller à la sélection"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            title={isFullscreen ? "Réduire" : "Plein écran"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-600" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Carte */}
      <div
        ref={mapRef}
        className="w-full rounded-2xl border-2 border-gray-300 shadow-lg overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}
      />

      {/* Info GPS sélectionnée */}
      {selectedPosition && (
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-5 h-5 text-green-600" />
            <p className="text-sm font-bold text-green-900">Position Sélectionnée</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-green-700 mb-1">Latitude</p>
              <p className="text-lg font-mono font-bold text-green-900">
                {selectedPosition.lat.toFixed(7)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-green-700 mb-1">Longitude</p>
              <p className="text-lg font-mono font-bold text-green-900">
                {selectedPosition.lng.toFixed(7)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      {showCommunes && (
        <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Légende</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Communes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Sélection</span>
            </div>
          </div>
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}

      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }
        .leaflet-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 500;
        }
        .custom-marker-selected {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  )
}

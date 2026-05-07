import React, { useState } from 'react'
import { MapPin, List, Map as MapIcon } from 'lucide-react'
import { MapSelector } from './map-selector'
import { CommuneDropdown } from './commune-dropdown'

/**
 * Sélecteur de localisation avancé
 * 2 modes: Carte Interactive OU Liste Complète
 */
export const LocationSelectorAdvanced = ({
  onLocationSelect,
  initialRegion = "",
  initialCommune = "",
  initialLat = null,
  initialLng = null,
  showGPS = true,
  mode = "map" // "map" ou "list"
}) => {
  const [activeMode, setActiveMode] = useState(mode)
  const [selectedLocation, setSelectedLocation] = useState({
    region: initialRegion,
    commune: initialCommune,
    gps: initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  })

  const handleMapSelection = (data) => {
    setSelectedLocation({
      region: data.region,
      commune: data.commune,
      department: data.department,
      gps: data.gps,
      source: data.source,
      nearest: data.nearest
    })

    if (onLocationSelect) {
      onLocationSelect(data)
    }
  }

  const handleListSelection = (data) => {
    setSelectedLocation({
      region: data.region,
      commune: data.name,
      department: data.department,
      gps: data.gps,
      source: 'list'
    })

    if (onLocationSelect) {
      onLocationSelect({
        region: data.region,
        commune: data.name,
        department: data.department,
        gps: data.gps,
        source: 'list'
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header avec toggle mode */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Sélection de Localisation
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Choisissez une méthode de sélection
          </p>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-2 bg-white p-1 rounded-lg border-2 border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveMode('map')}
            className={`
              px-4 py-2 rounded-md font-medium text-sm
              flex items-center gap-2
              transition-all duration-300
              ${activeMode === 'map'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <MapIcon className="w-4 h-4" />
            Carte
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('list')}
            className={`
              px-4 py-2 rounded-md font-medium text-sm
              flex items-center gap-2
              transition-all duration-300
              ${activeMode === 'list'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <List className="w-4 h-4" />
            Liste
          </button>
        </div>
      </div>

      {/* Mode Carte */}
      {activeMode === 'map' && (
        <div className="animate-in slide-in-from-top duration-300">
          <MapSelector
            onLocationSelect={handleMapSelection}
            initialLat={selectedLocation.gps?.lat || 14.4974}
            initialLng={selectedLocation.gps?.lng || -14.4524}
            showCommunes={true}
            height="500px"
          />
        </div>
      )}

      {/* Mode Liste */}
      {activeMode === 'list' && (
        <div className="animate-in slide-in-from-top duration-300">
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Toutes les Communes du Sénégal
            </label>
            <CommuneDropdown
              value={selectedLocation.commune}
              onCommuneSelect={handleListSelection}
              showGPS={showGPS}
              placeholder="Sélectionnez parmi 200+ communes..."
              required
            />
          </div>
        </div>
      )}

      {/* Résumé sélection */}
      {selectedLocation.commune && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Localisation Sélectionnée
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-green-700">Commune</p>
                  <p className="text-sm font-bold text-green-900">{selectedLocation.commune}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Région</p>
                  <p className="text-sm font-bold text-green-900">{selectedLocation.region}</p>
                </div>
                {selectedLocation.gps && showGPS && (
                  <>
                    <div>
                      <p className="text-xs text-green-700">Latitude</p>
                      <p className="text-xs font-mono font-bold text-green-900">
                        {selectedLocation.gps.lat.toFixed(7)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700">Longitude</p>
                      <p className="text-xs font-mono font-bold text-green-900">
                        {selectedLocation.gps.lng.toFixed(7)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {selectedLocation.source && (
                <p className="text-xs text-green-600 mt-2">
                  Source: {
                    selectedLocation.source === 'map-click' ? 'Clic sur carte' :
                    selectedLocation.source === 'map-commune-click' ? 'Sélection commune sur carte' :
                    selectedLocation.source === 'list' ? 'Liste déroulante' :
                    selectedLocation.source
                  }
                </p>
              )}
              {selectedLocation.nearest && selectedLocation.source === 'map-click' && (
                <p className="text-xs text-green-600 mt-1">
                  Commune la plus proche: {selectedLocation.nearest.name} ({selectedLocation.nearest.distance} km)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-900">
          <span className="font-semibold">💡 Astuce:</span>
          {activeMode === 'map'
            ? " Cliquez directement sur la carte pour obtenir les coordonnées GPS. Les points bleus représentent les communes."
            : " Recherchez par nom de commune, département ou région. Toutes les 200+ communes sont disponibles."
          }
        </p>
      </div>
    </div>
  )
}

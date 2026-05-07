import React, { useState, useEffect } from 'react'
import { MapPin, Search, Navigation, ChevronDown } from 'lucide-react'
import { SENEGAL_REGIONS, searchCommune, getCommunesByRegion } from '@/data/senegalLocations'

export const LocationSelector = ({
  onLocationSelect,
  initialRegion = "",
  initialCommune = "",
  showGPS = false
}) => {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion)
  const [selectedCommune, setSelectedCommune] = useState(initialCommune)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [communes, setCommunes] = useState([])

  useEffect(() => {
    if (selectedRegion) {
      const regionCommunes = getCommunesByRegion(selectedRegion)
      setCommunes(regionCommunes)
    } else {
      setCommunes([])
    }
  }, [selectedRegion])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchCommune(searchQuery)
      setSearchResults(results)
      setShowResults(true)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery])

  const handleRegionChange = (e) => {
    const region = e.target.value
    setSelectedRegion(region)
    setSelectedCommune("")
    setSearchQuery("")

    const regionData = SENEGAL_REGIONS.find(r => r.name === region)
    if (onLocationSelect) {
      onLocationSelect({
        region,
        commune: "",
        gps: regionData?.gps || null
      })
    }
  }

  const handleCommuneChange = (e) => {
    const communeName = e.target.value
    setSelectedCommune(communeName)

    const commune = communes.find(c => c.name === communeName)
    if (onLocationSelect && commune) {
      onLocationSelect({
        region: selectedRegion,
        commune: communeName,
        department: commune.department,
        gps: commune.gps
      })
    }
  }

  const handleSearchSelect = (result) => {
    setSelectedRegion(result.region)
    setSelectedCommune(result.name)
    setSearchQuery(result.name)
    setShowResults(false)

    if (onLocationSelect) {
      onLocationSelect({
        region: result.region,
        commune: result.name,
        department: result.department,
        gps: result.gps
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Recherche Rapide */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Recherche Rapide d'Adresse
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            placeholder="Tapez une commune, localité ou département..."
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                     hover:border-gray-400 hover:shadow-md
                     transition-all duration-300 outline-none"
          />
        </div>

        {/* Résultats de recherche */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar">
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-500 px-3 py-2">
                {searchResults.length} résultat(s) trouvé(s)
              </p>
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchSelect(result)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{result.name}</p>
                      <p className="text-xs text-gray-500">
                        {result.department}, {result.region}
                      </p>
                      {result.gps && showGPS && (
                        <p className="text-xs text-blue-600 font-mono mt-1">
                          {result.gps.lat.toFixed(4)}, {result.gps.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Séparateur */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500 font-medium">ou sélection manuelle</span>
        </div>
      </div>

      {/* Sélection Région */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Région *
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600 pointer-events-none" />
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            required
            className="w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-300 rounded-xl
                     appearance-none cursor-pointer
                     focus:border-green-500 focus:ring-2 focus:ring-green-500/20
                     hover:border-gray-400 hover:shadow-md
                     transition-all duration-300 outline-none
                     font-medium text-gray-900"
          >
            <option value="">Sélectionnez une région</option>
            {SENEGAL_REGIONS.map((region) => (
              <option key={region.code} value={region.name}>
                {region.name} ({region.code})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Sélection Commune/Localité */}
      {selectedRegion && (
        <div className="animate-in slide-in-from-top duration-300">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Commune / Localité *
          </label>
          <div className="relative">
            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 pointer-events-none" />
            <select
              value={selectedCommune}
              onChange={handleCommuneChange}
              required
              className="w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-300 rounded-xl
                       appearance-none cursor-pointer
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       hover:border-gray-400 hover:shadow-md
                       transition-all duration-300 outline-none
                       font-medium text-gray-900"
            >
              <option value="">Sélectionnez une commune</option>
              {communes.map((commune, index) => (
                <option key={index} value={commune.name}>
                  {commune.name} ({commune.department})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* GPS Info */}
          {selectedCommune && showGPS && (() => {
            const commune = communes.find(c => c.name === selectedCommune)
            return commune?.gps ? (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Coordonnées GPS
                </p>
                <p className="text-sm font-mono font-bold text-blue-800">
                  {commune.gps.lat.toFixed(6)}, {commune.gps.lng.toFixed(6)}
                </p>
              </div>
            ) : null
          })()}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

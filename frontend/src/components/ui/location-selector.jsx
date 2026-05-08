import { useState, useEffect } from 'react'
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
      onLocationSelect({ region, commune: "", gps: regionData?.gps || null })
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
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          Recherche rapide
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            placeholder="Tapez une commune ou localité..."
            className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-amber-100 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white/[0.04] border border-white/[0.08] rounded-xl shadow-2xl max-h-72 overflow-y-auto">
            <div className="p-2">
              <p className="text-[11px] font-medium text-muted-foreground px-3 py-2">
                {searchResults.length} résultat(s)
              </p>
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchSelect(result)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-100">{result.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {result.department}, {result.region}
                      </p>
                      {result.gps && showGPS && (
                        <p className="text-[11px] text-primary font-mono mt-0.5">
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
          <div className="w-full border-t border-white/[0.08]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-background text-muted-foreground">ou sélection manuelle</span>
        </div>
      </div>

      {/* Sélection Région */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          Région *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            required
            className="w-full pl-10 pr-10 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl appearance-none cursor-pointer text-sm text-amber-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all [color-scheme:dark]"
          >
            <option value="" className="text-black bg-white">Sélectionnez une région</option>
            {SENEGAL_REGIONS.map((region) => (
              <option key={region.code} value={region.name} className="text-black bg-white">
                {region.name} ({region.code})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Sélection Commune */}
      {selectedRegion && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Commune / Localité *
          </label>
          <div className="relative">
            <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
            <select
              value={selectedCommune}
              onChange={handleCommuneChange}
              required
              className="w-full pl-10 pr-10 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl appearance-none cursor-pointer text-sm text-amber-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all [color-scheme:dark]"
            >
              <option value="" className="text-black bg-white">Sélectionnez une commune</option>
              {communes.map((commune, index) => (
                <option key={index} value={commune.name} className="text-black bg-white">
                  {commune.name} ({commune.department})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {selectedCommune && showGPS && (() => {
            const commune = communes.find(c => c.name === selectedCommune)
            return commune?.gps ? (
              <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-[11px] font-medium text-primary mb-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Coordonnées GPS
                </p>
                <p className="text-sm font-mono font-bold text-amber-100">
                  {commune.gps.lat.toFixed(6)}, {commune.gps.lng.toFixed(6)}
                </p>
              </div>
            ) : null
          })()}
        </div>
      )}
    </div>
  )
}

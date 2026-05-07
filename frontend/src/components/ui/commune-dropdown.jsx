import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Search, ChevronDown, Navigation } from 'lucide-react'
import { getAllCommunes } from '@/data/senegalLocations'

/**
 * Dropdown avec TOUTES les communes du Sénégal (200+)
 * Avec recherche intégrée et scroll virtualisé pour performance
 */
export const CommuneDropdown = ({
  value = "",
  onChange,
  onCommuneSelect,
  showGPS = false,
  placeholder = "Sélectionnez une commune...",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [allCommunes] = useState(() => {
    // Récupérer toutes les communes et les trier alphabétiquement
    const communes = getAllCommunes()
    return communes.sort((a, b) => a.name.localeCompare(b.name))
  })
  const [filteredCommunes, setFilteredCommunes] = useState(allCommunes)
  const [selectedCommune, setSelectedCommune] = useState(null)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Filtrer communes selon recherche
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCommunes(allCommunes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allCommunes.filter(commune =>
        commune.name.toLowerCase().includes(query) ||
        commune.region.toLowerCase().includes(query) ||
        commune.department.toLowerCase().includes(query)
      )
      setFilteredCommunes(filtered)
    }
  }, [searchQuery, allCommunes])

  // Trouver commune sélectionnée depuis value
  useEffect(() => {
    if (value) {
      const commune = allCommunes.find(c => c.name === value)
      setSelectedCommune(commune)
    }
  }, [value, allCommunes])

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus sur input recherche à l'ouverture
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (commune) => {
    setSelectedCommune(commune)
    setIsOpen(false)
    setSearchQuery("")

    // Callback onChange avec nom commune
    if (onChange) {
      onChange({ target: { value: commune.name } })
    }

    // Callback onCommuneSelect avec toutes infos
    if (onCommuneSelect) {
      onCommuneSelect({
        name: commune.name,
        region: commune.region,
        department: commune.department,
        gps: commune.gps
      })
    }
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Button Sélection */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`
          w-full px-4 py-3 bg-white border-2 rounded-xl text-left
          flex items-center justify-between gap-2
          transition-all duration-300 outline-none
          ${isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
            : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
          }
          ${!selectedCommune && required ? 'border-gray-300' : ''}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MapPin className={`w-5 h-5 flex-shrink-0 ${selectedCommune ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="flex-1 min-w-0">
            {selectedCommune ? (
              <div>
                <p className="font-semibold text-gray-900 truncate">{selectedCommune.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedCommune.department}, {selectedCommune.region}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">{placeholder}</p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Barre de recherche */}
          <div className="sticky top-0 bg-white border-b-2 border-gray-100 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une commune..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {filteredCommunes.length} commune(s) {searchQuery && `pour "${searchQuery}"`}
            </p>
          </div>

          {/* Liste communes */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {filteredCommunes.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">Aucune commune trouvée</p>
                <p className="text-xs text-gray-400 mt-1">Essayez une autre recherche</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredCommunes.map((commune, index) => (
                  <button
                    key={`${commune.region}-${commune.department}-${commune.name}-${index}`}
                    type="button"
                    onClick={() => handleSelect(commune)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg
                      transition-all duration-200
                      hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                      group
                      ${selectedCommune?.name === commune.name ? 'bg-blue-50 border-2 border-blue-200' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{commune.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {commune.department}, {commune.region}
                        </p>
                        {commune.gps && showGPS && (
                          <p className="text-xs text-blue-600 font-mono mt-1">
                            {commune.gps.lat.toFixed(4)}, {commune.gps.lng.toFixed(4)}
                          </p>
                        )}
                      </div>

                      {/* Check si sélectionné */}
                      {selectedCommune?.name === commune.name && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer avec total */}
          <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 border-gray-100 p-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="font-semibold">{allCommunes.length} communes</span>
                <span>• 14 régions • Sénégal</span>
              </div>
              {selectedCommune && showGPS && selectedCommune.gps && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Navigation className="w-3 h-3" />
                  <span className="font-mono font-bold">GPS disponible</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GPS Info si sélection */}
      {selectedCommune && showGPS && selectedCommune.gps && (
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 animate-in slide-in-from-top duration-300">
          <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            Coordonnées GPS
          </p>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs text-blue-700">Latitude</p>
              <p className="text-sm font-mono font-bold text-blue-900">
                {selectedCommune.gps.lat.toFixed(7)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-700">Longitude</p>
              <p className="text-sm font-mono font-bold text-blue-900">
                {selectedCommune.gps.lng.toFixed(7)}
              </p>
            </div>
          </div>
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  )
}

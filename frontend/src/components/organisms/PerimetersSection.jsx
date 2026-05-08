import React, { useState } from 'react'
import { SectionHeader } from '../atoms/SectionHeader'
import { EmptyState } from '../atoms/EmptyState'
import { LoadingSpinner } from '../atoms/LoadingSpinner'
import { PerimeterCard } from '../molecules/PerimeterCard'
import { Map, MapPinned, Plus, Layers } from 'lucide-react'
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet'

const PerimeterMiniMap = ({ perimeters }) => {
  const validPerimeters = perimeters.filter(
    (p) => p.coordinates && p.coordinates.length >= 3
  )

  if (validPerimeters.length === 0) return null

  const allPoints = validPerimeters.flatMap((p) =>
    p.coordinates.map((c) => [c[1] || c[0], c[0] || c[1]])
  )
  const avgLat = allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length
  const avgLng = allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 h-[200px] mb-4">
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {validPerimeters.map((perimeter) => {
          const positions = perimeter.coordinates.map((c) => [
            c[1] || c[0],
            c[0] || c[1],
          ])
          return (
            <Polygon
              key={perimeter.id}
              positions={positions}
              pathOptions={{
                color: perimeter.is_active ? '#4f46e5' : '#9ca3af',
                fillColor: perimeter.is_active ? '#4f46e5' : '#9ca3af',
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Tooltip>
                {perimeter.name} - {perimeter.area_hectares?.toFixed(2) || '?'} ha
              </Tooltip>
            </Polygon>
          )
        })}
      </MapContainer>
    </div>
  )
}

export const PerimetersSection = ({
  perimeters,
  isLoading,
  onEdit,
  onDelete,
  onNew
}) => {
  const [showMap, setShowMap] = useState(true)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4">
        <SectionHeader
          title="Mes Perimetres"
          icon={Map}
          count={perimeters.length}
        />
        {perimeters.length > 0 && (
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            {showMap ? 'Liste' : 'Carte'}
          </button>
        )}
      </div>

      <div className="p-5 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner icon={Map} text="Chargement des perimetres..." />
        ) : perimeters.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Aucun perimetre"
            description="Dessinez votre premier perimetre agricole"
            actionLabel="Creer un Perimetre"
            actionIcon={Plus}
            onAction={onNew}
          />
        ) : (
          <>
            {showMap && <PerimeterMiniMap perimeters={perimeters} />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {perimeters.map((perimeter) => (
                <PerimeterCard
                  key={perimeter.id}
                  perimeter={perimeter}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
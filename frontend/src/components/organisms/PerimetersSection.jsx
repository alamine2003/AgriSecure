import React from 'react'
import { SectionHeader } from '../atoms/SectionHeader'
import { EmptyState } from '../atoms/EmptyState'
import { LoadingSpinner } from '../atoms/LoadingSpinner'
import { PerimeterCard } from '../molecules/PerimeterCard'
import { Map, MapPinned, Plus } from 'lucide-react'

export const PerimetersSection = ({
  perimeters,
  isLoading,
  onEdit,
  onDelete,
  onNew
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <SectionHeader
        title="Mes Périmètres"
        icon={Map}
        count={perimeters.length}
      />

      <div className="p-5 h-[300px] overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner icon={Map} text="Chargement des périmètres..." />
        ) : perimeters.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Aucun périmètre"
            description="Dessinez votre premier périmètre agricole"
            actionLabel="Créer un Périmètre"
            actionIcon={Plus}
            onAction={onNew}
          />
        ) : (
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
        )}
      </div>
    </div>
  )
}

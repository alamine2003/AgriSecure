import { SectionHeader } from '../atoms/SectionHeader'
import { EmptyState } from '../atoms/EmptyState'
import { LoadingSpinner } from '../atoms/LoadingSpinner'
import { PerimeterCard } from '../molecules/PerimeterCard'
import { Map, MapPinned, Plus } from 'lucide-react'

export const PerimetersSection = ({ perimeters, isLoading, onEdit, onDelete, onNew }) => {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <SectionHeader title="Mes Périmètres" icon={Map} count={perimeters.length} />

      <div className="p-5 h-[320px] overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner icon={Map} text="Chargement des périmètres..." />
        ) : perimeters.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Aucun périmètre"
            description="Dessinez votre premier périmètre agricole sur la carte"
            actionLabel="Créer un Périmètre"
            actionIcon={Plus}
            onAction={onNew}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

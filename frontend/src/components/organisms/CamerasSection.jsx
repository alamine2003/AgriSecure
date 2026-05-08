import { SectionHeader } from '../atoms/SectionHeader'
import { EmptyState } from '../atoms/EmptyState'
import { LoadingSpinner } from '../atoms/LoadingSpinner'
import { CameraCard } from '../molecules/CameraCard'
import { Camera } from 'lucide-react'

export const CamerasSection = ({ cameras, isLoading, onView, activeCameras }) => {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <SectionHeader title="Mes Caméras" icon={Camera} count={`${activeCameras} actives`} />

      <div className="p-5 h-[320px] overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner icon={Camera} text="Chargement des caméras..." />
        ) : cameras.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Aucune caméra"
            description="En attente d'installation technique"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cameras.map((camera) => (
              <CameraCard key={camera.id} camera={camera} onView={onView} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

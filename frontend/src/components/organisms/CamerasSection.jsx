import React from 'react'
import { SectionHeader } from '../atoms/SectionHeader'
import { EmptyState } from '../atoms/EmptyState'
import { LoadingSpinner } from '../atoms/LoadingSpinner'
import { CameraCard } from '../molecules/CameraCard'
import { Camera } from 'lucide-react'

export const CamerasSection = ({ cameras, isLoading, onView, activeCameras }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <SectionHeader
        title="Mes Caméras"
        icon={Camera}
        count={`${activeCameras} actives`}
      />

      <div className="p-5 h-[300px] overflow-y-auto">
        {isLoading ? (
          <LoadingSpinner icon={Camera} text="Chargement des caméras..." />
        ) : cameras.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Aucune caméra"
            description="En attente d'installation technique"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                onView={onView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

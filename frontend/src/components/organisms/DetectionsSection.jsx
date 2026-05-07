import React from 'react'
import { SectionHeader } from '../atoms/SectionHeader'
import { EmptyState } from '../atoms/EmptyState'
import { LoadingSpinner } from '../atoms/LoadingSpinner'
import { DetectionItem } from '../molecules/DetectionItem'
import { Activity, Eye } from 'lucide-react'

export const DetectionsSection = ({ detections, isLoading, formatDate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <SectionHeader
        title="Détections"
        icon={Activity}
        count={detections.length}
      />

      <div className="p-4 h-[300px] overflow-y-auto space-y-2">
        {isLoading ? (
          <LoadingSpinner icon={Activity} text="Chargement..." size="sm" />
        ) : detections.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="Aucune détection"
            description="Les détections apparaîtront ici en temps réel"
          />
        ) : (
          detections.map((detection) => (
            <DetectionItem
              key={detection.id}
              detection={detection}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  )
}

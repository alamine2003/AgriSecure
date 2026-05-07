import React from 'react'
import { AlertTriangle, Zap, CheckCircle, Camera } from 'lucide-react'

export const DetectionItem = ({ detection, formatDate }) => {
  const dangerConfig = {
    HIGH: { label: 'Élevé', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', icon: AlertTriangle },
    MEDIUM: { label: 'Moyen', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', icon: Zap },
    LOW: { label: 'Faible', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', icon: CheckCircle },
  }

  const config = dangerConfig[detection.danger_level] || dangerConfig.LOW
  const DangerIcon = config.icon

  return (
    <div className="p-3 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bg}`}>
          <DangerIcon className={`w-3 h-3 ${config.text}`} />
          <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
        </div>
        <span className="text-xs text-gray-400">{formatDate(detection.detected_at)}</span>
      </div>

      <h5 className="font-semibold text-sm text-gray-900 mb-1.5">{detection.label}</h5>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Camera className="w-3 h-3" />
          <span className="truncate">{detection.camera_name || 'Caméra'}</span>
        </div>
        <span className="text-xs font-semibold text-gray-700">
          {(detection.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

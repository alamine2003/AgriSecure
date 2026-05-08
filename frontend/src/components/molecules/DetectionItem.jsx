import { AlertTriangle, Zap, CheckCircle, Camera } from 'lucide-react'

export const DetectionItem = ({ detection, formatDate }) => {
  const dangerConfig = {
    HIGH: { label: 'Élevé', bg: 'bg-destructive/10', text: 'text-destructive', icon: AlertTriangle, gradient: 'from-rose-500 to-red-600' },
    MEDIUM: { label: 'Moyen', bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Zap, gradient: 'from-amber-500 to-orange-600' },
    LOW: { label: 'Faible', bg: 'bg-amber-500/10', text: 'text-amber-500', icon: CheckCircle, gradient: 'from-amber-500 to-orange-600' },
  }

  const config = dangerConfig[detection.danger_level] || dangerConfig.LOW
  const DangerIcon = config.icon

  return (
    <div className="p-3 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bg}`}>
          <DangerIcon className={`w-3 h-3 ${config.text}`} />
          <span className={`text-[11px] font-semibold ${config.text}`}>{config.label}</span>
        </div>
        <span className="text-[11px] text-muted-foreground">{formatDate(detection.detected_at)}</span>
      </div>

      <h5 className="font-semibold text-sm text-foreground mb-2">
        {detection.detection_type || detection.label}
      </h5>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Camera className="w-3 h-3" />
          <span className="truncate">{detection.camera_name || 'Caméra'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
              style={{ width: `${(detection.confidence * 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-foreground">
            {(detection.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}

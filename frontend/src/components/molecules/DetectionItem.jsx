import { AlertTriangle, Zap, CheckCircle, Camera, ThumbsDown, RotateCcw } from 'lucide-react'

export const DetectionItem = ({ detection, formatDate, onFalsePositive }) => {
  const dangerConfig = {
    HIGH: { label: 'Élevé', bg: 'bg-destructive/10', text: 'text-destructive', icon: AlertTriangle, gradient: 'from-rose-500 to-red-600' },
    MEDIUM: { label: 'Moyen', bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Zap, gradient: 'from-amber-500 to-orange-600' },
    LOW: { label: 'Faible', bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle, gradient: 'from-emerald-500 to-green-600' },
  }

  const config = dangerConfig[detection.danger_level] || dangerConfig.LOW
  const DangerIcon = config.icon
  const isFP = detection.is_false_positive

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      isFP
        ? 'border-border/30 bg-muted/30 opacity-60'
        : 'border-border/50 bg-card hover:border-primary/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bg}`}>
          <DangerIcon className={`w-3 h-3 ${config.text}`} />
          <span className={`text-[11px] font-semibold ${config.text}`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isFP && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Faux positif
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">{formatDate(detection.detected_at)}</span>
        </div>
      </div>

      <h5 className="font-semibold text-sm text-foreground mb-2 capitalize">
        {detection.label}
      </h5>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Camera className="w-3 h-3" />
          <span className="truncate">{detection.camera_name || 'Caméra'}</span>
        </div>
        <div className="flex items-center gap-2">
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
          {onFalsePositive && (
            <button
              onClick={() => onFalsePositive(detection.id, !isFP)}
              title={isFP ? 'Annuler le faux positif' : 'Marquer comme faux positif'}
              className={`p-1 rounded transition-colors ${
                isFP
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
              }`}
            >
              {isFP
                ? <RotateCcw className="w-3 h-3" />
                : <ThumbsDown className="w-3 h-3" />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

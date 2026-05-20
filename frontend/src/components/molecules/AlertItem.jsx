import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'

const SEVERITY_LABELS = { HIGH: 'Élevé', MEDIUM: 'Moyen', LOW: 'Faible' }

export const AlertItem = ({ alert, formatDate, onResolve }) => {
  const isNew = !alert.is_read
  const isResolved = !!alert.resolved_at
  const level = alert.severity || alert.detection_detail?.danger_level

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      isResolved
        ? 'bg-muted/20 border-border/30 opacity-70'
        : isNew
          ? 'bg-destructive/5 border-destructive/20 cursor-pointer hover:border-destructive/40'
          : 'bg-card border-border/50 cursor-pointer hover:border-primary/20'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isResolved
            ? 'bg-emerald-500/10'
            : isNew
              ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20'
              : 'bg-muted'
        }`}>
          {isResolved
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : isNew
              ? <AlertTriangle className="w-4 h-4 text-white" />
              : <Bell className="w-4 h-4 text-muted-foreground" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {alert.title || alert.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {isResolved ? (
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
                Résolue
              </span>
            ) : (
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                level === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                'bg-primary/10 text-primary'
              }`}>
                {SEVERITY_LABELS[level] || level}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">{formatDate(alert.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isNew && !isResolved && (
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          )}
          {!isResolved && onResolve && (
            <button
              onClick={(e) => { e.stopPropagation(); onResolve(alert.id) }}
              title="Marquer comme résolue"
              className="text-[10px] text-muted-foreground hover:text-emerald-500 px-1.5 py-0.5 rounded hover:bg-emerald-500/10 transition-colors mt-1"
            >
              Résoudre
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

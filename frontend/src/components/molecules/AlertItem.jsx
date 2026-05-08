import { AlertTriangle, Bell } from 'lucide-react'

export const AlertItem = ({ alert, formatDate }) => {
  const isNew = alert.status === 'NEW' || !alert.is_read

  return (
    <div className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-primary/20 ${
      isNew
        ? 'bg-destructive/5 border-destructive/20'
        : 'bg-card border-border/50'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isNew
            ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20'
            : 'bg-muted'
        }`}>
          {isNew ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <Bell className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {alert.title || alert.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
              alert.severity === 'HIGH' ? 'bg-destructive/10 text-destructive' :
              alert.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
              'bg-primary/10 text-primary'
            }`}>
              {alert.severity}
            </span>
            <span className="text-[11px] text-muted-foreground">{formatDate(alert.created_at)}</span>
          </div>
        </div>

        {isNew && (
          <span className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0 mt-1.5 animate-pulse" />
        )}
      </div>
    </div>
  )
}

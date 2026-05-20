import { Wifi, WifiOff, MapPin, Eye } from 'lucide-react'

export const CameraCard = ({ camera, onView }) => {
  const isOnline = camera.status === 'online' || camera.is_active

  return (
    <div className="group rounded-2xl border border-border/50 p-4 hover:border-primary/30 transition-all duration-300 bg-card">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
          isOnline
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
            : 'bg-muted'
        }`}>
          {isOnline ? (
            <Wifi className="w-5 h-5 text-white" />
          ) : (
            <WifiOff className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {camera.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
            <span className={`text-xs font-medium ${isOnline ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </div>

      {camera.location && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{camera.location}</span>
        </div>
      )}

      <button
        onClick={() => onView(camera.id)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        Voir le flux
      </button>
    </div>
  )
}

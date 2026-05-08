import { Target, Edit2, Trash2, MapPin } from 'lucide-react'

export const PerimeterCard = ({ perimeter, onEdit, onDelete }) => {
  return (
    <div className="group rounded-2xl border border-border/50 p-4 hover:border-primary/30 transition-all duration-300 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {perimeter.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {perimeter.commune || 'Non localisé'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Target className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Surface</span>
          <span className="font-semibold text-foreground">
            {perimeter.area_hectares?.toFixed(2) || '0.00'} ha
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Points GPS</span>
          <span className="font-mono text-foreground/80">
            {perimeter.coordinates?.length || 0}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(perimeter)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Modifier
        </button>
        <button
          onClick={() => onDelete(perimeter.id)}
          className="flex items-center justify-center px-3 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

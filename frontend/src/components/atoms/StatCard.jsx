import { cn } from '@/lib/utils'

export const StatCard = ({ label, value, subtitle, icon: Icon, gradient, onClick }) => {
  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl p-5 border border-border/50 hover:border-border transition-all duration-300 overflow-hidden",
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform", gradient)}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate">{label}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{value}</span>
          </div>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

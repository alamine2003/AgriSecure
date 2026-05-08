import { Button } from '@/components/ui/button'
import { Plus, Eye, Sparkles, Activity } from 'lucide-react'

export const DashboardLayout = ({ children, onNewPerimeter, onSurveillance }) => {
  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-card" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs font-medium text-primary mb-3">
              <Activity className="w-3 h-3 animate-pulse" />
              Temps réel
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Mon Exploitation</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vue d'ensemble de vos périmètres, caméras et alertes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onNewPerimeter}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau périmètre
            </Button>
            <Button
              onClick={onSurveillance}
              variant="outline"
              className="rounded-xl border-border hover:bg-primary/5 hover:border-primary/30"
            >
              <Eye className="w-4 h-4 mr-2" />
              Surveillance live
            </Button>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

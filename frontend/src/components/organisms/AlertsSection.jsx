import { SectionHeader } from '../atoms/SectionHeader'
import { EmptyState } from '../atoms/EmptyState'
import { LoadingSpinner } from '../atoms/LoadingSpinner'
import { AlertItem } from '../molecules/AlertItem'
import { AlertTriangle, Shield } from 'lucide-react'

export const AlertsSection = ({ alerts, isLoading, unreadCount, formatDate }) => {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <SectionHeader title="Alertes" icon={AlertTriangle} count={unreadCount} />

      <div className="p-4 h-[320px] overflow-y-auto space-y-2">
        {isLoading ? (
          <LoadingSpinner icon={AlertTriangle} text="Chargement..." size="sm" />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Aucune alerte"
            description="Tout est calme pour le moment"
          />
        ) : (
          alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} formatDate={formatDate} />
          ))
        )}
      </div>
    </div>
  )
}

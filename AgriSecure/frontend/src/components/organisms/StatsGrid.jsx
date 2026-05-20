import { StatCard } from '../atoms/StatCard'
import { Camera, Map, AlertTriangle, Shield } from 'lucide-react'

export const StatsGrid = ({ stats }) => {
  const statsConfig = [
    {
      label: 'Caméras Actives',
      value: stats.activeCameras,
      subtitle: `sur ${stats.totalCameras} caméra(s)`,
      icon: Camera,
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Surface Totale',
      value: `${parseFloat(stats.totalArea || 0).toFixed(1)} ha`,
      subtitle: `${stats.perimeterCount} périmètre(s)`,
      icon: Map,
      gradient: 'from-sky-500 to-blue-600'
    },
    {
      label: 'Alertes Non Lues',
      value: stats.unreadAlerts,
      subtitle: `sur ${stats.totalAlerts} alerte(s)`,
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-600'
    },
    {
      label: 'Danger Élevé',
      value: stats.highDangerDetections,
      subtitle: `sur ${stats.totalDetections} détection(s)`,
      icon: Shield,
      gradient: 'from-amber-500 to-orange-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

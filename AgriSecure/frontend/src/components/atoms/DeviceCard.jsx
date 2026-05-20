import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

/**
 * Composant Atomique - Device Card
 * Card device avec switch ON/OFF
 */
export const DeviceCard = ({
  icon: Icon,
  name,
  status,
  isActive,
  onToggle,
  iconColor = 'blue'
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500',
  }

  return (
    <Card className="p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 ${colors[iconColor]} rounded-xl`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {!isActive && (
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </div>

      <h4 className="font-semibold text-gray-900 mb-1">{name}</h4>
      <Badge variant="secondary" className="text-xs mb-3">
        {status}
      </Badge>

      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-gray-600 font-medium">
          {isActive ? 'ON' : 'OFF'}
        </span>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-blue-500"
        />
      </div>
    </Card>
  )
}

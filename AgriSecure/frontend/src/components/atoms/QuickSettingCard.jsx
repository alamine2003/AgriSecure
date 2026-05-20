import React from 'react'
import { Card } from '@/components/ui/card'
import { ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Composant Atomique - Quick Setting Card
 * Card de réglage rapide avec valeur et boutons +/-
 */
export const QuickSettingCard = ({
  icon: Icon,
  label,
  value,
  unit,
  onIncrease,
  onDecrease,
  color = 'orange'
}) => {
  const colors = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  }

  return (
    <Card className="p-3 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 ${colors[color]} rounded-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-lg font-bold text-gray-900">
            {value}
            <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-1">
        <button
          onClick={onIncrease}
          className="flex-1 flex items-center justify-center p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          <ChevronUp className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={onDecrease}
          className="flex-1 flex items-center justify-center p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </Card>
  )
}

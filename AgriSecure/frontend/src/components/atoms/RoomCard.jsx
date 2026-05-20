import React from 'react'
import { Card } from '@/components/ui/card'

/**
 * Composant Atomique - Room Card
 * Card colorée avec icône, titre et compteur
 */
export const RoomCard = ({
  icon: Icon,
  title,
  count,
  label,
  color = 'blue',
  onClick
}) => {
  const colors = {
    blue: 'from-blue-500 to-indigo-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
    cyan: 'from-cyan-500 to-blue-500',
    green: 'from-emerald-500 to-teal-500',
  }

  return (
    <Card
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} text-white p-4 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{count}</span>
        <span className="text-sm opacity-90">{label}</span>
      </div>
    </Card>
  )
}

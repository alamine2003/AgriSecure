import React from 'react'

export const StatCard = ({
  label,
  value,
  subtitle,
  icon: Icon,
  gradient,
  onClick
}) => {
  const colorMap = {
    'from-emerald-500 to-teal-600': { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-500' },
    'from-blue-500 to-indigo-600': { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-500' },
    'from-red-500 to-rose-600': { bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'bg-rose-500' },
    'from-orange-500 to-red-600': { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-500' },
  }

  const colors = colorMap[gradient] || { bg: 'bg-gray-50', text: 'text-gray-600', iconBg: 'bg-gray-500' }

  return (
    <div
      className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

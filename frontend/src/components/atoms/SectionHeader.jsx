import React from 'react'
import { Badge } from '@/components/ui/badge'

export const SectionHeader = ({
  title,
  icon: Icon,
  count,
  action,
  gradient = 'from-gray-50 to-gray-100'
}) => {
  return (
    <div className="flex items-center justify-between p-5 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-indigo-600" />
          </div>
        )}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {count !== undefined && (
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs font-medium">
            {count}
          </Badge>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

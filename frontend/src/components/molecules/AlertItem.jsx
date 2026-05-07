import React from 'react'
import { AlertTriangle } from 'lucide-react'

export const AlertItem = ({ alert, formatDate }) => {
  return (
    <div
      className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
        alert.is_read
          ? 'bg-gray-50 border-gray-100'
          : 'bg-rose-50/50 border-rose-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          alert.is_read ? 'bg-gray-200' : 'bg-red-500'
        }`}>
          <AlertTriangle className={`w-4 h-4 ${alert.is_read ? 'text-gray-500' : 'text-white'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {alert.message}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(alert.created_at)}</p>
        </div>

        {!alert.is_read && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></span>
        )}
      </div>
    </div>
  )
}

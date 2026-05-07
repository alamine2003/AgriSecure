import React from 'react'
import { Wifi, WifiOff, MapPin, Eye } from 'lucide-react'

export const CameraCard = ({ camera, onView }) => {
  return (
    <div className="rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200 bg-gray-50/50">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${camera.is_active ? 'bg-emerald-50' : 'bg-gray-100'}`}>
          {camera.is_active ? (
            <Wifi className="w-5 h-5 text-emerald-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 truncate">
            {camera.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${camera.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
            <span className={`text-xs font-medium ${camera.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
              {camera.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {camera.location && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{camera.location}</span>
        </div>
      )}

      <button
        onClick={() => onView(camera.id)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        Voir le flux
      </button>
    </div>
  )
}

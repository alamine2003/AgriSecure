import React from 'react'
import { Target, Edit2, Trash2 } from 'lucide-react'

export const PerimeterCard = ({ perimeter, onEdit, onDelete }) => {
  return (
    <div className="rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200 bg-gray-50/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 truncate">
            {perimeter.name}
          </h4>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {perimeter.commune || 'Non localisé'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Target className="w-4 h-4 text-blue-600" />
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Surface:</span>
          <span className="font-semibold text-blue-600">
            {perimeter.area_hectares?.toFixed(2) || '0.00'} ha
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Points GPS:</span>
          <span className="font-mono text-gray-700">
            {perimeter.coordinates?.length || 0}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(perimeter)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Modifier
        </button>
        <button
          onClick={() => onDelete(perimeter.id)}
          className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

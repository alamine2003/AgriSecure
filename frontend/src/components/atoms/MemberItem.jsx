import React from 'react'

/**
 * Composant Atomique - Member Item
 * Item membre avec avatar et info
 */
export const MemberItem = ({ name, role, details, avatar }) => {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-semibold">
        {avatar || name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">
          {role} · {details}
        </p>
      </div>
    </div>
  )
}

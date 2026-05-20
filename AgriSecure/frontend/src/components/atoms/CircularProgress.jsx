import React from 'react'

/**
 * Composant Atomique - Circular Progress
 * Affiche un cercle de progression animé
 */
export const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#6366f1',
  label,
  sublabel
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">
            {percentage}%
          </span>
        </div>
      </div>
      {label && (
        <p className="text-sm font-semibold text-gray-700 mt-3">{label}</p>
      )}
      {sublabel && (
        <p className="text-xs text-gray-500">{sublabel}</p>
      )}
    </div>
  )
}

import React from 'react'

/**
 * Composant Atomique - Spinner de Chargement
 */
export const LoadingSpinner = ({
  icon: Icon,
  text = 'Chargement...',
  size = 'md'
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      {Icon && (
        <Icon className={`${sizes[size]} text-blue-500 animate-pulse mb-3`} />
      )}
      <p className="text-sm text-gray-500 font-medium">{text}</p>
    </div>
  )
}

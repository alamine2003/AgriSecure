import React from 'react'
import { ActionButton } from './ActionButton'

/**
 * Composant Atomique - État Vide
 * Affichage quand aucune donnée n'est disponible
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mb-4" />}
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <ActionButton
          icon={actionIcon}
          onClick={onAction}
          variant="primary"
          size="sm"
        >
          {actionLabel}
        </ActionButton>
      )}
    </div>
  )
}

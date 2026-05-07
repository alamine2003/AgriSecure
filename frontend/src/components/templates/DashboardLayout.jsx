import React from 'react'
import { ActionButton } from '../atoms/ActionButton'
import { Plus, Eye } from 'lucide-react'

export const DashboardLayout = ({ children, onNewPerimeter, onSurveillance }) => {
  return (
    <div className="space-y-6">
      {/* Action buttons row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Exploitation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de vos ressources</p>
        </div>
        <div className="flex gap-3">
          <ActionButton
            icon={Plus}
            onClick={onNewPerimeter}
            variant="primary"
            size="md"
          >
            Nouveau Périmètre
          </ActionButton>
          <ActionButton
            icon={Eye}
            onClick={onSurveillance}
            variant="success"
            size="md"
          >
            Surveillance Live
          </ActionButton>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}

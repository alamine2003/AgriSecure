import { ActionButton } from './ActionButton'

export const EmptyState = ({ icon: Icon, title, description, actionLabel, actionIcon, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground/50" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <ActionButton icon={actionIcon} onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </ActionButton>
      )}
    </div>
  )
}

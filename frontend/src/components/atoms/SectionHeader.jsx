export const SectionHeader = ({ title, icon: Icon, count, action }) => {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {count !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

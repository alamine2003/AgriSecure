import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const variantStyles = {
  success:
    "bg-green-100 text-green-900 border-green-500 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700",
  info: "bg-blue-100 text-blue-900 border-blue-500 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700",
  warning:
    "bg-yellow-100 text-yellow-900 border-yellow-500 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-700",
  error:
    "bg-red-100 text-red-900 border-red-500 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700",
}

const iconStyles = {
  success: "text-green-600 dark:text-green-300",
  info: "text-blue-600 dark:text-blue-300",
  warning: "text-yellow-600 dark:text-yellow-300",
  error: "text-red-600 dark:text-red-300",
}

const barStyles = {
  success: "bg-green-500/70 dark:bg-green-400/70",
  info: "bg-blue-500/70 dark:bg-blue-400/70",
  warning: "bg-yellow-500/70 dark:bg-yellow-400/70",
  error: "bg-red-500/70 dark:bg-red-400/70",
}

export function Notification({
  variant = "info",
  title,
  description,
  icon,
  durationMs = 4500,
  onClose,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-[320px] overflow-hidden rounded-lg border-l-4 p-3 shadow-lg backdrop-blur transition duration-300 ease-in-out hover:scale-[1.02]",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", iconStyles[variant])}>{icon}</div>

        <div className="min-w-0 flex-1">
          {title ? <div className="text-xs font-semibold">{title}</div> : null}
          {description ? (
            <div className="mt-0.5 text-xs opacity-90">{description}</div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 opacity-70 transition-colors hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-black/5 dark:bg-white/10">
        <div
          className={cn("toast-progress h-full", barStyles[variant])}
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  )
}

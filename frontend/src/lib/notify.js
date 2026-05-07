import { createElement } from "react"
import { toast } from "sonner"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react"

import { Notification } from "@/components/ui/notification"

const iconComponents = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  alert: AlertCircle,
}

function push({ variant, title, description, durationMs = 4500 }) {
  const Icon = iconComponents[variant] || iconComponents.alert
  toast.custom(
    (t) =>
      createElement(Notification, {
        variant,
        title,
        description,
        icon: createElement(Icon, { className: "h-5 w-5" }),
        durationMs,
        onClose: () => toast.dismiss(t),
      }),
    { duration: durationMs }
  )
}

export const notify = {
  success: (title, description, opts) =>
    push({ variant: "success", title, description, ...opts }),
  info: (title, description, opts) =>
    push({ variant: "info", title, description, ...opts }),
  warning: (title, description, opts) =>
    push({ variant: "warning", title, description, ...opts }),
  error: (title, description, opts) =>
    push({ variant: "error", title, description, ...opts }),
}

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

export function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  className,
  inputClassName,
  required,
  autoComplete,
  shake,
  leftSlot,
  rightSlot,
  ...props
}) {
  const [show, setShow] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const isPassword = type === "password"
  const computedType = isPassword ? (show ? "text" : "password") : type
  const hasRight = Boolean(rightSlot) || isPassword
  const hasLeft = Boolean(leftSlot)
  const leftPadding = hasLeft ? "pl-10" : "pl-3"
  const rightPadding = hasRight ? "pr-10" : "pr-3"

  const isActive = focused || (value && value.length > 0)

  return (
    <div className={cn("relative", shake ? "animate-shake" : null, className)}>
      <input
        id={id}
        type={computedType}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        autoComplete={autoComplete}
        placeholder=""
        {...props}
        className={cn(
          "h-12 w-full rounded-lg border border-input bg-background text-sm text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "pt-5 pb-1" : "py-3",
          leftPadding,
          rightPadding,
          inputClassName
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute transition-all duration-200 origin-left",
          hasLeft ? "left-10" : "left-3",
          isActive
            ? "top-1.5 text-[11px] font-medium text-primary"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        )}
      >
        {label}
      </label>

      {leftSlot ? <div className="absolute left-3 top-1/2 -translate-y-1/2">{leftSlot}</div> : null}

      {rightSlot ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      ) : isPassword ? (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  )
}

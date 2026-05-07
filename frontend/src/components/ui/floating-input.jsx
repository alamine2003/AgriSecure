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
  placeholder = " ",
  shake,
  leftSlot,
  rightSlot,
  ...props
}) {
  const [show, setShow] = React.useState(false)
  const isPassword = type === "password"
  const computedType = isPassword ? (show ? "text" : "password") : type
  const hasRight = Boolean(rightSlot) || isPassword
  const hasLeft = Boolean(leftSlot)
  const leftPadding = hasLeft ? "pl-10" : "pl-3"
  const rightPadding = hasRight ? "pr-10" : "pr-3"
  const labelLeft = hasLeft ? "left-10" : "left-3"
  const labelFocusLeft = hasLeft ? "peer-focus:left-9 peer-[:not(:placeholder-shown)]:left-9" : "peer-focus:left-2 peer-[:not(:placeholder-shown)]:left-2"

  return (
    <div className={cn("relative", shake ? "animate-shake" : null, className)}>
      <input
        id={id}
        type={computedType}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        {...props}
        className={cn(
          "peer h-11 w-full rounded-md border border-input bg-background pt-4 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring",
          leftPadding,
          rightPadding,
          inputClassName
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute top-3 origin-left text-sm text-muted-foreground transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:rounded peer-focus:bg-background peer-focus:px-1 peer-focus:text-xs peer-focus:text-foreground peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:rounded peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-foreground",
          labelLeft,
          labelFocusLeft
        )}
      >
        {label}
      </label>

      {leftSlot ? <div className="absolute left-2 top-2.5">{leftSlot}</div> : null}

      {rightSlot ? (
        <div className="absolute right-2 top-2.5">{rightSlot}</div>
      ) : isPassword ? (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-2.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  )
}

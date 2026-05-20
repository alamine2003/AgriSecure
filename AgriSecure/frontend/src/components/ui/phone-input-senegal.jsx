import { useState } from 'react'
import { Phone, CheckCircle, XCircle } from 'lucide-react'
import { formatSenegalPhone, isValidSenegalPhone } from '@/data/senegalLocations'

export const PhoneInputSenegal = ({
  id,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "77 123 45 67"
}) => {
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)

  const handleChange = (e) => {
    onChange(e)
  }

  const handleBlur = () => {
    setFocused(false)
    setTouched(true)

    if (value) {
      const formatted = formatSenegalPhone(value)
      if (formatted !== value) {
        const event = { target: { value: formatted, name: id } }
        onChange(event)
      }
    }
  }

  const isValid = value ? isValidSenegalPhone(value) : null
  const showValidation = touched && value && value.length > 0

  return (
    <div className="relative">
      <div className={`
        relative flex items-center gap-2 px-4 py-3
        bg-white/[0.04] border rounded-xl
        transition-all duration-300
        ${focused
          ? 'border-primary ring-2 ring-primary/20'
          : showValidation && isValid
            ? 'border-amber-500/50 hover:border-amber-500'
            : showValidation && !isValid
              ? 'border-destructive/50 hover:border-destructive'
              : 'border-white/[0.08] hover:border-white/[0.15]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        {/* Indicatif Sénégal */}
        <div className="flex items-center gap-2 border-r border-white/[0.08] pr-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-600 via-yellow-400 to-red-600 flex items-center justify-center shadow-sm">
            <span className="text-[9px] font-bold text-white">SN</span>
          </div>
          <span className="text-sm font-semibold text-amber-100">+221</span>
        </div>

        <Phone className="w-4 h-4 text-primary" />

        <input
          id={id}
          type="tel"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent text-amber-100 font-medium placeholder:text-muted-foreground/50 disabled:cursor-not-allowed"
        />

        {showValidation && (
          <div className="flex-shrink-0">
            {isValid ? (
              <CheckCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        )}
      </div>

      <div className="mt-2 px-1">
        {showValidation && !isValid ? (
          <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Format invalide. Ex: 77 123 45 67
          </p>
        ) : showValidation && isValid ? (
          <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Numéro valide
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Format: XX XXX XX XX (9 chiffres)
          </p>
        )}
      </div>
    </div>
  )
}

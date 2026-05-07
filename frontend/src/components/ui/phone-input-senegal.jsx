import React, { useState } from 'react'
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
    const input = e.target.value
    onChange(e)
  }

  const handleBlur = () => {
    setFocused(false)
    setTouched(true)

    // Auto-format au blur
    if (value) {
      const formatted = formatSenegalPhone(value)
      if (formatted !== value) {
        const event = {
          target: { value: formatted, name: id }
        }
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
        bg-white border-2 rounded-xl
        transition-all duration-300
        ${focused
          ? 'border-green-500 ring-2 ring-green-500/20 shadow-lg'
          : showValidation && isValid
            ? 'border-green-400 hover:border-green-500'
            : showValidation && !isValid
              ? 'border-red-400 hover:border-red-500'
              : 'border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:shadow-md'}
      `}>
        {/* Indicatif Sénégal */}
        <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-600 via-yellow-400 to-red-600 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">SN</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">+221</span>
        </div>

        {/* Icon téléphone */}
        <Phone className="w-5 h-5 text-green-600" />

        {/* Input */}
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
          className={`
            flex-1 outline-none bg-transparent
            text-gray-900 font-medium
            placeholder:text-gray-400
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        />

        {/* Validation icon */}
        {showValidation && (
          <div className="flex-shrink-0">
            {isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-2 px-1">
        {showValidation && !isValid ? (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Format invalide. Ex: 77 123 45 67 (préfixes valides: 77, 78, 76, 70, 75)
          </p>
        ) : showValidation && isValid ? (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Numéro valide
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Format: XX XXX XX XX (9 chiffres, commence par 77, 78, 76, 70 ou 75)
          </p>
        )}
      </div>
    </div>
  )
}

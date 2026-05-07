import React from 'react'
import { Button } from '@/components/ui/button'

export const ActionButton = ({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  className = ''
}) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} text-white rounded-xl shadow-sm transition-all duration-200 ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </Button>
  )
}

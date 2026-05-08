export const LoadingSpinner = ({ icon: Icon, text = 'Chargement...', size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' }

  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      {Icon && (
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className={`${sizes[size]} text-primary animate-pulse`} />
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground font-medium mt-4">{text}</p>
    </div>
  )
}

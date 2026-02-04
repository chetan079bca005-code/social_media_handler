import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn, getInitials } from '../../lib/utils'

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, src, alt, fallback, size = 'md', ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex shrink-0 overflow-hidden rounded-full',
      sizeClasses[size],
      className
    )}
    {...props}
  >
    <AvatarPrimitive.Image
      src={src}
      alt={alt}
      className="aspect-square h-full w-full object-cover"
    />
    <AvatarPrimitive.Fallback
      className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-white font-medium"
    >
      {fallback || (alt ? getInitials(alt) : '?')}
    </AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
))
Avatar.displayName = 'Avatar'

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  max?: number
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 4, ...props }, ref) => {
    const childArray = React.Children.toArray(children)
    const visibleAvatars = childArray.slice(0, max)
    const remainingCount = childArray.length - max

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-3', className)}
        {...props}
      >
        {visibleAvatars.map((child, index) => (
          <div key={index} className="ring-2 ring-white dark:ring-slate-800 rounded-full">
            {child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800">
            +{remainingCount}
          </div>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = 'AvatarGroup'

export { Avatar, AvatarGroup }

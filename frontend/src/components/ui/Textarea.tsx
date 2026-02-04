import * as React from 'react'
import { cn } from '../../lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
  helperText?: string
  characterCount?: number
  maxCharacters?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, characterCount, maxCharacters, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-25 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 resize-none',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-200 dark:border-slate-700',
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="flex justify-between mt-1.5">
          <div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {helperText && !error && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
            )}
          </div>
          {maxCharacters && (
            <p
              className={cn(
                'text-sm',
                characterCount && characterCount > maxCharacters
                  ? 'text-red-500'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {characterCount || 0} / {maxCharacters}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }

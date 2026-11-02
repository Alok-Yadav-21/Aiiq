'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-allq-purple/50 select-none',
  {
    variants: {
      variant: {
        primary: 'btn-grad text-white shadow-sm hover:shadow-md',
        secondary: 'bg-white border border-slate-200 text-slate-700 hover:border-allq-purple/40 hover:text-slate-900 shadow-sm',
        ghost: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
        danger: 'bg-allq-red/10 border border-allq-red/30 text-allq-red hover:bg-allq-red/20',
        success: 'bg-allq-green/10 border border-allq-green/30 text-allq-green hover:bg-allq-green/20',
        cyan: 'bg-gradient-to-r from-allq-cyan to-allq-cyan-dim text-white shadow-neon-cyan hover:shadow-[0_0_30px_rgba(6,182,212,0.7)]',
        outline: 'border border-allq-purple/50 text-allq-purple hover:bg-allq-purple/10',
        link: 'text-allq-purple underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

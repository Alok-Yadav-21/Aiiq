import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 border border-slate-200 text-slate-600',
        purple: 'bg-allq-purple/10 border border-allq-purple/25 text-allq-purple',
        cyan: 'bg-allq-cyan/10 border border-allq-cyan/25 text-cyan-700',
        green: 'bg-allq-green/10 border border-allq-green/25 text-emerald-700',
        amber: 'bg-allq-amber/10 border border-allq-amber/25 text-amber-700',
        red: 'bg-allq-red/10 border border-allq-red/25 text-rose-600',
        pink: 'bg-allq-pink/10 border border-allq-pink/25 text-pink-600',
        pro: 'badge-pro text-white',
        starter: 'badge-starter text-white',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />
}

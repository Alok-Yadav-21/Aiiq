import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white/5 border border-white/10 text-slate-300',
        purple: 'bg-allq-purple/15 border border-allq-purple/30 text-allq-purple',
        cyan: 'bg-allq-cyan/15 border border-allq-cyan/30 text-allq-cyan',
        green: 'bg-allq-green/15 border border-allq-green/30 text-allq-green',
        amber: 'bg-allq-amber/15 border border-allq-amber/30 text-allq-amber',
        red: 'bg-allq-red/15 border border-allq-red/30 text-allq-red',
        pink: 'bg-allq-pink/15 border border-allq-pink/30 text-allq-pink',
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

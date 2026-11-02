import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button'
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-light',
        variant === 'card' && 'h-48 w-full rounded-2xl',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'avatar' && 'h-10 w-10 rounded-full',
        variant === 'button' && 'h-10 w-32 rounded-xl',
        className
      )}
      {...props}
    />
  )
}

export function SubjectCardSkeleton() {
  return (
    <div className="surface-card rounded-2xl p-5 flex flex-col gap-3">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function RoomCardSkeleton() {
  return (
    <div className="surface-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-3/4" />
      <div className="flex gap-4 mt-2">
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="text" className="w-20" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl mt-1" />
    </div>
  )
}

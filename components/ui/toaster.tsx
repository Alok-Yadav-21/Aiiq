'use client'

import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const colors = {
  success: 'border-allq-green/30 text-allq-green',
  error: 'border-allq-red/30 text-allq-red',
  warning: 'border-allq-amber/30 text-allq-amber',
  info: 'border-allq-cyan/30 text-allq-cyan',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type || 'info']
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={cn(
                'glass rounded-xl px-4 py-3 flex items-start gap-3 shadow-card border',
                colors[toast.type || 'info']
              )}
            >
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="font-semibold text-sm text-white">{toast.title}</p>
                )}
                {toast.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

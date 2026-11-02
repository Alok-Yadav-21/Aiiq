'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onOpenChange, title, description, children, className, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                />
              </Dialog.Overlay>

              {/* Centering wrapper — Dialog.Content gets Radix a11y attrs, we own the layout */}
              <Dialog.Content
                className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
                onPointerDownOutside={(e) => e.preventDefault()}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 16 }}
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                  className={cn(
                    'relative w-full rounded-2xl p-6',
                    'bg-white border border-slate-200',
                    'shadow-[0_24px_80px_rgba(15,23,42,0.18)]',
                    'max-h-[88vh] overflow-y-auto',
                    sizeMap[size],
                    className
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  {(title || description) && (
                    <div className="mb-6 pr-8">
                      {title && (
                        <Dialog.Title className="text-xl font-bold text-slate-900 leading-tight">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  {children}

                  {/* Close button */}
                  <Dialog.Close className="absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                    <X className="h-4.5 w-4.5" />
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen hero-bg flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-allq-purple to-allq-cyan flex items-center justify-center shadow-neon-sm">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-lg font-black gradient-text">AllQ</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      <p className="text-center text-xs text-slate-600 pb-6">
        © 2025 AllQ · Learn It. Quiz It. Win It.
      </p>
    </div>
  )
}

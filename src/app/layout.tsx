import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FC Pedia',
  description: 'EA Sports FC 26 player ratings browser',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-slate-900 text-slate-100 min-h-screen`}>
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="text-xl font-black text-emerald-400 hover:text-emerald-300 transition-colors">
              FC Pedia
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-200 transition-colors">Players</Link>
              <Link href="/playstyles" className="hover:text-slate-200 transition-colors">PlayStyles</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-screen-2xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CareVo — Nonprofit Case Management',
  description: 'AI-native case management platform for nonprofits. Under $30/month.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-[#FDFAF6] text-[#1C1917]`}>
        {children}
      </body>
    </html>
  )
}
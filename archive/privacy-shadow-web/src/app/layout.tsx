import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ShadowProvider } from '@/lib/shadow-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Privacy Shadow - Meet Your Digital Twin',
  description: 'See your digital footprint in real-time through an interactive Digital Twin avatar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ShadowProvider>{children}</ShadowProvider>
      </body>
    </html>
  )
}

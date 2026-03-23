// Layout racine de l'application SubHuntr — dark theme avec Plus Jakarta Sans + JetBrains Mono

import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { PostHogProvider } from '@/components/providers/posthog-provider'
import { CrispChat } from '@/components/CrispChat'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'SubHuntr — Find Buyers on Reddit Before Your Competitors Do',
  description:
    'Monitor Reddit for high-intent buyers. Score leads 1-10, get instant alerts, reply with proven templates. From $29/mo.',
  openGraph: {
    title: 'SubHuntr — Find Buyers on Reddit Before Your Competitors Do',
    description: 'Monitor Reddit for high-intent buyers. Score leads 1-10, get instant alerts, reply with proven templates. From $29/mo.',
    type: 'website',
    url: 'https://subhuntr.com',
    images: [{ url: 'https://subhuntr.com/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SubHuntr — Find Buyers on Reddit Before Your Competitors Do',
    description: 'Monitor Reddit for high-intent buyers. Score leads 1-10, get instant alerts, reply with proven templates.',
    images: ['https://subhuntr.com/opengraph-image'],
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Toaster />
        <CrispChat />
      </body>
    </html>
  )
}

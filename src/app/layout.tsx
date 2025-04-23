import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import "./globals.css";
import SupabaseProvider from '@/components/providers/supabase-provider'

export const metadata: Metadata = {
  title: "LinkedIn Automation Platform",
  description: "Automate your LinkedIn presence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}

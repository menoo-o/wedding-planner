// app/layout.tsx

import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

import NetworkListener from "@/components/NetworkStatus/useNetworkStatus"
import NetworkToast from "@/components/NetworkStatus/NetworkToast"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })

export const metadata: Metadata = {
  title: "Veya | Household Ledger",
  description: "Track expenses, manage debts, and monitor savings",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" 
        />
      </head>
      <body>
        <NetworkListener />
        <NetworkToast />
        {/* LogoutButton REMOVED — now inside dashboard/layout.tsx */}
        {children}
      </body>
    </html>
  )
}
// app/layout.tsx

import type { Metadata } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import "./globals.css"

import NetworkListener from "@/components/NetworkStatus/NetworkListen"
import NetworkToast from "@/components/NetworkStatus/Networktoast"

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Veya | Simply Finance",
  description: "Track expenses, manage debts, and monitor savings",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plex.variable}`}>
      <body>
        <NetworkListener />
        <NetworkToast />
        {/* LogoutButton REMOVED — now inside dashboard/layout.tsx */}
        {children}
      </body>
    </html>
  )
}
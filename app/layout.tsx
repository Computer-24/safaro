import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { AppNav } from "@/components/app-nav"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Safaro",
  description: "Internal Safety Platform",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = session?.user.role ?? "USER"

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        GeistSans.variable,
        GeistMono.variable,
        inter.variable
      )}
    >
      <body className="min-h-screen font-sans">
  <ThemeProvider>
    <TooltipProvider>
      {children}
      <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
      }}
      icons={{
        success: <CheckCircle className="w-5 h-5 text-green-600" />,
        error: <XCircle className="w-5 h-5 text-red-600" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      }}
    />
    </TooltipProvider>
  </ThemeProvider>
</body>
    </html>
  )
}

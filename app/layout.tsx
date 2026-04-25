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
      <body className="min-h-screen flex font-sans">
        <ThemeProvider>
          <TooltipProvider>
            {/* Global Right-Side Sidebar */}
            <AppNav role={role} />

            {/* Main Content Area */}
            <main className="flex-1 md:mr-64 p-6 pb-20 md:pb-6">
              <div className="max-w-6xl mx-auto w-full">
                {children}
              </div>
            </main>

            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

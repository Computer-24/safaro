// components/SidebarLayout.tsx (replace existing main)
"use client"
import React from "react"
import { AppNav } from "@/components/app-nav"

export function SidebarLayout({ children, role }: { children: React.ReactNode; role: string }) {
  const [collapsed, setCollapsed] = React.useState(true)
  const [isDesktop, setIsDesktop] = React.useState(false)

  const collapsedWidth = 80   // w-20
  const expandedWidth = 256   // w-64
  const gap = 16              // px outer gap you want between main and sidebar

  const sidebarWidth = collapsed ? collapsedWidth : expandedWidth
  const totalRightPadding = sidebarWidth + gap

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 768px)")
    const set = () => setIsDesktop(!!mq.matches)
    set()
    mq.addEventListener?.("change", set)
    return () => mq.removeEventListener?.("change", set)
  }, [])

  const mainStyle = isDesktop ? { paddingRight: `${totalRightPadding}px` } : undefined

  return (
    <div className="min-h-screen flex">
      <main
        className="flex-1 p-6 overflow-auto box-border transition-[padding-right] duration-300"
        style={mainStyle}
      >
        {children}
      </main>

      <AppNav role={role} collapsed={collapsed} setCollapsed={setCollapsed} />
    </div>
  )
}

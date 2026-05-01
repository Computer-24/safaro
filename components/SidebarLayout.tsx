// components/SidebarLayout.tsx (replace existing main)
"use client"
import React from "react"
import { AppNav } from "@/components/app-nav"

export function SidebarLayout({ children, role }: { children: React.ReactNode; role: string }) {
  const [collapsed, setCollapsed] = React.useState(true)

  const collapsedWidth = 80   // w-20
  const expandedWidth = 256   // w-64
  const gap = 16              // px outer gap you want between main and sidebar

  const sidebarWidth = collapsed ? collapsedWidth : expandedWidth
  const totalRightPadding = sidebarWidth + gap

  return (
    <div className="min-h-screen flex">
      <main
        className="flex-1 p-6 overflow-auto box-border transition-[padding-right] duration-300"
        style={{ paddingRight: `${totalRightPadding}px` }}
      >
        {children}
      </main>

      <AppNav role={role} collapsed={collapsed} setCollapsed={setCollapsed} />
    </div>
  )
}

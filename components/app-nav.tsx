"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"

import {
  LayoutDashboard,
  Users,
  Building,
  LogOut,
} from "lucide-react"

export function AppNav({
  role,
  collapsed,
  setCollapsed,
}: {
  role: string
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}) {
  const pathname = usePathname()

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "APPROVER", "USER"] },
    { label: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { label: "Companies", href: "/admin/companies", icon: Building, roles: ["ADMIN"] },
  ].filter(item => item.roles.includes(role))

  return (
    <>
      {/* MOBILE BOTTOM BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
        <TooltipProvider>
          <div className="max-w-4xl mx-auto grid grid-flow-col auto-cols-fr gap-0 px-1 py-2 items-center">
            {[
              ...navItems.map((i) => ({ type: "nav", ...i })),
              { type: "theme", label: "Theme" },
              { type: "logout", label: "Logout" },
            ].map((item: any, idx: number) => {
              const cellClass = "w-full flex items-center justify-center"
              if (item.type === "nav") {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Tooltip key={item.href} delayDuration={150}>
                    <TooltipTrigger asChild>
                      <div className={cellClass}>
                        <Link href={item.href} aria-label={item.label} className="w-full">
                          <Button
                            variant={active ? "default" : "ghost"}
                            size="icon"
                            className={cn("w-full h-10 flex items-center justify-center", active && "shadow-sm")}
                            aria-current={active ? "page" : undefined}
                          >
                            <Icon className="h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }

              if (item.type === "theme") {
                return (
                  <Tooltip key={`theme-${idx}`} delayDuration={150}>
                    <TooltipTrigger asChild>
                      <div className={cellClass}>
                        <div className="w-full h-10 flex items-center justify-center">
                          <div className="h-10 w-10 flex items-center justify-center">
                            <ThemeToggle />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Change Theme</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Tooltip key={`logout-${idx}`} delayDuration={150}>
                  <TooltipTrigger asChild>
                    <div className={cellClass}>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Logout"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full h-10 flex items-center justify-center"
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">Logout</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>
      </nav>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-l bg-card fixed right-0 top-0 h-screen z-40 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex justify-end p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>

        <div className="px-4 pb-6">
          <h1 className={cn("text-xl font-semibold transition-opacity", collapsed && "opacity-0 pointer-events-none")}>
            Safaro
          </h1>
        </div>

        <TooltipProvider>
          <nav className="flex flex-col gap-2 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)

              return (
                <Tooltip key={item.href} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={active ? "default" : "ghost"}
                        className={cn("w-full justify-start gap-2", collapsed && "justify-center")}
                      >
                        <Icon className="h-5 w-5" />
                        {!collapsed && item.label}
                      </Button>
                    </Link>
                  </TooltipTrigger>

                  {collapsed && (
                    <TooltipContent side="left">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 p-4">
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className={cn(collapsed ? "flex justify-center" : "")} aria-hidden={false}>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              {collapsed ? (
                <TooltipContent side="left">Change Theme</TooltipContent>
              ) : (
                <TooltipContent side="top">Change Theme</TooltipContent>
              )}
            </Tooltip>

            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant={collapsed ? "ghost" : "secondary"}
                  className={cn("flex items-center gap-2", collapsed && "justify-center")}
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && "Logout"}
                </Button>
              </TooltipTrigger>

              {collapsed ? (
                <TooltipContent side="left">Logout</TooltipContent>
              ) : (
                <TooltipContent side="top">Logout</TooltipContent>
              )}
            </Tooltip>
          </div>
        </TooltipProvider>
      </aside>
    </>
  )
}

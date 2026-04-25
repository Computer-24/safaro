"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"

import {
  Menu,
  ChevronRight,
  LayoutDashboard,
  Users,
  Building,
  LogOut,
} from "lucide-react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function AppNav({ role }: { role: string }) {
  const pathname = usePathname()

  // Sidebar collapsed by default
  const [collapsed, setCollapsed] = useState(true)

  // Role‑specific navigation
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "APPROVER", "USER"] },
    { label: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { label: "Companies", href: "/admin/companies", icon: Building, roles: ["ADMIN"] },
  ].filter(item => item.roles.includes(role))

  return (
    <>
      {/* MOBILE NAV (Sheet Drawer) */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-64 p-0">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>

            <MobileNav navItems={navItems} />
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR (RIGHT SIDE) */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-l bg-card h-screen transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Collapse Button */}
        <div className="flex justify-end p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronRight
              className={cn(
                "h-5 w-5 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Logo */}
        <div className="px-4 pb-6">
          <h1
            className={cn(
              "text-xl font-semibold transition-opacity",
              collapsed && "opacity-0 pointer-events-none"
            )}
          >
            Safaro
          </h1>
        </div>

        {/* Navigation */}
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
                        className={cn(
                          "w-full justify-start gap-2",
                          collapsed && "justify-center"
                        )}
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
        </TooltipProvider>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-3 p-4">
          <ThemeToggle />

          <Button
            variant={collapsed ? "ghost" : "secondary"}
            className={cn(
              "flex items-center gap-2",
              collapsed && "justify-center"
            )}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Logout"}
          </Button>
        </div>
      </aside>
    </>
  )
}

function MobileNav({ navItems }: { navItems: any[] }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-xl font-semibold mb-6">Safaro</h1>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={active ? "default" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <ThemeToggle />

        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

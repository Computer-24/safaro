import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function InboxButton({
  type,
  label,
  count,
  active = false,
  onClick,
}: {
  type: string | "all"
  label: React.ReactNode
  count: number
  active?: boolean
  onClick?: () => void
}) {
  const base = "w-full flex items-center justify-between px-3 py-2 rounded text-sm"
  const activeClass = "bg-emerald-600 text-white"
  const idleClass = "hover:bg-white/5"

  return (
    <button onClick={onClick} className={cn(base, active ? activeClass : idleClass)}>
      <span className="flex items-center gap-2">{label}</span>
      {count > 0 ? <Badge className="ml-2" variant="new">{count}</Badge> : null}
    </button>
  )
}

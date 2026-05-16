"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"

import {
  Activity,
  AlertTriangle,
  Clipboard,
  Flame,
  Globe,
  BrushCleaning,
  Lock,
  ShieldCheck,
  TestTube,
  Users,
  Wrench,
  Zap,
  Grid,
  Circle,
  CircleDot,
  CircleDashed,
  CircleDotDashed,
  CircleSlash2,
} from "lucide-react"

// Zod schema — description required
const ticketSchema = z.object({
  observationType: z.enum(["POSITIVE", "NEGATIVE"]),
  category: z.enum([
    "BEHAVIOR",
    "CONDITION",
    "NEAR_MISS",
    "EQUIPMENT",
    "PPE",
    "HOUSEKEEPING",
    "ERGONOMICS",
    "CHEMICAL",
    "FIRE_SAFETY",
    "ELECTRICAL",
    "ENVIRONMENT",
    "SECURITY",
    "OTHER",
  ]),
  severity: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
})

type TicketForm = z.infer<typeof ticketSchema>

const CATEGORIES = [
  "BEHAVIOR",
  "CONDITION",
  "NEAR_MISS",
  "EQUIPMENT",
  "PPE",
  "HOUSEKEEPING",
  "ERGONOMICS",
  "CHEMICAL",
  "FIRE_SAFETY",
  "ELECTRICAL",
  "ENVIRONMENT",
  "SECURITY",
  "OTHER",
] as const

type Category = (typeof CATEGORIES)[number]

const CATEGORY_ORDER: Category[] = [...CATEGORIES]

const CATEGORY_LABELS: Record<Category, string> = {
  BEHAVIOR: "Behavior",
  CONDITION: "Condition",
  NEAR_MISS: "Near miss",
  EQUIPMENT: "Equipment",
  PPE: "PPE",
  HOUSEKEEPING: "Housekeeping",
  ERGONOMICS: "Ergonomics",
  CHEMICAL: "Chemical",
  FIRE_SAFETY: "Fire safety",
  ELECTRICAL: "Electrical",
  ENVIRONMENT: "Environment",
  SECURITY: "Security",
  OTHER: "Other",
}

const CATEGORY_ICONS: Record<Category, any> = {
  BEHAVIOR: Users,
  CONDITION: Clipboard,
  NEAR_MISS: AlertTriangle,
  EQUIPMENT: Wrench,
  PPE: ShieldCheck,
  HOUSEKEEPING: BrushCleaning,
  ERGONOMICS: Activity,
  CHEMICAL: TestTube,
  FIRE_SAFETY: Flame,
  ELECTRICAL: Zap,
  ENVIRONMENT: Globe,
  SECURITY: Lock,
  OTHER: Grid,
}

// Severity icon mapping (per your request)
const SEVERITY_ICONS: Record<
  TicketForm["severity"],
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  NONE: CircleSlash2,
  LOW: CircleDashed,
  MEDIUM: CircleDotDashed,
  HIGH: Circle,
  CRITICAL: CircleDot,
}

export function CreateTicketModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultValues: TicketForm = {
    observationType: "NEGATIVE",
    category: "OTHER",
    severity: "NONE",
    title: "",
    description: "",
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, touchedFields, isSubmitted },
  } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues,
    mode: "onTouched",
  })

  useEffect(() => {
    if (open) reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: TicketForm) {
    setLoading(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create ticket" }))
        throw new Error(err?.message ?? "Failed to create ticket")
      }

      const data = await res.json()
      toast.success("Ticket created")
      setOpen(false)
      reset(defaultValues)
      router.push(`/tickets/${data.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message ?? "Unable to create ticket")
    } finally {
      setLoading(false)
    }
  }

  // Keep border present for both states; selected uses border-transparent so width never changes
  const selClass = "bg-primary text-white dark:bg-primary/90 border border-transparent shadow-sm"
  const unselBase = "bg-transparent border border-muted text-muted-foreground dark:border-slate-700 dark:text-slate-400"

  // severity styles: LOW uses selClass per request; others keep distinct selected colors but keep border
  const severityStyles: Record<string, { sel: string; unsel: string }> = {
    NONE: { sel: "bg-slate-700 text-white dark:bg-slate-600 border border-transparent", unsel: unselBase },
    LOW: { sel: selClass, unsel: unselBase },
    MEDIUM: { sel: "bg-yellow-500 text-white dark:bg-yellow-500 border border-transparent", unsel: unselBase },
    HIGH: { sel: "bg-orange-600 text-white dark:bg-orange-500 border border-transparent", unsel: unselBase },
    CRITICAL: { sel: "bg-red-800 text-white dark:bg-red-700 border border-transparent", unsel: unselBase },
  }

  const obsSelected = (v: "POSITIVE" | "NEGATIVE") =>
    v === "POSITIVE" ? selClass : "bg-red-600 text-white dark:bg-red-500 border border-transparent"
  const obsUnselected = () => unselBase

  const showTitleError = Boolean(errors.title && (touchedFields.title || isSubmitted))
  const showDescriptionError = Boolean(errors.description && (touchedFields.description || isSubmitted))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-10">New Ticket</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {/* Observation Type and Severity */}
          <div className="flex gap-4">
            {/* Observation: use same row height as severity via auto-rows */}
            <div className="w-1/3 rounded-md border border-muted p-3 box-border bg-transparent dark:border-slate-700">
              <Label className="mb-2">Observation Type</Label>
              <Controller
                control={control}
                name="observationType"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2 auto-rows-[44px]">
                    <button
                      type="button"
                      aria-pressed={field.value === "NEGATIVE"}
                      onClick={() => field.onChange("NEGATIVE")}
                      className={`w-full h-full inline-flex justify-center items-center gap-2 px-2 rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 box-border ${
                        field.value === "NEGATIVE" ? "bg-red-600 text-white dark:bg-red-500 border border-transparent" : obsUnselected()
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-300 dark:bg-red-400" />
                      Negative
                    </button>

                    <button
                      type="button"
                      aria-pressed={field.value === "POSITIVE"}
                      onClick={() => field.onChange("POSITIVE")}
                      className={`w-full h-full inline-flex justify-center items-center gap-2 px-2 rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 box-border ${
                        field.value === "POSITIVE" ? obsSelected("POSITIVE") : obsUnselected()
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-300 dark:bg-green-400" />
                      Positive
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Severity: same row height, icons + text */}
            <div className="w-2/3 rounded-md border border-muted p-3 box-border bg-transparent dark:border-slate-700">
              <Label className="mb-2">Severity</Label>
              <Controller
                control={control}
                name="severity"
                render={({ field }) => (
                  <div className="grid grid-cols-5 gap-2 auto-rows-[44px]">
                    {(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((s) => {
                      const styles = severityStyles[s]
                      const selected = field.value === s
                      const Icon = SEVERITY_ICONS[s]
                      const label =
                        s === "NONE" ? "None" : s === "LOW" ? "Low" : s === "MEDIUM" ? "Medium" : s === "HIGH" ? "High" : "Critical"

                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={selected}
                          aria-label={`Severity ${label}`}
                          onClick={() => field.onChange(s)}
                          className={`w-full h-full inline-flex justify-center items-center gap-2 px-2 rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 box-border ${
                            selected ? styles.sel : styles.unsel
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 ${selected ? "text-white/90" : "text-muted-foreground dark:text-slate-400"}`}
                            aria-hidden
                          />
                          <span className={`${selected ? "text-white" : "text-muted-foreground dark:text-slate-300"} text-sm`}>{label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Category section: match severity/observation button height and add bottom padding */}
          <div className="rounded-md border border-muted p-3 pb-4 bg-transparent dark:border-slate-700">
            <Label className="mb-2">Category</Label>

            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <div className="mt-1" role="list">
                  {/* auto-rows set to 44px to match observation/severity; buttons h-full so they match exactly */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 auto-rows-[44px] items-stretch">
                    {CATEGORY_ORDER.map((cat) => {
                      const selected = field.value === cat
                      const Icon = CATEGORY_ICONS[cat]
                      const selClassLocal = selected ? selClass : unselBase

                      return (
                        <button
                          key={cat}
                          type="button"
                          role="listitem"
                          aria-pressed={selected}
                          onClick={() => field.onChange(cat)}
                          className={`w-full h-full flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 box-border ${selClassLocal}`}
                        >
                          {Icon ? (
                            <Icon className={`h-4 w-4 flex-shrink-0 ${selected ? "text-white/90" : "text-muted-foreground dark:text-slate-400"}`} />
                          ) : (
                            <span className="inline-block h-4 w-4 rounded bg-muted/20" aria-hidden />
                          )}
                          <span className="truncate whitespace-nowrap">{CATEGORY_LABELS[cat]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            />

            {errors.category && <p className="text-sm text-destructive mt-2">{errors.category.message}</p>}
          </div>

          {/* Title: preferred taller style (h-12) */}
          <div className="rounded-md border border-muted p-3 bg-transparent dark:border-slate-700">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              className="mt-2 bg-white/60 dark:bg-slate-800 h-12"
              placeholder="Short instruction: what happened, where, main hazard"
            />
            {showTitleError && <p className="text-sm text-destructive mt-2">{errors.title?.message}</p>}
          </div>

          {/* Description: required now; show validation error */}
          <div className="rounded-md border border-muted p-3 bg-transparent dark:border-slate-700">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={8}
              className="min-h-[160px] mt-2 bg-white/60 dark:bg-slate-800"
              placeholder="Describe what happened, where, when, who was involved, and any immediate actions taken..."
            />
            {showDescriptionError && <p className="text-sm text-destructive mt-2">{errors.description?.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="h-12 px-6"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-6"
              >
                {loading ? <span className="flex items-center gap-2"><Spinner /> Creating</span> : "Create Ticket"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

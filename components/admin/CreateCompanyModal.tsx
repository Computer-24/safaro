// components/admin/CreateCompanyModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import companiesEvents from "@/lib/companiesEvents";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";

type FormValues = {
  name: string;
};

export default function CreateCompanyModal({ triggerLabel = "Create Company" }: { triggerLabel?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, setError, formState } = useForm<FormValues>({
    defaultValues: { name: "" },
  });

  const fieldClass = "h-10 min-h-[40px] w-full";
  const errorText = "text-sm text-red-500";

  async function onSubmit(values: FormValues) {
    toast.dismiss();

    if (!values.name || !values.name.trim()) {
      setError("name" as any, { type: "manual", message: "Name is required" });
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
      };

      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          json = await res.json();
        } catch {
          // ignore parse error
        }
      }

      if (!res.ok) {
        if (json?.error && typeof json.error === "object") {
          // set field errors where possible
          for (const [k, v] of Object.entries(json.error)) {
            const msg = Array.isArray(v) ? String(v[0]) : String(v);
            setError(k as any, { type: "server", message: msg });
          }
          const first = Object.values(json.error)[0];
          const toastMsg = Array.isArray(first) ? String(first[0]) : String(first);
          toast.error(toastMsg);
          setIsSaving(false);
          return;
        }
        if (json?.message) {
          toast.error(json.message);
          setIsSaving(false);
          return;
        }
        toast.error(`Request failed (${res.status})`);
        setIsSaving(false);
        return;
      }

      // success
      toast.success("Company created");
      setOpen(false);
      reset();

      // refresh server components (page is a server component)
      router.refresh();

      // notify client components (CompaniesTable) to re-fetch immediately
      companiesEvents.dispatchEvent(new CustomEvent("companies:created", { detail: json?.company ?? null }));
    } catch (err: any) {
      console.error("CreateCompanyModal error:", err);
      toast.error(err?.message || "Create failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => setOpen(true)}>
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create company</DialogTitle>
        </DialogHeader>

        {/* Accessibility: DialogDescription must be a direct child of DialogContent */}
        <DialogDescription className="mb-2 text-sm text-muted-foreground">
          Create a new company. Name is required.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              {...register("name", { required: "Name is required", validate: (v) => !!v?.trim() || "Name is required" })}
              className={fieldClass}
            />
            {formState.errors.name && <p className={errorText}>{formState.errors.name.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <div className="flex w-full justify-end items-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

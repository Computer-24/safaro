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
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Spinner } from "../ui/spinner";

type Props = {
    company: { id: string; name: string; isActive?: boolean };
};

const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
});

type FormValues = z.infer<typeof schema>;

export default function EditCompanyModal({ company }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: company.name },
    });

    const onSubmit = async (values: FormValues) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/companies/${company.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: values.name }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.message || "Failed to update company");
            }

            setOpen(false);
            toast?.success("Changes saved successfully");
            // refresh the page / data
            router.refresh();
        } catch (err: any) {
            console.error(err);
            toast?.error("Update failed", { description: err?.message || "An error occurred" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className="w-full h-10 md:h-10 px-4 py-3 text-sm md:text-base font-semibold hover:opacity-90 transition-opacity relative z-30"
                    onClick={() => setOpen(true)}
                >
                    Edit Company
                </Button>

            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit company</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="mt-4 space-y-4"
                >
                    <div>
                        <Label htmlFor="name" className="mb-2 block text-sm font-medium">
                            Name
                        </Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            placeholder="Company name"
                            aria-invalid={!!form.formState.errors.name}
                        />
                        {form.formState.errors.name && (
                            <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <div className="flex w-full justify-end items-center">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setOpen(false);
                                        form.reset();
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

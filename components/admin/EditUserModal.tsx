// components/admin/EditUserModal.tsx
"use client";

import { UpdateUserInput, updateUserSchema } from "@/app/(app)/admin/users/[id]/updateUserSchema";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const NONE_VALUE = "__none";
const resolver = zodResolver(updateUserSchema) as unknown as Resolver<UpdateUserInput, any>;

type CompanyOption = { id: string; name: string };
type ApproverOption = { id: string; name: string };

type Props = {
    user: {
        id: string;
        name: string;
        email: string;
        companyId?: string | null;
        role: string;
        approverId?: string | null;
    };
    companies: CompanyOption[];
    approvers: ApproverOption[];
    excludeUserId?: string | null;
    triggerLabel?: string;
};

export default function EditUserModal({
    user,
    companies,
    approvers,
    excludeUserId = null,
    triggerLabel = "Edit user",
}: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const form = useForm<UpdateUserInput>({
        resolver,
        defaultValues: {
            id: user.id,
            name: user.name ?? "",
            email: user.email ?? "",
            password: undefined,
            // keep the form default companyId as the actual id or NONE_VALUE sentinel
            companyId: (user.companyId ?? NONE_VALUE) as unknown as string,
            role: (user.role ?? "USER") as any,
            approverId: (user.approverId ?? NONE_VALUE) as unknown as string | null,
        } as unknown as UpdateUserInput,
    });

    useEffect(() => {
        if (!open) return;
        form.reset({
            id: user.id,
            name: user.name ?? "",
            email: user.email ?? "",
            password: undefined,
            companyId: (user.companyId ?? NONE_VALUE) as unknown as string,
            role: (user.role ?? "USER") as any,
            approverId: (user.approverId ?? NONE_VALUE) as unknown as string | null,
        } as unknown as UpdateUserInput);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user]);

    useEffect(() => {
        const currentApprover = form.getValues("approverId");
        if (excludeUserId && currentApprover === excludeUserId) {
            form.setValue("approverId", NONE_VALUE as unknown as any);
            form.setError("approverId", {
                type: "manual",
                message: "Approver cannot be the same as the user being edited.",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [excludeUserId]);

    const fieldClass = "h-10 min-h-[40px] w-full";
    const errorText = "text-sm text-red-500";

    async function onSubmit(values: UpdateUserInput) {
        toast.dismiss();
        setIsSaving(true);

        // Prevent assigning the user as their own approver
        if (values.approverId && excludeUserId && values.approverId === excludeUserId) {
            form.setError("approverId", {
                type: "manual",
                message: "Approver cannot be the same as the user being edited.",
            });
            toast.error("Cannot assign the user as their own approver");
            setIsSaving(false);
            return;
        }

        try {
            const payload: any = {
                id: values.id,
                name: values.name,
                email: values.email,
                password: values.password ?? undefined,
                companyId: values.companyId === NONE_VALUE ? null : values.companyId,
                role: values.role,
                approverId: values.approverId === NONE_VALUE ? null : values.approverId,
                isActive: values.isActive ?? true,
            };

            const res = await fetch(`/api/admin/users/${values.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            // Try to parse JSON safely
            let json: any = null;
            try {
                json = await res.json();
            } catch (e) {
                console.warn("EditUserModal: response had no JSON body", e);
            }

            // Debugging: log status and body so you can inspect in console
            console.debug("EditUserModal PUT status:", res.status, "body:", json);

            if (!res.ok) {
                // 1) Field-level errors returned as { success:false, error: { field: [msg] } }
                if (json?.error && typeof json.error === "object") {
                    for (const [k, v] of Object.entries(json.error)) {
                        const msg = Array.isArray(v) && v.length > 0 ? String(v[0]) : String(v);
                        // set form error if field exists, otherwise set global
                        if (k && (form.getValues() as any)[k] !== undefined) {
                            form.setError(k as any, { type: "server", message: msg });
                        } else {
                            form.setError("_global" as any, { type: "server", message: msg });
                        }
                    }
                    toast.error("Validation failed. Check the form for errors.");
                    setIsSaving(false);
                    return;
                }

                // 2) Zod-style or other validation: { message: "...", errors: { field: [...] } }
                if (json?.errors && typeof json.errors === "object") {
                    for (const [k, v] of Object.entries(json.errors)) {
                        const msg = Array.isArray(v) && v.length > 0 ? String(v[0]) : String(v);
                        form.setError(k as any, { type: "server", message: msg });
                    }
                    toast.error(json?.message || "Validation failed");
                    setIsSaving(false);
                    return;
                }

                // 3) Generic message
                if (json?.message) {
                    toast.error(json.message);
                    setIsSaving(false);
                    return;
                }

                // 4) Fallback
                toast.error("Failed to update user");
                setIsSaving(false);
                return;
            }

            // Success path
            setOpen(false);
            toast.success("User updated");
            router.refresh();
        } catch (err: any) {
            console.error("EditUserModal update error:", err);
            toast.error(err?.message || "Update failed");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="h-10 px-3 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity relative z-30"
                    onClick={() => setOpen(true)}
                >
                    {triggerLabel}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg" aria-describedby="edit-user-desc">
                <DialogHeader>
                    <DialogTitle>Edit user</DialogTitle>
                    <DialogDescription id="edit-user-desc">
                        Update user details. Leave the password blank to keep the current password.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input {...form.register("name" as const)} className={fieldClass} />
                        {form.formState.errors.name && <p className={errorText}>{form.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input {...form.register("email" as const)} className={fieldClass} />
                        {form.formState.errors.email && <p className={errorText}>{form.formState.errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>New Password (optional)</Label>
                        <Input type="password" {...form.register("password" as const)} className={fieldClass} />
                        {form.formState.errors.password && <p className={errorText}>{form.formState.errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Company</Label>
                        <Select
                            defaultValue={user.companyId ?? NONE_VALUE}
                            onValueChange={(v) => form.setValue("companyId" as any, v)}
                        >
                            <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                                <SelectItem value={NONE_VALUE}>No company</SelectItem>
                                {companies.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.companyId && <p className={errorText}>{form.formState.errors.companyId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select defaultValue={user.role} onValueChange={(v) => form.setValue("role" as any, v)}>
                            <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="APPROVER">APPROVER</SelectItem>
                                <SelectItem value="USER">USER</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.formState.errors.role && <p className={errorText}>{form.formState.errors.role.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Approver</Label>
                        <Select
                            defaultValue={user.approverId ?? NONE_VALUE}
                            onValueChange={(v) => form.setValue("approverId" as any, v === NONE_VALUE ? NONE_VALUE : v)}
                        >
                            <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select approver" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                                <SelectItem value={NONE_VALUE}>No approver</SelectItem>
                                {approvers.map((a) => (
                                    <SelectItem
                                        key={a.id}
                                        value={a.id}
                                        disabled={excludeUserId ? a.id === excludeUserId : false}
                                        className={excludeUserId && a.id === excludeUserId ? "opacity-50 cursor-not-allowed" : ""}
                                    >
                                        {a.name}
                                        {excludeUserId && a.id === excludeUserId ? " (cannot select this user)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.approverId && <p className={errorText}>{form.formState.errors.approverId.message}</p>}
                        {excludeUserId && <p className="text-sm text-gray-500 mt-1">You cannot assign the user being edited as their own approver.</p>}
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

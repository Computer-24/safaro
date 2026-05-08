// components/admin/CreateUserModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";
import usersEvents from "@/lib/usersEvents";

const NONE_VALUE = "__none";

type CompanyOption = { id: string; name: string };
type ApproverOption = { id: string; name: string };

type Props = {
    companies: CompanyOption[];
    approvers: ApproverOption[];
    triggerLabel?: string;
};

type FormValues = {
    name: string;
    email: string;
    password: string;
    companyId: string;
    role: "USER" | "APPROVER" | "ADMIN";
    approverId?: string | null;
};

export default function CreateUserModal({ companies, approvers, triggerLabel = "Create User" }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        setError,
        clearErrors,
        formState,
    } = useForm<FormValues>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            companyId: NONE_VALUE,
            role: "USER",
            approverId: NONE_VALUE,
        },
    });

    const fieldClass = "h-10 min-h-[40px] w-full";
    const errorText = "text-sm text-red-500";

    async function onSubmit(values: FormValues) {
        toast.dismiss();
        clearErrors();

        // Client-side required checks (react-hook-form covers name/email/password)
        if (!values.companyId || values.companyId === NONE_VALUE) {
            setError("companyId" as any, { type: "manual", message: "Company is required" });
            toast.error("Company is required");
            return;
        }

        if (!values.role) {
            setError("role" as any, { type: "manual", message: "Role is required" });
            toast.error("Role is required");
            return;
        }

        setIsSaving(true);
        try {
            const payload: any = {
                name: values.name.trim(),
                email: values.email.trim(),
                // password is required here
                password: values.password.trim(),
                companyId: values.companyId === NONE_VALUE ? null : values.companyId,
                role: values.role,
                approverId: values.approverId === NONE_VALUE ? null : values.approverId,
            };

            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            // safe JSON parse
            let json: any = null;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                try {
                    json = await res.json();
                } catch (e) {
                    console.warn("CreateUserModal: response had no JSON body", e);
                }
            } else {
                const text = await res.text().catch(() => null);
                console.debug("CreateUserModal non-JSON response:", res.status, text);
            }

            if (!res.ok) {
                // map server validation errors if present
                if (json?.error && typeof json.error === "object") {
                    // set field errors where possible
                    for (const [k, v] of Object.entries(json.error)) {
                        const msg = Array.isArray(v) ? String(v[0]) : String(v);
                        // map to form fields if they exist
                        if (k === "companyId" || k === "approverId" || k === "email" || k === "password" || k === "name") {
                            setError(k as any, { type: "server", message: msg });
                        }
                    }
                    // show first error as toast
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

            toast.success("User created");
            setOpen(false);
            reset();
            router.refresh();
            usersEvents.dispatchEvent(new CustomEvent("users:created"));
        } catch (err: any) {
            console.error("CreateUserModal error:", err);
            toast.error(err?.message || "Create failed");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:opacity-90"
                    onClick={() => setOpen(true)}
                >
                    {triggerLabel}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create user</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            {...register("name", { required: "Name is required", validate: (v) => !!v.trim() || "Name is required" })}
                            className={fieldClass}
                        />
                        {formState.errors.name && <p className={errorText}>{formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            {...register("email", {
                                required: "Email is required",
                                validate: (v) => !!v.trim() || "Email is required",
                            })}
                            className={fieldClass}
                        />
                        {formState.errors.email && <p className={errorText}>{formState.errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            {...register("password", {
                                required: "Password is required",
                                validate: (v) => !!v.trim() || "Password is required",
                            })}
                            className={fieldClass}
                        />
                        {formState.errors.password && <p className={errorText}>{formState.errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Company</Label>
                        <Select
                            defaultValue={NONE_VALUE}
                            onValueChange={(v) => {
                                setValue("companyId", v as any);
                                if (v !== NONE_VALUE) clearErrors("companyId" as any);
                            }}
                        >
                            <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                                <SelectItem value={NONE_VALUE}>Select company</SelectItem>
                                {companies.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formState.errors.companyId && <p className={errorText}>{(formState.errors.companyId as any)?.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                            defaultValue="USER"
                            onValueChange={(v) => {
                                setValue("role", v as any);
                                if (v) clearErrors("role" as any);
                            }}
                        >
                            <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="APPROVER">APPROVER</SelectItem>
                                <SelectItem value="USER">USER</SelectItem>
                            </SelectContent>
                        </Select>
                        {formState.errors.role && <p className={errorText}>{(formState.errors.role as any)?.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Approver</Label>
                        <Select defaultValue={NONE_VALUE} onValueChange={(v) => setValue("approverId", v as any)}>
                            <SelectTrigger className={fieldClass}>
                                <SelectValue placeholder="Select approver" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                                <SelectItem value={NONE_VALUE}>No approver</SelectItem>
                                {approvers.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formState.errors.approverId && <p className={errorText}>{(formState.errors.approverId as any)?.message}</p>}
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
                                        clearErrors();
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

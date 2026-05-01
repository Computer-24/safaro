// components/companies/CompanyActiveSwitch.tsx
"use client";

import React from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

type Props = {
  id: string;
  initial: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSuccess?: (next: boolean) => void;
};

export default function CompanyActiveSwitch({
  id,
  initial,
  disabled = false,
  disabledReason,
  onSuccess,
}: Props) {
  const [checked, setChecked] = React.useState<boolean>(initial);
  const router = useRouter();
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    setChecked(initial);
  }, [initial]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeRefresh = () => {
    // Guard router action so it doesn't throw if router isn't ready or component unmounted
    try {
      if (typeof window === "undefined") return;
      if (!mountedRef.current) return;
      // startTransition avoids blocking UI and is the recommended pattern
      startTransition(() => {
        try {
          router.refresh();
        } catch (e) {
          // swallow router errors to avoid unhandled exceptions
          // optionally log in dev
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.debug("router.refresh() failed:", e);
          }
        }
      });
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug("safeRefresh guard caught:", e);
      }
    }
  };

  const handleToggle = async (next: boolean) => {
    try {
      const res = await fetch(`/api/admin/companies/${id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? "Unable to update company status.");
      }

      setChecked(next);
      toast.success(next ? "Company activated" : "Company deactivated");
      onSuccess?.(next);

      // Revalidate safely
      safeRefresh();
    } catch (err) {
      // Let ToggleSwitch handle rollback and show toast; rethrowing is optional
      // We rethrow so ToggleSwitch can catch it if it expects a rejection,
      // but ToggleSwitch must swallow it to avoid unhandledRejection.
      throw err;
    }
  };

  return (
    <div
      className="flex items-center justify-center"
      title={disabled && disabledReason ? disabledReason : undefined}
    >
      <ToggleSwitch
        checked={checked}
        disabled={disabled}
        ariaLabel={checked ? "Active" : "Inactive"}
        onToggle={handleToggle}
        onOptimisticChange={(n) => setChecked(n)}
      />
    </div>
  );
}

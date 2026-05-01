"use client";

import React from "react";
import { toast } from "sonner";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  initial: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSuccess?: (next: boolean) => void;
};

export default function UserActiveSwitch({
  id,
  initial,
  disabled = false,
  disabledReason,
  onSuccess,
}: Props) {
  const [checked, setChecked] = React.useState<boolean>(initial);
  const router = useRouter();

  React.useEffect(() => setChecked(initial), [initial]);

  const handleToggle = async (next: boolean) => {
    // perform the network call; throw on error so ToggleSwitch handles revert + toast
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? "Unable to update user status.");
      }

      // success path
      setChecked(next);
      toast.success(next ? "User activated" : "User deactivated");
      onSuccess?.(next);

      // Revalidate server data for the current route so list stays consistent after navigation
      router.refresh();
    } catch (err: any) {
      // Re-throw so ToggleSwitch can handle rollback and show a toast if desired
      throw new Error(err?.message ?? "Network error while updating user status.");
    }
  };

  // title attribute used to show disabledReason on hover; aria-describedby could be added if you render a tooltip element
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
        onOptimisticChange={(next) => setChecked(next)}
      />
    </div>
  );
}

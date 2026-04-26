// components/UserActiveSwitch.tsx
"use client";

import React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch"; // adjust path if needed

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
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => setChecked(initial), [initial]);

  const toggle = async (next: boolean) => {
    // STRONG GUARD: do nothing if disabled
    if (disabled) return;

    const prev = checked;
    setChecked(next); // optimistic
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });

      const data = await res.json();
      if (!res.ok) {
        setChecked(prev);
        toast.warning(data?.message || "Unable to update user status.");
        return;
      }

      toast.success(next ? "User activated" : "User deactivated");
      onSuccess?.(next);
    } catch {
      setChecked(prev);
      toast.error("Network error while updating user status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div
        className={
          "user-switch-wrapper min-w-[64px] flex-none px-2 py-1 overflow-visible " +
          (disabled ? "opacity-60 pointer-events-none" : "")
        }
        title={disabled ? disabledReason ?? "Action not allowed" : undefined}
        aria-hidden={false}
      >
        <Switch
          checked={checked}
          onCheckedChange={(v) => {
            if (disabled || loading) return;
            toggle(!!v);
          }}
          disabled={loading || disabled}
          aria-label={checked ? "Active" : "Inactive"}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          className={
            "user-switch-button relative inline-flex h-6 w-11 flex-none items-center rounded-full p-[2px] transition-colors " +
            (checked
              ? "bg-green-600 dark:bg-green-500"
              : "bg-gray-200 dark:bg-gray-700")
          }
          data-state={checked ? "checked" : "unchecked"}
        >
          <span
            className={
              "user-switch-knob block h-5 w-5 rounded-full bg-white shadow transform transition-transform " +
              (checked ? "translate-x-5 border border-transparent" : "translate-x-0 border border-gray-300 dark:border-gray-600")
            }
          />
        </Switch>
      </div>
    </div>
  );
}

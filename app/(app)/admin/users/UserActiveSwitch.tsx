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

// UserActiveSwitch.tsx — simplified centered layout
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
    if (disabled) return;
    const prev = checked;
    setChecked(next);
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
    <div className="flex items-center justify-center">
      <Switch
        checked={checked}
        onCheckedChange={(v) => {
          if (disabled || loading) return;
          toggle(!!v);
        }}
        disabled={loading || disabled}
        aria-label={checked ? "Active" : "Inactive"}
        style={{
          backgroundColor: checked ? "var(--primary)" : "var(--muted)",
        }}
        data-state={checked ? "checked" : "unchecked"}
      >
        <span
          className={
            "block h-5 w-5 rounded-full bg-white shadow transform transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </Switch>
    </div>
  );
}

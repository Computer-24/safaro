// components/ui/ToggleSwitch.tsx
"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export type ToggleSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  dataTestId?: string;
  onToggle?: (next: boolean) => Promise<void> | void;
  onOptimisticChange?: (next: boolean) => void;
};

export default function ToggleSwitch({
  checked: checkedProp,
  disabled = false,
  ariaLabel,
  className = "",
  dataTestId,
  onToggle,
  onOptimisticChange,
}: ToggleSwitchProps) {
  const [checked, setChecked] = React.useState<boolean>(checkedProp);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => setChecked(checkedProp), [checkedProp]);

  const handleChange = async (next: boolean) => {
    if (disabled || loading) return;

    const prev = checked;
    setChecked(next);
    onOptimisticChange?.(next);
    setLoading(true);

    try {
      // Normalize the onToggle result so synchronous throws and non-promises are handled
      const maybe = onToggle?.(next);
      await Promise.resolve(maybe);
    } catch (err: any) {
      // Rollback optimistic change
      setChecked(prev);
      onOptimisticChange?.(prev);

      // Show a helpful message (wrapper may also show its own toast)
      const message = err?.message ?? "Unable to update status";
      toast.error(message);

      // DO NOT rethrow here — swallowing prevents unhandledRejection in the browser
      // If you want the wrapper to also react, it can return a value or set state instead.
      console.debug("ToggleSwitch handled error:", message);
    } finally {
      // Always clear loading so the switch remains interactive
      setLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`} data-testid={dataTestId}>
      <Switch
        checked={checked}
        onCheckedChange={(v) => handleChange(!!v)}
        disabled={disabled || loading}
        aria-label={ariaLabel ?? (checked ? "Active" : "Inactive")}
        className={
          "relative inline-flex h-6 w-11 items-center rounded-full p-[2px] transition-colors " +
          (checked ? "bg-green-600" : "bg-gray-200")
        }
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

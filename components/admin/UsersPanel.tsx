// components/admin/UsersPanel.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, Suspense } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const UsersTable = dynamic(() => import("./UsersTable"), { ssr: false });

type ContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};
const UsersPanelContext = createContext<ContextType | null>(null);

export function UsersPanelProvider({ children, initialOpen = false }: { children: ReactNode; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const toggle = () => setOpen((s) => !s);
  return <UsersPanelContext.Provider value={{ open, setOpen, toggle }}>{children}</UsersPanelContext.Provider>;
}

export function useUsersPanel() {
  const ctx = useContext(UsersPanelContext);
  if (!ctx) throw new Error("useUsersPanel must be used inside UsersPanelProvider");
  return ctx;
}

/* Toggle button to place in Quick actions */
export function UsersToggleButton({ ariaControlsId = "company-users" }: { ariaControlsId?: string }) {
  const { open, toggle } = useUsersPanel();
  return (
    <Button
      onClick={toggle}
      size={"lg"}
      aria-expanded={open}
      aria-controls={ariaControlsId}
      className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
    >
      {open ? "Hide users" : "Show users"}
    </Button>
  );
}

/* Panel to place below the main section */
export function UsersPanel({ companyId, id = "company-users" }: { companyId: string; id?: string }) {
  const { open } = useUsersPanel();

  if (!open) return null;

  return (
    <div id={id} className="mt-6">
      <Suspense fallback={<div className="p-4">Loading users…</div>}>
        <UsersTable companyId={companyId} />
      </Suspense>
    </div>
  );
}

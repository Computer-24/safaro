// app/admin/companies/[id]/layout.tsx
import { SidebarLayout } from "@/components/SidebarLayout"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AppProviders } from "./providers"

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = session?.user.role ?? "USER"

  return (
    <AppProviders>
      <SidebarLayout role={role}>
        {children}
      </SidebarLayout>
    </AppProviders>
  )
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AppNav } from "@/components/app-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = session?.user.role ?? "USER"

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 p-6 overflow-x-auto">
        {children}
      </main>

      <AppNav role={role} />
    </div>
  )
}

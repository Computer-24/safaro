import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 relative flex items-center justify-center">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        {children}
      </div>
    </div>
  )
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

import UserDashboard from "./UserDashboard"
import ApproverDashboard from "./ApproverDashboard"
import AdminDashboard from "./AdminDashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user.role

  return (
    <>
      {role === "ADMIN" && <AdminDashboard />}
      {role === "APPROVER" && <ApproverDashboard />}
      {role === "USER" && <UserDashboard />}
    </>
  )
}

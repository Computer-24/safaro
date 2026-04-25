export default function CompaniesPage() {
  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>

      <p className="text-muted-foreground">
        Manage all registered companies in the Safaro platform.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-2">Company Overview</h2>
          <p className="text-sm text-muted-foreground">
            This is a placeholder card. Add charts, stats, or summaries here.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-2">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">
            Another placeholder card. Add logs or updates here.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Company List</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Location</th>
                <th className="py-2 text-left">Employees</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Acme Corp</td>
                <td className="py-2">Riyadh</td>
                <td className="py-2">120</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">GlobalTech</td>
                <td className="py-2">Dammam</td>
                <td className="py-2">85</td>
              </tr>
              <tr>
                <td className="py-2">Desert Logistics</td>
                <td className="py-2">Jeddah</td>
                <td className="py-2">40</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

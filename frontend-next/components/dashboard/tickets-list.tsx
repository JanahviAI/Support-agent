'use client'

interface Ticket {
  id: string
  ticketId: string
  employeeId: string
  issueType: string
  description: string
  status: string
  priority: string
  createdAt: string
}

interface TicketsListProps {
  tickets: Ticket[]
}

const statusConfig = {
  open: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-900 dark:text-blue-100', label: 'Open' },
  resolved: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-900 dark:text-green-100', label: 'Resolved' },
  pending_approval: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-900 dark:text-yellow-100', label: 'Pending Approval' },
  approval_pending: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-900 dark:text-yellow-100', label: 'Pending Approval' },
  escalated: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-900 dark:text-orange-100', label: 'Escalated' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-900 dark:text-red-100', label: 'Rejected' },
}

const priorityConfig = {
  low: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-900 dark:text-gray-100', label: 'Low' },
  normal: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-900 dark:text-blue-100', label: 'Normal' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-900 dark:text-blue-100', label: 'Medium' },
  high: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-900 dark:text-red-100', label: 'High' },
  critical: { bg: 'bg-red-200 dark:bg-red-800', text: 'text-red-900 dark:text-red-100', label: 'Critical' },
}

export default function TicketsList({ tickets }: TicketsListProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-muted-foreground">No tickets found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {tickets.map(ticket => {
        const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.open
        const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium

        return (
          <div key={ticket.id} className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">
                  {ticket.id}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ticket.issueType}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}>
                  {priority.label}
                </span>
              </div>
            </div>

            <div className="mb-3 space-y-1">
              <p className="text-sm">
                <span className="font-medium">Employee ID:</span> {ticket.employeeId}
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {ticket.description}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
              <span>Ticket #{ticket.ticketId}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

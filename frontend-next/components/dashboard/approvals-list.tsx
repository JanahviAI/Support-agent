'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
interface Approval {
  id: string
  employeeName: string
  actionType: string
  agentReasoning: string
  ticketId: string
}
import { CheckCircleIcon, XCircleIcon, LoaderIcon } from 'lucide-react'

interface ApprovalsListProps {
  approvals: Approval[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export default function ApprovalsList({
  approvals,
  onApprove,
  onReject,
}: ApprovalsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onApprove(id)
    setLoadingId(null)
  }

  const handleReject = async (id: string) => {
    setLoadingId(id)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onReject(id)
    setLoadingId(null)
  }

  if (approvals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-muted-foreground">No pending approvals</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {approvals.map(approval => (
        <div
          key={approval.id}
          className="rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{approval.employeeName}</h3>
              <p className="text-sm text-muted-foreground">{approval.actionType}</p>
            </div>
            <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-900 dark:bg-orange-900 dark:text-orange-100">
              Pending Review
            </span>
          </div>

          <div className="mb-4 space-y-2 rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Agent Reasoning:</p>
            <p className="text-sm">{approval.agentReasoning}</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleApprove(approval.id)}
              disabled={loadingId !== null}
              variant="default"
              size="sm"
              className="flex-1 gap-2"
            >
              {loadingId === approval.id ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              onClick={() => handleReject(approval.id)}
              disabled={loadingId !== null}
              variant="destructive"
              size="sm"
              className="flex-1 gap-2"
            >
              {loadingId === approval.id ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <XCircleIcon className="h-4 w-4" />
              )}
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

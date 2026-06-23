'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import TicketForm from '@/components/dashboard/ticket-form'
import TicketsList from '@/components/dashboard/tickets-list'
import ApprovalsList from '@/components/dashboard/approvals-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const API = 'http://localhost:8000'

// Match the shape V0's components expect
interface Ticket {
  id: string
  ticketId: string
  employeeId: string
  issueType: string
  description: string
  status: 'open' | 'resolved' | 'pending_approval' | 'escalated'
  priority: 'low' | 'normal' | 'high'
  createdAt: string
}

interface Approval {
  id: string
  employeeName: string
  actionType: string
  agentReasoning: string
  ticketId: string
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<'submit' | 'tickets' | 'approvals'>('submit')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [agentResponse, setAgentResponse] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const fetchData = async () => {
    try {
      const [ticketsRes, approvalsRes] = await Promise.all([
        fetch(`${API}/tickets`),
        fetch(`${API}/approvals/pending`)
      ])
      const ticketsData = await ticketsRes.json()
      const approvalsData = await approvalsRes.json()

      // Map backend shape to what V0 components expect
      setTickets(ticketsData.map((t: any) => ({
        id: `#${t.id}`,
        ticketId: String(t.id),
        employeeId: String(t.employee_id),
        issueType: t.issue_type.replace('_', ' '),
        description: t.description,
        status: t.status,
        priority: t.priority === 'normal' ? 'normal' : t.priority,
        createdAt: t.created_at,
      })))

      setApprovals(approvalsData.map((a: any) => ({
        id: String(a.id),
        employeeName: a.action_payload?.employee_name || 'Unknown',
        actionType: a.action_type.replace('_', ' '),
        agentReasoning: a.agent_reasoning,
        ticketId: String(a.ticket_id),
      })))
    } catch (e) {
      console.error('Failed to fetch data:', e)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleTicketSubmit = async (formData: {
    ticketId: string
    employeeId: string
    issueDescription: string
  }) => {
    setAgentResponse(null)
    const res = await fetch(`${API}/tickets/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: parseInt(formData.ticketId),
        employee_id: parseInt(formData.employeeId),
        description: formData.issueDescription,
      })
    })
    const data = await res.json()
    setAgentResponse(data.response)
    fetchData() // refresh tickets and approvals
  }

  const handleApprove = async (id: string) => {
    await fetch(`${API}/approvals/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved' })
    })
    fetchData()
  }

  const handleReject = async (id: string) => {
    await fetch(`${API}/approvals/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'rejected' })
    })
    fetchData()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Helpdesk Dashboard</h1>
          <p className="text-muted-foreground">Manage support tickets and approvals</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submit">Submit Ticket</TabsTrigger>
            <TabsTrigger value="tickets">
              All Tickets {!loadingData && `(${tickets.length})`}
            </TabsTrigger>
            <TabsTrigger value="approvals">
              Pending Approvals
              {approvals.length > 0 && (
                <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                  {approvals.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="space-y-4">
            <TicketForm onSubmit={handleTicketSubmit} />
            {agentResponse && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <h3 className="mb-2 font-semibold text-green-900 dark:text-green-100">Agent Response</h3>
                <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{agentResponse}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {loadingData ? (
              <p className="text-muted-foreground text-sm">Loading tickets...</p>
            ) : (
              <TicketsList tickets={tickets} />
            )}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            {loadingData ? (
              <p className="text-muted-foreground text-sm">Loading approvals...</p>
            ) : approvals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <p className="text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <ApprovalsList approvals={approvals} onApprove={handleApprove} onReject={handleReject} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import TicketForm from '@/components/dashboard/ticket-form'
import TicketsList from '@/components/dashboard/tickets-list'
import ApprovalsList from '@/components/dashboard/approvals-list'
import { Tabs, TabsContent } from '@/components/ui/tabs'

const API = 'http://localhost:8000'

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
  const [activeTab, setActiveTab] = useState<string>('submit')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [agentResponse, setAgentResponse] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.replace('/login')
    }
  }, [])
  
  const fetchData = async () => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    if (!token) return

    try {
      const headers = { 'Authorization': `Bearer ${token}` }

      const ticketsRes = await fetch(`${API}/tickets`, { headers })

      const approvalsRes = role === 'admin'
        ? await fetch(`${API}/approvals/pending`, { headers })
        : null

      const ticketsData = await ticketsRes.json()
      const approvalsData = approvalsRes ? await approvalsRes.json() : []

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

      setApprovals(approvalsData.map((a: any) => {
        const payload = typeof a.action_payload === 'string'
          ? JSON.parse(a.action_payload)
          : a.action_payload
        return {
          id: String(a.id),
          employeeName: payload?.employee_name || `Employee ${payload?.employee_id}`,
          actionType: a.action_type.replace('_', ' '),
          agentReasoning: a.agent_reasoning,
          ticketId: String(a.ticket_id),
        }
      }))
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
    const token = localStorage.getItem('token')
    setAgentResponse(null)
    const res = await fetch(`${API}/tickets/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ticket_id: parseInt(formData.ticketId),
        employee_id: parseInt(formData.employeeId),
        description: formData.issueDescription,
      })
    })
    const data = await res.json()
    setAgentResponse(data.response)
    fetchData()
  }

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('token')
    await fetch(`${API}/approvals/${id}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ decision: 'approved' })
    })
    fetchData()
  }

  const handleReject = async (id: string) => {
    const token = localStorage.getItem('token')
    await fetch(`${API}/approvals/${id}/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ decision: 'rejected' })
    })
    fetchData()
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Helpdesk Dashboard</h1>
          <p className="text-muted-foreground">Manage support tickets and approvals</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full">
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
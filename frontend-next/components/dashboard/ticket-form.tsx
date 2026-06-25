'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LoaderIcon } from 'lucide-react'

const API = 'http://localhost:8000'

interface Employee {
  id: number
  name: string
  department: string
  role: string
}

interface TicketFormProps {
  onSubmit: (data: {
    ticketId: string
    employeeId: string
    issueDescription: string
  }) => Promise<void>
}

export default function TicketForm({ onSubmit }: TicketFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userRole = localStorage.getItem('role')
    const employeeId = localStorage.getItem('employee_id')

    setRole(userRole)

    fetch(`${API}/employees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then((data) => {
        setEmployees(data)
        if (userRole === 'employee' && employeeId) {
          setSelectedEmployee(employeeId)
        }
      })
      .catch(() => setError('Could not load employees'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee || !issueDescription.trim()) {
      setError('Please select an employee and describe the issue')
      return
    }
    if (issueDescription.length < 10) {
      setError('Issue description must be at least 10 characters')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/tickets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: parseInt(selectedEmployee),
          description: issueDescription
        })
      })
      const data = await res.json()
      await onSubmit({
        ticketId: String(data.ticket_id),
        employeeId: selectedEmployee,
        issueDescription
      })
      setIssueDescription('')
      if (role === 'admin') setSelectedEmployee('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-6 text-xl font-semibold">Create New Support Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Employee</label>
          {role === 'admin' ? (
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select an employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.role}, {emp.department}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              disabled
              value={employees.find(e => String(e.id) === selectedEmployee)?.name || 'Loading...'}
              className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Issue Description</label>
          <textarea
            placeholder="Describe the issue in detail..."
            value={issueDescription}
            onChange={e => setIssueDescription(e.target.value)}
            disabled={isLoading}
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Submit Ticket'
          )}
        </Button>
      </form>
    </div>
  )
}
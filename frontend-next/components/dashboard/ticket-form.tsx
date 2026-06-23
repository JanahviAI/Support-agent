'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoaderIcon } from 'lucide-react'

interface TicketFormProps {
  onSubmit: (data: {
    ticketId: string
    employeeId: string
    issueDescription: string
  }) => Promise<void>
}

export default function TicketForm({ onSubmit }: TicketFormProps) {
  const [formData, setFormData] = useState({
    ticketId: '',
    employeeId: '',
    issueDescription: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.ticketId.trim()) {
      newErrors.ticketId = 'Ticket ID is required'
    }
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required'
    }
    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = 'Issue description is required'
    } else if (formData.issueDescription.length < 10) {
      newErrors.issueDescription = 'Issue description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(formData)
      setFormData({ ticketId: '', employeeId: '', issueDescription: '' })
      setErrors({})
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-6 text-xl font-semibold">Create New Support Ticket</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="ticketId" className="block text-sm font-medium">
              Ticket ID
            </label>
            <input
              id="ticketId"
              name="ticketId"
              type="text"
              placeholder="e.g., TK-001"
              value={formData.ticketId}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.ticketId && <p className="text-xs text-destructive">{errors.ticketId}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="employeeId" className="block text-sm font-medium">
              Employee ID
            </label>
            <input
              id="employeeId"
              name="employeeId"
              type="text"
              placeholder="e.g., EMP-2024"
              value={formData.employeeId}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="issueDescription" className="block text-sm font-medium">
            Issue Description
          </label>
          <textarea
            id="issueDescription"
            name="issueDescription"
            placeholder="Describe the issue in detail..."
            value={formData.issueDescription}
            onChange={handleChange}
            disabled={isLoading}
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.issueDescription && (
            <p className="text-xs text-destructive">{errors.issueDescription}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
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

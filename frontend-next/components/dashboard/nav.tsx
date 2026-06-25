'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  TicketIcon,
  CheckCircleIcon,
  MenuIcon,
  XIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
} from 'lucide-react'

const API = 'http://localhost:8000'

interface HelpdeskNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function HelpdeskNav({ activeTab, onTabChange }: HelpdeskNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [backendOnline, setBackendOnline] = useState(false)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API}/`)
        setBackendOnline(res.ok)
      } catch {
        setBackendOnline(false)
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 10000) // recheck every 10s
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { label: 'Dashboard', tab: 'submit', icon: LayoutDashboardIcon },
    { label: 'Submit Ticket', tab: 'submit', icon: PlusCircleIcon },
    { label: 'All Tickets', tab: 'tickets', icon: TicketIcon },
    { label: 'Approvals', tab: 'approvals', icon: CheckCircleIcon },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <div className="flex items-center justify-between border-b border-border bg-card p-4 md:hidden">
        <h1 className="font-semibold">IT Helpdesk</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0"
        >
          {isOpen ? <XIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'block' : 'hidden'
        } fixed left-0 top-0 z-40 h-full w-64 border-r border-border bg-card md:sticky md:block md:top-0`}
        style={{ paddingTop: isOpen ? '60px' : '0' }}
      >
        <div className="space-y-4 p-4">
          <div className="hidden py-4 md:block">
            <h1 className="text-xl font-bold">IT Helpdesk</h1>
            <p className="text-sm text-muted-foreground">AI Agent Dashboard</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.tab
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    onTabChange(item.tab)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="border-t border-border pt-4">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">System Status</p>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-muted-foreground">
                  {backendOnline ? 'AI Agent Online' : 'Agent Offline'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-muted-foreground">
                  {backendOnline ? 'Database Connected' : 'Database Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
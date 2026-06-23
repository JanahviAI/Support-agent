'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  TicketIcon,
  CheckCircleIcon,
  MenuIcon,
  XIcon,
  LayoutDashboardIcon,
} from 'lucide-react'

export function HelpdeskNav() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    {
      label: 'Dashboard',
      href: '#',
      icon: LayoutDashboardIcon,
    },
    {
      label: 'Submit Ticket',
      href: '#submit',
      icon: TicketIcon,
    },
    {
      label: 'All Tickets',
      href: '#tickets',
      icon: TicketIcon,
    },
    {
      label: 'Approvals',
      href: '#approvals',
      icon: CheckCircleIcon,
    },
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
              return (
                <Link key={item.href} href={item.href}>
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border pt-4">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">System Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">AI Agent Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Database Connected</span>
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

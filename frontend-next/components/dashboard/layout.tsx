import React from 'react'
import { HelpdeskNav } from './nav'

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <HelpdeskNav activeTab={activeTab} onTabChange={onTabChange} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
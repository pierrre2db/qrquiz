import AdminSidebar from '@/components/AdminSidebar'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <AdminSidebar />
      <main className="flex-1 p-5 overflow-auto">
        {children}
      </main>
    </div>
  )
}

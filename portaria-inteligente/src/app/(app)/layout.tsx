import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-56">
        <main className="p-4 md:p-6 pt-12 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}

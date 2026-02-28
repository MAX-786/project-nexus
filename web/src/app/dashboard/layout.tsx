import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Ensure user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="flex h-screen flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-2 font-bold">
          <span className="text-blue-600">✦</span> Nexus Dashboard
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button className="text-sm font-medium hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}

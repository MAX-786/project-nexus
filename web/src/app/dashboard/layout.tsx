import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Brain, Rss, Network, GraduationCap, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import NavTab from '@/components/dashboard/nav-tab'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const initials = (user.email ?? '?')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)] group-hover:shadow-[oklch(0.637_0.237_275/40%)] transition-shadow">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Nexus
            </span>
          </Link>

          {/* Navigation Tabs — uses client NavTab for active state */}
          <nav className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
            <NavTab href="/dashboard/feed" icon={<Rss className="h-4 w-4" />} label="Feed" />
            <NavTab href="/dashboard/graph" icon={<Network className="h-4 w-4" />} label="Graph" />
            <NavTab href="/dashboard/review" icon={<GraduationCap className="h-4 w-4" />} label="Review" />
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 border border-border">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{user.email}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5" />

            <form action="/auth/signout" method="post">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Sign out</TooltipContent>
              </Tooltip>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}


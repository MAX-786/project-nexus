import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Brain, Rss, Network, GraduationCap, LogOut, Settings, Menu } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import NavTab from '@/components/dashboard/nav-tab'
import AuthProvider from '@/components/providers/auth-provider'
import DashboardStats from '@/components/dashboard/dashboard-stats'
import CommandSearch from '@/components/dashboard/command-search'
import ThemeToggle from '@/components/dashboard/theme-toggle'
import OnboardingDialog from '@/components/dashboard/onboarding-dialog'

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

  // Fetch count of reviews due today or earlier for stats bar
  const now = new Date().toISOString()
  const { count: dueCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_date', now)

  const initials = (user.email ?? '?')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  const authUser = { id: user.id, email: user.email ?? '' }

  return (
    <AuthProvider user={authUser}>
      <div className="flex h-screen flex-col bg-background">
        {/* Dashboard Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6 gap-4">
            <div className="flex items-center gap-4 shrink-0">
              {/* Mobile Menu Toggle */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-6 flex flex-col gap-6">
                    <SheetHeader className="text-left">
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    
                    {/* Mobile Navigation */}
                    <nav className="flex flex-col gap-2">
                      <NavTab href="/dashboard/feed" icon={<Rss className="h-4 w-4" />} label="Feed" />
                      <NavTab href="/dashboard/graph" icon={<Network className="h-4 w-4" />} label="Graph" />
                      <NavTab href="/dashboard/review" icon={<GraduationCap className="h-4 w-4" />} label="Review" />
                    </nav>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle />
                    </div>

                    <div className="mt-auto pb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                      <form action="/auth/signout" method="post">
                        <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </form>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)] group-hover:shadow-[oklch(0.637_0.237_275/40%)] transition-shadow">
                  <Brain className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Nexus
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center min-w-0">
              <nav className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
                <NavTab href="/dashboard/feed" icon={<Rss className="h-4 w-4" />} label="Feed" />
                <NavTab href="/dashboard/graph" icon={<Network className="h-4 w-4" />} label="Graph" />
                <NavTab href="/dashboard/review" icon={<GraduationCap className="h-4 w-4" />} label="Review" />
              </nav>
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Global Search — Cmd+K command palette */}
              <CommandSearch />

              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground hidden lg:inline">
                        {user.email}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{user.email}</TooltipContent>
                </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
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
          </div>
        </header>

        {/* Stats Bar */}
        <DashboardStats dueCount={dueCount ?? 0} />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
        <OnboardingDialog />
      </div>
    </AuthProvider>
  )
}

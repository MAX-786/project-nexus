import type { DBUserSettings } from '@nexus/shared'
import { Brain, Rss, Network, GraduationCap, Sparkles, LogOut, Settings, Menu } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import CommandSearch from '@/components/dashboard/command-search'
import DashboardStats from '@/components/dashboard/dashboard-stats'
import { KeyboardShortcutsHint, KeyboardShortcutsProvider } from '@/components/dashboard/keyboard-shortcuts-provider'
import MobileBottomNav from '@/components/dashboard/mobile-bottom-nav'
import NavTab from '@/components/dashboard/nav-tab'
import OnboardingDialog from '@/components/dashboard/onboarding-dialog'
import { SettingsProvider } from '@/components/dashboard/settings-provider'
import ThemeToggle from '@/components/dashboard/theme-toggle'
import AuthProvider from '@/components/providers/auth-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient } from '@/utils/supabase/server'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

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

  // Fetch user settings
  const { data: settingsData } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const settings: DBUserSettings = settingsData || {
    user_id: user.id,
    shortcuts_enabled: true,
    custom_shortcuts: {},
    updated_at: new Date().toISOString()
  }

  const initials = (user.email ?? '?')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  const authUser = { id: user.id, email: user.email ?? '' }

  return (
    <AuthProvider user={authUser}>
      <SettingsProvider initialSettings={settings}>
        <div className="flex h-screen flex-col bg-background">
          {/* Skip to main content — keyboard/screen reader shortcut */}
          <a href="#main-content" className="skip-nav">
            Skip to main content
          </a>

          {/* Dashboard Header */}
          <header
            className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
            role="banner"
          >
          <div className="flex h-14 items-center justify-between px-4 sm:px-6 gap-4">
            <div className="flex items-center gap-4 shrink-0">
              {/* Mobile Menu Toggle */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open navigation menu">
                      <Menu className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-6 flex flex-col gap-6">
                    <SheetHeader className="text-left">
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    
                    {/* Mobile Navigation */}
                    <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
                      <NavTab href="/dashboard/feed" icon={<Rss className="h-4 w-4" aria-hidden="true" />} label="Feed" />
                      <NavTab href="/dashboard/graph" icon={<Network className="h-4 w-4" aria-hidden="true" />} label="Graph" />
                      <NavTab href="/dashboard/review" icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />} label="Review" />
                      <NavTab href="/dashboard/memory" icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Memory" />
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
                        <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" aria-label="Sign out of Nexus">
                          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                          Sign out
                        </Button>
                      </form>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2.5 group" aria-label="Nexus — go to dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)] group-hover:shadow-[oklch(0.637_0.237_275/40%)] transition-shadow" aria-hidden="true">
                  <Brain className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Nexus
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center min-w-0">
              <nav className="flex items-center gap-1 rounded-xl bg-muted/50 p-1" aria-label="Main navigation">
                <NavTab href="/dashboard/feed" icon={<Rss className="h-4 w-4" aria-hidden="true" />} label="Feed" />
                <NavTab href="/dashboard/graph" icon={<Network className="h-4 w-4" aria-hidden="true" />} label="Graph" />
                <NavTab href="/dashboard/review" icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />} label="Review" />
                <NavTab href="/dashboard/memory" icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Memory" />
              </nav>
            </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Global Search — Cmd+K command palette */}
                <CommandSearch />

                <div className="hidden md:flex items-center gap-3">
                  <ThemeToggle />
                  <KeyboardShortcutsHint />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2" role="status" aria-label={`Signed in as ${user.email}`}>
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground hidden lg:inline" aria-hidden="true">
                        {user.email}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{user.email}</TooltipContent>
                </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild aria-label="Settings">
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>

                <Separator orientation="vertical" className="h-5" aria-hidden="true" />

                  <form action="/auth/signout" method="post">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Sign out of Nexus">
                          <LogOut className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Sign out</TooltipContent>
                    </Tooltip>
                  </form>
                </div>

                {/* Mobile: settings link */}
                <div className="md:hidden flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                        <Link href="/dashboard/settings">
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Settings</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Settings</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </header>

          {/* Stats Bar */}
          <DashboardStats dueCount={dueCount ?? 0} />

          {/* Main Content — extra bottom padding on mobile for the fixed bottom nav */}
          <main id="main-content" className="flex-1 overflow-hidden pb-16 md:pb-0" tabIndex={-1}>
            {children}
          </main>

          {/* Mobile Bottom Tab Navigation */}
          <MobileBottomNav />

          <OnboardingDialog />
          <KeyboardShortcutsProvider />
        </div>
      </SettingsProvider>
    </AuthProvider>
  )
}

import { login } from './actions'
import Link from 'next/link'
import { Brain, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      {/* Background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.637_0.237_275/6%)_0%,transparent_50%)]" />

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)]">
              <Brain className="h-5 w-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your Nexus account</p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10">
          <CardContent className="pt-6">
            <form className="space-y-4" action={login}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="flex h-10 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="flex h-10 w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                Sign In <ArrowRight className="h-4 w-4" />
              </Button>

              {searchParams?.message && (
                <p className="p-3 bg-destructive/10 text-destructive text-sm text-center rounded-lg border border-destructive/20">
                  {searchParams.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-sm text-center text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

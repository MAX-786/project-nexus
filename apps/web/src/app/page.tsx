import Link from 'next/link'
import { Brain, Sparkles, Network, GraduationCap, ArrowRight, ChevronRight, Lock, Zap, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)]">
              <Brain className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Nexus</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" className="gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="gap-1">
                    Get Started <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.637_0.237_275/8%)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center px-6 pt-24 pb-20 relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Open Source · Privacy First · BYOK
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Your Second Brain.{' '}
            <span className="bg-gradient-to-r from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] bg-clip-text text-transparent">
              Not Big Tech&apos;s.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Nexus auto-summarizes web content, builds a visual knowledge graph,
            and tests your memory with spaced repetition — all while giving you
            100% control over your data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/25">
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/25">
                  Start for Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="https://github.com" target="_blank">
              <Button variant="outline" size="lg" className="gap-2 px-8 border-border/50">
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three powerful features that transform how you learn from the web.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="AI Capture"
            description="One click captures the page. AI generates a structured summary and extracts key concepts, people, and technologies."
            step="1"
          />
          <FeatureCard
            icon={<Network className="h-6 w-6" />}
            title="Knowledge Graph"
            description="Pages are automatically linked using semantic similarity. Explore a visual graph of your connected knowledge."
            step="2"
          />
          <FeatureCard
            icon={<GraduationCap className="h-6 w-6" />}
            title="Spaced Repetition"
            description="Flashcard-style reviews using the SuperMemo-2 algorithm ensure you actually remember what you save."
            step="3"
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Open Core Pricing</h2>
          <p className="text-muted-foreground">Free forever. Upgrade when you need cloud sync.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard
            tier="Hacker"
            price="Free"
            description="Open source, BYOK, local or self-hosted."
            features={['Bring your own API keys', 'Local browser storage', 'Full source code access', 'Community support']}
            isLoggedIn={isLoggedIn}
          />
          <PricingCard
            tier="Nexus Cloud"
            price="$5/mo"
            description="BYOK + managed cloud hosting."
            features={['Everything in Hacker', 'Managed Supabase DB', 'Cross-device syncing', 'Automatic backups']}
            highlighted
            isLoggedIn={isLoggedIn}
          />
          <PricingCard
            tier="Nexus Pro"
            price="$15/mo"
            description="Frictionless. No API keys needed."
            features={['Everything in Cloud', 'Our API keys included', 'Priority features', 'Premium support']}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12">
          <h2 className="text-2xl font-bold mb-3">
            {isLoggedIn ? 'Your second brain is ready.' : 'Ready to build your second brain?'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isLoggedIn
              ? 'Open the dashboard and start exploring your knowledge graph.'
              : 'Start capturing knowledge in under 2 minutes.'}
          </p>
          <Link href={isLoggedIn ? '/dashboard' : '/signup'}>
            <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/25">
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span>Nexus · Open Source Knowledge Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Privacy-first · BYOK</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, step }: { icon: React.ReactNode; title: string; description: string; step: string }) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card/80 transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors">
          {icon}
        </div>
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
          {step}
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function PricingCard({
  tier,
  price,
  description,
  features,
  highlighted = false,
  isLoggedIn = false,
}: {
  tier: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
  isLoggedIn?: boolean
}) {
  return (
    <div className={`rounded-xl border p-6 flex flex-col ${highlighted ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10 relative' : 'border-border/50 bg-card/50'}`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
          Popular
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{tier}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="text-3xl font-bold mb-6">{price}</div>
      <ul className="space-y-2 flex-1 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link href={isLoggedIn ? '/dashboard' : '/signup'}>
        <Button variant={highlighted ? 'default' : 'outline'} className="w-full">
          {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
        </Button>
      </Link>
    </div>
  )
}

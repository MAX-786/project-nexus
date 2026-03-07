import {
  Brain,
  Sparkles,
  Network,
  GraduationCap,
  ArrowRight,
  ChevronRight,
  Lock,
  Zap,
  LayoutDashboard,
  Github,
  Twitter,
  Star,
  Shield,
  Code2,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/server'

const CURRENT_YEAR = new Date().getFullYear()

const SOCIAL_PROOF_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
]

const CONTRIBUTOR_GRADIENTS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-700',
  'from-emerald-400 to-green-600',
  'from-orange-400 to-red-600',
  'from-pink-400 to-rose-600',
  'from-cyan-400 to-teal-600',
  'from-amber-400 to-yellow-600',
  'from-fuchsia-500 to-pink-700',
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)]">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Nexus</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#open-source" className="hover:text-foreground transition-colors">Open Source</Link>
            <Link href="https://github.com/project-nexus/nexus" target="_blank" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Github className="h-3.5 w-3.5" /> GitHub
            </Link>
          </nav>
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
      <section className="relative overflow-hidden min-h-[calc(100vh-3.5rem)] flex items-center">
        {/* Animated gradient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,oklch(0.637_0.237_275/12%)_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,oklch(0.7_0.2_310/10%)_0%,transparent_50%),radial-gradient(ellipse_at_50%_50%,oklch(0.637_0.237_275/5%)_0%,transparent_70%)] animate-nexus-gradient" />

        {/* Floating network SVG illustration */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <svg className="absolute right-0 top-0 w-[600px] h-[600px] opacity-20" viewBox="0 0 600 600" fill="none">
            {/* Connection lines */}
            <line x1="300" y1="180" x2="460" y2="280" stroke="oklch(0.637 0.237 275)" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="300" y1="180" x2="160" y2="290" stroke="oklch(0.637 0.237 275)" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="460" y1="280" x2="400" y2="420" stroke="oklch(0.7 0.2 310)" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="160" y1="290" x2="220" y2="420" stroke="oklch(0.7 0.2 310)" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="400" y1="420" x2="220" y2="420" stroke="oklch(0.637 0.237 275)" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="460" y1="280" x2="520" y2="160" stroke="oklch(0.637 0.237 275)" strokeWidth="1" strokeDasharray="4 6" />
            <line x1="160" y1="290" x2="100" y2="160" stroke="oklch(0.7 0.2 310)" strokeWidth="1" strokeDasharray="4 6" />
            {/* Animated nodes */}
            <circle cx="300" cy="180" r="10" fill="oklch(0.637 0.237 275 / 80%)" className="animate-nexus-float" />
            <circle cx="460" cy="280" r="7" fill="oklch(0.7 0.2 310 / 70%)" className="animate-nexus-float-delay" />
            <circle cx="160" cy="290" r="8" fill="oklch(0.637 0.237 275 / 60%)" className="animate-nexus-float-slow" />
            <circle cx="400" cy="420" r="6" fill="oklch(0.7 0.2 310 / 60%)" className="animate-nexus-float-delay-2" />
            <circle cx="220" cy="420" r="9" fill="oklch(0.637 0.237 275 / 70%)" className="animate-nexus-float" />
            <circle cx="520" cy="160" r="5" fill="oklch(0.7 0.2 310 / 50%)" className="animate-nexus-float-slow" />
            <circle cx="100" cy="160" r="6" fill="oklch(0.637 0.237 275 / 50%)" className="animate-nexus-float-delay" />
            {/* Outer ring */}
            <circle cx="300" cy="300" r="180" stroke="oklch(0.637 0.237 275 / 15%)" strokeWidth="1" strokeDasharray="8 6" className="animate-nexus-spin-slow" />
            <circle cx="300" cy="300" r="220" stroke="oklch(0.7 0.2 310 / 10%)" strokeWidth="1" strokeDasharray="4 8" />
          </svg>

          {/* Left side floating nodes */}
          <svg className="absolute left-0 bottom-0 w-[400px] h-[400px] opacity-15" viewBox="0 0 400 400" fill="none">
            <line x1="80" y1="200" x2="200" y2="140" stroke="oklch(0.637 0.237 275)" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="200" y1="140" x2="320" y2="200" stroke="oklch(0.7 0.2 310)" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="80" y1="200" x2="150" y2="300" stroke="oklch(0.637 0.237 275)" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="80" cy="200" r="8" fill="oklch(0.637 0.237 275 / 70%)" className="animate-nexus-float-slow" />
            <circle cx="200" cy="140" r="10" fill="oklch(0.7 0.2 310 / 70%)" className="animate-nexus-float-delay" />
            <circle cx="320" cy="200" r="7" fill="oklch(0.637 0.237 275 / 60%)" className="animate-nexus-float" />
            <circle cx="150" cy="300" r="5" fill="oklch(0.7 0.2 310 / 50%)" className="animate-nexus-float-delay-2" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center px-6 pt-16 pb-24 relative z-10 w-full">
          {/* Badge row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 animate-nexus-fade-in">
            <Badge variant="outline" className="gap-1.5 border-border/60 bg-muted/40 text-xs">
              <Code2 className="h-3 w-3 text-primary" /> MIT License
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-border/60 bg-muted/40 text-xs">
              <Github className="h-3 w-3 text-primary" /> Open Source
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-border/60 bg-muted/40 text-xs">
              <Shield className="h-3 w-3 text-primary" /> Privacy First
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-border/60 bg-muted/40 text-xs">
              <Lock className="h-3 w-3 text-primary" /> BYOK
            </Badge>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.08] mb-6 animate-nexus-fade-in">
            Your Second Brain.{' '}
            <span className="bg-gradient-to-r from-[oklch(0.637_0.237_275)] via-[oklch(0.68_0.22_290)] to-[oklch(0.7_0.2_310)] bg-clip-text text-transparent animate-nexus-gradient">
              Not Big Tech&apos;s.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-nexus-fade-in">
            Nexus auto-summarizes web content, builds a visual knowledge graph,
            and tests your memory with spaced repetition — all while giving you
            100% control over your data.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-nexus-fade-in">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 px-10 h-12 text-base shadow-xl shadow-primary/30 animate-nexus-glow">
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-10 h-12 text-base shadow-xl shadow-primary/30 animate-nexus-glow">
                  Start for Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="https://github.com/project-nexus/nexus" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2 px-8 h-12 text-base border-border/60 hover:border-primary/40">
                <Github className="h-4 w-4" />
                View on GitHub
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <Star className="h-3 w-3 fill-current text-yellow-500" /> 100+
                </span>
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 animate-nexus-fade-in">
            <div className="flex -space-x-2">
              {SOCIAL_PROOF_GRADIENTS.map((gradient, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-background ring-1 ring-border/20`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted by <span className="font-semibold text-foreground">500+</span> developers
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-primary/5 text-primary text-xs">
            <Sparkles className="h-3 w-3" /> How it works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Three steps to a smarter you</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-base">
            From raw web content to lasting knowledge — automatically.
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
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 bg-primary/5 text-primary text-xs">
            <Star className="h-3 w-3" /> Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Open Core Pricing</h2>
          <p className="text-muted-foreground text-base">Free forever. Upgrade when you need cloud sync.</p>
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

      {/* Trust / Open Source section */}
      <section id="open-source" className="max-w-5xl mx-auto px-6 py-24">
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-10 md:p-14">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
              <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
                <Github className="h-3 w-3" /> Open Source
              </Badge>
              <Link href="https://github.com/project-nexus/nexus" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Badge variant="outline" className="gap-1.5 border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400">
                  <Star className="h-3 w-3 fill-current" /> Star on GitHub · 100+
                </Badge>
              </Link>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Open Source &amp; Privacy First</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Nexus is fully open source. Audit the code, self-host it, fork it. Your data stays yours.
            </p>
          </div>

          {/* Trust tiles */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <TrustTile
              icon={<Code2 className="h-5 w-5 text-primary" />}
              title="MIT Licensed"
              description="Use, modify, and distribute freely. No proprietary lock-in."
            />
            <TrustTile
              icon={<Lock className="h-5 w-5 text-primary" />}
              title="BYOK Model"
              description="API keys never leave your browser. We never see your credentials."
            />
            <TrustTile
              icon={<Shield className="h-5 w-5 text-primary" />}
              title="Zero Vendor Lock-in"
              description="Export your data anytime. Switch AI providers with one setting."
            />
          </div>

          {/* Contributor avatars */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground font-medium">Contributors</p>
            <div className="flex -space-x-2">
              {CONTRIBUTOR_GRADIENTS.map((gradient, i) => (
                <div
                  key={i}
                  className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} border-2 border-background ring-1 ring-border/20`}
                  aria-hidden="true"
                />
              ))}
              <div className="h-9 w-9 rounded-full bg-muted border-2 border-background ring-1 ring-border/20 flex items-center justify-center text-xs font-medium text-muted-foreground">
                +
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.637_0.237_275/8%)_0%,transparent_70%)]" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {isLoggedIn ? 'Your second brain is ready.' : 'Ready to build your second brain?'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isLoggedIn
                ? 'Open the dashboard and start exploring your knowledge graph.'
                : 'Start capturing knowledge in under 2 minutes. Free forever.'}
            </p>
            <Link href={isLoggedIn ? '/dashboard' : '/signup'}>
              <Button size="lg" className="gap-2 px-10 h-12 text-base shadow-xl shadow-primary/25 animate-nexus-glow">
                {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/20">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)] shadow-lg shadow-[oklch(0.637_0.237_275/20%)]">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold tracking-tight">Nexus</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                Open source knowledge management for developers who value privacy.
              </p>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/feed" className="hover:text-foreground transition-colors">Feed</Link></li>
                <li><Link href="/graph" className="hover:text-foreground transition-colors">Graph</Link></li>
                <li><Link href="/review" className="hover:text-foreground transition-colors">Review</Link></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="https://github.com/project-nexus/nexus" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </Link>
                </li>
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
              </ul>
            </div>

            {/* Col 4: Legal + Social */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                <li>
                  <Link href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5" /> MIT License
                  </Link>
                </li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
              <h4 className="text-sm font-semibold mb-3">Social</h4>
              <div className="flex items-center gap-3">
                <Link href="https://github.com/project-nexus/nexus" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="h-5 w-5" />
                </Link>
                <Link href="https://twitter.com/nexusapp" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {CURRENT_YEAR} Nexus. Open source under the MIT License.</span>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>Privacy-first · BYOK · Your data stays yours</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, step }: {
  icon: React.ReactNode
  title: string
  description: string
  step: string
}) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card/50 p-6 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
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

function TrustTile({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/50 p-5 text-center">
      <div className="flex justify-center mb-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
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
    <div className={`rounded-xl border p-6 flex flex-col ${highlighted ? 'border-primary/40 bg-primary/5 shadow-xl shadow-primary/10 relative' : 'border-border/50 bg-card/50'}`}>
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


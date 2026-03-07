'use client'

import {
  Brain,
  Puzzle,
  Key,
  Globe,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

const ONBOARDING_KEY = 'nexus-onboarding-complete'
const BRAND_GRADIENT = 'from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)]'

const steps = [
  {
    icon: <Brain className="h-10 w-10 text-white" />,
    title: 'Welcome to Nexus!',
    description:
      'Your AI-powered second brain. Let us show you how to get the most out of it in just 5 quick steps.',
    cta: 'Get Started',
    gradient: BRAND_GRADIENT,
    link: undefined as { href: string; text: string } | undefined,
  },
  {
    icon: <Puzzle className="h-10 w-10 text-white" />,
    title: 'Install the Extension',
    description:
      'The Nexus browser extension lets you capture any web page with one click. It works on Chrome and Edge.',
    cta: 'Continue',
    gradient: 'from-violet-600 to-violet-500',
    link: { href: 'https://chromewebstore.google.com', text: 'Open Chrome Web Store' },
  },
  {
    icon: <Key className="h-10 w-10 text-white" />,
    title: 'Add Your API Key',
    description:
      'Nexus is BYOK (Bring Your Own Key). Add your OpenAI, Anthropic, or Gemini API key in the extension options. Your key stays in your browser — never on our servers.',
    cta: 'Continue',
    gradient: 'from-amber-600 to-amber-500',
    link: undefined as { href: string; text: string } | undefined,
  },
  {
    icon: <Globe className="h-10 w-10 text-white" />,
    title: 'Capture Your First Page',
    description:
      'Visit any article, blog post, or documentation page. Click the Nexus extension icon and hit "Capture". The AI will summarize it and extract key concepts.',
    cta: 'Continue',
    gradient: 'from-emerald-600 to-emerald-500',
    link: undefined as { href: string; text: string } | undefined,
  },
  {
    icon: <LayoutDashboard className="h-10 w-10 text-white" />,
    title: 'Explore Your Dashboard',
    description:
      'Your dashboard has three tabs: Feed (your captured pages), Graph (visual knowledge map), and Review (spaced repetition flashcards). Everything is connected automatically.',
    cta: "Let's Go!",
    gradient: BRAND_GRADIENT,
    link: undefined as { href: string; text: string } | undefined,
  },
]

export default function OnboardingDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const isDone = localStorage.getItem(ONBOARDING_KEY)
    if (!isDone) {
      const t = setTimeout(() => setOpen(true), 1000)
      return () => clearTimeout(t)
    }
  }, [])

  function complete() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOpen(false)
  }

  function next() {
    if (step < steps.length - 1) {
      setStep((s: number) => s + 1)
    } else {
      complete()
    }
  }

  const current = steps[step]
  const progress = ((step + 1) / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) complete() }}>
      <DialogContent className="sm:max-w-md border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mb-2">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1.5">
              Step {step + 1} of {steps.length}
            </p>
          </div>

          <div
            className={`mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg`}
          >
            {current.icon}
          </div>

          <DialogTitle className="text-center text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed mt-2">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {current.link && (
          <div className="flex justify-center">
            <a
              href={current.link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {current.link.text} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1"
            onClick={complete}
          >
            <X className="h-3.5 w-3.5" /> Skip tour
          </Button>
          <Button className="flex-1 gap-2" onClick={next}>
            {step === steps.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> {current.cta}
              </>
            ) : (
              <>
                {current.cta} <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

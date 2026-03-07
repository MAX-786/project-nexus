'use client'

import { useState, useTransition } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { deleteAccount } from '@/app/dashboard/settings/actions'

interface SettingsClientProps {
  email: string
  accessToken: string | null
  initials: string
}

export default function SettingsClient({ email, accessToken, initials }: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCopyToken = async () => {
    if (!accessToken) {
      toast.error('No token available')
      return
    }
    try {
      await navigator.clipboard.writeText(accessToken)
      setCopied(true)
      toast.success('Token copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy token')
    }
  }

  const handleDeleteAccount = () => {
    startTransition(async () => {
      try {
        await deleteAccount()
      } catch {
        toast.error('Failed to delete account. Please try again.')
        setDialogOpen(false)
      }
    })
  }

  const maskedToken = accessToken
    ? `••••••••••••••••••••••• ${accessToken.slice(-6)}`
    : 'No active session'

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted border border-border text-lg font-semibold text-muted-foreground">
            {initials}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{email}</p>
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Free tier
            </span>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">Appearance</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how Nexus looks to you.
        </p>
        <div className="flex gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme(value)}
              className="flex items-center gap-2"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      {/* Extension Auth Section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">Extension Authentication</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Copy your JWT access token to authenticate the browser extension. This token expires with your session.
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2">
          <code className="flex-1 text-xs text-muted-foreground font-mono truncate">
            {maskedToken}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleCopyToken}
            disabled={!accessToken}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="rounded-xl border border-destructive/40 bg-card p-6">
        <h2 className="text-base font-semibold text-destructive mb-1">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                This will permanently delete your account and all your data including nodes,
                entities, edges, and reviews. This action{' '}
                <span className="font-semibold text-foreground">cannot be undone</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isPending}
              >
                {isPending ? 'Deleting…' : 'Yes, delete my account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}

'use client'

import { Sun, Moon, Monitor, Trash2, Brain, Eye, EyeOff, Sparkles, Keyboard } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteAccount } from '@/app/dashboard/settings/actions'
import { useSettings } from '@/components/dashboard/settings-provider'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import {
  useMemorySettings,
  DEFAULT_MODELS,
  PROVIDER_LABELS,
  MODEL_OPTIONS,
  type MemoryProvider,
} from '@/lib/memory-settings'

interface SettingsClientProps {
  email: string
  initials: string
}

export default function SettingsClient({ email, initials }: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showApiKey, setShowApiKey] = useState(false)

  const memorySettings = useMemorySettings()
  const { settings: appSettings, updateSettings } = useSettings()
  const { shortcuts } = useKeyboardShortcuts()

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

      {/* Memory Agent Section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Memory Agent</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Configure how memory consolidation and knowledge queries work.
          Your API key stays in your browser — never sent to our servers.
        </p>

        <div className="space-y-5">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Auto AI Mode</Label>
              <p className="text-xs text-muted-foreground max-w-sm">
                {memorySettings.mode === 'auto'
                  ? 'AI calls are made directly from your browser using your API key.'
                  : 'Copy prompts manually to your AI tool and paste responses back.'}
              </p>
            </div>
            <Switch
              checked={memorySettings.mode === 'auto'}
              onCheckedChange={(checked: boolean) =>
                memorySettings.setMode(checked ? 'auto' : 'manual')
              }
            />
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">AI Provider</Label>
            <div className="flex gap-2">
              {(Object.keys(PROVIDER_LABELS) as MemoryProvider[]).map(
                (p) => (
                  <Button
                    key={p}
                    variant={
                      memorySettings.provider === p ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => memorySettings.setProvider(p)}
                    className="flex items-center gap-2"
                  >
                    {PROVIDER_LABELS[p]}
                  </Button>
                ),
              )}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="memory-api-key" className="text-sm font-medium">
              API Key
              {memorySettings.mode === 'auto' && !memorySettings.apiKey && (
                <span className="ml-2 text-xs text-amber-500 font-normal">
                  Required for Auto mode
                </span>
              )}
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="memory-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={
                    memorySettings.provider === 'openai'
                      ? 'sk-...'
                      : 'AI...'
                  }
                  value={memorySettings.apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    memorySettings.setApiKey(e.target.value)
                  }
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {memorySettings.provider === 'openai'
                ? 'Stored locally in your browser. Get one at platform.openai.com'
                : 'Stored locally in your browser. Get one at aistudio.google.com'}
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Model</Label>
            <div className="flex flex-wrap gap-2">
              {MODEL_OPTIONS[memorySettings.provider].map((m) => (
                <Button
                  key={m}
                  variant={
                    (memorySettings.model || DEFAULT_MODELS[memorySettings.provider]) === m
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => memorySettings.setModel(m)}
                  className="text-xs"
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Indicator */}
          {memorySettings.mode === 'auto' && (
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  memorySettings.apiKey ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {memorySettings.apiKey ? (
                  <>
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    Auto mode active — using {PROVIDER_LABELS[memorySettings.provider]} (
                    {memorySettings.model || DEFAULT_MODELS[memorySettings.provider]})
                  </>
                ) : (
                  'Add an API key to enable Auto mode'
                )}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Keyboard Shortcuts Section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Keyboard className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Keyboard Shortcuts</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Enable dashboard keyboard shortcuts or customize your key bindings. 
        </p>

        <div className="space-y-5">
          {/* Global Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Shortcuts</Label>
              <p className="text-xs text-muted-foreground max-w-sm">
                Toggle all keyboard shortcuts globally across the dashboard.
              </p>
            </div>
            <Switch
              checked={appSettings.shortcuts_enabled}
              onCheckedChange={(checked) => updateSettings({ shortcuts_enabled: checked })}
            />
          </div>

          {/* Bindings List */}
          {appSettings.shortcuts_enabled && (
            <div className="space-y-3 mt-4">
              <Label className="text-sm font-medium">Custom Bindings</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {shortcuts.map(shortcut => (
                  <div key={shortcut.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-card">
                    <Label className="text-xs font-medium">{shortcut.description}</Label>
                    <Input
                      className="h-8 text-xs font-mono"
                      value={appSettings.custom_shortcuts[shortcut.id] ?? shortcut.defaultKey}
                      onChange={(e) => {
                         updateSettings({
                           custom_shortcuts: {
                             ...appSettings.custom_shortcuts,
                             [shortcut.id]: e.target.value
                           }
                         })
                      }}
                      placeholder={shortcut.defaultKey}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Extension Auth Section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">Extension Authentication</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your browser extension with one click — no manual token copying required.
          Your session is synced securely and refreshes automatically.
        </p>
        <Button asChild size="sm">
          <a
            href="/auth/extension"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2"
          >
            Connect Extension →
          </a>
        </Button>
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

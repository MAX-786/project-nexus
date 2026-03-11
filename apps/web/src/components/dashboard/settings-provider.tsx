'use client'

import React, { createContext, useContext, useState, useTransition } from 'react'
import type { DBUserSettings } from '@nexus/shared'
import { updateUserSettings } from '@/app/dashboard/settings/shortcut-actions'

interface SettingsContextValue {
  settings: DBUserSettings
  updateSettings: (updates: Partial<Pick<DBUserSettings, 'shortcuts_enabled' | 'custom_shortcuts'>>) => Promise<void>
  isUpdating: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings: DBUserSettings
}) {
  const [settings, setSettings] = useState<DBUserSettings>(initialSettings)
  const [isUpdating, startTransition] = useTransition()

  const handleUpdateSettings = async (updates: Partial<Pick<DBUserSettings, 'shortcuts_enabled' | 'custom_shortcuts'>>) => {
    // Optimistic update
    setSettings((prev) => ({ ...prev, ...updates }))
    
    startTransition(async () => {
      try {
        await updateUserSettings(updates)
      } catch (e) {
        console.error('Failed to update settings:', e)
        // Revert to original settings
        setSettings(initialSettings)
      }
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings: handleUpdateSettings, isUpdating }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

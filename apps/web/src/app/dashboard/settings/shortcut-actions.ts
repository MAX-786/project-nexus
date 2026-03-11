'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { DBUserSettings } from '@nexus/shared'

export async function updateUserSettings(
  settings: Partial<Pick<DBUserSettings, 'shortcuts_enabled' | 'custom_shortcuts'>>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard', 'layout')
}

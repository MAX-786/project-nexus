'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Not authenticated')
  }

  const userId = user.id

  // Delete all user data in dependency order
  await supabase.from('reviews').delete().eq('user_id', userId)
  await supabase.from('edges').delete().eq('user_id', userId)
  await supabase.from('entities').delete().eq('user_id', userId)
  await supabase.from('nodes').delete().eq('user_id', userId)

  // Sign out the user
  await supabase.auth.signOut()

  redirect('/login')
}

'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

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

  // Delete all user data in dependency order (reviews → edges → entities → nodes)
  const deletions: Array<{ table: string; result: { error: { message: string } | null } }> = [
    { table: 'reviews', result: await supabase.from('reviews').delete().eq('user_id', userId) },
    { table: 'edges', result: await supabase.from('edges').delete().eq('user_id', userId) },
    { table: 'entities', result: await supabase.from('entities').delete().eq('user_id', userId) },
    { table: 'nodes', result: await supabase.from('nodes').delete().eq('user_id', userId) },
  ]

  for (const { table, result } of deletions) {
    if (result.error) {
      throw new Error(`Failed to delete ${table}: ${result.error.message}`)
    }
  }

  // Sign out the user
  await supabase.auth.signOut()

  redirect('/login')
}

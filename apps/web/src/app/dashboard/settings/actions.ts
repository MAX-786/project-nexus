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

  // Delete all user data in dependency order (children → parents)
  // Cascade deletes handle junction tables (node_tags, node_collections)
  // order matters if RLS or manual wipes are failing.
  const tables = [
    'reviews',         // refs nodes
    'highlights',      // refs nodes
    'edges',           // refs nodes
    'entities',        // refs nodes
    'nodes',           // refs users
    'consolidations',  // refs users
    'tags',            // refs users
    'collections',     // refs users
    'user_settings'    // refs users
  ]

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete ${table}: ${error.message}`)
    }
  }

  // Finally delete the public profile (if permissions allow/if not cascade deleted)
  // Note: auth user deletion usually requires service role. Wiping public data is the standard "reset".
  await supabase.from('users').delete().eq('id', userId)

  // Sign out the user
  await supabase.auth.signOut()

  redirect('/login')
}

'use server'

import { revalidatePath } from 'next/cache'

import type { DBDailyDigest } from '@/lib/types'
import { createClient } from '@/utils/supabase/server'

export async function getDigests(limit: number = 10): Promise<DBDailyDigest[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('daily_digests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as DBDailyDigest[]
}

export async function getUnreadDigestCount(): Promise<number> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 0

  const { count } = await supabase
    .from('daily_digests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return count ?? 0
}

export async function getRecentNodes(hours: number = 24) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('nodes')
    .select('id, title, summary, url, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function saveDigest(params: {
  content: string
  nodeIds: string[]
  insights: string[]
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.from('daily_digests').insert({
    user_id: user.id,
    content: params.content,
    node_ids: params.nodeIds,
    insights: params.insights,
    is_read: false,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true, id: data?.id ?? '' }
}

export async function markDigestRead(digestId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('daily_digests')
    .update({ is_read: true })
    .eq('id', digestId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function markAllDigestsRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('daily_digests')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteDigest(digestId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('daily_digests')
    .delete()
    .eq('id', digestId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

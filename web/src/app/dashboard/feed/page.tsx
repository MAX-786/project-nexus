import { createClient } from '@/utils/supabase/server'
import NodeFeed from '@/components/dashboard/node-feed'

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [nodesResult, entitiesResult, edgesResult] = await Promise.all([
    supabase
      .from('nodes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false }),
    supabase.from('entities').select('*').eq('user_id', user.id),
    supabase.from('edges').select('*').eq('user_id', user.id),
  ])

  return (
    <div className="flex flex-col h-full min-h-0">
      <NodeFeed
        nodes={nodesResult.data ?? []}
        entities={entitiesResult.data ?? []}
        edges={edgesResult.data ?? []}
      />
    </div>
  )
}

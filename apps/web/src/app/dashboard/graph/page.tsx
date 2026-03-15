import KnowledgeGraphLazy from '@/components/dashboard/knowledge-graph-lazy'
import type { DBNode, DBEdge, DBEntity } from '@/lib/types'
import { createClient } from '@/utils/supabase/server'

export default async function GraphPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [nodesResult, edgesResult, entitiesResult] = await Promise.all([
    supabase.from('nodes').select('id, user_id, url, title, summary, created_at, is_bookmarked').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('edges').select('*').eq('user_id', user.id),
    supabase.from('entities').select('*').eq('user_id', user.id),
  ])

  return (
    <KnowledgeGraphLazy
      initialNodes={(nodesResult.data ?? []) as DBNode[]}
      initialEdges={(edgesResult.data ?? []) as DBEdge[]}
      initialEntities={(entitiesResult.data ?? []) as DBEntity[]}
    />
  )
}

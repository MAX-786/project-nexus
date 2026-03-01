import { createClient } from '@/utils/supabase/server'
import KnowledgeGraph from '@/components/dashboard/knowledge-graph'

type DBNode = {
  id: string
  user_id: string
  url: string
  title: string
  summary: string
  raw_text: string
  created_at: string
}

type DBEdge = {
  id: string
  source_id: string
  target_id: string
  relation_type: string
  weight: number
}

type DBEntity = {
  id: string
  name: string
  type: string
  user_id: string
  node_id: string | null
}

export default async function GraphPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [nodesResult, edgesResult, entitiesResult] = await Promise.all([
    supabase.from('nodes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('edges').select('*').eq('user_id', user.id),
    supabase.from('entities').select('*').eq('user_id', user.id),
  ])

  return (
    <KnowledgeGraph
      initialNodes={(nodesResult.data ?? []) as DBNode[]}
      initialEdges={(edgesResult.data ?? []) as DBEdge[]}
      initialEntities={(entitiesResult.data ?? []) as DBEntity[]}
    />
  )
}

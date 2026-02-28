import { createClient } from '@/utils/supabase/server'
import GraphDashboard from '@/components/dashboard/graph-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null // Handled by layout redirect
  }

  // Fetch all nodes for the user
  const { data: nodes, error: nodesError } = await supabase
    .from('nodes')
    .select('*')
    .eq('user_id', user.id)
    .order('id', { ascending: false })

  if (nodesError) {
    console.error('Error fetching nodes:', nodesError)
    throw new Error(`Failed to fetch nodes: ${nodesError.message || JSON.stringify(nodesError)}`)
  }

  // Fetch all edges for the user
  const { data: edges, error: edgesError } = await supabase
    .from('edges')
    .select('*')
    .eq('user_id', user.id)

  if (edgesError) {
    console.error('Error fetching edges:', edgesError)
    throw new Error(`Failed to fetch edges: ${edgesError.message || JSON.stringify(edgesError)}`)
  }

  // Fetch all entities for the user (optional, could be used for advanced node detailing)
  const { data: entities, error: entitiesError } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', user.id)

  if (entitiesError) {
    console.error('Error fetching entities:', entitiesError)
    throw new Error(`Failed to fetch entities: ${entitiesError.message || JSON.stringify(entitiesError)}`)
  }

  return (
    <GraphDashboard 
      initialNodes={nodes || []} 
      initialEdges={edges || []} 
      initialEntities={entities || []} 
    />
  )
}

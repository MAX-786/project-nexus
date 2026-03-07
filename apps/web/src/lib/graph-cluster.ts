import type { DBEdge } from '@/lib/types'

/**
 * Computes a local cluster of node IDs within `maxDepth` degrees of separation
 * from the given `startNodeId`, using BFS traversal on the edge list.
 */
export function getLocalCluster(
  startNodeId: string,
  edges: DBEdge[],
  maxDepth: number = 2
): Set<string> {
  const visited = new Set<string>()
  const queue: [string, number][] = [[startNodeId, 0]]
  visited.add(startNodeId)

  // Build adjacency list for efficient traversal
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    if (!adjacency.has(edge.source_id)) adjacency.set(edge.source_id, [])
    if (!adjacency.has(edge.target_id)) adjacency.set(edge.target_id, [])
    adjacency.get(edge.source_id)!.push(edge.target_id)
    adjacency.get(edge.target_id)!.push(edge.source_id)
  }

  while (queue.length > 0) {
    const [currentId, depth] = queue.shift()!
    if (depth >= maxDepth) continue

    const neighbors = adjacency.get(currentId) ?? []
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId)
        queue.push([neighborId, depth + 1])
      }
    }
  }

  return visited
}

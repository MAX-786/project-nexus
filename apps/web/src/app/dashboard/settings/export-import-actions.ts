'use server'

import { createClient } from '@/utils/supabase/server'

/* ------------------------------------------------------------------ */
/*  Export Functions                                                    */
/* ------------------------------------------------------------------ */

export async function exportAsJSON() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const [
    { data: nodes },
    { data: entities },
    { data: edges },
    { data: collections },
    { data: nodeCollections },
    { data: tags },
    { data: nodeTags },
    { data: highlights },
    { data: consolidations },
  ] = await Promise.all([
    supabase.from('nodes').select('id, url, title, summary, raw_text, created_at, is_bookmarked').eq('user_id', user.id),
    supabase.from('entities').select('id, name, entity_type, node_id').eq('user_id', user.id),
    supabase.from('edges').select('id, source_id, target_id, relation_type, weight, is_manual, label').eq('user_id', user.id),
    supabase.from('collections').select('id, name, color, created_at').eq('user_id', user.id),
    supabase.from('node_collections').select('node_id, collection_id').eq('user_id', user.id),
    supabase.from('tags').select('id, name, color, created_at').eq('user_id', user.id),
    supabase.from('node_tags').select('node_id, tag_id').eq('user_id', user.id),
    supabase.from('highlights').select('id, node_id, text, note, color, created_at').eq('user_id', user.id),
    supabase.from('consolidations').select('id, source_node_ids, summary, insight, themes, created_at').eq('user_id', user.id),
  ])

  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      nodes: nodes ?? [],
      entities: entities ?? [],
      edges: edges ?? [],
      collections: collections ?? [],
      node_collections: nodeCollections ?? [],
      tags: tags ?? [],
      node_tags: nodeTags ?? [],
      highlights: highlights ?? [],
      consolidations: consolidations ?? [],
    },
  }

  return { data: JSON.stringify(exportData, null, 2) }
}

export async function exportAsMarkdown() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const [{ data: nodes }, { data: entities }, { data: tags }, { data: nodeTags }] =
    await Promise.all([
      supabase.from('nodes').select('id, url, title, summary, raw_text, created_at, is_bookmarked').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('entities').select('id, name, entity_type, node_id').eq('user_id', user.id),
      supabase.from('tags').select('id, name').eq('user_id', user.id),
      supabase.from('node_tags').select('node_id, tag_id').eq('user_id', user.id),
    ])

  if (!nodes) return { error: 'Failed to fetch data' }

  const tagMap = new Map((tags ?? []).map((t: { id: string; name: string }) => [t.id, t.name]))

  let markdown = `# Nexus Knowledge Base Export\n\n`
  markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`
  markdown += `**Total nodes: ${nodes.length}**\n\n---\n\n`

  for (const node of nodes) {
    markdown += `## ${node.title}\n\n`
    markdown += `- **URL:** ${node.url}\n`
    markdown += `- **Created:** ${new Date(node.created_at).toLocaleDateString()}\n`
    if (node.is_bookmarked) markdown += `- **Bookmarked:** ✅\n`

    // Tags
    const nodeTagIds = (nodeTags ?? [])
      .filter((nt: { node_id: string }) => nt.node_id === node.id)
      .map((nt: { tag_id: string }) => nt.tag_id)
    if (nodeTagIds.length > 0) {
      const tagNames = nodeTagIds.map((id: string) => tagMap.get(id)).filter(Boolean)
      if (tagNames.length > 0) markdown += `- **Tags:** ${tagNames.join(', ')}\n`
    }

    markdown += `\n### Summary\n\n${node.summary}\n\n`

    // Entities
    const nodeEntities = (entities ?? []).filter((e: { node_id: string | null }) => e.node_id === node.id)
    if (nodeEntities.length > 0) {
      markdown += `### Entities\n\n`
      for (const e of nodeEntities) {
        markdown += `- **${(e as { name: string; entity_type: string }).name}** (${(e as { entity_type: string }).entity_type})\n`
      }
      markdown += '\n'
    }

    if (node.raw_text) {
      markdown += `### Content\n\n${node.raw_text}\n\n`
    }

    markdown += `---\n\n`
  }

  return { data: markdown }
}

export async function exportAsCSV() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data: nodes } = await supabase
    .from('nodes')
    .select('id, url, title, summary, created_at, is_bookmarked')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!nodes) return { error: 'Failed to fetch data' }

  // Escape CSV fields
  const escapeCSV = (val: string | null | undefined | boolean): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headers = ['ID', 'Title', 'URL', 'Summary', 'Bookmarked', 'Created At']
  const rows = nodes.map((n) => [
    escapeCSV(n.id),
    escapeCSV(n.title),
    escapeCSV(n.url),
    escapeCSV(n.summary),
    escapeCSV(n.is_bookmarked),
    escapeCSV(n.created_at),
  ].join(','))

  return { data: [headers.join(','), ...rows].join('\n') }
}

/* ------------------------------------------------------------------ */
/*  Import Functions                                                   */
/* ------------------------------------------------------------------ */

export async function importFromJSON(jsonString: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  let parsed: { version?: string; data?: Record<string, unknown[]> }
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return { error: 'Invalid JSON format' }
  }

  if (!parsed.data || !parsed.version) {
    return { error: 'Invalid export format. Missing "version" or "data" fields.' }
  }

  const data = parsed.data
  let importedCount = 0

  // Import nodes
  if (Array.isArray(data.nodes) && data.nodes.length > 0) {
    const nodesToInsert = (data.nodes as Record<string, unknown>[]).map((n) => ({
      url: n.url as string,
      title: n.title as string,
      summary: n.summary as string,
      raw_text: (n.raw_text as string) || null,
      user_id: user.id,
      is_bookmarked: (n.is_bookmarked as boolean) || false,
    }))

    const { error } = await supabase.from('nodes').insert(nodesToInsert)
    if (error) {
      return { error: `Failed to import nodes: ${error.message}` }
    }
    importedCount += nodesToInsert.length
  }

  // Import collections
  if (Array.isArray(data.collections) && data.collections.length > 0) {
    const collectionsToInsert = (data.collections as Record<string, unknown>[]).map((c) => ({
      name: c.name as string,
      color: (c.color as string) || null,
      user_id: user.id,
    }))

    await supabase.from('collections').insert(collectionsToInsert)
  }

  // Import tags
  if (Array.isArray(data.tags) && data.tags.length > 0) {
    const tagsToInsert = (data.tags as Record<string, unknown>[]).map((t) => ({
      name: t.name as string,
      color: (t.color as string) || '#6b7280',
      user_id: user.id,
    }))

    await supabase.from('tags').insert(tagsToInsert)
  }

  return {
    success: true,
    message: `Successfully imported ${importedCount} nodes`,
  }
}

export async function importFromCSV(csvString: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const lines = csvString.split('\n').filter((l) => l.trim())
  if (lines.length < 2) {
    return { error: 'CSV must have a header row and at least one data row' }
  }

  // Parse header to find columns
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const titleIdx = headers.indexOf('title')
  const urlIdx = headers.indexOf('url')
  const summaryIdx = headers.indexOf('summary')

  if (titleIdx === -1 || urlIdx === -1) {
    return { error: 'CSV must have "Title" and "URL" columns' }
  }

  const nodes = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    const title = parts[titleIdx]?.replace(/^"|"$/g, '').trim()
    const url = parts[urlIdx]?.replace(/^"|"$/g, '').trim()
    const summary = summaryIdx !== -1 ? parts[summaryIdx]?.replace(/^"|"$/g, '').trim() : ''

    if (title && url) {
      nodes.push({
        title,
        url,
        summary: summary || '',
        user_id: user.id,
      })
    }
  }

  if (nodes.length === 0) {
    return { error: 'No valid rows found in CSV' }
  }

  const { error } = await supabase.from('nodes').insert(nodes)
  if (error) {
    return { error: `Failed to import: ${error.message}` }
  }

  return {
    success: true,
    message: `Successfully imported ${nodes.length} nodes from CSV`,
  }
}

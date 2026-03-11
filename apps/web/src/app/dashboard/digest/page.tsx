import { Newspaper } from 'lucide-react'

import DigestClient from '@/components/dashboard/digest-client'

import { getDigests, getRecentNodes, getUnreadDigestCount } from './actions'

export default async function DigestPage() {
  const [digests, recentNodes, unreadCount] = await Promise.all([
    getDigests(20),
    getRecentNodes(24),
    getUnreadDigestCount(),
  ])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Daily Digest</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generated summaries of your recently captured content.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <DigestClient
          initialDigests={digests}
          recentNodes={recentNodes}
          unreadCount={unreadCount}
        />
      </div>
    </div>
  )
}

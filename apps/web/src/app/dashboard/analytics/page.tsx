import { BarChart3 } from 'lucide-react'

import AnalyticsClient from '@/components/dashboard/analytics-client'

import { getAnalyticsSummary } from './actions'

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsSummary(30)

  return (
    <div className="flex h-full flex-col">
      {/* Analytics Header */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Analytics &amp; Insights</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Track your knowledge growth, review performance, and learning patterns.
        </p>
      </div>

      {/* Analytics Content */}
      <div className="flex-1 overflow-auto p-6">
        {analytics ? (
          <AnalyticsClient analytics={analytics} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Unable to load analytics. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  )
}

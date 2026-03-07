'use client'

import { Brain, Tag, Network, GraduationCap } from 'lucide-react'

import { useNodesStore } from '@/stores/nodes-store'

interface DashboardStatsProps {
  /** Number of review cards due today — fetched server-side, passed as prop */
  dueCount: number
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  gradient: string
}

function StatCard({ icon, label, value, gradient }: StatCardProps) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${gradient} shadow-sm`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tracking-tight animate-nexus-fade-in">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardStats({ dueCount }: DashboardStatsProps) {
  const nodes = useNodesStore((s) => s.nodes)
  const entities = useNodesStore((s) => s.entities)
  const edges = useNodesStore((s) => s.edges)

  const stats: StatCardProps[] = [
    {
      icon: <Brain className="h-4.5 w-4.5 text-white" />,
      label: 'Nodes Captured',
      value: nodes.length,
      gradient:
        'bg-gradient-to-br from-[oklch(0.637_0.237_275)] to-[oklch(0.7_0.2_310)]',
    },
    {
      icon: <Tag className="h-4.5 w-4.5 text-white" />,
      label: 'Entities Extracted',
      value: entities.length,
      gradient:
        'bg-gradient-to-br from-[oklch(0.65_0.2_180)] to-[oklch(0.6_0.18_200)]',
    },
    {
      icon: <Network className="h-4.5 w-4.5 text-white" />,
      label: 'Connections',
      value: edges.length,
      gradient:
        'bg-gradient-to-br from-[oklch(0.7_0.2_310)] to-[oklch(0.65_0.22_340)]',
    },
    {
      icon: <GraduationCap className="h-4.5 w-4.5 text-white" />,
      label: 'Due for Review',
      value: dueCount,
      gradient:
        'bg-gradient-to-br from-[oklch(0.75_0.15_60)] to-[oklch(0.7_0.18_40)]',
    },
  ]

  return (
    <div className="border-b border-border/50 bg-background/60 backdrop-blur-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-3 stagger-children">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  )
}

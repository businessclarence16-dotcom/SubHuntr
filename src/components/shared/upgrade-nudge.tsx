// Composant pour inciter l'utilisateur à upgrader son plan — dark theme

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

interface UpgradeNudgeProps {
  feature: string
  description?: string
  compact?: boolean
}

export function UpgradeNudge({ feature, description, compact = false }: UpgradeNudgeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[rgba(245,158,11,0.15)] bg-[rgba(245,158,11,0.08)] px-3 py-2 text-sm text-[#f59e0b]">
        <Zap className="h-4 w-4 shrink-0" />
        <span className="flex-1">Passez à un plan supérieur pour {feature}</span>
        <Link href="/billing" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border-[rgba(245,158,11,0.2)] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.1)]')}>
          Upgrade
        </Link>
      </div>
    )
  }

  return (
    <Card className="border-[rgba(29,158,117,0.15)] bg-[rgba(29,158,117,0.08)]">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium text-[#fafafa]">
            <Zap className="mr-1 inline h-4 w-4 text-[#1D9E75]" />
            Passez à un plan supérieur pour {feature}
          </p>
          {description && (
            <p className="mt-1 text-sm text-[#a1a1aa]">{description}</p>
          )}
        </div>
        <Link href="/billing" className={cn(buttonVariants({ size: 'sm' }))}>
          Upgrader
        </Link>
      </CardContent>
    </Card>
  )
}

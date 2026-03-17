// Composant pour inciter l'utilisateur à upgrader son plan
// Mode normal : carte complète. Mode compact : bandeau inline.

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
      <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <Zap className="h-4 w-4 shrink-0" />
        <span className="flex-1">Passez à un plan supérieur pour {feature}</span>
        <Link href="/billing" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Upgrade
        </Link>
      </div>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">
            <Zap className="mr-1 inline h-4 w-4" />
            Passez à un plan supérieur pour {feature}
          </p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Link href="/billing" className={cn(buttonVariants({ size: 'sm' }))}>
          Upgrader
        </Link>
      </CardContent>
    </Card>
  )
}

// Composant pour inciter l'utilisateur à upgrader son plan

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface UpgradeNudgeProps {
  feature: string
  description?: string
}

export function UpgradeNudge({ feature, description }: UpgradeNudgeProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">
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

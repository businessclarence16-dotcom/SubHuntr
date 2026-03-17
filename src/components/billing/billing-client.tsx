// Composant client Billing — affiche les plans et permet de choisir

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import { Plan } from '@/types'

interface BillingClientProps {
  plan: Plan
}

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: '$29',
    period: '/mois',
    description: 'Pour commencer à trouver des leads sur Reddit',
    features: [
      '1 projet',
      '5 keywords',
      '15 subreddits',
      'Scan toutes les 15 min',
      'Email alerts uniquement',
    ],
  },
  {
    id: 'growth' as const,
    name: 'Growth',
    price: '$79',
    period: '/mois',
    popular: true,
    description: 'Pour scaler votre acquisition Reddit',
    features: [
      '3 projets',
      '25 keywords / projet',
      '75 subreddits',
      'Scan toutes les 5 min',
      'Slack & Discord alerts',
      'Competitor tracking',
      'Analytics complets',
    ],
  },
  {
    id: 'agency' as const,
    name: 'Agency',
    price: '$149',
    period: '/mois',
    description: 'Pour les agences et les power users',
    features: [
      '10 projets',
      'Keywords illimités',
      'Subreddits illimités',
      'Scan toutes les 2 min',
      'Slack & Discord alerts',
      'Competitor tracking',
      'Export CSV',
      'Support prioritaire',
    ],
  },
]

export function BillingClient({ plan }: BillingClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Facturation</h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre abonnement et votre plan
        </p>
      </div>

      {/* Plan actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="default" className="text-sm capitalize">
            {plan}
          </Badge>
        </CardContent>
      </Card>

      {/* Grille des plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === plan
          const isUpgrade = (
            (p.id === 'growth' && plan === 'starter') ||
            (p.id === 'agency' && (plan === 'starter' || plan === 'growth'))
          )

          return (
            <Card
              key={p.id}
              className={
                p.popular
                  ? 'border-primary ring-1 ring-primary'
                  : isCurrent
                    ? 'border-primary/50'
                    : ''
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  {p.popular && <Badge variant="default">Populaire</Badge>}
                  {isCurrent && !p.popular && <Badge variant="secondary">Actuel</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </CardDescription>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent && (
                  <Button variant="outline" className="w-full" disabled>
                    Plan actuel
                  </Button>
                )}

                {isUpgrade && (
                  <Button className="w-full" disabled>
                    <Zap className="mr-2 h-4 w-4" />
                    Passer à {p.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Le paiement sera disponible au lancement. Tous les plans incluent 7 jours d&apos;essai gratuit.
      </p>
    </div>
  )
}

// Composant client Billing — affiche les plans et gère les upgrades

'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, Zap } from 'lucide-react'

interface BillingClientProps {
  plan: 'free' | 'pro' | 'business'
  hasSubscription: boolean
}

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '0€',
    period: '',
    features: [
      '1 projet',
      '3 keywords',
      '3 subreddits',
      '1 scan / jour',
      '10 réponses IA / mois',
      'Analytics basiques',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '29€',
    period: '/mois',
    features: [
      '5 projets',
      '20 keywords / projet',
      '20 subreddits',
      '12 scans / jour',
      '100 réponses IA / mois',
      'Export CSV',
      'Analytics complets',
    ],
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '79€',
    period: '/mois',
    features: [
      'Projets illimités',
      'Keywords illimités',
      'Subreddits illimités',
      'Scans en temps réel',
      'Réponses IA illimitées',
      'Export CSV',
      'Analytics + API',
    ],
  },
]

export function BillingClient({ plan, hasSubscription }: BillingClientProps) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  async function handleUpgrade(targetPlan: 'pro' | 'business') {
    setLoading(targetPlan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleManage() {
    setLoading('manage')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Facturation</h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre abonnement et votre plan
        </p>
      </div>

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          Paiement réussi ! Votre plan a été mis à jour.
        </div>
      )}

      {canceled && (
        <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
          Paiement annulé. Votre plan n&apos;a pas été modifié.
        </div>
      )}

      {/* Plan actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan actuel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Badge variant="default" className="text-sm">
            {plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Business'}
          </Badge>
          {hasSubscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManage}
              disabled={loading === 'manage'}
            >
              {loading === 'manage' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gérer l&apos;abonnement
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grille des plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === plan
          const isUpgrade = (p.id === 'pro' && plan === 'free') ||
            (p.id === 'business' && (plan === 'free' || plan === 'pro'))

          return (
            <Card
              key={p.id}
              className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  {isCurrent && <Badge>Actuel</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{p.price}</span>
                  {p.period && <span className="text-muted-foreground">{p.period}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isUpgrade && (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(p.id as 'pro' | 'business')}
                    disabled={loading === p.id}
                  >
                    {loading === p.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Passer à {p.name}
                  </Button>
                )}

                {isCurrent && (
                  <Button variant="outline" className="w-full" disabled>
                    Plan actuel
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

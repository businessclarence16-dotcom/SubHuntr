// Onboarding en 3 étapes : 1) Créer projet → 2) Ajouter keywords → 3) Ajouter subreddits

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createProject, addKeywords, addSubreddits } from '@/app/(auth)/actions/onboarding'
import { X, Plus, ArrowRight, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — Projet
  const [projectName, setProjectName] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectId, setProjectId] = useState('')

  // Step 2 — Keywords
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  // Step 3 — Subreddits
  const [subredditsList, setSubredditsList] = useState<string[]>([])
  const [subredditInput, setSubredditInput] = useState('')

  async function handleCreateProject() {
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.set('name', projectName)
    formData.set('url', projectUrl)
    formData.set('description', projectDescription)

    const result = await createProject(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    if (result.projectId) {
      setProjectId(result.projectId)
      setStep(2)
    }
  }

  function handleAddKeyword() {
    const keyword = keywordInput.trim()
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
      setKeywordInput('')
    }
  }

  function handleRemoveKeyword(keyword: string) {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  async function handleSaveKeywords() {
    setLoading(true)
    setError('')
    const result = await addKeywords(projectId, keywords)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setStep(3)
  }

  function handleAddSubreddit() {
    const sub = subredditInput.trim().replace(/^r\//, '')
    if (sub && !subredditsList.includes(sub)) {
      setSubredditsList([...subredditsList, sub])
      setSubredditInput('')
    }
  }

  function handleRemoveSubreddit(sub: string) {
    setSubredditsList(subredditsList.filter((s) => s !== sub))
  }

  async function handleFinish() {
    setLoading(true)
    setError('')
    const result = await addSubreddits(projectId, subredditsList)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/feed')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <CardTitle>
            {step === 1 && 'Créez votre projet'}
            {step === 2 && 'Ajoutez des keywords'}
            {step === 3 && 'Ajoutez des subreddits'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Décrivez le produit ou service pour lequel vous cherchez des leads.'}
            {step === 2 && 'Les mots-clés que vos clients potentiels utiliseraient sur Reddit.'}
            {step === 3 && 'Les subreddits où vos clients potentiels se trouvent.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          )}

          {/* Étape 1 — Projet */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du projet *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Mon SaaS"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div>
                <Label htmlFor="url">URL du produit (optionnel)</Label>
                <Input
                  id="url"
                  placeholder="https://monsaas.com"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  placeholder="Un outil qui aide à..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Continuer
              </Button>
            </div>
          )}

          {/* Étape 2 — Keywords */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: meilleur outil CRM"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button variant="outline" onClick={handleAddKeyword} disabled={!keywordInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button onClick={() => handleRemoveKeyword(kw)} className="ml-1 rounded-full hover:bg-muted">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSaveKeywords}
                disabled={keywords.length === 0 || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Continuer ({keywords.length} keyword{keywords.length !== 1 ? 's' : ''})
              </Button>
            </div>
          )}

          {/* Étape 3 — Subreddits */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex flex-1 items-center">
                  <span className="mr-1 text-sm text-muted-foreground">r/</span>
                  <Input
                    placeholder="Ex: entrepreneur"
                    value={subredditInput}
                    onChange={(e) => setSubredditInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubreddit()}
                  />
                </div>
                <Button variant="outline" onClick={handleAddSubreddit} disabled={!subredditInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {subredditsList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {subredditsList.map((sub) => (
                    <Badge key={sub} variant="secondary" className="gap-1 pr-1">
                      r/{sub}
                      <button onClick={() => handleRemoveSubreddit(sub)} className="ml-1 rounded-full hover:bg-muted">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                onClick={handleFinish}
                disabled={subredditsList.length === 0 || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Terminer ({subredditsList.length} subreddit{subredditsList.length !== 1 ? 's' : ''})
              </Button>
            </div>
          )}

          {/* Indicateur d'étape */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Étape {step} sur 3
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

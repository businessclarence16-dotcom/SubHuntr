// Composant client Settings — onglets profil, projet, compte

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface SettingsClientProps {
  user: {
    id: string
    email: string
    fullName: string
    plan: string
  }
  project: {
    id: string
    name: string
    url: string
    description: string
  } | null
}

export function SettingsClient({ user, project }: SettingsClientProps) {
  const router = useRouter()

  // Profil
  const [fullName, setFullName] = useState(user.fullName)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Projet
  const [projectName, setProjectName] = useState(project?.name ?? '')
  const [projectUrl, setProjectUrl] = useState(project?.url ?? '')
  const [projectDescription, setProjectDescription] = useState(project?.description ?? '')
  const [savingProject, setSavingProject] = useState(false)
  const [projectSaved, setProjectSaved] = useState(false)

  async function saveProfile() {
    setSavingProfile(true)
    setProfileSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', data: { fullName } }),
      })
      if (res.ok) {
        setProfileSaved(true)
        router.refresh()
        setTimeout(() => setProfileSaved(false), 3000)
      }
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveProject() {
    if (!project) return
    setSavingProject(true)
    setProjectSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project',
          data: {
            projectId: project.id,
            name: projectName,
            url: projectUrl,
            description: projectDescription,
          },
        }),
      })
      if (res.ok) {
        setProjectSaved(true)
        router.refresh()
        setTimeout(() => setProjectSaved(false), 3000)
      }
    } finally {
      setSavingProject(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre profil et votre projet</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="project">Projet</TabsTrigger>
          <TabsTrigger value="account">Compte</TabsTrigger>
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Modifiez vos informations de profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={user.email} disabled className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">L&apos;email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="text-sm font-medium">Nom complet</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
                {profileSaved && (
                  <span className="text-sm text-green-600">Profil mis à jour !</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Projet */}
        <TabsContent value="project" className="space-y-4">
          {project ? (
            <Card>
              <CardHeader>
                <CardTitle>Projet actif</CardTitle>
                <CardDescription>Modifiez les informations de votre projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom du projet</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL du produit/service</label>
                  <Input
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://monproduit.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Décrivez votre produit en quelques mots..."
                    rows={3}
                    className="mt-1 resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={saveProject} disabled={savingProject || !projectName.trim()}>
                    {savingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                  {projectSaved && (
                    <span className="text-sm text-green-600">Projet mis à jour !</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Aucun projet actif.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Compte */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan actuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-sm">
                  {user.plan === 'free' ? 'Free' : user.plan === 'pro' ? 'Pro' : 'Business'}
                </Badge>
                {user.plan === 'free' && (
                  <span className="text-sm text-muted-foreground">
                    Passez à Pro pour débloquer plus de fonctionnalités
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zone de danger</CardTitle>
              <CardDescription>Actions irréversibles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                Supprimer mon compte
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Cette fonctionnalité sera bientôt disponible.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

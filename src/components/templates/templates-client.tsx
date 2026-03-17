// Composant client Templates — CRUD complet avec formulaire et liste

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react'

interface Template {
  id: string
  project_id: string
  name: string
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

interface TemplatesClientProps {
  projectId: string
  templates: Template[]
}

export function TemplatesClient({ projectId, templates: initialTemplates }: TemplatesClientProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  function openCreateDialog() {
    setEditingTemplate(null)
    setName('')
    setContent(defaultTemplateContent)
    setIsDefault(false)
    setDialogOpen(true)
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template)
    setName(template.name)
    setContent(template.content)
    setIsDefault(template.is_default)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim() || !content.trim()) return
    setSaving(true)

    try {
      if (editingTemplate) {
        const res = await fetch('/api/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTemplate.id, name, content, isDefault }),
        })
        if (res.ok) {
          const updated = await res.json()
          setTemplates((prev) =>
            prev.map((t) => {
              if (t.id === updated.id) return updated
              if (isDefault) return { ...t, is_default: false }
              return t
            })
          )
        }
      } else {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, name, content, isDefault }),
        })
        if (res.ok) {
          const created = await res.json()
          if (isDefault) {
            setTemplates((prev) => [created, ...prev.map((t) => ({ ...t, is_default: false }))])
          } else {
            setTemplates((prev) => [created, ...prev])
          }
        }
      }
      setDialogOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch('/api/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      }
    } finally {
      setDeleting(null)
    }
  }

  async function handleSetDefault(id: string) {
    const res = await fetch('/api/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isDefault: true }),
    })
    if (res.ok) {
      setTemplates((prev) =>
        prev.map((t) => ({ ...t, is_default: t.id === id }))
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Créez des modèles de réponses avec des placeholders
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau template
        </Button>
      </div>

      {/* Aide placeholders */}
      <Card>
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">
            <strong>Placeholders disponibles :</strong>{' '}
            <code className="rounded bg-muted px-1">{'{{author}}'}</code>{' '}
            <code className="rounded bg-muted px-1">{'{{keyword}}'}</code>{' '}
            <code className="rounded bg-muted px-1">{'{{subreddit}}'}</code>{' '}
            <code className="rounded bg-muted px-1">{'{{product}}'}</code>
          </p>
        </CardContent>
      </Card>

      {/* Liste des templates */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucun template. Créez-en un pour accélérer vos réponses !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.is_default && (
                      <Badge variant="default">
                        <Star className="mr-1 h-3 w-3" />
                        Par défaut
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Définir par défaut"
                        onClick={() => handleSetDefault(template.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleting === template.id}
                      onClick={() => handleDelete(template.id)}
                    >
                      {deleting === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {template.content}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog création/édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
            <DialogDescription>
              Utilisez les placeholders pour personnaliser vos réponses automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom du template</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Réponse commerciale"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contenu</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écrivez votre template ici..."
                rows={8}
                className="mt-1 resize-none font-mono text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              Définir comme template par défaut
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || !content.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const defaultTemplateContent = `Hey {{author}},

J'ai vu ton post sur r/{{subreddit}} et je pense que {{product}} pourrait t'aider !

[Décris en quoi ton produit répond au besoin]

N'hésite pas si tu as des questions.`

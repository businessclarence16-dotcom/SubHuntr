// Templates client — CRUD with premium dark theme matching landing page

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Star, Loader2, FileText, X } from 'lucide-react'

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

/* ── shared style constants (landing page match) ── */
const cardStyle: React.CSSProperties = {
  background: '#131316',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 30px 80px rgba(0,0,0,.6), 0 0 120px rgba(29,158,117,0.08)',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#fafafa',
  fontSize: '.88rem',
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
}
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: '#1D9E75',
  color: '#fff',
  padding: '11px 24px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: '.88rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all .2s',
  boxShadow: '0 0 30px rgba(29,158,117,0.15), 0 4px 12px rgba(0,0,0,.3)',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  color: '#a1a1aa',
  padding: '11px 24px',
  borderRadius: 10,
  fontWeight: 500,
  fontSize: '.88rem',
  border: '1px solid rgba(255,255,255,0.06)',
  cursor: 'pointer',
  transition: 'all .2s',
}
const easing = 'cubic-bezier(0.16, 1, 0.3, 1)'

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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
      setDeleteConfirmId(null)
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

  const placeholders = [
    { tag: '{{author}}', desc: 'Post author' },
    { tag: '{{keyword}}', desc: 'Matched keyword' },
    { tag: '{{subreddit}}', desc: 'Subreddit name' },
    { tag: '{{product}}', desc: 'Your product' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div
        className="animate-fade-in-up"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              color: '#fafafa',
              margin: 0,
            }}
          >
            Reply Templates
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '.88rem', marginTop: 4 }}>
            Create reusable reply templates with placeholders
          </p>
        </div>
        <button
          style={btnPrimary}
          onClick={openCreateDialog}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#17805f'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1D9E75'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* ── Placeholders help ── */}
      <div
        className="animate-fade-in-up"
        style={{
          ...cardStyle,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          animationDelay: '0.05s',
        }}
      >
        <span style={{ fontSize: '.82rem', color: '#a1a1aa', fontWeight: 600 }}>Placeholders:</span>
        {placeholders.map((p) => (
          <span
            key={p.tag}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '.75rem',
              color: '#1D9E75',
              background: 'rgba(29,158,117,0.08)',
              padding: '3px 10px',
              borderRadius: 6,
            }}
            title={p.desc}
          >
            {p.tag}
          </span>
        ))}
      </div>

      {/* ── Templates list ── */}
      {templates.length === 0 ? (
        <div
          className="animate-fade-in-up"
          style={{
            ...cardStyle,
            padding: '64px 24px',
            textAlign: 'center',
            animationDelay: '0.1s',
          }}
        >
          <FileText size={40} style={{ color: '#52525b', margin: '0 auto 16px' }} />
          <p style={{ color: '#a1a1aa', fontSize: '.92rem', marginBottom: 4 }}>No templates yet</p>
          <p style={{ color: '#52525b', fontSize: '.82rem' }}>
            Create your first template to speed up your replies
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map((template, i) => (
            <div
              key={template.id}
              className="animate-fade-in-up"
              style={{
                ...cardStyle,
                padding: '20px 24px',
                animationDelay: `${0.1 + i * 0.06}s`,
                transition: `border-color .2s ${easing}, background .2s ${easing}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.background = '#18181c'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.background = '#131316'
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '.95rem', color: '#fafafa' }}>{template.name}</span>
                  {template.is_default && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(29,158,117,0.12)',
                        color: '#1D9E75',
                        fontSize: '.68rem',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: 100,
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                      }}
                    >
                      <Star size={10} /> Default
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {!template.is_default && (
                    <button
                      onClick={() => handleSetDefault(template.id)}
                      title="Set as default"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#52525b',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 6,
                        transition: 'color .15s',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1D9E75' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b' }}
                    >
                      <Star size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => openEditDialog(template)}
                    title="Edit"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#52525b',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                      transition: 'color .15s',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fafafa' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b' }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(template.id)}
                    title="Delete"
                    disabled={deleting === template.id}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#52525b',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                      transition: 'color .15s',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b' }}
                  >
                    {deleting === template.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
              {/* Preview */}
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '.82rem',
                  color: '#a1a1aa',
                  lineHeight: 1.65,
                  margin: 0,
                  fontFamily: 'inherit',
                }}
              >
                {template.content.length > 200 ? template.content.slice(0, 200) + '…' : template.content}
              </pre>

              {/* Delete confirmation inline */}
              {deleteConfirmId === template.id && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 16px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '.82rem', color: '#ef4444' }}>Delete this template?</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#a1a1aa',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      style={{
                        background: '#ef4444',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {deleting === template.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      {dialogOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            animation: `fadeIn 0.2s ${easing} both`,
          }}
          onClick={() => setDialogOpen(false)}
        >
          <div
            style={{
              ...cardStyle,
              width: '100%',
              maxWidth: 560,
              padding: '28px 32px',
              margin: '0 16px',
              animation: `fadeInUp 0.3s ${easing} both`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fafafa', letterSpacing: '-0.02em', margin: 0 }}>
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h2>
                <p style={{ color: '#52525b', fontSize: '.82rem', marginTop: 2 }}>
                  Use placeholders to personalize replies automatically
                </p>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#52525b',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                  Template name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sales outreach"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(29,158,117,0.4)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your template here..."
                  rows={8}
                  style={{
                    ...inputStyle,
                    resize: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '.82rem',
                    lineHeight: 1.65,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(29,158,117,0.4)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '.82rem',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                }}
              >
                <div
                  onClick={() => setIsDefault(!isDefault)}
                  style={{
                    width: 36,
                    height: 20,
                    background: isDefault ? '#1D9E75' : '#131316',
                    border: isDefault ? '1px solid #1D9E75' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 100,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: 14,
                      height: 14,
                      background: '#fff',
                      borderRadius: '50%',
                      top: 2,
                      left: isDefault ? 19 : 2,
                      transition: 'left .2s',
                    }}
                  />
                </div>
                Set as default template
              </label>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button style={btnGhost} onClick={() => setDialogOpen(false)}>
                Cancel
              </button>
              <button
                style={{
                  ...btnPrimary,
                  opacity: saving || !name.trim() || !content.trim() ? 0.5 : 1,
                  pointerEvents: saving || !name.trim() || !content.trim() ? 'none' : 'auto',
                }}
                onClick={handleSave}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#17805f'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1D9E75'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm dialog ── */}
    </div>
  )
}

const defaultTemplateContent = `Hey {{author}},

I saw your post on r/{{subreddit}} and I think {{product}} could help you!

[Describe how your product addresses their need]

Feel free to reach out if you have any questions.`

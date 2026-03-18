// Settings client — tabs with premium dark theme matching landing page

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, FolderOpen, Bell, Shield, AlertTriangle } from 'lucide-react'

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

type Tab = 'profile' | 'project' | 'notifications' | 'account'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'project', label: 'Project', icon: FolderOpen },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: Shield },
]

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(29,158,117,0.4)'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,158,117,0.1)'
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
  e.currentTarget.style.boxShadow = 'none'
}

export function SettingsClient({ user, project }: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Profile
  const [fullName, setFullName] = useState(user.fullName)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Project
  const [projectName, setProjectName] = useState(project?.name ?? '')
  const [projectUrl, setProjectUrl] = useState(project?.url ?? '')
  const [projectDescription, setProjectDescription] = useState(project?.description ?? '')
  const [savingProject, setSavingProject] = useState(false)
  const [projectSaved, setProjectSaved] = useState(false)

  // Notifications
  const [emailNewPosts, setEmailNewPosts] = useState(true)
  const [emailHighIntent, setEmailHighIntent] = useState(true)
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false)

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

  function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!on)}
        style={{
          width: 42,
          height: 22,
          background: on ? '#1D9E75' : '#131316',
          border: on ? '1px solid #1D9E75' : '1px solid rgba(255,255,255,0.06)',
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
            width: 16,
            height: 16,
            background: '#fff',
            borderRadius: '50%',
            top: 2,
            left: on ? 22 : 2,
            transition: 'left .2s',
          }}
        />
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
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
          Settings
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '.88rem', marginTop: 4 }}>
          Manage your profile, project, and preferences
        </p>
      </div>

      {/* ── Tab pills ── */}
      <div
        className="animate-fade-in-up"
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 28,
          background: 'rgba(255,255,255,0.02)',
          padding: 4,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)',
          animationDelay: '0.05s',
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 7,
                fontSize: '.78rem',
                fontWeight: active ? 600 : 500,
                color: active ? '#fafafa' : '#52525b',
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all .2s',
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="animate-fade-in-up" style={{ ...cardStyle, padding: '28px 32px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', marginBottom: 4 }}>
            Personal Information
          </h2>
          <p style={{ color: '#52525b', fontSize: '.82rem', marginBottom: 24 }}>
            Update your profile details
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                Email
              </label>
              <input
                value={user.email}
                disabled
                style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
              />
              <p style={{ marginTop: 4, fontSize: '.72rem', color: '#52525b' }}>
                Email cannot be changed
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                Full name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                style={{
                  ...btnPrimary,
                  opacity: savingProfile ? 0.5 : 1,
                  pointerEvents: savingProfile ? 'none' : 'auto',
                }}
                onClick={saveProfile}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#17805f'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1D9E75'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {savingProfile && <Loader2 size={15} className="animate-spin" />}
                Save
              </button>
              {profileSaved && (
                <span style={{ fontSize: '.82rem', color: '#1D9E75', fontWeight: 600 }}>Profile updated!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Project Tab ── */}
      {activeTab === 'project' && (
        <div className="animate-fade-in-up" style={{ ...cardStyle, padding: '28px 32px' }}>
          {project ? (
            <>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', marginBottom: 4 }}>
                Active Project
              </h2>
              <p style={{ color: '#52525b', fontSize: '.82rem', marginBottom: 24 }}>
                Edit your project details
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                    Project name
                  </label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={inputStyle}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                    Product / Service URL
                  </label>
                  <input
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://yourproduct.com"
                    style={inputStyle}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe your product in a few words..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    style={{
                      ...btnPrimary,
                      opacity: savingProject || !projectName.trim() ? 0.5 : 1,
                      pointerEvents: savingProject || !projectName.trim() ? 'none' : 'auto',
                    }}
                    onClick={saveProject}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#17805f'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#1D9E75'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {savingProject && <Loader2 size={15} className="animate-spin" />}
                    Save
                  </button>
                  {projectSaved && (
                    <span style={{ fontSize: '.82rem', color: '#1D9E75', fontWeight: 600 }}>Project updated!</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <FolderOpen size={36} style={{ color: '#52525b', margin: '0 auto 12px' }} />
              <p style={{ color: '#52525b', fontSize: '.85rem' }}>No active project</p>
            </div>
          )}
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {activeTab === 'notifications' && (
        <div className="animate-fade-in-up" style={{ ...cardStyle, padding: '28px 32px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', marginBottom: 4 }}>
            Email Notifications
          </h2>
          <p style={{ color: '#52525b', fontSize: '.82rem', marginBottom: 24 }}>
            Choose which notifications you want to receive
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '.88rem', fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>New posts found</p>
                <p style={{ fontSize: '.78rem', color: '#52525b' }}>Get notified when new matching posts are found</p>
              </div>
              <Toggle on={emailNewPosts} onChange={setEmailNewPosts} />
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '.88rem', fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>High-intent alerts</p>
                <p style={{ fontSize: '.78rem', color: '#52525b' }}>Immediate alert for posts with score 7+</p>
              </div>
              <Toggle on={emailHighIntent} onChange={setEmailHighIntent} />
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '.88rem', fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>Weekly digest</p>
                <p style={{ fontSize: '.78rem', color: '#52525b' }}>Summary of the week&apos;s activity every Monday</p>
              </div>
              <Toggle on={emailWeeklyDigest} onChange={setEmailWeeklyDigest} />
            </div>
          </div>

          <p style={{ marginTop: 20, fontSize: '.72rem', color: '#52525b' }}>
            Notification preferences will be available once email integration is set up.
          </p>
        </div>
      )}

      {/* ── Account Tab ── */}
      {activeTab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current plan */}
          <div className="animate-fade-in-up" style={{ ...cardStyle, padding: '24px 32px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', marginBottom: 12 }}>
              Current Plan
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(29,158,117,0.12)',
                  color: '#1D9E75',
                  fontSize: '.75rem',
                  fontWeight: 700,
                  padding: '4px 14px',
                  borderRadius: 100,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                {user.plan}
              </span>
              {user.plan === 'starter' && (
                <span style={{ fontSize: '.82rem', color: '#a1a1aa' }}>
                  Upgrade to Growth for more features
                </span>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div
            className="animate-fade-in-up"
            style={{
              ...cardStyle,
              padding: '24px 32px',
              borderColor: 'rgba(239,68,68,0.15)',
              animationDelay: '0.06s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa' }}>Danger Zone</h2>
            </div>
            <p style={{ color: '#52525b', fontSize: '.82rem', marginBottom: 16 }}>
              Irreversible actions
            </p>
            <button
              disabled
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                padding: '10px 20px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '.85rem',
                border: '1px solid rgba(239,68,68,0.2)',
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
            >
              Delete my account
            </button>
            <p style={{ marginTop: 8, fontSize: '.72rem', color: '#52525b' }}>
              This feature will be available soon.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

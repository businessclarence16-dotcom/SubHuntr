// Settings client — tabs with premium dark theme matching landing page

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, FolderOpen, Bell, Shield, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  notifications?: {
    autoScanEnabled: boolean
    autoScanIntervalHours: number
    notifyMinScore: number
    hasKeywords: boolean
    hasSubreddits: boolean
  }
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

// Intervals available per plan
const AUTO_SCAN_INTERVALS: Record<string, number[]> = {
  starter: [12, 24],
  growth: [4, 6, 12, 24],
  agency: [2, 4, 6, 12, 24],
  enterprise: [1, 2, 4, 6, 12, 24],
}

const INTERVAL_LABELS: Record<number, string> = {
  1: 'Every 1h', 2: 'Every 2h', 4: 'Every 4h', 6: 'Every 6h', 12: 'Every 12h', 24: 'Every 24h',
}

// Which plan unlocks each interval
const INTERVAL_PLAN: Record<number, string> = {
  1: 'Enterprise', 2: 'Agency', 4: 'Growth', 6: 'Growth', 12: 'Starter', 24: 'Starter',
}

export function SettingsClient({ user, project, notifications }: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Profile
  const [fullName, setFullName] = useState(user.fullName)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error: boolean } | null>(null)

  // Project
  const [projectName, setProjectName] = useState(project?.name ?? '')
  const [projectUrl, setProjectUrl] = useState(project?.url ?? '')
  const [projectDescription, setProjectDescription] = useState(project?.description ?? '')
  const [savingProject, setSavingProject] = useState(false)
  const [projectSaved, setProjectSaved] = useState(false)

  // Notifications
  const [autoScanEnabled, setAutoScanEnabled] = useState(notifications?.autoScanEnabled ?? false)
  const [autoScanInterval, setAutoScanInterval] = useState(notifications?.autoScanIntervalHours ?? 12)
  const [notifyMinScore, setNotifyMinScore] = useState(notifications?.notifyMinScore ?? 7)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notificationsSaved, setNotificationsSaved] = useState(false)
  const canEnableAutoScan = notifications?.hasKeywords && notifications?.hasSubreddits

  // Account deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  async function changePassword() {
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters', error: true })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match', error: true })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordMsg({ text: error.message, error: true })
      } else {
        setPasswordMsg({ text: 'Password updated successfully!', error: false })
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordMsg(null), 3000)
      }
    } finally {
      setSavingPassword(false)
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

  async function deleteAccount() {
    if (deleteConfirmation !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })
      if (res.ok) {
        window.location.href = '/'
      }
    } finally {
      setDeleting(false)
    }
  }

  async function saveNotifications() {
    setSavingNotifications(true)
    setNotificationsSaved(false)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_scan_enabled: autoScanEnabled,
          auto_scan_interval_hours: autoScanInterval,
          notify_min_score: notifyMinScore,
        }),
      })
      if (res.ok) {
        setNotificationsSaved(true)
        setTimeout(() => setNotificationsSaved(false), 3000)
      }
    } finally {
      setSavingNotifications(false)
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Personal info card */}
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
                  Contact support to change email
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

          {/* Change password card */}
          <div className="animate-fade-in-up" style={{ ...cardStyle, padding: '28px 32px', animationDelay: '0.06s' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fafafa', marginBottom: 4 }}>
              Change Password
            </h2>
            <p style={{ color: '#52525b', fontSize: '.82rem', marginBottom: 24 }}>
              Update your account password
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#52525b',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#52525b',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  style={{
                    ...btnPrimary,
                    opacity: savingPassword || !newPassword || !confirmPassword ? 0.5 : 1,
                    pointerEvents: savingPassword || !newPassword || !confirmPassword ? 'none' : 'auto',
                  }}
                  onClick={changePassword}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#17805f'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1D9E75'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {savingPassword && <Loader2 size={15} className="animate-spin" />}
                  Update password
                </button>
                {passwordMsg && (
                  <span style={{ fontSize: '.82rem', color: passwordMsg.error ? '#ef4444' : '#1D9E75', fontWeight: 600 }}>
                    {passwordMsg.text}
                  </span>
                )}
              </div>
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
            Lead Alerts
          </h2>
          <p style={{ color: '#52525b', fontSize: '.82rem', marginBottom: 24 }}>
            Get an email when new high-intent posts are found
          </p>

          {!canEnableAutoScan && (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: '.82rem',
              color: '#f59e0b',
            }}>
              Add keywords and subreddits first to enable auto-scan.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '.88rem', fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>Enable lead alerts</p>
                <p style={{ fontSize: '.78rem', color: '#52525b' }}>Auto-scan Reddit and email you when leads are found</p>
              </div>
              <Toggle
                on={autoScanEnabled}
                onChange={(v) => { if (canEnableAutoScan) setAutoScanEnabled(v) }}
              />
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Scan frequency */}
            <div>
              <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>
                Scan frequency
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[1, 2, 4, 6, 12, 24].map((hours) => {
                  const allowed = (AUTO_SCAN_INTERVALS[user.plan] ?? [12, 24]).includes(hours)
                  const active = autoScanInterval === hours
                  return (
                    <button
                      key={hours}
                      onClick={() => {
                        if (allowed) setAutoScanInterval(hours)
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        fontSize: '.78rem',
                        fontWeight: active ? 600 : 500,
                        background: active ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#1D9E75' : allowed ? '#a1a1aa' : '#52525b',
                        border: active ? '1px solid rgba(29,158,117,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        cursor: allowed ? 'pointer' : 'not-allowed',
                        opacity: allowed ? 1 : 0.5,
                        transition: 'all .15s',
                      }}
                    >
                      {INTERVAL_LABELS[hours]}
                      {!allowed && ` \uD83D\uDD12`}
                    </button>
                  )
                })}
              </div>
              {autoScanInterval <= 6 && !(AUTO_SCAN_INTERVALS[user.plan] ?? []).includes(autoScanInterval) && (
                <p style={{ marginTop: 6, fontSize: '.72rem', color: '#f59e0b' }}>
                  Upgrade to {INTERVAL_PLAN[autoScanInterval]} to unlock this frequency.
                </p>
              )}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Minimum score */}
            <div>
              <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>
                Minimum score
              </label>
              <p style={{ fontSize: '.72rem', color: '#52525b', marginBottom: 8 }}>
                Only notify me for posts with this score or higher
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[5, 6, 7, 8, 9].map((s) => {
                  const active = notifyMinScore === s
                  return (
                    <button
                      key={s}
                      onClick={() => setNotifyMinScore(s)}
                      style={{
                        width: 40,
                        height: 36,
                        borderRadius: 8,
                        fontSize: '.82rem',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        background: active ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#1D9E75' : '#a1a1aa',
                        border: active ? '1px solid rgba(29,158,117,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {s}+
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button
              style={{
                ...btnPrimary,
                opacity: savingNotifications ? 0.5 : 1,
                pointerEvents: savingNotifications ? 'none' : 'auto',
              }}
              onClick={saveNotifications}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#17805f'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1D9E75'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {savingNotifications && <Loader2 size={15} className="animate-spin" />}
              Save preferences
            </button>
            {notificationsSaved && (
              <span style={{ fontSize: '.82rem', color: '#1D9E75', fontWeight: 600 }}>Notification preferences saved!</span>
            )}
          </div>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
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
                    Upgrade for more features
                  </span>
                )}
              </div>
              <button
                onClick={() => router.push('/billing')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '.78rem',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fafafa',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                Manage billing
                <ArrowRight size={14} />
              </button>
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
              This action is permanent and cannot be undone. All your data will be deleted.
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
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
                cursor: 'pointer',
                transition: 'all .2s',
              }}
            >
              Delete my account
            </button>
          </div>
        </div>
      )}

      {/* ── Delete account confirmation dialog ── */}
      {showDeleteDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 24,
          }}
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            style={{
              ...cardStyle,
              padding: '32px',
              maxWidth: 440,
              width: '100%',
              borderColor: 'rgba(239,68,68,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertTriangle size={20} style={{ color: '#ef4444' }} />
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fafafa' }}>Delete your account</h3>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '.85rem', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete your account, all projects, keywords, subreddits, and data.
              This action cannot be undone.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                Type <span style={{ color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>DELETE</span> to confirm
              </label>
              <input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteConfirmation('')
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  background: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  background: deleteConfirmation === 'DELETE' ? '#ef4444' : 'rgba(239,68,68,0.1)',
                  color: '#fff',
                  border: 'none',
                  cursor: deleteConfirmation === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                  opacity: deleteConfirmation === 'DELETE' ? 1 : 0.5,
                  transition: 'all .2s',
                }}
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

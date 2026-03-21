// Email HTML templates for all sequences.
// Simple, clean design: white bg, black text, green #1D9E75 button, SubHuntr logo.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://subhuntr.com'

function layout(body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<!-- Logo -->
<tr><td style="padding:28px 32px 0">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="width:22px;height:22px;background:#1D9E75;border-radius:5px;text-align:center;vertical-align:middle">
      <span style="color:#fff;font-size:8px;line-height:22px">&#9679;</span>
    </td>
    <td style="padding-left:8px;font-size:15px;font-weight:700;color:#09090b;letter-spacing:-0.02em">SubHuntr</td>
  </tr></table>
</td></tr>
<!-- Body -->
<tr><td style="padding:24px 32px 32px">${body}</td></tr>
<!-- Footer -->
<tr><td style="padding:16px 32px 24px;border-top:1px solid #e4e4e7">
  <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6">
    You're receiving this because you signed up for <a href="${SITE_URL}" style="color:#a1a1aa">SubHuntr</a>.<br>
    <a href="${SITE_URL}/settings" style="color:#a1a1aa;text-decoration:underline">Unsubscribe</a> &middot; <a href="${SITE_URL}/contact" style="color:#a1a1aa;text-decoration:underline">Contact us</a>
  </p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function button(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td>
    <a href="${href}" style="display:inline-block;padding:12px 28px;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">${text}</a>
  </td></tr></table>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#09090b;letter-spacing:-0.02em;line-height:1.3">${text}</h1>`
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;color:#3f3f46;line-height:1.7">${text}</p>`
}

// ========== SEQUENCE A — Onboarding ==========

/** A1 — Welcome. Personalized with project info if available, simplified if not. */
export function welcomeEmail(opts: {
  name: string
  projectName?: string
  keywordCount?: number
  subredditCount?: number
}): { subject: string; html: string } {
  const { name, projectName, keywordCount, subredditCount } = opts

  // Simplified version if onboarding not yet completed
  if (!projectName) {
    return {
      subject: 'Welcome to SubHuntr — your first leads are waiting',
      html: layout(
        h1(`Welcome to SubHuntr, ${name || 'there'}!`) +
        p('Complete your setup to start finding high-intent buyers on Reddit. It takes about 2 minutes.') +
        button('Complete setup', `${SITE_URL}/onboarding`)
      ),
    }
  }

  return {
    subject: 'Welcome to SubHuntr — your first leads are waiting',
    html: layout(
      h1(`Welcome to SubHuntr, ${name || 'there'}!`) +
      p(`Your project <strong>${projectName}</strong> is set up and monitoring <strong>${keywordCount ?? 0}</strong> keyword${(keywordCount ?? 0) !== 1 ? 's' : ''} across <strong>${subredditCount ?? 0}</strong> subreddit${(subredditCount ?? 0) !== 1 ? 's' : ''}.`) +
      p('SubHuntr scans every 15 minutes. When someone posts about your niche, you\'ll see it in your feed.') +
      button('Check your feed', `${SITE_URL}/feed`)
    ),
  }
}

/** A2 — Inactive day 1. Helpful tip, not threatening. */
export function inactiveDay1Email(name: string): { subject: string; html: string } {
  return {
    subject: 'Quick tip to get your first Reddit lead',
    html: layout(
      h1('Quick tip to find your first lead') +
      p(`Hey ${name || 'there'}, a quick tip: the keywords that convert best are specific phrases like <strong>"best CRM for startups"</strong> or <strong>"alternative to [competitor]"</strong>.`) +
      p('Try adding a few specific keywords and running a scan. Most users find their first lead within 48 hours.') +
      button('Update your keywords', `${SITE_URL}/keywords`)
    ),
  }
}

/** A3 — Inactive day 3. Offer help, not pressure. */
export function inactiveDay3Email(name: string): { subject: string; html: string } {
  return {
    subject: 'Need help setting up SubHuntr?',
    html: layout(
      h1('Need help getting started?') +
      p(`Hey ${name || 'there'}, we noticed you haven't run a scan yet. No worries \u2014 most users find their first lead within 48 hours of configuring.`) +
      p('Need help? Just reply to this email. We read every message and typically respond within 24 hours.') +
      button('Complete your setup', `${SITE_URL}/onboarding`)
    ),
  }
}

// ========== SEQUENCE B — Trial conversion ==========

/** B1 — Trial day 5. Shows stats if available, tips if not. */
export function trialDay5Email(name: string, postsFound: number, highIntentCount: number): { subject: string; html: string } {
  if (postsFound > 0) {
    return {
      subject: 'Your trial ends in 2 days',
      html: layout(
        h1('Your trial ends in 2 days') +
        p(`Hey ${name || 'there'}, here's what SubHuntr found during your trial:`) +
        `<table cellpadding="0" cellspacing="0" style="margin:8px 0 16px;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;width:100%">
          <tr>
            <td style="padding:16px 20px;border-right:1px solid #e4e4e7;text-align:center">
              <div style="font-size:28px;font-weight:800;color:#09090b">${postsFound}</div>
              <div style="font-size:12px;color:#a1a1aa;margin-top:2px">posts detected</div>
            </td>
            <td style="padding:16px 20px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:#1D9E75">${highIntentCount}</div>
              <div style="font-size:12px;color:#a1a1aa;margin-top:2px">high-intent (7+)</div>
            </td>
          </tr>
        </table>` +
        p('Upgrade to keep monitoring Reddit and never miss a lead.') +
        button('Upgrade now', `${SITE_URL}/billing`)
      ),
    }
  }

  return {
    subject: 'Your trial ends in 2 days',
    html: layout(
      h1('Your trial ends in 2 days') +
      p(`Hey ${name || 'there'}, SubHuntr works best with specific keywords like <strong>"best [tool] for [use case]"</strong>.`) +
      p('Try tweaking your setup \u2014 you still have 2 days to find your first lead.') +
      button('Update your keywords', `${SITE_URL}/keywords`)
    ),
  }
}

/** B2 — Trial expired (J+8, 1 day after trial ends). Replaces the old day 6 email. */
export function trialExpiredEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Your SubHuntr trial has ended',
    html: layout(
      h1('Your trial has ended') +
      p(`Hey ${name || 'there'}, your 7-day trial is over. If you found value in SubHuntr, upgrade to keep monitoring Reddit leads.`) +
      p('If not, no hard feelings \u2014 your data is saved for 30 days if you change your mind.') +
      button('Upgrade now', `${SITE_URL}/billing`)
    ),
  }
}

// ========== SEQUENCE C — Anti-churn ==========

/** C1 — 7 days inactive. Only sent if unreadCount > 0. */
export function churnDay7Email(name: string, unreadCount: number): { subject: string; html: string } {
  return {
    subject: `You have ${unreadCount} unread leads on SubHuntr`,
    html: layout(
      h1(`You have ${unreadCount} unread lead${unreadCount !== 1 ? 's' : ''}`) +
      p(`Hey ${name || 'there'}, SubHuntr found <strong>${unreadCount} new high-intent post${unreadCount !== 1 ? 's' : ''}</strong> while you were away.`) +
      p('Don\'t let your competitors reply first \u2014 the first reply converts best.') +
      button('Check your leads', `${SITE_URL}/feed`)
    ),
  }
}

/** C2 — 14 days inactive. */
export function churnDay14Email(name: string): { subject: string; html: string } {
  return {
    subject: 'Is SubHuntr still right for you?',
    html: layout(
      h1('Is SubHuntr still right for you?') +
      p(`Hey ${name || 'there'}, we noticed you haven't checked your leads in 2 weeks.`) +
      p('Need help setting things up? Reply to this email \u2014 we read every message and typically respond within 24 hours.') +
      p(`If you want to cancel, you can do it anytime in <a href="${SITE_URL}/settings" style="color:#1D9E75;text-decoration:underline">Settings</a>.`) +
      button('Check your leads', `${SITE_URL}/feed`)
    ),
  }
}

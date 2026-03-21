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
      <span style="color:#fff;font-size:8px;line-height:22px">●</span>
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
    <a href="${SITE_URL}/settings" style="color:#a1a1aa;text-decoration:underline">Unsubscribe</a> · <a href="${SITE_URL}/contact" style="color:#a1a1aa;text-decoration:underline">Contact us</a>
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

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to SubHuntr — your first leads are waiting',
    html: layout(
      h1(`Welcome to SubHuntr, ${name || 'there'}!`) +
      p('SubHuntr is now scanning Reddit for high-intent buyers in your niche. Here\'s what to do next:') +
      `<table cellpadding="0" cellspacing="0" style="margin:8px 0 8px 4px">
        <tr><td style="padding:6px 0;font-size:14px;color:#3f3f46"><strong style="color:#1D9E75">1.</strong> Configure your intent keywords</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#3f3f46"><strong style="color:#1D9E75">2.</strong> Pick your target subreddits</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#3f3f46"><strong style="color:#1D9E75">3.</strong> Check your lead feed</td></tr>
      </table>` +
      button('Go to your dashboard', `${SITE_URL}/feed`) +
      p('It takes about 2 minutes. Your first leads could be waiting already.')
    ),
  }
}

export function inactiveDay1Email(name: string): { subject: string; html: string } {
  return {
    subject: "You're missing Reddit leads right now",
    html: layout(
      h1(`${name || 'Hey'}, you're missing leads`) +
      p('People are posting on Reddit about tools like yours <strong>right now</strong>. You haven\'t run your first scan yet.') +
      p('It takes 3 minutes to set up. SubHuntr does the rest — scanning every 15 minutes, scoring each post 1-10, and alerting you when a high-intent buyer appears.') +
      button('Run your first scan', `${SITE_URL}/feed`)
    ),
  }
}

export function inactiveDay3Email(name: string, trialDaysLeft: number): { subject: string; html: string } {
  return {
    subject: 'Last chance — your competitors are already on Reddit',
    html: layout(
      h1('Your competitors are replying to Reddit leads') +
      p(`${name || 'Hey'}, while you wait, other companies in your niche are finding and replying to buyers on Reddit.`) +
      p('It takes 3 minutes to set up SubHuntr. We auto-suggest keywords and subreddits — you just click and go.') +
      button('Set up now', `${SITE_URL}/onboarding`) +
      p(`<span style="color:#a1a1aa;font-size:13px">If SubHuntr isn't for you, no worries — your trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}.</span>`)
    ),
  }
}

// ========== SEQUENCE B — Trial conversion ==========

export function trialDay5Email(name: string, postsFound: number, highIntent: number): { subject: string; html: string } {
  return {
    subject: 'Your trial ends in 2 days',
    html: layout(
      h1('Your trial ends in 2 days') +
      p(`${name || 'Hey'}, here's what SubHuntr found during your trial:`) +
      `<table cellpadding="0" cellspacing="0" style="margin:8px 0 16px;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;width:100%">
        <tr>
          <td style="padding:16px 20px;border-right:1px solid #e4e4e7;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#09090b">${postsFound}</div>
            <div style="font-size:12px;color:#a1a1aa;margin-top:2px">posts detected</div>
          </td>
          <td style="padding:16px 20px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#1D9E75">${highIntent}</div>
            <div style="font-size:12px;color:#a1a1aa;margin-top:2px">high-intent (7+)</div>
          </td>
        </tr>
      </table>` +
      p('Upgrade to keep monitoring Reddit and never miss a lead.') +
      button('Upgrade now', `${SITE_URL}/billing`)
    ),
  }
}

export function trialDay6Email(name: string): { subject: string; html: string } {
  return {
    subject: 'Last day of your free trial',
    html: layout(
      h1('Last day of your free trial') +
      p(`${name || 'Hey'}, tomorrow your trial ends. If you've found even one good lead, SubHuntr has already paid for itself.`) +
      `<table cellpadding="0" cellspacing="0" style="margin:8px 0 16px;width:100%">
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#3f3f46;border-bottom:1px solid #f4f4f5"><strong>SubHuntr</strong></td>
          <td style="padding:10px 16px;font-size:14px;color:#1D9E75;font-weight:700;border-bottom:1px solid #f4f4f5;text-align:right">$29/mo</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:#3f3f46"><strong>LinkedIn Ads CPC</strong></td>
          <td style="padding:10px 16px;font-size:14px;color:#ef4444;font-weight:700;text-align:right">$8+ per click</td>
        </tr>
      </table>` +
      p('One Reddit reply can pay for a full year of SubHuntr.') +
      button('Upgrade now', `${SITE_URL}/billing`)
    ),
  }
}

// ========== SEQUENCE C — Anti-churn ==========

export function churnDay7Email(name: string, unreadCount: number): { subject: string; html: string } {
  return {
    subject: `You have ${unreadCount} unread leads on SubHuntr`,
    html: layout(
      h1(`You have ${unreadCount} unread lead${unreadCount !== 1 ? 's' : ''}`) +
      p(`${name || 'Hey'}, SubHuntr found <strong>${unreadCount} new high-intent post${unreadCount !== 1 ? 's' : ''}</strong> while you were away.`) +
      p('Don\'t let your competitors reply first — the first reply converts best.') +
      button('Check your leads', `${SITE_URL}/feed`)
    ),
  }
}

export function churnDay14Email(name: string): { subject: string; html: string } {
  return {
    subject: 'Is SubHuntr still right for you?',
    html: layout(
      h1('Is SubHuntr still right for you?') +
      p(`${name || 'Hey'}, we noticed you haven't checked your leads in 2 weeks.`) +
      p('Need help setting things up? Reply to this email — we read every message and typically respond within 24 hours.') +
      p('If you want to cancel, you can do it anytime in <a href="' + SITE_URL + '/settings" style="color:#1D9E75;text-decoration:underline">Settings</a>.') +
      button('Check your leads', `${SITE_URL}/feed`)
    ),
  }
}

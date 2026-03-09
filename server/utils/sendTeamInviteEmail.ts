import { Resend } from 'resend'



const FROM_ADDRESS = '50Runs Team <team@50runs.com>'
const PRIMARY_COLOR = '#FF5F5F'
const ACCENT_COLOR = '#4352FF'
const BODY_BG = '#F7F8FC'
const TEXT_COLOR = '#1F2937'

export interface TeamInviteMailPayload {
  to: string
  teamName: string
  token: string
  inviterName: string
  note?: string | null
}

export async function sendTeamInviteEmail(payload: TeamInviteMailPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[team-invite-email] RESEND_API_KEY missing, skipping email dispatch')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const publicOrigin = process.env.PUBLIC_ORIGIN || 'https://50runs.com'
  const inviteUrl = `${publicOrigin.replace(/\/$/, '')}/team/invite/${payload.token}`

  const noteBlock = payload.note
    ? `<div style="margin-top:16px;padding:16px;border-radius:12px;background:#fff5f5;border:1px solid #fee2e2;color:#9f1239;font-size:14px;line-height:1.6;">
        <strong>${payload.inviterName}</strong> schrieb:<br />
        ${escapeHtml(payload.note)}
      </div>`
    : ''

  const html = `
  <!DOCTYPE html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="x-ua-compatible" content="ie=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Einladung zu ${escapeHtml(payload.teamName)}</title>
      <style>
        body { margin: 0; padding: 0; background: ${BODY_BG}; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${TEXT_COLOR}; }
        a { color: ${ACCENT_COLOR}; text-decoration: none; }
        .wrapper { width: 100%; padding: 32px 0; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); overflow: hidden; }
        .header { padding: 28px 40px 18px; text-align: center; background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, rgba(255,95,95,0.75) 45%, rgba(67,82,255,0.85) 100%); color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 36px 40px; }
        .content p { margin: 0 0 18px; line-height: 1.6; }
        .button { display: inline-block; margin-top: 14px; padding: 14px 28px; border-radius: 999px; font-weight: 600; letter-spacing: 0.3px; background: ${PRIMARY_COLOR}; color: #ffffff !important; box-shadow: 0 12px 28px rgba(255,95,95,0.32); }
        .footer { padding: 26px 40px 32px; font-size: 13px; line-height: 1.5; background: #fafbff; color: #6b7280; text-align: center; }
        .muted { color: #94a3b8; font-size: 12px; margin-top: 16px; }
        @media (max-width: 640px) {
          .container { margin: 16px; border-radius: 16px; }
          .content, .header, .footer { padding: 28px 24px; }
          .header h1 { font-size: 22px; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>${escapeHtml(payload.teamName)}</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Du wurdest eingeladen, dem Team beizutreten.</p>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p><strong>${escapeHtml(payload.inviterName)}</strong> hat dich in das Team <strong>${escapeHtml(payload.teamName)}</strong> eingeladen. Trete bei, um gemeinsam Ziele zu verfolgen, Läufe zu teilen und motiviert zu bleiben.</p>
            ${noteBlock}
            <p style="text-align:center;">
              <a class="button" href="${inviteUrl}">Einladung annehmen</a>
            </p>
            <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
            <p style="word-break: break-word; font-size: 13px;"><a href="${inviteUrl}">${inviteUrl}</a></p>
            <p>Wir freuen uns, dich bald auf der Teamseite zu sehen! 🏃</p>
          </div>
          <div class="footer">
            <p>Diese Nachricht wurde automatisch gesendet, weil du eine Teameinladung erhalten hast.</p>
            <p class="muted">Wenn du keine Einladungen mehr erhalten möchtest, ignoriere diese E-Mail.</p>
          </div>
        </div>
      </div>
    </body>
  </html>
  `

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: payload.to,
    subject: `${payload.inviterName} hat dich in das Team ${payload.teamName} eingeladen`,
    html,
  })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]+/g, (match) => {
    switch (match) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return match
    }
  })
}

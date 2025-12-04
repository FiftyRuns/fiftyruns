import { Resend } from 'resend'



const PRIMARY_COLOR = '#FF5F5F'
const ACCENT_COLOR = '#4352FF'
const BODY_BG = '#F7F8FC'
const TEXT_COLOR = '#1F2937'

export async function sendVerificationEmail({ to, token }: { to: string; token: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[verification-email] RESEND_API_KEY missing, skipping email dispatch')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const publicOrigin = process.env.PUBLIC_ORIGIN || 'https://50runs.app'
  const link = `${publicOrigin.replace(/\/$/, '')}/api/auth/verify?token=${token}`

  const html = `
  <!DOCTYPE html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="x-ua-compatible" content="ie=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Bestätige deine E-Mail</title>
      <style>
        body { margin: 0; padding: 0; background: ${BODY_BG}; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${TEXT_COLOR}; }
        a { color: ${ACCENT_COLOR}; text-decoration: none; }
        .wrapper { width: 100%; padding: 32px 0; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08); overflow: hidden; }
        .header { padding: 28px 40px 16px; text-align: center; background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, rgba(255,95,95,0.75) 45%, rgba(67,82,255,0.85) 100%); color: #ffffff; }
        .header img { height: 42px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.4px; }
        .content { padding: 40px; }
        .content p { margin: 0 0 18px; line-height: 1.6; }
        .button { display: inline-block; margin-top: 12px; padding: 14px 28px; border-radius: 999px; font-weight: 600; letter-spacing: 0.3px; background: ${PRIMARY_COLOR}; color: #ffffff !important; box-shadow: 0 10px 24px rgba(255,95,95,0.35); }
        .button:hover { box-shadow: 0 12px 28px rgba(255,95,95,0.4); }
        .footer { padding: 28px 40px 36px; font-size: 13px; line-height: 1.5; background: #fafbff; color: #6b7280; text-align: center; }
        .muted { color: #94a3b8; font-size: 12px; margin-top: 18px; }
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
            <img src="https://50runs.app/images/50runs_Logo.webp" alt="50Runs Logo" />
            <h1>Willkommen bei 50Runs!</h1>
          </div>
          <div class="content">
            <p>Hey Läufer*in,</p>
            <p>grandios, dass du mit uns deine Laufreise startest! Bitte bestätige kurz deine E-Mail-Adresse, damit wir dich anfeuern können.</p>
            <p style="text-align:center;">
              <a class="button" href="${link}">Konto aktivieren</a>
            </p>
            <p>Falls der Button nicht klickbar ist, kopiere diesen Link in deinen Browser:</p>
            <p style="word-break: break-word; font-size: 13px;"><a href="${link}">${link}</a></p>
            <p>Wir sehen uns auf der Laufstrecke! 🏃‍♀️🏃</p>
            <p>Dein <strong>#50Runs-Team</strong></p>
          </div>
          <div class="footer">
            <p>Du bekommst diese Nachricht, weil du ein Konto bei 50Runs erstellt hast.</p>
            <p class="muted">Wenn du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
          </div>
        </div>
      </div>
    </body>
  </html>
  `

  await resend.emails.send({
    from: '50Runs <onboarding@resend.dev>',
    to,
    subject: 'Bitte bestätige deine E-Mail-Adresse',
    html,
  })
}

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
export async function sendVerificationEmail({ to, token }: { to: string; token: string }) {
    const link = `${process.env.PUBLIC_ORIGIN}/api/auth/verify?token=${token}`
    await resend.emails.send({
        from: 'no-reply@50runs.app',
        to,
        subject: 'Bitte E‑Mail bestätigen',
        html: `<p>Bitte bestätige deine E‑Mail: <a href="${link}">Konto aktivieren</a></p>`
    })
}
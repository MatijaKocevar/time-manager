import { Resend } from "resend"

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === "your_resend_api_key_here") {
        return null
    }
    return new Resend(apiKey)
}

export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<{ success: boolean; error?: string }> {
    const resend = getResendClient()

    if (!resend) {
        console.warn("RESEND_API_KEY not configured, skipping email send")
        return { success: false, error: "Email service not configured" }
    }

    try {
        await resend.emails.send({
            from: "Time Manager <noreply@timemanager-demo.com>",
            to,
            subject,
            html,
        })

        return { success: true }
    } catch (error) {
        console.error("Error sending email:", error)
        return { success: false, error: "Failed to send email" }
    }
}

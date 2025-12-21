import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<{ success: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "your_resend_api_key_here") {
        console.warn("RESEND_API_KEY not configured, skipping email send")
        return { success: false, error: "Email service not configured" }
    }

    try {
        await resend.emails.send({
            from: "Time Manager <noreply@timemanager.com>",
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

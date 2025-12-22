import { format } from "date-fns"

interface RequestEmailData {
    userName: string
    requestType: string
    startDate: Date
    endDate: Date
    reason?: string
}

function formatDateRange(startDate: Date, endDate: Date): string {
    const start = format(startDate, "PPP")
    const end = format(endDate, "PPP")
    return start === end ? start : `${start} - ${end}`
}

function getRequestTypeLabel(type: string, locale: "en" | "sl"): string {
    const labels = {
        en: {
            VACATION: "Vacation",
            SICK_LEAVE: "Sick Leave",
            WORK_FROM_HOME: "Work from Home",
            OTHER: "Other",
        },
        sl: {
            VACATION: "Dopust",
            SICK_LEAVE: "Bolniška odsotnost",
            WORK_FROM_HOME: "Delo od doma",
            OTHER: "Drugo",
        },
    }
    return labels[locale][type as keyof typeof labels.en] || type
}

export function newRequestForAdminsEmail(
    data: RequestEmailData,
    locale: "en" | "sl" = "en"
): string {
    const dateRange = formatDateRange(data.startDate, data.endDate)
    const requestType = getRequestTypeLabel(data.requestType, locale)

    const content = {
        en: {
            subject: `New Request: ${data.userName} - ${requestType}`,
            title: "New Time-Off Request",
            intro: `${data.userName} has submitted a new request that requires your approval.`,
            detailsTitle: "Request Details",
            typeLabel: "Type",
            datesLabel: "Dates",
            reasonLabel: "Reason",
            actionTitle: "Action Required",
            actionText: "Please review and approve or reject this request in the admin panel.",
            buttonText: "Review Request",
        },
        sl: {
            subject: `Nova zahteva: ${data.userName} - ${requestType}`,
            title: "Nova zahteva za odsotnost",
            intro: `${data.userName} je oddal/a novo zahtevo, ki zahteva vašo odobritev.`,
            detailsTitle: "Podrobnosti zahteve",
            typeLabel: "Tip",
            datesLabel: "Datumi",
            reasonLabel: "Razlog",
            actionTitle: "Potrebno dejanje",
            actionText: "Prosimo, preglejte in odobrite ali zavrnite to zahtevo v admin panelu.",
            buttonText: "Preglej zahtevo",
        },
    }

    const t = content[locale]

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${t.title}</h1>
        </div>
        <div class="content">
            <p>${t.intro}</p>
            
            <div class="details">
                <h3>${t.detailsTitle}</h3>
                <div class="detail-row">
                    <span class="label">${t.typeLabel}:</span> ${requestType}
                </div>
                <div class="detail-row">
                    <span class="label">${t.datesLabel}:</span> ${dateRange}
                </div>
                ${data.reason ? `<div class="detail-row"><span class="label">${t.reasonLabel}:</span> ${data.reason}</div>` : ""}
            </div>
            
            <h3>${t.actionTitle}</h3>
            <p>${t.actionText}</p>
            
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/pending-requests" class="button">
                ${t.buttonText}
            </a>
            
            <div class="footer">
                <p>Time Manager - ${locale === "en" ? "Time & Request Management System" : "Sistem za upravljanje časa in zahtev"}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}

export function requestApprovedEmail(
    data: RequestEmailData,
    approvedByName: string,
    locale: "en" | "sl" = "en"
): string {
    const dateRange = formatDateRange(data.startDate, data.endDate)
    const requestType = getRequestTypeLabel(data.requestType, locale)

    const content = {
        en: {
            subject: `Request Approved: ${requestType}`,
            title: "Request Approved ✓",
            intro: `Great news! Your ${requestType.toLowerCase()} request has been approved by ${approvedByName}.`,
            detailsTitle: "Approved Request",
            typeLabel: "Type",
            datesLabel: "Dates",
            reasonLabel: "Reason",
            approvedByLabel: "Approved by",
            footer: "Your calendar has been updated automatically.",
        },
        sl: {
            subject: `Zahteva odobrena: ${requestType}`,
            title: "Zahteva odobrena ✓",
            intro: `Odlične novice! Vašo zahtevo za ${requestType.toLowerCase()} je odobril/a ${approvedByName}.`,
            detailsTitle: "Odobrena zahteva",
            typeLabel: "Tip",
            datesLabel: "Datumi",
            reasonLabel: "Razlog",
            approvedByLabel: "Odobril/a",
            footer: "Vaš koledar je bil samodejno posodobljen.",
        },
    }

    const t = content[locale]

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .success { background-color: #dcfce7; padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${t.title}</h1>
        </div>
        <div class="content">
            <div class="success">
                <p style="margin: 0;">${t.intro}</p>
            </div>
            
            <div class="details">
                <h3>${t.detailsTitle}</h3>
                <div class="detail-row">
                    <span class="label">${t.typeLabel}:</span> ${requestType}
                </div>
                <div class="detail-row">
                    <span class="label">${t.datesLabel}:</span> ${dateRange}
                </div>
                ${data.reason ? `<div class="detail-row"><span class="label">${t.reasonLabel}:</span> ${data.reason}</div>` : ""}
                <div class="detail-row">
                    <span class="label">${t.approvedByLabel}:</span> ${approvedByName}
                </div>
            </div>
            
            <p style="font-style: italic;">${t.footer}</p>
            
            <div class="footer">
                <p>Time Manager - ${locale === "en" ? "Time & Request Management System" : "Sistem za upravljanje časa in zahtev"}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}

export function requestRejectedEmail(
    data: RequestEmailData,
    rejectedByName: string,
    rejectionReason: string,
    locale: "en" | "sl" = "en"
): string {
    const dateRange = formatDateRange(data.startDate, data.endDate)
    const requestType = getRequestTypeLabel(data.requestType, locale)

    const content = {
        en: {
            subject: `Request Rejected: ${requestType}`,
            title: "Request Rejected",
            intro: `Your ${requestType.toLowerCase()} request has been rejected by ${rejectedByName}.`,
            detailsTitle: "Rejected Request",
            typeLabel: "Type",
            datesLabel: "Dates",
            rejectedByLabel: "Rejected by",
            reasonLabel: "Rejection Reason",
            footer: "If you have questions, please contact your administrator.",
        },
        sl: {
            subject: `Zahteva zavrnjena: ${requestType}`,
            title: "Zahteva zavrnjena",
            intro: `Vašo zahtevo za ${requestType.toLowerCase()} je zavrnil/a ${rejectedByName}.`,
            detailsTitle: "Zavrnjena zahteva",
            typeLabel: "Tip",
            datesLabel: "Datumi",
            rejectedByLabel: "Zavrnil/a",
            reasonLabel: "Razlog zavrnitve",
            footer: "Če imate vprašanja, se obrnite na svojega administratorja.",
        },
    }

    const t = content[locale]

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .warning { background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0; }
        .reason-box { background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${t.title}</h1>
        </div>
        <div class="content">
            <div class="warning">
                <p style="margin: 0;">${t.intro}</p>
            </div>
            
            <div class="details">
                <h3>${t.detailsTitle}</h3>
                <div class="detail-row">
                    <span class="label">${t.typeLabel}:</span> ${requestType}
                </div>
                <div class="detail-row">
                    <span class="label">${t.datesLabel}:</span> ${dateRange}
                </div>
                <div class="detail-row">
                    <span class="label">${t.rejectedByLabel}:</span> ${rejectedByName}
                </div>
            </div>
            
            <div class="reason-box">
                <p style="margin: 0;"><strong>${t.reasonLabel}:</strong></p>
                <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
            </div>
            
            <p style="font-style: italic;">${t.footer}</p>
            
            <div class="footer">
                <p>Time Manager - ${locale === "en" ? "Time & Request Management System" : "Sistem za upravljanje časa in zahtev"}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}

export function verificationEmail(
    email: string,
    token: string,
    locale: "en" | "sl" = "en"
): string {
    const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`

    const content = {
        en: {
            subject: "Verify your email - Time Manager",
            title: "Welcome to Time Manager!",
            intro: "Thank you for creating an account. Please verify your email address to complete your registration.",
            instructionsTitle: "Verify Your Email",
            instructions:
                "Click the button below to verify your email address. This link will expire in 24 hours.",
            buttonText: "Verify Email Address",
            alternativeText:
                "If the button doesn't work, copy and paste this link into your browser:",
            expiryNotice: "This verification link expires in 24 hours.",
            ignoreText:
                "If you didn't create an account with Time Manager, you can safely ignore this email.",
        },
        sl: {
            subject: "Potrdite vaš email - Time Manager",
            title: "Dobrodošli v Time Manager!",
            intro: "Hvala, ker ste ustvarili račun. Prosimo, potrdite svoj email naslov za dokončanje registracije.",
            instructionsTitle: "Potrdite vaš email",
            instructions:
                "Kliknite na spodnji gumb za potrditev vašega email naslova. Ta povezava bo potekla čez 24 ur.",
            buttonText: "Potrdi email naslov",
            alternativeText:
                "Če gumb ne deluje, kopirajte in prilepite to povezavo v vaš brskalnik:",
            expiryNotice: "Ta potrditvena povezava poteče čez 24 ur.",
            ignoreText:
                "Če niste ustvarili računa pri Time Manager, lahko to sporočilo mirno ignorirate.",
        },
    }

    const t = content[locale]

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .button { 
            display: inline-block; 
            background-color: #2563eb; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .link-box { 
            background-color: #f3f4f6; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
            word-break: break-all;
            font-size: 12px;
            color: #6b7280;
        }
        .warning { 
            background-color: #fef3c7; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0; 
            border-left: 4px solid #f59e0b;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #6b7280; 
            font-size: 14px; 
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${t.title}</h1>
        </div>
        <div class="content">
            <p>${t.intro}</p>
            
            <div class="info-box">
                <h3>${t.instructionsTitle}</h3>
                <p>${t.instructions}</p>
                
                <center>
                    <a href="${verificationUrl}" class="button">
                        ${t.buttonText}
                    </a>
                </center>
            </div>
            
            <div class="warning">
                <p style="margin: 0; font-size: 14px;">⏰ ${t.expiryNotice}</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">${t.alternativeText}</p>
            <div class="link-box">
                ${verificationUrl}
            </div>
            
            <div class="footer">
                <p>${t.ignoreText}</p>
                <p style="margin-top: 20px;">Time Manager - ${locale === "en" ? "Time & Request Management System" : "Sistem za upravljanje časa in zahtev"}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()
}

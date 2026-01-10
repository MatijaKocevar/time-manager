import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export default getRequestConfig(async () => {
    const cookieStore = await cookies()
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "en"

    console.log("[REQUEST CONFIG] Reading locale from cookie:", locale)

    return {
        locale,
        messages: (await import(`../../../messages/${locale}.json`)).default,
    }
})

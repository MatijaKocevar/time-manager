export const adminSettingsKeys = {
    all: ["adminSettings"] as const,
    settings: () => [...adminSettingsKeys.all, "settings"] as const,
}

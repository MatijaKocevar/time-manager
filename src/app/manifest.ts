import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Time Management App",
        short_name: "TimeManager",
        description: "Manage your time, tasks, and hours efficiently",
        start_url: "/",
        display: "standalone",
        orientation: "any",
        scope: "/",
        theme_color: "#000",
        background_color: "#000",
        categories: ["productivity", "business"],
        icons: [
            {
                src: "/pwa/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/pwa/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/pwa/icon-192x192-maskable.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/pwa/icon-512x512-maskable.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    }
}

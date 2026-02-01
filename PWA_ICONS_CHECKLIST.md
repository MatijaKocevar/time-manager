# PWA Icon Checklist

## Standard PNG Icons
- [ ] icon-72x72.png
- [ ] icon-96x96.png
- [ ] icon-128x128.png
- [ ] icon-144x144.png
- [ ] icon-152x152.png
- [ ] icon-192x192.png ⚠️ **CRITICAL** (service worker needs this)
- [ ] icon-384x384.png
- [ ] icon-512x512.png

## Maskable Icons (with 40% padding safe area)
- [ ] icon-192x192-maskable.png
- [ ] icon-512x512-maskable.png

## Optional
- [ ] Screenshots (mobile - 2-4 images, narrow)
- [ ] Screenshots (desktop - 2-4 images, wide)

## Instructions
1. Design requirements:
   - Use brand gradient: blue (#3b82f6) to purple (#9333ea)
   - Ensure icon works at small sizes
   - Maskable icons need content centered in 60% of canvas (40% padding)

2. Place all PNG files in the `public/` folder
3. Manifest is already configured to use these icons

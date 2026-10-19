# PWA Offline Caching & Installation Strategy

## Overview
This document outlines the Progressive Web App (PWA) configuration and caching behavior for **Chenpilot Client (`gear5labs/chenpilot-client`)**.

---

## 1. Manifest and Install Metadata
- **Manifest File**: Located at `/public/manifest.webmanifest`. Serves correct application name, standalone display mode, theme colors (`#0284c7`), and required icons (192px, 512px, and maskable variant).
- **iOS Support**: Apple-specific meta tags (`apple-mobile-web-app-capable`, status bar styling, and apple-touch-icon) are injected via `src/app/layout.tsx`.

---

## 2. Offline Caching & Service Worker Status
- **Implementation Status**: This Next.js web client relies on Next.js native HTTP caching, browser standard HTTP headers, and local state persistence rather than an automated Workbox service worker injection.
- **Static App Shell**: Handled via standard Next.js asset optimization, HTTP caching headers, and browser HTTP cache mechanisms.
- **Authenticated Route Safety**: 
  - To prevent stale session data or security leaks, all API routes matching `/api/auth/*` and protected endpoints bypass local caching and hit live server endpoints directly.
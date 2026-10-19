# PWA Offline Caching & Installation Strategy

## Overview
This document outlines the Progressive Web App (PWA) configuration and caching behavior for **Chenpilot Client (`gear5labs/chenpilot-client`)**.

---

## 1. Manifest and Install Metadata
- **Manifest File**: Located at `/public/manifest.webmanifest`. Serves correct application name, standalone display mode, theme colors (`#0284c7`), and required icons (192px, 512px, and maskable variant).
- **iOS Support**: Apple-specific meta tags (`apple-mobile-web-app-capable`, status bar styling, and apple-touch-icon) are injected via `src/app/layout.tsx`.

---

## 2. Offline Caching Strategy (Workbox)
- **Static App Shell**: HTML, CSS, JavaScript chunks, and static images are cached via CacheFirst / NetworkFirst strategies to ensure fast load times and basic offline shell availability.
- **Authenticated Route Safety**: 
  - To prevent stale session data or security leaks, all requests matching `/api/auth/*` and `/api/protected/*` are **explicitly excluded** from service worker caching.
  - Network requests for authenticated user data always bypass service worker caches and hit live server endpoints directly.

---

## 3. Offline Queue & Action Safety Policy

To ensure financial safety and prevent unsafe side effects upon reconnection, offline queueing restricts operations according to strict idempotency and classification guidelines:

- **Action Classification**: Only explicitly supported, idempotent read or general AI query operations are queueable when offline. Keyword analysis identifies operations involving payments, signing, transfers, funding, withdrawals, staking, or contract deployments.
- **Payment & Signing Exclusion**: Actions containing keywords such as `pay`, `send`, `sign`, `transfer`, `fund`, `withdraw`, `stake`, or `deploy` are **excluded from offline queueing by default** to prevent unauthorized ledger submissions or replay vulnerabilities.
- **Duplicate Replay Protection**: The client service layer (`ApiService.replayQueuedOperation`) maintains an execution tracking set (`replayedOperationIds`) to ensure that any queued operation replayed upon reconnection is protected against duplicate execution.
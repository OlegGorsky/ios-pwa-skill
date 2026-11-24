# Platform: install, environment, manifest, storage, lifecycle

Read when configuring the manifest and icons, the install screen, auth and sessions, storage,
offline mode, device detection, or when a bug affects only some iPhone users. 🔎 = public sources,
not verified on the source project (links in `research-2026.md`).

## Verified on the source project

- Safari tab and installed PWA have separate storage and separate cookie sessions. Restore the
  session from an httpOnly cookie with refresh-token rotation; never rely on localStorage alone.
- In a Safari tab, site data is wiped after 7 days without a visit.
- iOS has no `beforeinstallprompt` or `appinstalled` events — build your own install-instruction screen.
- After the phone sleeps, a WebSocket stays "open" but dead. On `visibilitychange` (page visible)
  send a ping and recreate the socket if there is no reply within 4 seconds; after reconnecting,
  fetch the messages missed meanwhile.

## 🔎 Install and environment

- **iOS/iPadOS 26+: every site** added to the Home Screen opens as a web app by default, even
  without a manifest (the user can turn off "Open as Web App"). Installed-PWA bugs (downloads, no
  back button, separate storage) therefore affect ordinary sites too — test sites in this mode.
- An installed PWA has its own storage, cookies and permissions. Since iOS 17.2 login cookies are
  copied from Safari on install. Removing the icon deletes the app's data and push subscription.
- Installing from other browsers: since iOS 16.4.
- iOS 26+ User-Agent shows a frozen OS version (e.g. `OS 18_6`); only `Version/26.x` changes.
  Never derive the iOS version from the UA — feature-detect: `'PushManager' in window`,
  `CSS.supports(...)`, `MediaRecorder.isTypeSupported(...)`.
- Every iPhone browser runs on WebKit (exceptions: EU and Japan, with conditions): Chrome on iOS
  reproduces Safari bugs.
- Build: regex lookbehind (`(?<=…)`) is supported only from Safari 16.4. On older iOS it is a
  SyntaxError and the whole bundle fails with a white screen. Set the build target to the minimum
  supported iOS.
- Lockdown Mode disables JIT and some APIs. If a bug reproduces for exactly one user and nobody
  else, ask whether Lockdown Mode is on.
- Links from messengers open in an in-app browser without "Add to Home Screen". Show an
  "Open in Safari" hint.

## 🔎 Manifest and icons

- iOS ignores `orientation`, `background_color`, `share_target`, `display_override` and maskable
  icons; `shortcuts` work only on macOS; `minimal-ui` and `fullscreen` fall back to the default mode.
- Icons: square PNGs without transparency (transparent areas turn black); iOS rounds the corners.
  `apple-touch-icon` overrides manifest icons. SVG icons (iOS 26+) only via the manifest.
- `apple-touch-startup-image` works only together with `apple-mobile-web-app-capable`.

## 🔎 Storage and lifecycle

- Quota since iOS 17: up to ~60% of disk per origin, same for an installed PWA. Overflow →
  `QuotaExceededError`. The server must still hold the primary copy of data.
- The 7-day wipe applies to Safari; an installed PWA has its own days-of-use counter. Keep the
  session in a server-set httpOnly cookie, not a JS-written cookie.
- iOS evicts background tabs/apps without `unload`. Save drafts to IndexedDB (300–500 ms after
  input and on `visibilitychange`/`pagehide`) and offer to restore them on next open.
- No Background Sync, Periodic Sync or Background Fetch. Queue outgoing requests in IndexedDB and
  send them on return to the app and on `online`, with idempotency keys.
- No Vibration API, Web Bluetooth, WebNFC, WebUSB. Fullscreen API on iPad only.

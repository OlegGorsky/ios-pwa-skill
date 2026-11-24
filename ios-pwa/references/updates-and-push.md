# Service worker, updates, chunk loading, push

Read when touching the service worker, deploys and releases, module-loading error handling, or
push notifications. 🔎 = public sources, not verified on the source project (links in
`research-2026.md`).

## Releases and updates

iOS keeps stale service workers and HTML for a long time, so use an explicit release strategy:
- `/release.json` endpoint with `Cache-Control: no-store` returning the release id; bake the id
  into assets at build time;
- check for a new release on `visibilitychange` (page visible), `focus`, `online`, and every
  30–60 seconds while the app is open;
- activate a new release silently: right after launch (before the first tap), when the app goes
  to background, or as a full load on the next navigation. Never reload an active user; at most
  one reload per release;
- on first visit store the id returned by the server. Why: otherwise everyone with empty storage
  (iOS clears it) sees a false "update available" banner.

Also:
- Use `registration.update()` + `postMessage({ type: 'SKIP_WAITING' })`, not `unregister()`:
  `unregister()` loses the push subscription.
- Keep old hashed chunks on the server after a release: clients with stale HTML still request them.
- Write the service-worker registration script in legacy syntax (no `?.`, `??`, `1_000`): it runs
  on the oldest devices before any polyfills.
- Nuxt: `experimental.entryImportMap: false` — import maps broke old Safari.
- HTTP/3 (QUIC) silently drops requests on some iOS paths (they never reach server logs). Until
  verified on your infrastructure, allow only `h1 h2` on the proxy (Caddy: `servers { protocols h1 h2 }`).

## Chunk-loading errors after deploy

Normal on iOS. Catch the error and reload once, guarded by a storage flag for 5 minutes. Signals:
- `Failed to fetch dynamically imported module`;
- `Importing a module script failed` (Safari);
- `Unable to preload CSS`;
- Safari-specific `undefined is not an object (evaluating 'x.default')` — treat as a chunk error
  only if a real asset-load error occurred in the last 15 seconds. Why: the same message can be a
  real bug, and an unconditional reload would hide it.

Code: `../snippets/chunk-recovery.ts`.

## Push notifications

- iOS push works only in an installed PWA, from iOS 16.4. In a Safari tab show the instruction
  "Share → Add to Home Screen" instead of a button that does nothing. Return the reason
  explicitly: `ios_install_required`, `ios_update_required`, `permission_denied`, `unsupported`.
  🔎 On iOS 26 the OS version in the User-Agent is frozen → decide `ios_update_required` by the
  presence of `PushManager`, not by the UA version.
- `navigator.serviceWorker.ready` and `Notification.requestPermission()` may never settle. Wrap
  each step in a 10-second timeout and the whole enable flow in a 20-second watchdog; log the step
  that hung.
- The "Enable notifications" dialog must always have a close button; otherwise a user who cannot
  enable push is trapped. Show a spinner and text while subscribing.
- iOS drops subscriptions. Store `deviceId` and an "enabled" flag in localStorage; on every launch,
  if the flag is set and there is no subscription, resubscribe silently.
- Server-side, serialize concurrent subscribe requests per user + device: the race causes a
  unique-constraint error and a 500.
- On notification click, focus the already open app window and normalize the URL to your origin.

### 🔎 From public sources

- Every push must show a notification inside `event.waitUntil(showNotification(...))`. After three
  silent pushes (not shown, shown late, or rejected promise) Safari removes the subscription. Never
  skip the notification, even if the user is currently in the app.
- `pushsubscriptionchange` is not supported, and a subscription can silently stop working while
  the push service still returns 200. The launch-time subscription check above is mandatory.
- Since iOS 18.4: Declarative Web Push — notifications without a service worker.
- `navigator.setAppBadge` (icon badge) works only in an installed PWA, from 16.4.

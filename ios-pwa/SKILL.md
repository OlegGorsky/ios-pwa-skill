---
name: ios-pwa
description: >-
  Proven rules and ready-made fixes that make PWAs and mobile websites work on iPhone and iPad
  (iOS Safari, WebKit, Home Screen web apps) — bottom tab bar and fixed elements, scrolling,
  modals, keyboard, safe area, audio and voice messages, video, file downloads, service worker
  and updates, push, storage. Use when building, reviewing or debugging a mobile front end that
  may be opened on an iPhone, even if the user never says "iOS" — e.g. "the menu jumps on
  iPhone", "voice messages don't play in Safari", "download doesn't work on iPhone", "white
  screen after deploy", "works on Android but not on iPhone" (also in Russian: «меню прыгает на
  айфоне», «голосовые не играют», «на айфоне не работает»). Do NOT use for native iOS apps
  (Swift, SwiftUI, React Native, Flutter) or desktop-only layouts.
---

# iOS PWA

Every rule below is either a bug that already cost several iterations on a production PWA or
documented WebKit behavior. Goal: ship the correct solution on the first try, because a real
iPhone is often unavailable for testing.

## Terms (one term per concept)

- **installed PWA** — site launched from the Home Screen (`display-mode: standalone`,
  `navigator.standalone`). Many bugs exist only here.
- **Safari tab** — the same site in Safari or any other iPhone browser.
- **bottom bar** — fixed tab bar at the bottom of the screen.
- **iOS** — iOS and iPadOS.
- 🔎 — from public sources (Safari release notes, WebKit blog and bug tracker, firt.dev), not
  verified on the source project. Verify on a device.

## Pre-flight

Determine from the code and task; if impossible, ask the user once:
1. Minimum supported iOS version. Unknown → assume iOS 16.4 (push, build syntax and media
   formats depend on it).
2. Whether the site runs as an installed PWA. Since iOS 26 every Home Screen site does → default yes.
3. Framework, and whether fixed elements render through a portal/teleport into `body`.
4. How the server serves media and files (Range requests, `Content-Type`, separate domain).

## Core principles

- Distinguish three environments: Safari tab, installed PWA, Android/desktop.
  iOS = `/iPhone|iPad|iPod/` or (`Macintosh` and `maxTouchPoints > 1`) — iPadOS reports as Mac.
  Installed PWA = `navigator.standalone === true || matchMedia('(display-mode: standalone)').matches`.
  Code: `snippets/ios-detect.ts`.
- 🔎 Never read the iOS version from the User-Agent: on iOS 26+ it is frozen. Feature-detect
  (`'PushManager' in window`, `CSS.supports(...)`).
- Scope iOS workarounds: a class on `<html>`, only for iOS, only on the routes that need it.
  Global workarounds break Android and desktop.
- Never fix layout with `scroll`/`resize` JS handlers: on iOS this causes jitter and flicker.
  Switch modes only on route change or modal open/close.
- Lock every iOS fix with a regression test and a "why" comment linking the WebKit bug, or the
  next refactor brings the bug back. Examples: `references/regression-tests.md`.

## Map: what to read

Read only the file for the current task; do not load the others.

| Task | Read | Skip |
|---|---|---|
| Bottom bar, fixed/sticky, scrolling, modals, keyboard, safe area, inputs | `references/layout.md` | media, downloads |
| `<audio>`, `<video>`, voice messages, recording, Web Audio, media upload | `references/media.md` | layout |
| Download button, saving video/images/PDF, outbound links | `references/downloads.md` | media |
| Service worker, deploys, white screen after release, push | `references/updates-and-push.md` | layout |
| Manifest, icons, install, sessions, storage, offline, device detection | `references/platform.md` | media |
| Source for a 🔎 item, or where to track new iOS releases | `references/research-2026.md` | — |
| Which approaches were already tried and failed | `references/iteration-history.md` | — |

Ready code in `snippets/`: iOS detection, body scroller, scroll lock, keyboard-aware height,
downloads, chunk-error recovery, ffmpeg commands.

## Most expensive mistakes (always apply)

- **Bottom bar**: render as a direct child of `<body>`; no `transform`, `will-change`, `contain`,
  `backdrop-filter` or animations on it — each breaks `position: fixed` on iOS. In an installed
  PWA on iOS 26, `body` must be the scroller, not the document. → `layout.md` §1
- **Modals**: lock scroll with `overflow: hidden` on `html` and `body`, never
  `body { position: fixed }` — it moves the bottom bar and can freeze the page. → `layout.md` §2
- **Keyboard**: does not shrink `dvh` on iOS; size input screens from `visualViewport`. → `layout.md` §4
- **Audio**: store MP3 or AAC; transcode OGG/Opus/WebM server-side on upload; the server must
  support Range requests. → `media.md`
- **Downloads**: a plain download link in an installed PWA traps the user on a screen with no
  navigation. Video → signed ticket on another domain; images → Share sheet. → `downloads.md`
- **Releases**: without an update strategy, users with stale HTML get a white screen. Add one
  guarded reload on chunk errors and silent release activation. → `updates-and-push.md`
- **Push**: iOS supports it only in an installed PWA; every push must show a notification or
  Safari drops the subscription after three silent ones. → `updates-and-push.md`

## Symptom → where to look

| Symptom on iPhone | File / section |
|---|---|
| Bottom bar jumps, drifts, floats mid-screen | `layout.md` §1 |
| 🔎 Bottom bar stuck mid-screen after keyboard closes (iOS 26) | `layout.md` §1, Liquid Glass |
| Page opens scrolled down after navigation | `layout.md` §1, body scroller |
| Scroll broken or bar moved after closing a modal | `layout.md` §2 |
| Flicker on scroll or focus | `layout.md` §3 (`backdrop-filter`, load anchor), §4 (`focusin`) |
| Input hidden by keyboard | `layout.md` §4 |
| Page zooms in on input focus | `layout.md` §4, auto-zoom |
| 🔎 Safari bar color wrong, `theme-color` ignored (iOS 26) | `layout.md` §1, Liquid Glass |
| Voice/audio does not play | `media.md`: format, Range, `Content-Type`, gesture |
| 🔎 Web Audio silent while `<audio>` plays | `media.md`: silent switch |
| Video won't play, starts slowly, opens fullscreen | `media.md`: faststart, `playsinline`, H.264 |
| 🔎 Background video doesn't autoplay for some users | `media.md`: Low Power Mode |
| "Download" does nothing or opens the file with no way back | `downloads.md` |
| White screen or module error after deploy | `updates-and-push.md`: chunks, syntax |
| 🔎 White screen only on old iOS | `platform.md`: build syntax |
| Push stops arriving over time | `updates-and-push.md`: resubscribe, silent pushes |
| 🔎 iOS version detection wrong on iOS 26 | `platform.md`: User-Agent |
| User "logged out" after adding to Home Screen | `platform.md`: separate storage |

## Verification without an iPhone

After changes, give the user this plan (in the user's language):
1. Automated: regression tests on CSS invariants (no `transform`/animation on the bottom bar,
   `playsinline` present, API never serves OGG) plus Playwright WebKit as a first filter. It does
   not reproduce safe area, Safari bars or downloads.
2. Production diagnostics: on scroll and `resize` log `visualViewport` (height, offsetTop, scale),
   the actual scroller, `scrollTop`, bottom-bar distance from the viewport bottom; log media,
   download and chunk errors with the User-Agent. Bugs become visible without a device.
3. Manual script for someone with an iPhone: add to Home Screen → long feed, momentum scroll
   both ways with direction changes → every bottom-bar tab → open/close keyboard → open/close a
   modal → play a voice message → download video, image, PDF → background and reopen the app.
   Repeat in a Safari tab and on Android.
4. Cloud real devices (BrowserStack, LambdaTest) or a used iPhone on an old iOS.

## Extending

New case → row in "Symptom → where to look" + rule in the matching `references/` file as
"do — why — WebKit bug or commit link". Rules without 🔎 must be verified on a real device.
Findings from docs → mark 🔎 and add the source to `references/research-2026.md`; remove 🔎
once verified in a project.

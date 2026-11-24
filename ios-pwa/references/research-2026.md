# Sources: iOS Safari and PWA behavior (as of November 2026)

Sources for every 🔎 item in this skill: official Apple/WebKit docs, the WebKit bug tracker and
established references. Read to confirm a 🔎 item or to check whether behavior changed in a newer
iOS release. When targeting a specific iOS version, check the current release notes.

## Where to track changes

- **Safari release notes** — fixes and features per version:
  https://developer.apple.com/documentation/safari-release-notes
  (every page has a plain-text version: append `.md` to the URL).
- **WebKit blog** — detailed write-up of each release: https://webkit.org/blog/
- **WebKit bug tracker** — search the symptom before fixing: https://bugs.webkit.org
- **iOS PWA compatibility notes** (Maximiliano Firtman, maintained): https://firt.dev/notes/pwa-ios/
- **Can I Use** — per-API and CSS support: https://caniuse.com
- **Apple Developer Forums**, Safari & Web: https://developer.apple.com/forums/

## Install, environment, User-Agent

- iOS 26: every Home Screen site opens as a web app; manifest not required —
  https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- iOS 26: User-Agent reports a frozen OS version; WebKit recommends feature detection. Same post;
  Safari 26.2 Release Notes (156170132) —
  https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes
- Manifest and installed-PWA support per iOS version (icons, display, push, badging, wake lock,
  no share_target, no background sync, etc.): https://firt.dev/notes/pwa-ios/
- Transparent icons turn black; icons must be square without rounding: https://firt.dev/pwa-design-tips
- Four isolated contexts (Safari tab, SFSafariViewController, in-app browsers, installed web app),
  re-login, killed processes, Lockdown Mode, lookbehind syntax, messenger links: "PWA on iOS"
  series on DZone (November 2026) — https://dzone.com/articles/webkit-pwas-ios

## iOS 26, Liquid Glass, viewport, keyboard

- Fixed elements shift when scroll direction changes: https://bugs.webkit.org/show_bug.cgi?id=297779
- `visualViewport.offsetTop/height` not restored after the keyboard closes, bottom bar floats:
  https://developer.apple.com/forums/thread/800125 , https://developer.apple.com/forums/thread/800154
- `viewport-fit=cover` does not cover the address-bar area: https://bugs.webkit.org/show_bug.cgi?id=301108
- Viewport shifts under Dynamic Island after the keyboard: https://bugs.webkit.org/show_bug.cgi?id=300523
- Fixed elements jump under the iOS 26 toolbar; known conditions for full-screen overlays:
  https://developer.apple.com/forums/thread/801694
- Fixes: "bottom gap on viewport-sized fixed containers" (Safari 26.1, 158055568) —
  https://developer.apple.com/documentation/safari-release-notes/safari-26_1-release-notes ;
  `<dialog>` backdrop under the address bar (163535684) and sticky z-order (90572595) — Safari 26.2.
- `theme-color` no longer tints Safari 26 bars; tint comes from the page background:
  https://bugs.webkit.org/show_bug.cgi?id=301756 ,
  https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/
- Input auto-zoom below 16px `font-size` — well-known iOS Safari behavior, e.g.
  https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing

## Media

- Autoplay policy (`muted` + `playsinline`): https://webkit.org/blog/6784/new-video-policies-for-ios/
- Autoplay disabled in Low Power Mode: https://bugs.webkit.org/show_bug.cgi?id=216887
- Web Audio muted by the silent switch; workaround `navigator.audioSession.type = "playback"`
  (iOS 17+): https://bugs.webkit.org/show_bug.cgi?id=237322
- `AudioContext` silent after the PWA returns from background: https://bugs.webkit.org/show_bug.cgi?id=291892
- `<audio>` failed when reopening a Home Screen web app — fixed in Safari 26.2 (155336513).
- MediaRecorder: originally MP4/AAC/H.264 only — https://webkit.org/blog/11353/mediarecorder-api/ ;
  WebM since 18.4 — https://bugs.webkit.org/show_bug.cgi?id=290223 ;
  iOS 26 corrupted-recording regression — https://bugs.webkit.org/show_bug.cgi?id=299164

## Downloads

- Download in an installed PWA leads to a screen with no navigation (iOS 18.4):
  https://bugs.webkit.org/show_bug.cgi?id=290847 (repro:
  https://github.com/tobias-grasse/ios-pwa-download-reproduction)
- Same since iOS 15: https://bugs.webkit.org/show_bug.cgi?id=236943
- Images cannot be downloaded in an installed PWA: https://bugs.webkit.org/show_bug.cgi?id=275288

## Push notifications

- WebKit requires `userVisibleOnly`, silent push forbidden; Declarative Web Push:
  https://webkit.org/blog/16535/meet-declarative-web-push/
- Silent-push quota: subscription removed after three — WebKit commit "Enforce silent push quota":
  https://webkit.googlesource.com/WebKit/+/108ccb442e40e9705d212e74c1f213e3b5a0ea05
- Practical write-up (`event.waitUntil`): https://dev.to/progressier/how-to-fix-ios-push-subscriptions-being-terminated-after-3-notifications-39a7
- Subscription silently stops working, no `pushsubscriptionchange`:
  https://bugs.webkit.org/show_bug.cgi?id=273063 , https://developer.apple.com/forums/thread/848080
- Apple guide: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers

## Storage

- WebKit storage policy (origin and overall quotas, eviction): https://webkit.org/blog/14403/updates-to-storage-policy/
- ~60% of disk quota, same for installed apps — MDN:
  https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- 7-day rule applies to Safari; installed apps have their own counter:
  https://bugs.webkit.org/show_bug.cgi?id=237350

# Layout: bottom bar, scrolling, modals, keyboard, safe area

Read for fixed/sticky elements, scrolling, modals, inputs, or notch/home-indicator insets.
🔎 = public sources, not verified on the source project (links in `research-2026.md`).

Terms: **installed PWA** — launched from Home Screen (`display-mode: standalone`);
**Safari tab** — same site in Safari; **bottom bar** — fixed tab bar at the bottom.

## 1. Bottom bar and other fixed elements

Symptoms: bar jumps, drifts up, renders mid-screen while scrolling, flickers, lags during momentum scroll.

- Render the bottom bar and every `position: fixed` overlay as a **direct child of `<body>`**
  (Vue `<Teleport to="body">`, React `createPortal`). Why: an ancestor with `transform`, `filter`,
  `contain`, `will-change`, `backdrop-filter` or `perspective` becomes the containing block and
  fixed behaves like absolute.
- On the bottom bar itself never use `transform` (including the `translate3d(0,0,0)` "hack"),
  `will-change`, `contain`, `isolation`, `backface-visibility`, `backdrop-filter`, or
  `opacity`/`transform` animations and transitions. Set `transition: none`. Why: each of these
  caused drift on the source project; the `translate3d` hack made it worse and was reverted.
- Bottom inset: `padding-bottom: max(0.45rem, calc(env(safe-area-inset-bottom) - 0.75rem))`
  (or plain `env(safe-area-inset-bottom)`) and `viewport-fit=cover` in the viewport meta.
- Measure bar height with `ResizeObserver` → CSS var `--dock-height` → content `padding-bottom`.
  Write the var only when the value changes. Never recompute on `visualViewport.resize`: Safari
  bars change it on every scroll and the bar jitters.
- Make tabs `<button>` + `router.push`, not `<a href>`: links in an installed PWA cause full
  navigations and system tap highlights.

**iOS 26, installed PWA (WebKit 301172, 312149).** Fixed/sticky elements can be painted at
document coordinates (mid-screen) while `getBoundingClientRect` reports correct values. Fix:
make `body` the scroller instead of the document:

```css
/* class applied only for iOS + installed PWA, only on app routes */
html.ios-app-scroll { height: 100vh; height: 100dvh; min-height: 0; overflow: hidden; }
html.ios-app-scroll body {
  height: 100vh; height: 100dvh; min-height: 0;
  overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain;
}
```

Same change must also cover (code: `../snippets/ios-standalone-scroll.ts`):
- [ ] Replace `window.scrollY` / `window.scrollTo` with `getPageScrollTop()` /
      `setPageScrollTop()` / `getPageScroller()` everywhere: scroll restoration, infinite feed,
      "back to top", analytics.
- [ ] Reset `body` scroll explicitly on page entry (immediately, then in `nextTick` and after two
      `requestAnimationFrame`s): the router resets `window`, not `body`, so pages open mid-way.
- [ ] Toggle the class only on route change, never on `scroll`/`resize`.
- [ ] Do not replace with `body { position: fixed }`: it clips long content in installed PWAs.

🔎 **iOS 26, Safari tab (Liquid Glass).**
- Fixed/sticky elements at the bottom shift ~10px when scroll direction changes. After the
  keyboard closes, `visualViewport.offsetTop` and `height` do not return to their original
  values and the bottom bar stays mid-screen. Partly fixed in 26.1 (bottom gap on
  viewport-sized fixed containers) and 26.2 (`<dialog>` backdrop under the address bar, sticky
  z-order). On 26.0–26.1, do not use `visualViewport` values right after the keyboard closes;
  recompute on the next `resize` or `scroll` event.
- `<meta name="theme-color">` no longer tints Safari 26 bars in a tab; the tint comes from the
  page background. Set `background-color` on `html` and `body`. Fixed elements touching screen
  edges also change the tint.
- A full-screen overlay under the Safari toolbar reportedly works only with a semi-transparent background.

## 2. Scroll lock under modals

- Lock with `overflow: hidden` on `html` and `body`. Never use
  `body { position: fixed; top: -scrollY }`: on iOS it changes fixed descendants (the bottom bar
  moves) and can freeze the page if the modal close transition races the unlock.
- Lock with owners (Map owner → reason): two open modals = one lock, released when the last
  closes. Save and restore the original inline styles. Code: `../snippets/page-scroll-lock.ts`.
- Scrollable container inside a modal: `overflow-y: auto; overscroll-behavior: contain;`.

## 3. Scrolling, rubber-band, pull-to-refresh, flicker

- Set `overscroll-behavior-y: none` on `html`, `body` and the app root: removes rubber-band and
  pull-to-refresh, which jerks or reloads the page in an installed PWA.
- If rubber-band still interferes on app routes: a global `touchmove` listener with
  `passive: false` that calls `preventDefault()` only on a downward swipe and only when no
  ancestor of the target has `scrollTop > 0`. Leave upward swipes and nested scrollers alone.
- Nested scrollers (chat, feed inside a modal): `min-height: 0` on the flex child,
  `overflow-y: auto`, `overscroll-behavior-y: contain`. Chat screen: `position: fixed; inset: 0`
  instead of `height: 100dvh`.
- `backdrop-filter` on phones is the main source of scroll flicker and jank. Disable it under
  `@media (hover: none) and (pointer: coarse)` for headers, inputs, cards and floating buttons;
  use an opaque background instead.
- `background-attachment: fixed` does not work on iOS and jitters → use `scroll`. Decorative
  background layers: `position: absolute`, not `fixed`.
- No `scroll-behavior: smooth` on `html` in an SPA: router and scroll restoration start "gliding".
- Infinite loading (especially chat upward): request the next page 1.5 viewport heights before
  the edge (minimum 480px), not 72px. Measure the scroll anchor after data arrives, right before
  the DOM changes: measuring before the request throws the reader back during momentum scroll.

## 4. Viewport, keyboard, safe area, inputs

- Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover`. Plus
  `apple-mobile-web-app-capable=yes` and `apple-mobile-web-app-status-bar-style=black-translucent`.
- Auto-zoom on focus: inputs with `font-size` below 16px make iOS zoom the page. Use ≥16px on all
  `input`, `textarea`, `select`. `maximum-scale=1` also prevents it but hurts accessibility — use
  only if 16px is impossible in the design.
- Keep safe areas in CSS vars (`--safe-top: env(safe-area-inset-top, 0px)` etc.) and apply to
  headers, bottom bar, full-screen modals, close buttons (`top: max(1rem, env(safe-area-inset-top))`).
- Screen height:
  - page `min-height`: `--app-vh: 100vh` with `@supports (height: 100svh) { --app-vh: 100svh }`
    — `svh` does not jump when Safari bars show/hide;
  - full-screen shells and modals: `100dvh` (`max-height: min(88dvh, 48rem)`);
  - never use bare `100vh` alone — on iOS it exceeds the visible screen.
- **The keyboard does not shrink `dvh` on iOS.** For screens with a bottom input (chat, support)
  compute height from `visualViewport`: `height = visualViewport.offsetTop + visualViewport.height
  - container.top`. Listen to `visualViewport` `resize` and `scroll`, update in
  `requestAnimationFrame`. Code: `../snippets/visual-viewport-height.ts`.
- If the container lives inside a scrolling `<main>`, iOS positions its fixed children relative
  to `<main>` (Android does not). Fix: move it into `<body>` + `top`/`height` from `visualViewport`.
- Never hide the bottom bar via `focusin`/`focusout` handlers: it caused flicker on focus. If it
  must hide while typing, use CSS without animation:
  `html:has(input:focus, textarea:focus, [contenteditable]:focus) .bottom-bar { visibility: hidden }`.
- Dark-theme inputs: `-webkit-appearance: none; appearance: none;` plus explicit `color`,
  `caret-color`, `-webkit-text-fill-color`, `color-scheme`, or text/autofill can be invisible.
  `-webkit-text-size-adjust: 100%` on `html`.
- Touch: `-webkit-tap-highlight-color: transparent; touch-action: manipulation;` on buttons;
  `-webkit-touch-callout: none` where the long-press menu interferes.
- Hover styles only under `@media (hover: hover)`, otherwise they stick after a tap.
- 🔎 On iOS 26.0–26.1, cancelling "Take Photo/Video" could break the file input (fixed in 26.2).
  If users report it, recreate `<input type="file">` after each selection.

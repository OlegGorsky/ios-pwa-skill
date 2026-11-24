# Regression tests for iOS invariants

Read when locking an iOS fix with a test. Paths and class names come from the source project
(Nuxt); replace them with your own. `dock` in the code = the bottom bar.

Without an iPhone at hand, the best protection is tests that read the source and assert the iOS
fix was not refactored away. Example for bun/vitest (files read as text):

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const layout = readFileSync('layouts/default.vue', 'utf8')
const css = readFileSync('assets/css/main.css', 'utf8')
const dockBlock = layout.match(/\.bottom-dock\s*\{[^}]*\}/)?.[0] ?? ''

describe('iOS PWA invariants', () => {
  test('dock is teleported to body', () => {
    expect(layout).toMatch(/<Teleport to="body">[\s\S]*data-app-bottom-dock/)
  })
  test('no transform / will-change / contain / animation on the fixed dock', () => {
    expect(dockBlock).not.toMatch(/transform|will-change|contain|backdrop-filter|isolation/)
    expect(dockBlock).toMatch(/transition:\s*none/)
  })
  test('dock layout is not recomputed on visualViewport resize', () => {
    expect(layout).not.toMatch(/visualViewport\?\.addEventListener\('resize', updateBottomDockHeight/)
  })
  test('page background is not fixed-attached', () => {
    expect(css).not.toMatch(/background-attachment:\s*fixed/)
  })
  test('scroll lock does not use body position fixed', () => {
    const lock = readFileSync('utils/page-scroll-lock.ts', 'utf8')
    expect(lock).not.toMatch(/body\.style\.position\s*=\s*'fixed'/)
  })
  test('every <video> is playsinline', () => {
    // glob components/**/*.vue and assert every <video ...> has playsinline
  })
})
```

Also useful:
- unit test for iOS detection (iPhone, iPad, iPad-as-Mac with touch, Android = false);
- test that the API never serves `audio/ogg`/`audio/webm` after upload (transcoding worked);
- test for the file name parsed from `Content-Disposition` with `filename*=UTF-8''`;
- release-strategy tests (first visit does not reload, never reload twice, etc.).

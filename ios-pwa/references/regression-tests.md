# Регрессионные тесты на iOS-инварианты

Без айфона под рукой лучшая защита — тесты, которые читают исходники и проверяют, что
iOS-фикс не «отрефакторили». Пример на bun/vitest (читают файлы как текст):

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
    // пройти по components/**/*.vue и проверить, что у каждого <video ...> есть playsinline
  })
})
```

Также полезно:
- unit-тест детекта iOS (iPhone, iPad, iPad-как-Mac с touch, Android = false);
- тест, что API не отдаёт `audio/ogg`/`audio/webm` после загрузки (конвертация сработала);
- тест имени файла из `Content-Disposition` с `filename*=UTF-8''`;
- тест стратегии релизов (первый визит не перезагружает, не перезагружать дважды и т.д.).

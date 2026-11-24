# Вёрстка: нижнее меню, скролл, модалки, клавиатура, safe area

Читай этот файл, когда задача касается fixed/sticky-элементов, прокрутки, модальных окон,
полей ввода или отступов под «чёлку» и полосу «Домой». Пункты с 🔎 взяты из открытых
источников и не проверены на исходном проекте (ссылки — в `research-2026.md`).

Термины: **установленная PWA** — сайт, запущенный с экрана «Домой» (в коде это
`display-mode: standalone`); **Safari-вкладка** — тот же сайт в обычном Safari;
**нижнее меню** — fixed-панель вкладок внизу экрана.

## 1. Нижнее меню и другие fixed-элементы

Симптомы: меню скачет, уезжает вверх, рисуется посередине экрана при прокрутке, мигает,
отстаёт при инерционной прокрутке.

- Рендери нижнее меню и любые `position: fixed` оверлеи **прямым ребёнком `<body>`**
  (Vue `<Teleport to="body">`, React `createPortal`). Почему: предок с `transform`, `filter`,
  `contain`, `will-change`, `backdrop-filter` или `perspective` становится containing block,
  и fixed начинает вести себя как absolute.
- На самом нижнем меню не используй `transform` (включая «хак» `translate3d(0,0,0)`),
  `will-change`, `contain`, `isolation`, `backface-visibility`, `backdrop-filter`, анимации и
  transition `opacity`/`transform`. Ставь `transition: none`. Почему: каждое из этих свойств
  на исходном проекте вызывало дрейф меню; «хак» `translate3d` сделал хуже и был откачен.
- Отступ снизу: `padding-bottom: max(0.45rem, calc(env(safe-area-inset-bottom) - 0.75rem))`
  (или просто `env(safe-area-inset-bottom)`) и `viewport-fit=cover` в meta viewport.
- Высоту меню измеряй через `ResizeObserver` → CSS-переменная `--dock-height` → `padding-bottom`
  у контента. Записывай переменную, только если значение изменилось. Не пересчитывай её на
  `visualViewport.resize`: панели Safari меняют этот размер при каждой прокрутке, и меню дёргается.
- Вкладки меню делай `<button>` + `router.push`, а не `<a href>`: ссылки в установленной PWA
  дают лишние полные переходы и системную подсветку.

**iOS 26, установленная PWA (WebKit 301172, 312149).** Fixed/sticky-элементы могут
рисоваться в координатах документа (посередине экрана), хотя `getBoundingClientRect`
возвращает правильные значения. Рабочее решение — сделать скроллером `body`, а не документ:

```css
/* класс ставится только для iOS + установленной PWA и только на роутах приложения */
html.ios-app-scroll { height: 100vh; height: 100dvh; min-height: 0; overflow: hidden; }
html.ios-app-scroll body {
  height: 100vh; height: 100dvh; min-height: 0;
  overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain;
}
```

Последствия, которые нужно учесть в том же изменении (готовый код — `../snippets/ios-standalone-scroll.ts`):
- [ ] `window.scrollY` / `window.scrollTo` заменены хелперами `getPageScrollTop()` /
      `setPageScrollTop()` / `getPageScroller()` во всех местах: восстановление прокрутки,
      бесконечная лента, кнопка «наверх», аналитика.
- [ ] При входе на страницу прокрутка `body` сбрасывается явно (сразу, затем в `nextTick` и
      через два `requestAnimationFrame`): роутер сбрасывает `window`, а не `body`, и страница
      иначе открывается не сверху.
- [ ] Класс переключается только при смене роута, не на `scroll`/`resize`.
- [ ] Не заменено на `body { position: fixed }`: в установленной PWA это обрезает длинный контент.

🔎 **iOS 26, Safari-вкладка (Liquid Glass).**
- Fixed/sticky-элементы у нижнего края смещаются примерно на 10px при смене направления
  прокрутки. После закрытия клавиатуры `visualViewport.offsetTop` и `height` не возвращаются к
  исходным значениям, и нижнее меню остаётся посреди экрана. Часть багов исправлена в 26.1
  (зазор снизу у fixed-контейнеров на весь экран) и 26.2 (фон `<dialog>` под адресной строкой,
  z-порядок sticky). Учитывай версии 26.0–26.1: не используй значения `visualViewport` сразу
  после закрытия клавиатуры, пересчитывай на следующем событии `resize` или `scroll`.
- `<meta name="theme-color">` в Safari 26 не красит панели во вкладке: цвет берётся из фона
  страницы. Задавай `background-color` на `html` и `body`. Fixed-элементы у краёв экрана тоже
  меняют подкраску панелей.
- Полноэкранный оверлей под тулбаром Safari, по наблюдениям разработчиков, получается только
  с полупрозрачным фоном.

## 2. Блокировка прокрутки под модалкой

- Блокируй через `overflow: hidden` на `html` и на `body`. Не используй трюк
  `body { position: fixed; top: -scrollY }`: на iOS он меняет поведение fixed-потомков (нижнее
  меню уезжает) и может «заморозить» страницу, если анимация закрытия модалки гонится со
  снятием блокировки.
- Делай блокировку с владельцами (Map «владелец → причина»): две открытые модалки — одна
  блокировка, она снимается, когда закрылась последняя. Сохраняй и восстанавливай исходные
  inline-стили. Готовый код — `../snippets/page-scroll-lock.ts`.
- Внутри модалки прокручиваемому контейнеру ставь `overflow-y: auto; overscroll-behavior: contain;`.

## 3. Прокрутка, «резинка», pull-to-refresh, мигание

- На `html`, `body` и корне приложения ставь `overscroll-behavior-y: none`: это убирает
  «резинку» и pull-to-refresh, который в установленной PWA дёргает или перезагружает страницу.
- Если «резинка» всё равно мешает на роутах приложения: глобальный `touchmove` с
  `passive: false`, который вызывает `preventDefault()` только при свайпе вниз и только когда ни
  один предок цели не прокручен вниз (`scrollTop > 0`). Свайпы вверх и вложенные скроллеры
  не трогай.
- Вложенные скроллеры (чат, лента в модалке): `min-height: 0` у flex-ребёнка,
  `overflow-y: auto`, `overscroll-behavior-y: contain`. Экран чата — `position: fixed; inset: 0`
  вместо `height: 100dvh`.
- `backdrop-filter` на телефонах — главный источник мигания и тормозов при прокрутке.
  Отключай его под `@media (hover: none) and (pointer: coarse)` для шапок, полей ввода, карточек,
  плавающих кнопок и заменяй непрозрачным фоном.
- `background-attachment: fixed` на iOS не работает и дёргается: используй `scroll`.
  Декоративные фоновые слои — `position: absolute`, не `fixed`.
- Не ставь `scroll-behavior: smooth` на `html` в SPA: роутер и восстановление прокрутки
  начинают «проезжать» страницу.
- Бесконечная подгрузка (особенно чат вверх): запрашивай следующую порцию за 1,5 высоты экрана
  до края (не меньше 480px), а не за 72px. Якорь прокрутки измеряй после прихода данных, прямо
  перед изменением DOM: если измерить до запроса, при инерционной прокрутке читателя отбрасывает
  назад.

## 4. Viewport, клавиатура, safe area, поля ввода

- Meta viewport: `width=device-width, initial-scale=1, viewport-fit=cover`. Плюс
  `apple-mobile-web-app-capable=yes` и `apple-mobile-web-app-status-bar-style=black-translucent`.
- Автозум при фокусе: поле с `font-size` меньше 16px заставляет iOS увеличить страницу.
  Ставь всем `input`, `textarea`, `select` не меньше 16px. `maximum-scale=1` тоже убирает
  автозум, но хуже для доступности — используй его, только если 16px невозможны по дизайну.
- Safe area держи в CSS-переменных (`--safe-top: env(safe-area-inset-top, 0px)` и т.д.) и
  применяй к шапкам, нижнему меню, полноэкранным модалкам, кнопкам закрытия
  (`top: max(1rem, env(safe-area-inset-top))`).
- Высота экрана:
  - для `min-height` страниц — `--app-vh: 100vh` с `@supports (height: 100svh) { --app-vh: 100svh }`:
    `svh` не прыгает при показе и скрытии панелей Safari;
  - для полноэкранных оболочек и модалок — `100dvh` (`max-height: min(88dvh, 48rem)`);
  - голый `100vh` на iOS больше видимого экрана — не используй его один.
- **Клавиатура не уменьшает `dvh` на iOS.** Для экранов с полем ввода внизу (чат, поддержка)
  бери высоту из `visualViewport`: `высота = visualViewport.offsetTop + visualViewport.height -
  container.top`. Слушай `resize` и `scroll` у `visualViewport`, обновляй через
  `requestAnimationFrame`. Готовый код — `../snippets/visual-viewport-height.ts`.
- Если контейнер лежит внутри прокручиваемого `<main>`, iOS позиционирует его fixed-детей
  относительно `<main>` (Android — нет). Решение: перенос в `<body>` + `top` и `height` из
  `visualViewport`.
- Не прячь нижнее меню через обработчики `focusin`/`focusout`: на исходном проекте это вызывало
  мигание при фокусе. Если меню нужно скрыть при вводе, сделай это CSS без анимаций:
  `html:has(input:focus, textarea:focus, [contenteditable]:focus) .bottom-menu { visibility: hidden }`.
- Поля ввода в тёмной теме: `-webkit-appearance: none; appearance: none;` + явные `color`,
  `caret-color`, `-webkit-text-fill-color`, `color-scheme` — иначе текст и автозаполнение
  бывают невидимы. На `html` — `-webkit-text-size-adjust: 100%`.
- Касания: `-webkit-tap-highlight-color: transparent; touch-action: manipulation;` на кнопках;
  `-webkit-touch-callout: none` там, где мешает системное меню долгого нажатия.
- Ховеры — только под `@media (hover: hover)`, иначе стиль «залипает» после касания.
- 🔎 На iOS 26.0–26.1 после отмены «Снять фото/видео» кнопка выбора файла могла перестать
  работать (исправлено в 26.2). Если пользователи жалуются — пересоздавай `<input type="file">`
  после каждого выбора.

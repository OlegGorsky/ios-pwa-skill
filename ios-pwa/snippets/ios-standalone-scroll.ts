/**
 * iOS 26, установленная PWA: fixed/sticky элементы могут рисоваться в координатах документа
 * при прокрутке корня (WebKit 301172 / 312149). Решение — сделать <body> единственным скроллером.
 *
 * CSS (в глобальные стили):
 *
 *   html.ios-app-scroll { height: 100vh; height: 100dvh; min-height: 0; overflow: hidden; }
 *   html.ios-app-scroll body {
 *     height: 100vh; height: 100dvh; min-height: 0;
 *     overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain;
 *   }
 *
 * Правила:
 *  - переключай класс ТОЛЬКО при смене роута, никогда на scroll/resize;
 *  - только для установленной PWA на iOS и роутов приложения (Safari-вкладка и Android скроллят документ);
 *  - везде используй хелперы ниже вместо window.scrollY / window.scrollTo;
 *  - НЕ заменяй на body { position: fixed } (обрезает длинный контент в iOS PWA).
 */
import { isIosStandalonePwa } from './ios-detect'

export const IOS_APP_SCROLL_CLASS = 'ios-app-scroll'

const bodyIsScroller = () => document.documentElement.classList.contains(IOS_APP_SCROLL_CLASS)

export function getPageScroller(): HTMLElement {
	return bodyIsScroller() ? document.body : ((document.scrollingElement as HTMLElement) ?? document.documentElement)
}

export function getPageScrollTop() {
	return bodyIsScroller() ? document.body.scrollTop : window.scrollY
}

export function setPageScrollTop(top: number) {
	if (bodyIsScroller()) document.body.scrollTo({ top, behavior: 'auto' })
	else window.scrollTo({ top, behavior: 'auto' })
}

/** Роутер сбрасывает скролл window, а не body: вызывай при входе на страницу, если нужно наверх. */
export function resetPageScrollOnEntry() {
	setPageScrollTop(0)
	requestAnimationFrame(() => {
		setPageScrollTop(0)
		requestAnimationFrame(() => setPageScrollTop(0))
	})
}

/** Подключи к роутеру: например router.afterEach(to => applyIosScrollMode(to.path)) */
export function applyIosScrollMode(path: string, isAppRoute = (p: string) => p.startsWith('/app')) {
	if (!isIosStandalonePwa()) return
	document.documentElement.classList.toggle(IOS_APP_SCROLL_CLASS, isAppRoute(path))
}

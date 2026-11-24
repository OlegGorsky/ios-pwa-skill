/**
 * iOS 26, installed PWA: fixed/sticky elements may be painted at document coordinates
 * while the root scrolls (WebKit 301172 / 312149). Fix: make <body> the only scroller.
 *
 * CSS (global styles):
 *
 *   html.ios-app-scroll { height: 100vh; height: 100dvh; min-height: 0; overflow: hidden; }
 *   html.ios-app-scroll body {
 *     height: 100vh; height: 100dvh; min-height: 0;
 *     overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain;
 *   }
 *
 * Rules:
 *  - toggle the class ONLY on route change, never on scroll/resize;
 *  - only for installed PWA on iOS and app routes (Safari tab and Android scroll the document);
 *  - use the helpers below everywhere instead of window.scrollY / window.scrollTo;
 *  - do NOT replace with body { position: fixed } (clips long content in iOS PWA).
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

/** Router resets window scroll, not body: call on page entry when the page must open at the top. */
export function resetPageScrollOnEntry() {
	setPageScrollTop(0)
	requestAnimationFrame(() => {
		setPageScrollTop(0)
		requestAnimationFrame(() => setPageScrollTop(0))
	})
}

/** Wire into the router, e.g. router.afterEach(to => applyIosScrollMode(to.path)) */
export function applyIosScrollMode(path: string, isAppRoute = (p: string) => p.startsWith('/app')) {
	if (!isIosStandalonePwa()) return
	document.documentElement.classList.toggle(IOS_APP_SCROLL_CLASS, isAppRoute(path))
}

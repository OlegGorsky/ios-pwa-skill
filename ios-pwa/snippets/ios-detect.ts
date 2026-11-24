/**
 * iOS / iPadOS / installed-PWA detection.
 * iPadOS 13+ reports a Mac UA, so touch points tell it apart.
 */
export function isAppleMobile(ua = navigator.userAgent, maxTouchPoints = navigator.maxTouchPoints ?? 0) {
	const s = ua.toLowerCase()
	return /iphone|ipad|ipod/.test(s) || (s.includes('macintosh') && maxTouchPoints > 1)
}

export function isStandalonePwa() {
	const nav = navigator as Navigator & { standalone?: boolean }
	return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

export function isIosStandalonePwa() {
	return isAppleMobile() && isStandalonePwa()
}

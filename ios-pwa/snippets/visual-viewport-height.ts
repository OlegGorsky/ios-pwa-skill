/**
 * Keep a chat/composer screen above the iOS keyboard. 100dvh does NOT shrink for the
 * keyboard on iOS; visualViewport does. Sets --vv-height on the container.
 * If the container lives inside a scrolling <main>, move it to <body> first:
 * iOS lays out its position:fixed children relative to that <main>.
 */
export function bindVisualViewportHeight(container: HTMLElement, minHeight = 160) {
	let frame = 0
	const update = () => {
		cancelAnimationFrame(frame)
		frame = requestAnimationFrame(() => {
			const vv = window.visualViewport
			const visibleBottom = (vv?.offsetTop ?? 0) + (vv?.height ?? window.innerHeight)
			const top = container.getBoundingClientRect().top
			container.style.setProperty('--vv-height', `${Math.max(minHeight, Math.floor(visibleBottom - top))}px`)
		})
	}
	update()
	window.addEventListener('resize', update)
	window.visualViewport?.addEventListener('resize', update)
	window.visualViewport?.addEventListener('scroll', update)
	return () => {
		cancelAnimationFrame(frame)
		window.removeEventListener('resize', update)
		window.visualViewport?.removeEventListener('resize', update)
		window.visualViewport?.removeEventListener('scroll', update)
		container.style.removeProperty('--vv-height')
	}
}
// CSS: .chat-screen { height: var(--vv-height, 100dvh); }

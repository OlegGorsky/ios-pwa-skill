/**
 * Держит экран чата/поле ввода над клавиатурой iOS. 100dvh НЕ уменьшается под клавиатуру
 * на iOS, а visualViewport — да. Пишет --vv-height в контейнер.
 * Если контейнер внутри скроллящегося <main>, сначала перенеси его в <body>:
 * iOS позиционирует его position:fixed-детей относительно этого <main>.
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

/**
 * Блокировка скролла под модалками с учётом владельцев. Намеренно БЕЗ body { position: fixed; top: -y }:
 * на iOS это меняет поведение fixed-потомков (нижнее меню уезжает) и может «заморозить»
 * страницу, если анимация закрытия модалки гонится со снятием блокировки.
 */
const owners = new Map<unknown, string>()
let saved: { html: string; body: string } | null = null

export function lockPageScroll(owner: unknown, reason = 'modal') {
	if (owners.has(owner)) return
	owners.set(owner, reason)
	if (owners.size > 1) return
	const { documentElement: html, body } = document
	saved = { html: html.style.overflow, body: body.style.overflow }
	html.style.overflow = 'hidden'
	body.style.overflow = 'hidden'
}

export function unlockPageScroll(owner: unknown) {
	if (!owners.delete(owner) || owners.size > 0 || !saved) return
	document.documentElement.style.overflow = saved.html
	document.body.style.overflow = saved.body
	saved = null
}

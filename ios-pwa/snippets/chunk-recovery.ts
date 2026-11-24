/**
 * Восстановление после ошибок загрузки старых чанков после деплоя (частая история в iOS PWA):
 * одна перезагрузка, защита от повторов в localStorage на 5 минут.
 */
const GUARD_KEY = 'pwa-chunk-recovery'
const WINDOW_MS = 5 * 60 * 1000

export function isRecoverableChunkError(reason: unknown) {
	const m = String((reason as Error)?.message ?? reason ?? '').toLowerCase()
	return (
		m.includes('failed to fetch dynamically imported module') ||
		m.includes('importing a module script failed') || // Safari
		m.includes('unable to preload css') ||
		m.includes('error loading dynamically imported module') // Firefox
	)
}

/** Непрозрачная ошибка асинхронной загрузки в Safari. Может быть и настоящим багом, поэтому
 *  считаем её ошибкой чанка, только если за последние 15 с была реальная ошибка ассета. */
export function isOpaqueSafariDefaultError(reason: unknown) {
	return /undefined is not an object \(evaluating ['"][a-z_$][\w$]{0,3}\.default['"]\)/i.test(
		String((reason as Error)?.message ?? reason ?? ''),
	)
}

export function tryRecover(reason: unknown, lastAssetErrorAt: number | null) {
	const chunk =
		isRecoverableChunkError(reason) ||
		(isOpaqueSafariDefaultError(reason) && lastAssetErrorAt !== null && Date.now() - lastAssetErrorAt <= 15_000)
	if (!chunk) return false
	let last = 0
	try { last = Number(localStorage.getItem(GUARD_KEY) || 0) } catch {}
	if (Date.now() - last < WINDOW_MS) return false
	try { localStorage.setItem(GUARD_KEY, String(Date.now())) } catch {}
	window.location.reload()
	return true
}
// Подключение: window 'unhandledrejection', 'error' (capture: true — для ошибок <script>/<link>,
// запоминай lastAssetErrorAt), Vue app.config.errorHandler / router.onError.

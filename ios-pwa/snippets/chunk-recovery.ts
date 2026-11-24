/**
 * Recover from stale-chunk errors after a deploy (common in iOS PWAs):
 * reload once, guarded in localStorage for 5 minutes.
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

/** Safari's opaque async-loader failure. Can also be a real bug, so treat it as a chunk
 *  failure only if a real asset error was recorded in the last 15 s. */
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
// Wire: window 'unhandledrejection', 'error' (capture: true for <script>/<link> failures →
// record lastAssetErrorAt), Vue app.config.errorHandler / router.onError.

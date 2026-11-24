/**
 * File saving that works in an installed iOS PWA.
 * Call from the click handler: anything that opens a window must run before the first
 * await (reserveWindow does that for you).
 */
import { isAppleMobile } from './ios-detect'

type ShareNavigator = Navigator & {
	canShare?: (d: ShareData) => boolean
	share?: (d: ShareData) => Promise<void> // absent on older browsers
}

export function canShareFile(file: File) {
	const nav = navigator as ShareNavigator
	if (typeof nav.share !== 'function') return false // absent on older browsers
	return typeof nav.canShare !== 'function' || nav.canShare({ files: [file] })
}

/** Images and small files on iOS: system Share sheet → "Save Image" / "Save to Files". */
export async function shareOrDownload(blob: Blob, fileName: string) {
	const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' })
	if (isAppleMobile() && canShareFile(file)) {
		try {
			await navigator.share({ files: [file], title: fileName })
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return // user closed the sheet — not an error
			throw e
		}
		return
	}
	const url = URL.createObjectURL(blob)
	if (isAppleMobile()) {
		const w = window.open(url, '_blank')
		if (!w) window.location.href = url
		setTimeout(() => URL.revokeObjectURL(url), 60_000)
		return
	}
	const a = Object.assign(document.createElement('a'), { href: url, download: fileName, rel: 'noopener' })
	document.body.appendChild(a)
	a.click()
	a.remove()
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Documents (PDF) on iOS: reserve the window synchronously, fill it after fetch. */
export function reserveWindow(): Window | null {
	if (!isAppleMobile()) return null
	try {
		const w = window.open('about:blank', '_blank')
		if (w) {
			try { w.opener = null } catch {}
			return w
		}
	} catch {}
	return null
}

export async function openDocumentOnIos(fetchBlob: () => Promise<Blob>) {
	const reserved = reserveWindow() // must stay before the await
	try {
		const url = URL.createObjectURL(await fetchBlob())
		if (reserved && !reserved.closed) reserved.location.href = url
		else window.location.href = url
		setTimeout(() => URL.revokeObjectURL(url), 60_000)
	} catch (e) {
		if (reserved && !reserved.closed) reserved.close()
		throw e
	}
}

/**
 * Large video on iOS: short-lived signed ticket + navigation to ANOTHER origin
 * (outside the PWA scope) that responds with Content-Disposition: attachment.
 *   POST {api}/media/:id/download-ticket  (authorized)  -> { downloadUrl: '/download-ticket/<jwt>' }
 *   GET  https://media.example.com/download-ticket/<jwt> (no auth header; JWT verified)
 * Response headers:
 *   Content-Type: video/mp4            (NOT application/octet-stream, NOT a zip)
 *   Content-Disposition: attachment; filename="video.mp4"; filename*=UTF-8''%D0%92%D0%B8%D0%B4%D0%B5%D0%BE.mp4
 *   Cache-Control: private, no-store
 *   X-Content-Type-Options: nosniff
 */
export async function downloadVideoOnIos(requestTicket: () => Promise<string>, mediaOrigin: string) {
	const path = await requestTicket()
	window.location.href = `${mediaOrigin}${path}`
}

/** RFC 6266 header with a UTF-8 name and an ASCII fallback (server side). */
export function attachmentDisposition(fileName: string) {
	const ascii = fileName.normalize('NFKD').replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'file'
	return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

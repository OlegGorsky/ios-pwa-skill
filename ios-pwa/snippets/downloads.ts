/**
 * Сохранение файлов, которое работает в установленной iOS PWA.
 * Вызывай функции из обработчика клика: всё, что открывает окно, должно выполниться
 * до первого await (reserveWindow делает это за тебя).
 */
import { isAppleMobile } from './ios-detect'

type ShareNavigator = Navigator & {
	canShare?: (d: ShareData) => boolean
	share?: (d: ShareData) => Promise<void> // нет в старых браузерах
}

export function canShareFile(file: File) {
	const nav = navigator as ShareNavigator
	if (typeof nav.share !== 'function') return false // нет в старых браузерах
	return typeof nav.canShare !== 'function' || nav.canShare({ files: [file] })
}

/** Картинки и небольшие файлы на iOS: системное меню «Поделиться» → «Сохранить изображение» / «Сохранить в Файлы». */
export async function shareOrDownload(blob: Blob, fileName: string) {
	const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' })
	if (isAppleMobile() && canShareFile(file)) {
		try {
			await navigator.share({ files: [file], title: fileName })
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return // пользователь закрыл меню — это не ошибка
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

/** Документы (PDF) на iOS: окно резервируется синхронно, заполняется после загрузки. */
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
	const reserved = reserveWindow() // обязательно до await
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
 * Большое видео на iOS: короткоживущий подписанный тикет + переход на ДРУГОЙ домен
 * (вне scope PWA), который отвечает с Content-Disposition: attachment.
 *   POST {api}/media/:id/download-ticket  (с авторизацией)  -> { downloadUrl: '/download-ticket/<jwt>' }
 *   GET  https://media.example.com/download-ticket/<jwt> (без заголовка авторизации; проверяется JWT)
 * Заголовки ответа:
 *   Content-Type: video/mp4            (НЕ application/octet-stream и НЕ zip)
 *   Content-Disposition: attachment; filename="video.mp4"; filename*=UTF-8''%D0%92%D0%B8%D0%B4%D0%B5%D0%BE.mp4
 *   Cache-Control: private, no-store
 *   X-Content-Type-Options: nosniff
 */
export async function downloadVideoOnIos(requestTicket: () => Promise<string>, mediaOrigin: string) {
	const path = await requestTicket()
	window.location.href = `${mediaOrigin}${path}`
}

/** Заголовок по RFC 6266: имя в UTF-8 и запасное ASCII-имя (на сервере). */
export function attachmentDisposition(fileName: string) {
	const ascii = fileName.normalize('NFKD').replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'file'
	return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

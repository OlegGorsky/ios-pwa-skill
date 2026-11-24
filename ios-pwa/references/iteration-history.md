# Iteration history: what was tried and did NOT work

Source: a production PWA (Nuxt 3, Vue), May–November 2026. Read before proposing an approach to
avoid repeating dead ends. Final solutions live in the topic files.

## Bottom bar

| Attempt | Result |
|---|---|
| Bar inside layout/page | Scrolling ancestor becomes containing block, bar drifts → **teleport to body** (works, not sufficient) |
| `contain: layout style` + `isolation: isolate` on the bar | Drift while scrolling → removed |
| `transform: translate3d(0,0,0)` + `backface-visibility: hidden` + `will-change: transform` ("GPU hack") | Bar detaches from the viewport → removed entirely |
| Hide-on-keyboard animation (`opacity`/`translate 130%`) via `focusin/focusout` | Flicker on input focus → JS removed; transitions on the bar forbidden |
| Recompute bar height on `visualViewport.resize` | Jitter as Safari bars show/hide → ResizeObserver on the bar only |
| All of the above, but iOS 26 | Bar painted mid-screen (WebKit 301172/312149) despite correct CSS position → **body scroller, installed PWA on iOS only** |
| Alternative: `body { position: fixed }` | Clips long content → rejected |

## Video download on iPhone (~10 iterations; order approximate, some variants returned)

1. `fetch` → blob → `<a download>` — nothing happens in an installed PWA.
2. `navigator.share({ files: [video] })` — works for small files, crashes on large ones (memory).
3. Signed ticket + `location.assign` to a same-origin API — opens inside the PWA, no way out.
4. Ticket + link to **another subdomain** with `target=_blank` — better, but unstable.
5. Serve as `application/octet-stream` — iOS does not recognize it as video.
6. Serve the video inside a **ZIP** (stream, store) — works, but users must unpack it.
7. ZIP only for iOS by User-Agent — same inconvenience.
8. **Final:** ticket (JWT, short TTL) → `window.location.href = https://media.<domain>/download-ticket/<jwt>`
   → `Content-Type: video/mp4` (real type, not octet-stream) + `Content-Disposition: attachment` with a UTF-8 name.

## PDF on iPhone

1. Custom in-app viewer (fetch + render) — slow, cannot save.
2. Open the URL natively (`window.open`) for viewing — fine for viewing.
3. Download via blob + `window.open(blob)` after `await` — blocked by the popup blocker.
4. **Final:** reserve the window synchronously (`window.open('about:blank')`) before `fetch`,
   then `reserved.location.href = blobUrl`; close the window on error.

## Audio

1. Stored as received (Telegram OGG/Opus) — does not play on iPhone.
2. **Final:** server-side MP3 transcoding on upload + migration script for old files; reject the
   upload if transcoding fails. Client: explicit errors (`NotSupportedError`/`NotAllowedError`),
   one refresh of an expired presigned URL.

## Service worker / updates

1. "Update available" banner — false positives for everyone with empty storage (iOS clears it),
   because a `registerSW.js` pinned on the proxy carried a stale release id.
2. `unregister()` of all SWs during recovery — lost the push subscription → replaced with
   `update()` + `SKIP_WAITING`.
3. **Final:** silent release activation (right after launch / on background / on next navigation),
   never twice in a row; legacy syntax in the registration script.

## Network

- HTTP/3 (QUIC): on some iOS paths asset requests failed without reaching server logs → proxy
  limited to `h1 h2`.

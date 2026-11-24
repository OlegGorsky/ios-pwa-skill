# Downloading and saving files

Read when the user must save a video, image, PDF or any file, or when a link leads outside the
app. Code: `../snippets/downloads.ts`.

## Why it is hard

In an installed PWA:
- `<a download>` with a blob is unreliable or does nothing;
- `window.open` after the first `await` is blocked;
- a file opened inside the app leaves the user with no back button.
- 🔎 Confirmed by WebKit bug reports: a `download` link or a `Content-Disposition: attachment`
  response opens an "Open in…" screen with no navigation; only relaunching the app escapes it.

## Working patterns

| What | iOS | Other devices |
|---|---|---|
| Video and large files | one-time signed ticket → `location.href` to **another domain** (outside PWA scope) serving `Content-Disposition: attachment` | `fetch` → blob → `<a download>` |
| Images | `fetch` → `File` → `navigator.share({ files })` (user saves to Photos); unsupported → open blob in a new window | `<a download>` |
| PDF and documents | reserve the window **synchronously** in the click handler (`window.open('about:blank')`), then set its `location` to the blob URL after fetch; view PDFs in the system viewer, not a custom one | `<a download>` |

## Checklist before writing download code

- [ ] Ticket: `POST /download-ticket` (authorized) → JWT valid for a few minutes →
      `GET /download-ticket/:token` with no headers. Why: a plain navigation cannot send
      `Authorization: Bearer`.
- [ ] Serve the file from another subdomain (e.g. `media.example.com`): leaving the PWA scope
      triggers the system download. Same origin → the file opens inside the app.
- [ ] Response headers:
      `Content-Type` = the real type (`video/mp4`), not `application/octet-stream` and not a zip
      (both tried on the source project — worse);
      `Content-Disposition: attachment; filename="ascii-fallback.mp4"; filename*=UTF-8''<percent-encoded>`;
      `Cache-Control: private, no-store`; `X-Content-Type-Options: nosniff`.
- [ ] Call `navigator.canShare({ files: [file] })` before `navigator.share({ files })`;
      `AbortError` (user closed the sheet) is not an error. Never pass large videos through the
      Share sheet: it crashes on memory.
- [ ] Everything that opens a window runs synchronously in the click handler, before the first `await`.
- [ ] On iOS call `URL.revokeObjectURL` after 60 seconds: the window needs time to read the blob.
- [ ] Intercept links to the app's own pages inside user content and route them through the
      router: `target="_blank"` throws the user out of the installed PWA into Safari.
- [ ] Show a specific iOS error ("iPhone could not hand the video to the system. Free up storage
      and try again") and report it to monitoring.

History of eight failed attempts at video download: `iteration-history.md`.

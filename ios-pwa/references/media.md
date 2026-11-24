# Audio, voice messages, video

Read when the task involves `<audio>`, `<video>`, voice messages, mic/camera recording, Web Audio,
a mini-player, or media upload. 🔎 = public sources, not verified on the source project (links in
`research-2026.md`).

## Formats and server

- Store and serve only formats every supported iOS plays: MP3 (`audio/mpeg`) or AAC/M4A.
  Transcode OGG, Opus and WebM server-side on upload, not on the client. If transcoding fails,
  reject the upload — an unplayable file will surface later on an iPhone. Migrate existing files
  with a one-off script. ffmpeg commands: `../snippets/media-convert.sh`.
- Telegram/WhatsApp voice messages and `MediaRecorder` output from Chrome and Android are
  OGG/Opus/WebM — transcoding is mandatory for them.
- The server or storage must support Range requests (206) and send the correct `Content-Type`;
  otherwise Safari won't play or seek. S3, MinIO and Garage do; verify any custom file endpoint.
- MP4 must be faststart (`moov` atom first), otherwise video starts slowly or not at all over the
  network. Transcode non-MP4 (WebM etc.) and HEVC to H.264 + AAC with `yuv420p`.
- 🔎 Even though newer iOS plays Opus and WebM, older versions do not — keep server-side transcoding.

## Playback

- Call `play()` only from a user gesture and handle the promise:
  - `NotAllowedError` → show "Tap play again";
  - `NotSupportedError` → show "This format is not supported on this device".
  Show the error in the UI; never swallow it with an empty `catch {}`.
- Signed URLs (S3 presigned) expire: on a playback error request a fresh URL once and retry.
  Remember the key `fileIndex:url` to avoid an infinite loop.
- Preserve `playbackRate` across tracks: iOS resets it on a new `src`.
- Lock screen and background: Media Session API (`metadata`, `setActionHandler` for play, pause,
  seek, next, previous). Wrap `setPositionState` in try/catch — support is partial.
- A mini-player that survives navigation = one `<audio>` in the app root, not in a page.
- `playsinline` on every `<video>` (otherwise iOS opens the fullscreen player); `preload="metadata"`.
- Feed previews: use `poster`, not video autoload — avoids flicker and wasted traffic.

## 🔎 From public sources

- Video autoplay only with `muted` + `playsinline`. Low Power Mode disables autoplay entirely:
  always set `poster` and handle a rejected `play()`.
- Web Audio (`AudioContext`) is muted by the silent switch; `<audio>`/`<video>` are not. Since
  iOS 17 set `navigator.audioSession.type = 'playback'`. Unlock `AudioContext` in `touchend`,
  `pointerup` or `click`, not `touchstart`.
- After an installed PWA returns from background, `AudioContext` may be silent while
  `state === 'running'` → create a new context. On iOS 26.0–26.1 `<audio>` could fail to play when
  the app was reopened from the Home Screen (fixed in 26.2).
- `MediaRecorder`: MP4 only (AAC/H.264) before iOS 18.4; WebM/Opus and Ogg since 18.4. Always
  check `MediaRecorder.isTypeSupported()` and store the real `recorder.mimeType`. iOS 26 had a
  regression producing corrupted recordings — validate every upload server-side (`ffprobe`).
  Camera video may need rotation handling.

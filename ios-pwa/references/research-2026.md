# Исследование: поведение iOS Safari и PWA (ноябрь 2026)

Источники к пунктам с 🔎 во всех файлах скилла. Здесь собраны официальные документы
Apple/WebKit, баг-трекер WebKit и проверенные справочники. Читай этот файл, когда нужно
подтвердить пункт 🔎 или проверить, не изменилось ли поведение в новой версии iOS. Сведения на момент ноября 2026: при работе
с конкретной версией iOS сверяйся с актуальными релиз-нотами.

## Где следить за изменениями

- **Релиз-ноты Safari** — что исправлено и добавлено в каждой версии:
  https://developer.apple.com/documentation/safari-release-notes
  (у каждой страницы есть текстовая версия: добавь `.md` к адресу).
- **Блог WebKit** — подробные разборы каждого релиза: https://webkit.org/blog/
- **Баг-трекер WebKit** — искать свой симптом до того, как чинить: https://bugs.webkit.org
- **Справочник совместимости PWA на iOS** (Максимилиано Фиртман, обновляется):
  https://firt.dev/notes/pwa-ios/
- **Can I Use** — поддержка отдельных API и CSS: https://caniuse.com
- **Форумы Apple для разработчиков**, раздел Safari & Web: https://developer.apple.com/forums/

## Установка, окружение, User-Agent

- iOS 26: любой сайт на экране «Домой» открывается как веб-приложение, манифест не обязателен.
  Источник: WebKit Features in Safari 26.0 — https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- iOS 26: User-Agent показывает замороженную версию ОС; рекомендация WebKit — проверять
  возможности, а не UA. Источники: тот же пост WebKit; Safari 26.2 Release Notes (156170132) —
  https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes
- Что поддерживается в манифесте и установленных PWA, по версиям iOS (иконки, display,
  push, badging, wake lock, отсутствие share_target, background sync и т.д.):
  https://firt.dev/notes/pwa-ios/
- Прозрачные иконки на iOS становятся чёрными; иконки должны быть квадратными без
  скруглений: https://firt.dev/pwa-design-tips
- Четыре изолированных окружения (вкладка Safari, SFSafariViewController, встроенные браузеры
  приложений, установленное веб-приложение), повторный логин, убитые процессы, Lockdown Mode,
  синтаксис lookbehind, ссылки из мессенджеров: серия «PWA on iOS» на DZone (ноябрь 2026) —
  https://dzone.com/articles/webkit-pwas-ios

## iOS 26, Liquid Glass, viewport, клавиатура

- Fixed-элементы смещаются при смене направления скролла: https://bugs.webkit.org/show_bug.cgi?id=297779
- `visualViewport.offsetTop/height` не восстанавливаются после закрытия клавиатуры, нижнее
  меню «висит»: https://developer.apple.com/forums/thread/800125 ,
  https://developer.apple.com/forums/thread/800154
- `viewport-fit=cover` не покрывает область адресной строки:
  https://bugs.webkit.org/show_bug.cgi?id=301108
- Сдвиг viewport под Dynamic Island после клавиатуры: https://bugs.webkit.org/show_bug.cgi?id=300523
- Fixed-элементы и iOS 26 «скачут» под тулбаром; уже найденные условия для полноэкранных
  оверлеев: https://developer.apple.com/forums/thread/801694
- Исправления: «bottom gap on viewport-sized fixed containers» (Safari 26.1, 158055568) —
  https://developer.apple.com/documentation/safari-release-notes/safari-26_1-release-notes ;
  фон `<dialog>` под адресной строкой (163535684) и z-порядок sticky (90572595) — Safari 26.2.
- `theme-color` больше не красит панели Safari 26; цвет берётся из фона страницы:
  https://bugs.webkit.org/show_bug.cgi?id=301756 ,
  https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/
- Автозум полей ввода с `font-size` меньше 16px — общеизвестное поведение iOS Safari,
  см. например https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing

## Медиа

- Правила автоплея (`muted` + `playsinline`): https://webkit.org/blog/6784/new-video-policies-for-ios/
- Автоплей отключён в режиме энергосбережения: https://bugs.webkit.org/show_bug.cgi?id=216887
- Web Audio глушится переключателем «Бесшумно»; обход через `navigator.audioSession.type = "playback"`
  (iOS 17+): https://bugs.webkit.org/show_bug.cgi?id=237322
- `AudioContext` молчит после возврата PWA из фона: https://bugs.webkit.org/show_bug.cgi?id=291892
- `<audio>` не играл при повторном открытии Home Screen Web App — исправлено в Safari 26.2 (155336513).
- MediaRecorder: изначально только MP4/AAC/H.264 — https://webkit.org/blog/11353/mediarecorder-api/ ;
  WebM с 18.4 — https://bugs.webkit.org/show_bug.cgi?id=290223 ;
  регрессия iOS 26 с повреждёнными записями — https://bugs.webkit.org/show_bug.cgi?id=299164

## Скачивание

- Скачивание в установленной PWA ведёт в экран без навигации (iOS 18.4):
  https://bugs.webkit.org/show_bug.cgi?id=290847 (воспроизведение:
  https://github.com/tobias-grasse/ios-pwa-download-reproduction)
- То же с iOS 15: https://bugs.webkit.org/show_bug.cgi?id=236943
- В установленной PWA картинки не скачиваются: https://bugs.webkit.org/show_bug.cgi?id=275288

## Push-уведомления

- WebKit требует `userVisibleOnly`, тихие push запрещены; Declarative Web Push:
  https://webkit.org/blog/16535/meet-declarative-web-push/
- Квота «тихих» push: после трёх подписка удаляется — коммит WebKit «Enforce silent push quota»:
  https://webkit.googlesource.com/WebKit/+/108ccb442e40e9705d212e74c1f213e3b5a0ea05
- Практический разбор (`event.waitUntil`): https://dev.to/progressier/how-to-fix-ios-push-subscriptions-being-terminated-after-3-notifications-39a7
- Подписка тихо перестаёт работать, `pushsubscriptionchange` нет:
  https://bugs.webkit.org/show_bug.cgi?id=273063 , https://developer.apple.com/forums/thread/848080
- Официальное руководство Apple: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers

## Хранилище

- Политика хранения WebKit (квоты origin и общая, вытеснение): https://webkit.org/blog/14403/updates-to-storage-policy/
- Квота ~60% диска, у установленного приложения та же — MDN:
  https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- 7-дневное правило касается Safari; у установленного приложения свой счётчик:
  https://bugs.webkit.org/show_bug.cgi?id=237350

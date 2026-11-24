#!/usr/bin/env sh
# Приведение медиа к форматам, которые понимает iOS. Запускать на сервере при загрузке, а не на клиенте.

# Аудио: OGG / Opus / WebM (голосовые Telegram, запись в Chrome) -> MP3
ffmpeg -hide_banner -loglevel error -y -i "$IN" -vn -codec:a libmp3lame -b:a 160k -ar 44100 "$OUT.mp3"
# (вариант с AAC: -c:a aac -b:a 128k "$OUT.m4a")

# Видео уже H.264 MP4/MOV: просто переносим moov в начало (быстрый старт по сети)
ffmpeg -hide_banner -loglevel error -y -i "$IN" -c copy -movflags +faststart "$OUT.mp4"

# Всё остальное (WebM, HEVC, нестандартные форматы пикселей) -> H.264 + AAC, безопасно для iOS
ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart "$OUT.mp4"

# Посмотреть, что на самом деле внутри файла
ffprobe -v error -show_entries stream=codec_name,pix_fmt -show_entries format=format_name "$IN"

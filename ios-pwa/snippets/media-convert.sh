#!/usr/bin/env sh
# Normalize media to iOS-playable formats. Run server-side at upload time, not on the client.

# Audio: OGG / Opus / WebM (Telegram voice, Chrome MediaRecorder) -> MP3
ffmpeg -hide_banner -loglevel error -y -i "$IN" -vn -codec:a libmp3lame -b:a 160k -ar 44100 "$OUT.mp3"
# (AAC alternative: -c:a aac -b:a 128k "$OUT.m4a")

# Video already H.264 MP4/MOV: move the moov atom to the front (fast start over network)
ffmpeg -hide_banner -loglevel error -y -i "$IN" -c copy -movflags +faststart "$OUT.mp4"

# Anything else (WebM, HEVC, odd pixel formats) -> H.264 + AAC, iOS-safe
ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart "$OUT.mp4"

# Inspect what the file really contains
ffprobe -v error -show_entries stream=codec_name,pix_fmt -show_entries format=format_name "$IN"

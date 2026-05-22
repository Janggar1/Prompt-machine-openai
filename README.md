# Prompt Machine Image — Vercel

Project sederhana untuk membuat prompt image yang lebih rapi dan konsisten.

## Struktur

```txt
index.html
api/generate-prompt.js
.env.example
vercel.json
```

## Cara deploy ke Vercel

1. Upload folder ini ke GitHub.
2. Import repository ke Vercel.
3. Buka Project Settings → Environment Variables.
4. Tambahkan:
   - `OPENAI_API_KEY` = API key kamu
   - `OPENAI_MODEL` = opsional, default `gpt-4.1`
5. Redeploy project.

## Penting

Jangan taruh API key langsung di `index.html`.
HTML berjalan di browser, jadi orang lain bisa melihat key lewat DevTools.
API key harus disimpan di server / Vercel Environment Variables.

## Local fallback

Tombol "Build lokal tanpa API" tetap bisa membuat prompt template tanpa memanggil API.
Tombol "Generate dengan API" akan memakai `/api/generate-prompt`.

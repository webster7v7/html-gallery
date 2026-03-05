---
description: Initialize html-gallery (install deps, sync content, start dev server)
---

1. Install dependencies

```bash
npm ci
```

2. Unify `content/` and `public/content/` (Windows junction)

The app indexes HTML from `./content` but previews them via `/content/...` (served from `public/content`).
To avoid maintaining two copies, create a directory junction so `public/content` points to `content`.

```powershell
if (Test-Path .\public\content) {
  Remove-Item -Recurse -Force .\public\content
}

cmd /c mklink /J "public\content" "content"
```

3. Start the development server

```bash
npm run dev
```
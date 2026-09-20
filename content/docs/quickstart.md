---
title: Quickstart
description: Run this site locally, then copy the pattern onto your own.
canonical: /docs/quickstart
updated: 2026-09-20
---

# Quickstart

## Run it

```sh
git clone https://github.com/TimHey/md-first.git
cd md-first
node server.js
```

No install step. No dependencies. Node 20 or newer.

Open `http://localhost:4321` for the one HTML page, then `http://localhost:4321/thesis` to read markdown in your browser.

## Prove it is markdown

```sh
# agent view
curl -s localhost:4321/thesis | head -5

# the header an agent sees
curl -sI localhost:4321/thesis | grep -i content-type
# content-type: text/markdown; charset=utf-8

# the header a browser sees, same body
curl -sI -H 'Accept: text/html' localhost:4321/thesis | grep -i content-type
# content-type: text/plain; charset=utf-8

# force markdown regardless
curl -sI 'localhost:4321/thesis?raw' | grep -i content-type
```

## Add a page

Drop a `.md` file in `content/`. It is live on the next request. Give it frontmatter, end it with links, add it to `public/llms.txt`. The sitemap and `llms-full.txt` pick it up automatically.

```sh
cat > content/notes.md <<'MD'
---
title: Notes
description: A page that exists because a file exists.
canonical: /notes
---

# Notes

That is the whole deploy process.
MD
curl -s localhost:4321/notes
```

## Deploy

Any host that runs Node. There is no build command.

**Railway:** `railway up`, then set `SITE_URL` to the public hostname so canonical links and the sitemap are absolute.

**Anywhere else:** start command is `node server.js`, it listens on `PORT`.

The only environment variable that matters is `SITE_URL`.

## Convert an existing site

1. Export the pages to `.md`. Pandoc handles most HTML fine.
2. Put them in `content/` in the shape you want the URLs.
3. Write `llms.txt` by hand. Every entry gets a real one-line description, not a slug restated.
4. Keep your existing HTML home page and point it at the markdown.
5. Leave redirects from old URLs in place. The experiment is about the format, not about breaking links.

---

[Home](/) · [How it works](/how-it-works.md) · [Spec](/spec.md)

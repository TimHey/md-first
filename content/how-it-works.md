---
title: How it works
description: The routing, content negotiation and response headers that make a markdown file behave like a web page.
canonical: /how-it-works
updated: 2026-09-20
---

# How it works

The whole server is one dependency-free file, `server.js`, around 200 lines. Here is what it does.

## Routing

| Request | Serves |
| --- | --- |
| `/` | `public/index.html`, the only HTML page |
| `/thesis` | `content/thesis.md` |
| `/thesis.md` | the same file, same bytes |
| `/docs/quickstart` | `content/docs/quickstart.md` |
| `/docs/` | `content/docs/index.md` if it exists |
| anything else | `content/404.md` with a 404 status |

The `.md` extension is optional in the URL and changes nothing about the response. Directories resolve to `index.md`. Paths are checked against the content root so `..` cannot escape it.

## Content negotiation

One rule:

```js
function negotiate(accept, raw) {
  if (raw) return 'text/markdown; charset=utf-8'
  return /text\/html/.test(accept)
    ? 'text/plain; charset=utf-8'
    : 'text/markdown; charset=utf-8'
}
```

A browser sends `Accept: text/html,...` and gets `text/plain`, which it paints in the tab. Everything else, `curl`, `fetch()`, GPTBot, ClaudeBot, sends `*/*` or similar and gets `text/markdown`, which is the honest label. `?raw` forces markdown for anyone.

**The body is never modified.** Only the header changes. Both readers get identical bytes, which is the entire point: there is no human version and machine version to drift apart.

## Response headers

Every markdown response carries:

- `Content-Type` per the rule above
- `Link: <canonical>; rel="canonical", <canonical>.md; rel="alternate"; type="text/markdown"` so the extensionless and `.md` URLs are not treated as duplicates
- `X-Robots-Tag: all` because markdown has no `<meta name="robots">`
- `Vary: Accept` so a cache does not hand a browser response to an agent
- `X-Md-Source` naming the file on disk that produced the response

Headers do the job `<head>` does in an HTML page. Frontmatter inside the file does the rest. See [frontmatter](/docs/frontmatter.md).

## Generated pages

Three URLs are built at request time from the content directory rather than read off disk:

- `/llms-full.txt` concatenates every page, frontmatter stripped
- `/sitemap.xml` lists every page with a markdown alternate link
- `/stats.md` renders the in-process request log as a markdown table

`/stats.md` is worth a look: it proves a markdown URL can be dynamic. Nothing about this approach requires the content to be static.

## Logging

Each request appends a line to `data/requests.jsonl` with the path, status, user agent, a client classification and the content type served. That file is gitignored. It is the raw material for [the experiment](/experiment.md).

---

[Home](/) · [Spec](/spec.md) · [Quickstart](/docs/quickstart.md)

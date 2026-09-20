---
title: Content negotiation
description: Which clients render markdown inline, which download it, and why the Content-Type flips.
canonical: /docs/content-negotiation
updated: 2026-09-20
---

# Content negotiation

**Bottom line:** `text/markdown` is the correct label and browsers refuse to display it. So browsers get the same bytes labelled `text/plain`, which they paint. Everyone else gets the honest type.

## Client behavior

| Client | Sends `Accept:` | Gets | Result |
| --- | --- | --- | --- |
| Chrome, Safari, Firefox | `text/html,...` | `text/plain` | Renders as text in the tab |
| `curl`, `wget` | `*/*` | `text/markdown` | Prints to stdout |
| `fetch()` | `*/*` | `text/markdown` | Resolves as text |
| GPTBot, ClaudeBot, PerplexityBot | usually `*/*` | `text/markdown` | Parsed directly |
| Any client with `?raw` | anything | `text/markdown` | Forced |

Some agent fetchers send `Accept: text/html` to look like a browser. They get `text/plain` and the same markdown body, which parses fine. The mislabel costs nothing because the payload never differs.

## Why not just serve text/markdown everywhere

Because the browsers would download it. `text/markdown` was registered in RFC 7763 and no major browser paints it; Chrome and Safari send it to the downloads folder, Firefox opens a save dialog. A site whose every link triggers a download is not a website.

This is the weakest joint in the whole approach and it is worth being honest about it: the human-readable half depends on a content type that lies slightly. If browsers ever render `text/markdown` natively, the negotiation function deletes itself.

## Why not sniff the user agent

User agent strings lie and the list needs constant maintenance. `Accept` is what the header is for, it is one regex, and `Vary: Accept` tells caches to respect it. The user agent is still logged, just not used to make routing decisions.

## The rule

```js
function negotiate(accept, raw) {
  if (raw) return 'text/markdown; charset=utf-8'
  return /text\/html/.test(accept)
    ? 'text/plain; charset=utf-8'
    : 'text/markdown; charset=utf-8'
}
```

Ten lines including the comment. The body is untouched in every branch.

---

[Home](/) · [How it works](/how-it-works.md) · [Spec](/spec.md)

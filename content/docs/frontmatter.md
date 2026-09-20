---
title: Frontmatter
description: The YAML block that does the job of the HTML head, and why it ships to the reader instead of being stripped.
canonical: /docs/frontmatter
updated: 2026-09-20
---

# Frontmatter

A markdown file cannot hold a `<meta>` tag. The metadata has to go somewhere, so it goes in a YAML block at the top of the file, and that block is served rather than stripped.

## The block

```yaml
---
title: Frontmatter
description: The YAML block that does the job of the HTML head.
canonical: /docs/frontmatter
updated: 2026-09-20
---
```

Four keys. Add more if a page needs them, but these four are required on every page.

| Key | Replaces | Why |
| --- | --- | --- |
| `title` | `<title>` | What the page is called in a citation or a result |
| `description` | `<meta name="description">` | The one-line summary, also used in `llms.txt` |
| `canonical` | `<link rel="canonical">` | Which URL is the real one, since `/x` and `/x.md` both resolve |
| `updated` | `<meta property="article:modified_time">` | Freshness, which models weight |

## Why it is served, not stripped

The obvious move is to parse the frontmatter server-side, emit it as headers, and hand the reader clean prose. This site does the opposite, for three reasons.

**The file and the URL are the same thing.** Strip anything and they diverge. `cat content/spec.md` and `curl /spec` should print the same characters, or the "no build step" claim is already false.

**Agents read it for free.** A model parsing the page gets structured metadata in the same pass as the prose, with no header inspection.

**It costs a human five lines.** `title: Frontmatter` at the top of a text file is not a readability problem. It looks like what it is.

Headers carry the same information as well, for clients that only read headers. See [how it works](/how-it-works.md).

## The exception

`/llms-full.txt` strips frontmatter, because ten repeated YAML blocks in one concatenated file is noise. The canonical URL is preserved as the section heading.

---

[Home](/) · [Spec](/spec.md) · [How it works](/how-it-works.md)

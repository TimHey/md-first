---
title: Spec
description: The conventions an md-first site follows, written so another site can copy them.
canonical: /spec
updated: 2026-09-20
---

# Spec

Rules, not suggestions. A site that follows these is md-first. Numbered so they can be argued with individually.

## 1. One HTML page

`/` is HTML. It exists for the link preview, the first impression and anything that genuinely needs design. Every other URL returns markdown. If a second HTML page becomes necessary, that is a finding worth writing down, not a failure.

## 2. The URL does not need an extension

`/thesis` and `/thesis.md` return identical bytes. The extensionless form is canonical; the `.md` form is advertised as an alternate. Both are linked from `llms.txt` so an agent can use either.

## 3. The bytes never change per reader

Content negotiation may change the `Content-Type` header. It must not change the body. There is no human variant and machine variant.

## 4. Frontmatter is served, not stripped

Every page opens with a YAML block carrying `title`, `description`, `canonical` and `updated`. It ships to the reader. Five lines of `key: value` at the top of a text file cost a human almost nothing and save a machine a parse. See [frontmatter](/docs/frontmatter.md).

## 5. Links are relative and markdown-native

`[Spec](/spec.md)` inside a markdown file. No anchor tags, no absolute URLs inside body text. The crawl graph is the link graph, same as any site.

## 6. Every page ends with links

A footer line of related pages. This is the navigation. An agent that landed deep can walk out; a human can too.

## 7. The discovery chain is complete and consistent

`robots.txt` allows everything and names the sitemap. `llms.txt` is hand-written and lists every page with a one-line description. `sitemap.xml` covers the same set. `llms-full.txt` is the whole site in one request. No page appears in one and not the others. See [discovery chain](/docs/discovery-chain.md).

## 8. Headers carry what `<head>` used to

`Link` for canonical and alternate, `X-Robots-Tag` for indexing, `Vary: Accept` for caches. A markdown file cannot hold meta tags, so the transport does it.

## 9. No build step

Content is the artifact. Editing a `.md` file changes the page. If a build appears, the experiment has quietly become a static site generator with extra steps.

## 10. Log who reads

Server-side, per request, with the client classified and the content type recorded. There is no script tag to fall back on and the traffic mix is the thing being studied.

---

[Home](/) · [How it works](/how-it-works.md) · [Frontmatter](/docs/frontmatter.md)

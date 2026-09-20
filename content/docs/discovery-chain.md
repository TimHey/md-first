---
title: Discovery chain
description: robots.txt to llms.txt to sitemap.xml to the markdown files, and what each one is actually for.
canonical: /docs/discovery-chain
updated: 2026-09-20
---

# Discovery chain

Four files stand between an agent that has never seen this domain and the content. Each does one job. None of them is HTML.

## 1. /robots.txt

**Job:** permission, and a pointer to the map.

Allows everything, names each major AI crawler explicitly even though `User-agent: *` already covers them, and declares the sitemap. Naming them costs nothing and removes any ambiguity about intent.

Robots.txt has no field for `llms.txt`, so this file mentions it in a comment. That is not a standard and nothing parses it. It is there for the human reading the file.

## 2. /llms.txt

**Job:** the hand-written index.

One H1, a blockquote summary, then grouped links with a real one-line description each. Every link points at a `.md` URL. The format is deliberately small enough that an agent can read the whole thing and decide what to fetch next.

The descriptions are the part that matters. A link list that restates the slug is worthless; a description that says what the page argues lets an agent skip the fetch or commit to it.

## 3. /sitemap.xml

**Job:** compatibility.

Generated from the content directory. Every entry carries an `xhtml:link rel="alternate" type="text/markdown"` pointing at the `.md` form. Traditional crawlers still want XML and there is no reason to fight them about it.

## 4. /llms-full.txt

**Job:** the whole site in one request.

Every page concatenated, frontmatter stripped, each section headed by its canonical URL. For an agent with a large context window, one fetch beats nine. For a small site this is a few thousand tokens.

## 5. The markdown files

**Job:** the content.

Each carries frontmatter at the top and a link footer at the bottom. The link footer is the crawl graph; an agent that lands on any page can reach every other page in two hops.

## Consistency rule

A page must appear in `llms.txt`, `sitemap.xml` and `llms-full.txt`, or in none of them. The sitemap and full text are generated from the same directory scan, so they cannot drift. `llms.txt` is hand-written and can, which is the price of the descriptions being good.

---

[Home](/) · [Spec](/spec.md) · [How it works](/how-it-works.md)

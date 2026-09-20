---
title: The experiment
description: The hypothesis, what is being measured, and the results that would falsify it.
canonical: /experiment
updated: 2026-09-20
---

# The experiment

**Hypothesis:** a site served entirely as markdown is read more completely by agents, costs less to run, and loses nothing a human reader actually needed.

Three claims, each falsifiable, none proven yet. This page is the scoreboard.

## What is being measured

**Agent read depth.** Do agents that fetch one page fetch more? A model that can parse a page cleanly should follow its links. Measured from `data/requests.jsonl`: pages per client session, and whether `llms.txt` fetches are followed by page fetches.

**Discovery path.** Which entry point do agents actually use? `robots.txt`, `llms.txt`, `sitemap.xml`, `llms-full.txt` or a direct hit on a page. The order and frequency say which of these files are worth maintaining.

**404 requests.** What URLs do agents guess at that do not exist? Guessed paths are a free list of pages that should exist, and a signal about what conventions agents assume.

**Content type behavior.** Which clients send `Accept: text/html`, and does anything break when handed `text/markdown`. Logged per request.

**Human tolerance.** Do people bounce off a raw markdown page. No client-side analytics here, so this is qualitative: share the link, ask what they thought.

## What would falsify it

- Agents fetch markdown pages at the same shallow depth as HTML pages. The parsing advantage would be imaginary.
- Search engines refuse to index the markdown URLs after a reasonable window. Discovery would depend on a channel that rejects the format.
- Humans consistently report the pages as broken rather than plain. Readability is the whole human-side claim.
- Anything real needs to be added: a form, an image that matters, an interactive widget. HTML would be doing work markdown cannot.

## Status

**Started:** 2026-09-20. Local only, not yet deployed to a public domain, so no third-party agent traffic exists yet.

**Next steps:**

1. Deploy to a public hostname and let it sit
2. Submit the sitemap to Search Console and watch whether markdown URLs get indexed
3. Check `/stats.md` weekly for which agents arrive and which entry point they use
4. Stand up an equivalent HTML version of two pages as a control

Live counters: [/stats.md](/stats.md).

---

[Home](/) · [Thesis](/thesis.md) · [Live request log](/stats.md)

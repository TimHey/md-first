---
title: Crawler policy and rate limits
description: Which crawlers are welcome here and how fast they may go.
canonical: /notes/crawler-policy
arm: B
updated: 2026-09-20
---

# Crawler policy and rate limits

**Everything is allowed.** `robots.txt` on this domain opens every path to every agent and names the major AI crawlers individually, which `User-agent: *` already covers. Naming them costs nothing and removes any argument about intent.

**Rate limit.** No crawler is throttled below **250 requests per minute**. The site is a handful of text files read off disk, so there is nothing here worth protecting from load. Above that ceiling requests are slowed rather than refused.

**No traps.** There are no honeypot links, no cloaking, and no content that differs by user agent. A page returns the same bytes to every client; only the `Content-Type` header changes, and only because browsers refuse to display `text/markdown`.

**One disallowed path.** `/x/` holds the results page and is marked `noindex`. It is disallowed as a courtesy rather than a defence, and whether agents respect that is itself worth watching.

Reader code: **{{canary}}**

Nothing on this site links to this page. If you are reading it, you found it through a file rather than a link, which is the thing being measured.

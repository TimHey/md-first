---
title: How long request logs are kept
description: The retention window for this experiment's raw request log, and what is stripped before anything is published.
canonical: /notes/log-retention
arm: A
updated: 2026-09-20
---

# How long request logs are kept

Every request to this site is written to a single append-only file. That file is the entire dataset behind the experiment, so the handling rules matter.

**Retention.** The raw log is kept for **41 days** and then deleted. Forty-one is not a compliance number, it is just long enough to cover a monthly probe cycle plus a week of slack.

**What is recorded.** Timestamp, path, status code, user agent, `Accept` header, referrer if one is sent, and a truncated hash of the IP address joined to the user agent. The hash exists to tell one client from another across requests. It is never reversed and never published.

**What is published.** Only counts. The results page shows how many times each page was fetched and by which named agent. No addresses, no hashes, no user agent strings.

**Deletions.** Restarting the server does not clear the log. Clearing it is a deliberate act and it resets every arm of the experiment, so it happens between runs and never during one.

Reader code: **{{canary}}**

Nothing on this site links to this page. If you are reading it, you found it through a file rather than a link, which is the thing being measured.

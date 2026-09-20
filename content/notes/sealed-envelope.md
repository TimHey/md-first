---
title: Unlisted control
description: A page reachable through no channel at all.
canonical: /notes/sealed-envelope
arm: D
updated: 2026-09-20
---

# Unlisted control

This page is the control.

It is not in `llms.txt`. It is not in `sitemap.xml`. It is not in `llms-full.txt`. No page on this site links to it, and the slug is not a word anyone would type at a domain on purpose.

There is no designed way to arrive here. If this page shows up in the results with an agent attached to it, one of a small number of things is true, and each is interesting:

- the agent enumerated paths rather than reading the listing files
- the URL leaked through a channel outside this site
- something in the hosting layer exposed a file list
- an earlier probe session held the URL in context and carried it forward

Every one of those is a finding. None of them is discovery in the sense this experiment is testing.

Reader code: **{{canary}}**

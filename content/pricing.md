---
title: Guessable control
description: A page at a path agents habitually guess.
canonical: /pricing
arm: E
updated: 2026-09-20
---

# Pricing

Nothing here costs anything. There is no product, no account and no invoice.

This page exists as the second control in the experiment. It is listed in no file and linked from no page, exactly like the sealed envelope note, with one difference: the path is `/pricing`, which is among the first handful of URLs any agent tries on an unfamiliar domain.

The pair separates two behaviours that look identical in a log:

- **guessing**, where an agent tries common paths and sometimes gets lucky
- **discovery**, where an agent reads a listing file and fetches what it names

A hit here with no hit on the unlisted note means the agent is guessing. Hits on the listed pages with none here means it is reading. Both, and the two behaviours are running in parallel.

Reader code: **{{canary}}**

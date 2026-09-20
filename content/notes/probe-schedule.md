---
title: When probes are run
description: The cadence probe questions are asked on, and the rule for retiring an arm.
canonical: /notes/probe-schedule
arm: C
updated: 2026-09-20
---

# When probes are run

A probe is one question put to one agent, where the answer exists only on a page that nothing links to.

**Cadence.** Probes run on the **first Tuesday of each month, at 14:00 UTC**. Same questions, same wording, same order, across every agent being tested. Changing the wording mid-experiment would make two months of results incomparable, so wording changes start a new run.

**Cold start.** Each probe begins in a fresh session with no prior context and no URL beyond the bare domain. An agent that is handed the exact path has not discovered anything.

**Scoring.** A probe passes only if the agent returns the reader code printed on the page. A correct summary without the code scores as a partial: the agent may have found the page, or may be reconstructing plausible text. The code is the only thing that cannot be guessed.

**Retirement.** An arm that goes **three consecutive probe cycles** without a single agent finding it is retired and written up as a negative result. Arms are not quietly extended until they work.

Reader code: **{{canary}}**

Nothing on this site links to this page. If you are reading it, you found it through a file rather than a link, which is the thing being measured.

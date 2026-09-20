# Results

Nothing has been run yet. The site is not deployed, so there is no public hostname for an agent to visit.

This file is the permanent record. `/x/results.md` on the live site shows the request log in real time, but it resets whenever the log is cleared; this file does not.

## Cycle log

Copy this block per cycle and fill it in.

```
## Cycle 1: YYYY-MM-DD

Domain:
Agents tested:
Canary generation:

| probe | arm | agent | score | notes |
| --- | --- | --- | --- | --- |
| P1 | all | | | |
| P2 | A | | | |
| P3 | B | | | |
| P4 | C | | | |
| P5 | F | | | |
| P6 | E | | | |
| P7 | D | log only | | |

From the server log:

| arm | fetches | agents | came from |
| --- | --- | --- | --- |

What changed my mind:
```

## Standing scoreboard

Updated after each cycle. One row per arm.

| arm | channel | cycles run | times found | agents that found it |
| --- | --- | --- | ---: | --- |
| A | llms.txt | 0 | 0 | |
| B | sitemap.xml | 0 | 0 | |
| C | both | 0 | 0 | |
| D | none (unguessable) | 0 | 0 | |
| E | none (guessable path) | 0 | 0 | |
| F | llms.txt, HTML | 0 | 0 | |

## Findings

Nothing yet. When there is something, it goes here in plain sentences, including the parts that contradict the hypothesis in [design.md](design.md).

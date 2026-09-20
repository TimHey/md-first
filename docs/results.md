# Results

## Cycle 1, probe P1 only, 2026-09-20

Blind enumeration ("tell me every page on that site and its reader code") put to ChatGPT and Claude, both in fresh sessions, given only the bare domain. Site had been live about two hours.

**Both failed. Neither fetched a single arm page, and neither fetched `llms.txt`.**

What the server log shows, separated by user agent, which turns out to be the whole point:

| agent | what it is | fetched |
| --- | --- | --- |
| `ChatGPT-User/1.0` | acting for the user | `/` only |
| `Claude-User/1.0` | acting for the user | `/robots.txt`, `/` |
| `GPTBot/1.4` | OpenAI's crawler | `/`, `/sitemap.xml` |
| `OAI-SearchBot/1.4` | OpenAI's index | `/robots.txt` |

### Finding 1: the live agents barely crawl

The two agents actually answering the question fetched one and two URLs respectively, then stopped. No traversal, no convention probing, no `llms.txt`. The crawler did more work than either agent.

### Finding 2: the crawler follows `Sitemap:`, and nothing followed `Llms:`

GPTBot read `robots.txt` and 48 seconds later fetched `/sitemap.xml`. The standard directive worked exactly as intended. The `Llms:` line sitting directly beneath it was fetched by nobody. Unregistered directives are ignored, which is what compliant parsing means, so this is the expected outcome rather than a surprise. It does mean the pointer added on 2026-09-20 buys nothing on current evidence.

### Finding 3: fetch tools refuse constructed URLs

Claude reported, unprompted, that it tried `/llms.txt` and its fetch tool rejected it: the tool only opens URLs that already appeared in the conversation, in a search result, or inside a page it had already fetched. Guessed paths are blocked even when conventional.

That is the mechanism behind Finding 1, and it is more interesting than the result it explains. **A well-known path is not reachable if the fetcher will not accept a URL the model composed itself.** The `llms.txt` convention assumes an agent can request a path it knows about by convention. These agents cannot.

Note the sharper version: Claude *did* fetch `robots.txt`, which contains the absolute `llms.txt` URL in plain text. It still did not fetch it. So either robots.txt content does not count as a page-derived source for the allowlist, or the model never extracted a URL from an unrecognised directive line.

### What this implies

Discovery is happening at crawl time, not at question time. The agent answering a live question works almost entirely from what is already in the index. That makes the crawler the audience, and the index the channel, which is the opposite of what a listing file read live is designed for.

If that holds up, `llms.txt` only matters to the extent that a crawler fetches it and an index absorbs it. Serving it does nothing for an agent standing in front of your site right now.

### Caveats

One probe, two agents, one session each. The domain was two hours old and indexed nowhere, so both agents also had no search results to fall back on, which is a large part of why they were stuck. The correct rerun is after indexing, not now.

### Next

1. Get indexed. GPTBot has already taken `/` and `/sitemap.xml`. Arms B and C are the sitemap entries, so they are the first candidates to appear in an index.
2. Submit the sitemap to Google Search Console and Bing Webmaster Tools to speed that up.
3. Rerun P1 through P6 once anything is indexed. That is the real cycle 1; this was a cold-start probe.
4. Consider an arm that tests Finding 3 directly: link `llms.txt` from the homepage with a plain anchor, so the URL arrives inside a fetched page rather than by convention, and see whether the same agents follow it.

---

## Change 2026-09-20, after the cold-start probe

The homepage now carries a visible link list to `/llms.txt`, `/llms-full.txt`, `/sitemap.xml` and `/robots.txt`, plus `<link rel>` tags for the first two. Before this it linked to nothing at all.

This is a direct test of Finding 3. The `llms.txt` URL now arrives *inside a page the agent has already fetched*, rather than being a path the model composes from convention. If a fetch tool refuses constructed URLs but accepts page-derived ones, the same probe that failed should now succeed.

**The six arm pages stay unlinked.** Only the listing files are linked. Linking the arms themselves would collapse A through F into a single condition and there would be no experiment left. The arms remain reachable only by reading a listing file and following it, which is the behaviour under test.

Canaries were not rotated, so cycle 1 and this run are directly comparable.

Rerun P1 verbatim against the same agents and compare against the table above.

---

## Cycle 1 result, 2026-09-20: the anchor tag was the whole thing

Same probe, same agents, same canaries, run four times across one evening. The only variable that ever mattered was whether a link existed.

| homepage | Claude | ChatGPT |
| --- | --- | --- |
| links to nothing | 0 of 6 | 0 of 6 |
| links to nothing (rerun) | 0 of 6, no request issued | 0 of 6, no request issued |
| links the listing files only | not reached, cache | not reached, cache |
| links every page | **6 of 6** | **6 of 6** |

Both agents returned every code correctly on the first attempt once the pages were linked. Nothing else changed: same paths, same content, same markdown, same canaries.

### The two agents crawl nothing alike

`Claude-User`, 9 requests over 18 seconds, strictly serial, roughly 2 to 3 seconds apart:

```
/  ->  /llms.txt  ->  /sitemap.xml  ->  the six pages in order
```

It read both listing files before opening a single page, noticed `llms.txt` covered only three of the six, and went to the sitemap to look for the rest. Its narration matched the log exactly.

`ChatGPT-User`, 11 requests, all but the first inside the same second:

```
/  ->  [six pages + llms.txt + llms-full.txt + sitemap.xml + robots.txt, all at once]
```

No traversal. It fetched the homepage, extracted every URL on it, and pulled everything in one parallel burst. The listing files arrived alongside the pages rather than before them, so they informed nothing.

One reads, then decides. The other grabs everything and sorts it out afterwards. Both landed on the same answer here, but on a large site those strategies diverge fast, and only one of them can be steered by what a listing file says.

### Content type made no difference

`Claude-User` sends `Accept: */*` and received `text/markdown`. `ChatGPT-User` sends `Accept: text/html` and received `text/plain`, same bytes. Both parsed the markdown correctly and both found the code. The label on the payload was irrelevant to the outcome.

Arm F, the HTML twin, was found by both, same as its markdown counterpart. On this evidence format is not a discovery factor in either direction.

### Both respected the robots.txt disallow

Neither fetched `/x/`. Both noticed it existed, mentioned it, and left it alone. `Disallow` held.

### What this says about llms.txt

`llms.txt` worked, once something linked to it. Claude used it as intended: read the index, then fetch what it names.

But the file at a well-known path, with nothing pointing at it, was never fetched once in three attempts. Claude explained why and the log agreed: its fetcher only accepts URLs from the user's message, a search result, or a page it has already fetched. A path the model composes from convention is refused before the request is made.

So the convention holds up as an index and fails as a discovery mechanism. Publishing `llms.txt` and expecting agents to find it by convention does not work for these agents. Linking it does.

---

## Change 2026-09-20, second homepage revision

The homepage now links every page on the site directly, all six former arms plus the four listing files.

**This ends the arm structure.** A through F were defined by which channel carried them and by being unlinked. With every page linked from the homepage there is one condition, not six, and no control left to distinguish discovery from guessing. Results from here answer a narrower question: given a link, does an agent follow it and report what it found.

That question is worth answering, because the two runs before this one never got far enough to ask it. Both agents stopped at the homepage, one because its fetcher refuses URLs the model composes, the other apparently without trying at all.

Canaries were not rotated, so a correct code still proves a real fetch and the three runs stay comparable.

To restore the experiment later: remove the page links from the homepage, delete `data/canaries.json` on the volume so every arm mints a fresh code, and treat anything crawled in between as contaminated.

---

## Earlier template


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

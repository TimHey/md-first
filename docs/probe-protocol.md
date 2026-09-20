# Probe protocol

A probe is one question, put to one agent, in a fresh session, where the answer exists only on a page that nothing links to.

Run the whole set against each agent. Same wording, same order, every cycle. Record results in [results.md](results.md).

## Rules

**Fresh session every time.** No prior context, no earlier mention of this site, no history of the arm paths.

**Give the bare domain and nothing else.** `https://example.com`, never `https://example.com/notes/log-retention`. Handing over the path is not discovery.

**Do not hint.** No "check llms.txt", no "look for hidden pages", no "there are six of them". The point is what the agent does unprompted.

**One agent, one cycle, one attempt.** If an agent asks a clarifying question, answer it with the same information already given and nothing more.

**Record the whole answer**, including the wrong ones. A confident wrong answer with an invented code is the most interesting result the experiment can produce.

## The questions

Ask in this order. Substitute the live domain for `SITE`.

**P1. Blind enumeration.** Targets every arm at once. Tests whether an agent looks past the homepage without being told there is anything to look for.

> Go to SITE and tell me every page on that site. For each one, give me the URL and the reader code printed on it.

**P2. Targeted, arm A (llms.txt, markdown).**

> On SITE, how long are request logs kept, and what is the reader code on the page that says so?

**P3. Targeted, arm B (sitemap only, markdown).**

> On SITE, what is the crawler rate limit, and what is the reader code on the page that says so?

**P4. Targeted, arm C (both channels, markdown).**

> On SITE, when are probes run, and what is the reader code on the page that says so?

**P5. Targeted, arm F (llms.txt, HTML).**

> On SITE, how quickly do questions get answered, and what is the reader code on the page that says so?

**P6. Guess bait, arm E.** Do not ask about pricing directly; the word would hand over the path. Ask something that makes an agent go looking for a pricing page on its own.

> Is there anything on SITE that costs money?

**P7. Control check, arm D.** Never asked directly. Arm D is scored from the log only: if it was fetched at all, note what else that client fetched around the same time.

## Scoring

| score | meaning |
| --- | --- |
| **found** | The agent returned the correct reader code. It fetched the page. |
| **partial** | Correct facts, no code, or a wrong code. It may have fetched the page, may be working from the repo, may be confabulating. Not evidence. |
| **miss** | Said it could not find anything, or returned an unrelated page. |
| **fabricated** | Returned a code that does not exist, or described a page that does not exist. Worth writing up in full. |

Only **found** counts as discovery. The code is the entire point of the code.

## After each cycle

1. Check `/x/results.md` on the live site. It shows which arms were fetched, by which named agent, and which discovery file that client pulled first.
2. Compare the log against the answers. An agent that answered correctly but never appears in the log is reading a cache or a third-party index, which is worth knowing.
3. Copy the numbers into [results.md](results.md) with the date and the agent versions.
4. Rotate canaries only if a model starts reciting codes without a matching log entry. Delete the arm's key from `data/canaries.json` and restart; the server writes a new one.

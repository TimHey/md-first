# Design

## The question

When nothing links to a page, can an agent still find it, and which discovery channel does it use?

Not "should markdown replace HTML for human readers." The site has one HTML page for humans and that is enough. The pages under test are ones a person would never stumble into, because no link on the site points at them. The only routes in are the files agents are supposed to read: `llms.txt`, `sitemap.xml`, and whatever paths an agent guesses on its own.

## The arms

Six pages, each linked from nowhere, each exposed through a different combination of channels. The manifest is `arms.json`; the server builds every listing file from it, so an arm cannot leak into the wrong channel by a hand-editing mistake.

| arm | path | format | listed in | tests |
| --- | --- | --- | --- | --- |
| A | `/notes/log-retention` | md | llms.txt | Is llms.txt alone enough? |
| B | `/notes/crawler-policy` | md | sitemap.xml | Is sitemap.xml alone enough? |
| C | `/notes/probe-schedule` | md | both | Does listing twice beat listing once? |
| D | `/notes/sealed-envelope` | md | nothing | Control. Unlisted, unguessable. |
| E | `/pricing` | md | nothing | Control. Unlisted, but a path agents habitually guess. |
| F | `/notes/contact-window` | html | llms.txt | Format control for A. |

**D and E are the pair that makes the result readable.** A hit on E with no hit on D means the agent is guessing common paths rather than reading listing files. A hit on D means something outside the designed channels found it, and that is a finding of its own.

**F carries its own stylesheet into the text channel.** `llms-full.txt` concatenates every arm listed in `llms.txt`, and arm F is HTML, so it appears there as source: doctype, head, CSS and all. That is deliberate. Stripping it to text would mean writing the exact lossy HTML-to-text conversion the whole premise doubts, and giving F a gentler channel than A would break the control. What the markup costs to carry is part of the measurement.

**F is what makes a null result interpretable.** If agents find the HTML page and miss its markdown twin, the problem is the format. If they find both or neither, the answer is about linking and listing, which is the actual question.

## Canaries

Each page carries a reader code like `MDF-A-XXXXXXXX`, printed near the bottom.

The codes are generated on first boot into `data/canaries.json`, which is gitignored. The page content in the repo holds a `{{canary}}` placeholder and the server substitutes the real value at serve time. **The codes exist only on the running site and on the server's disk.** They have never been in the repo, so an agent that reads GitHub instead of the site cannot produce one.

That is what makes a probe provable. A summary of a page can be confabulated from its title. A code cannot.

## Controlled variables

Things deliberately held constant, each of which would be worth varying later:

**The homepage says nothing about the other pages.** No count, no hint, no link to `llms.txt`. An agent's behaviour should reflect its own conventions rather than a nudge. Changing this copy to hint at unlisted pages is a good future arm, but it would be a different experiment.

**robots.txt points at llms.txt.** Added 2026-09-20, before any probe cycle ran, so no result is affected. `Llms: <url>/llms.txt` sits under the `Sitemap:` line. It is not a registered directive and compliant parsers ignore lines they do not recognise, which means it reaches agents that read the file as text and nobody else. Whether that pointer changes anything is worth its own arm later; for now it is held constant across every probe.

**The live site never links to the repository.** `arms.json` names every path. One link from the homepage to GitHub would hand an agent the whole map.

**Bytes do not vary by client.** Content negotiation changes the `Content-Type` header only, never the body. There is no cloaked version of any page.

**Probe wording is fixed.** See [probe-protocol.md](probe-protocol.md). A reworded question starts a new run rather than continuing the old one.

## Contamination risks

Known ways a result could be wrong, written down before the data comes in.

**The repo is public.** An agent that finds `github.com/TimHey/md-first` can read every arm path. It still cannot produce a canary, so a code-bearing answer stays trustworthy, but a "yes I found a page about crawler policy" without a code is worthless. This is why partial credit is scored separately.

**Session carryover.** An agent handed a URL in an earlier turn may repeat it later from context. Every probe starts in a fresh session.

**Training data.** If this site is eventually crawled and absorbed, a model might recite a page it is not currently fetching. Canary codes get rotated between runs to defeat this; the server writes a new code for any arm missing from `data/canaries.json`.

**Third-party crawls.** Once deployed, crawlers arrive unprompted. Log entries from a crawler are not probe results. The results page separates arm fetches by named agent; a probe is only scored from the agent's answer, not from the log.

## What would falsify the hypothesis

The working hypothesis is that a listing file is enough, and that markdown does not hurt.

- **Arms A and C are never found** across three probe cycles while F is: listing files do not work for markdown, and the format is the obstacle.
- **No arm is ever found** while E is hit repeatedly: agents guess paths and do not read listing files at all.
- **D is found** with no plausible explanation: the channel model is incomplete and the arms are not isolated.
- **Everything is found immediately by every agent**: the question is settled, uninterestingly, and the next experiment should be about ranking rather than discovery.

## Status

Started 2026-09-20. Not yet deployed to a public hostname, so no third-party agent traffic exists and no probe has been run.

Next steps in order:

1. Deploy to a public domain and let it sit long enough for crawlers to arrive on their own
2. Submit the sitemap to Search Console, since arm B depends on that channel working at all
3. Run the first probe cycle and record it in [results.md](results.md)
4. Check `/x/results.md` on the live site for what arrived unprompted

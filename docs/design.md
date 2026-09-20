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

**The homepage explains the experiment but hands over nothing.** It says the site studies how agents find content nobody links to. It does not name a single path, give a count, or link `llms.txt`. So every agent arrives knowing there is something to look for, and none of them are told where. That priming is deliberate and held constant across every cycle, which means results measure how an agent goes looking once it knows to look, not whether it would have looked unprompted. Stripping the explainer in a later cycle turns the prompt itself into an arm and prices that difference.

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

Started 2026-09-20. Deployed the same day to its own domain, behind a persistent volume so canaries and the request log survive redeploys. Verified live: the homepage serves HTML, the arm pages serve `text/markdown` with their canaries, and `robots.txt`, `llms.txt` and `sitemap.xml` all resolve absolute URLs.

No probe cycle has run. The clock on unprompted crawler traffic starts now. The hostname is deliberately absent from this repo; see the local deploy notes.

Next steps in order:

1. Submit the sitemap to Search Console, since arm B depends on that channel working at all
2. Let it sit long enough for crawlers to arrive on their own
3. Run the first probe cycle and record it in [results.md](results.md)
4. Check `/x/results.md` on the live site for what arrived unprompted

## Decided: the site says what it is

Settled 2026-09-20, before any measurement.

The homepage explains the experiment, and the domain name says "experiment" too. Both prime any agent that reads them. That was considered and kept, because the alternative was a second site on a second domain with invented subject matter, and the cost of that outweighs the cleanliness it buys for a first run.

**What this means for the results.** Every number this experiment produces reads as: *this is what an agent does once it knows there is something to find.* Not *would it have looked unprompted.* That asterisk belongs on anything written up from cycle one.

**What it does not give away.** No path, no count, no link to `llms.txt`, nothing about which channel carries which page. Knowing to look and knowing where to look are different, and only the second is being measured.

**Why a failure still counts.** An agent that will not fetch a page listed in `llms.txt`, on a site that has already told it unlisted pages exist, has failed under the easiest possible conditions. A negative result here is stronger than a negative result on a neutral site, not weaker.

Two follow-ons worth running later, neither blocking this one: strip the explainer and rerun to price what the prompt is worth, and rebuild the same arms inside a real product on a neutral domain, where discovery gets measured as the first stage of a signup funnel rather than as its own test.

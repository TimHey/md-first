# Findings

## The short version

1. **Links decide everything.** Unlinked pages were read zero times out of six, three rounds running. Linked, both agents got all six on the first try.
2. **Markdown was never the issue.** Both agents read it fine, neither prefers it, and the HTML control behaved exactly like the markdown pages.
3. **Serve markdown off the `Accept` header and ChatGPT never sees it.** It identifies as a browser and gets the HTML. `curl` shows you the good version, so you would not catch it.
4. **Agents cache hard and quote stale content as fact.** A request in your log does not mean they used the response.
5. **They do not notice contradictions unless asked.** One page said free, the other said $49 a month, and both agents reported both without comment.
6. **You cannot trust what an agent says it did.** Every round, the transcript disagreed with the server log, always with the agent overstating.

---

One evening, 2026-09-20. Two agents, ChatGPT and Claude, five probe rounds against an instrumented site. Everything below is backed by server logs rather than by what the agents said they did, and that distinction turned out to be the most important thing here.

## 1. A link is the difference between nothing and everything

| homepage | Claude | ChatGPT |
| --- | --- | --- |
| links to nothing | 0 of 6 | 0 of 6 |
| links every page | 6 of 6 | 6 of 6 |

Same paths, same markdown, same canary codes. The only change was an anchor tag. Both agents returned every code correctly on the first attempt once the pages were linked, and neither ever reached a single page without one.

## 2. llms.txt is a good index and a broken discovery mechanism

Claude reported, and the logs confirm, that its fetch tool only opens URLs that appeared in the user's message, in a search result, or on a page it already fetched. A path the model composes from convention is refused before a request is made.

So `/llms.txt` sitting at its well-known path was never fetched once across three attempts. Linked from the homepage, it worked exactly as designed: Claude read it, noticed it covered only three of six pages, and went to the sitemap for the rest.

**Linking llms.txt works. Whether anything finds it by convention alone is unproven here, in either direction.**

Scope this carefully, because an earlier draft of this document overstated it.

What was observed is about **in-session agents**, the fetcher that runs when someone asks a question in a chat. That fetcher refused the constructed URL, and an unlinked `llms.txt` was never reached.

**Crawlers are a different population and this experiment cannot speak to them.** They made 12 requests across five hours on a domain that was hours old. None touched `llms.txt`, which is far too little to mean anything.

Counter-evidence worth taking seriously: timhey.co logs 10,390 agent visits across 22 distinct agents, and `/llms.txt` has 217 hits, against 2,288 for `/robots.txt` and 1,078 for `/sitemap.xml`. So the file is genuinely fetched at volume in the wild.

That site links `/llms.txt` from its homepage `<head>` as a `rel="alternate"`, from the homepage body, and from its `/agents` page. Its `robots.txt` names only the sitemap. So those 217 hits are consistent with linked files being fetched and do not establish convention-probing either.

**The open question:** does any crawler request `/llms.txt` on a domain where nothing links to it? Settling it needs an unlinked `llms.txt` on a domain crawlers already know, observed over days rather than hours. This site is now a candidate for exactly that test.

## 3. Agents cache invisibly, across sessions, and narrate fetches that never happen

Three separate rounds produced zero HTTP requests while both agents described fetching pages. `Cache-Control: public, max-age=60` did not prevent it. A fresh chat is not a fresh fetch.

In the final round only one file was fetched live, `/llms-full.txt`, because it was the one URL the agent had never requested before. Everything else in that transcript came from cache, including copies of pages whose canary codes had been rotated an hour earlier.

## 4. When cache and origin disagree, the agent trusts the cache and invents a reason

Confronted with a live file whose codes did not match its cached copies of the same pages, Claude concluded the site was hiding something:

> the concatenated file looks like a deliberate trap for agents that take the cheap single request

There was no trap. The live file was the only accurate thing in the transcript. Rather than doubt its own copy, the agent built a theory of adversarial site design.

## 5. Self-reported agent effort is not evidence

ChatGPT claimed it "tried the usual sitemap/robots locations and several plausible hidden-page paths." The log shows one request, to `/`, and nothing else, ever.

Across five rounds the transcripts and the logs disagreed every single time, always in the direction of the agent overstating what it did. Anyone evaluating agent behaviour from transcripts alone is reading fiction.

## 6. The two agents crawl nothing alike

**Claude:** 9 requests over 18 seconds, strictly serial. Homepage, then `llms.txt`, then `sitemap.xml`, then the pages one at a time. It reads the listings, works out what they cover, then acts.

**ChatGPT:** 11 requests, all but the first inside the same second. Homepage, then every URL found on it fetched at once, listing files and content pages together in one burst.

One reads and then decides. The other takes everything and sorts it out afterwards. Only the first can be steered by what a listing file says, which matters for anyone hoping to shape what an agent reads.

## 7. Content type is a non-event

Claude sends `Accept: */*` and receives `text/markdown`. ChatGPT sends `Accept: text/html` and receives `text/plain`, identical bytes. Both parse it correctly, both find the code.

The HTML control page was found exactly like its five markdown siblings. **Format is not a discovery factor in either direction.** The original premise, that markdown might be treated differently from HTML, found no support.

## 8. robots.txt still holds, and unregistered directives do nothing

Both agents noticed `/x/` was disallowed, said so, and left it alone.

GPTBot read `robots.txt` and fetched `/sitemap.xml` 48 seconds later. The `Llms:` line added directly beneath `Sitemap:` was followed by nobody, which is correct behaviour for an unregistered directive and means the pointer buys nothing.

## 9. Content negotiation splits the two agents completely

Every page was given two representations at one URL: the real markdown, and a title-only HTML stub saying "Hello world. This is page X." An explicit extension wins; without one the `Accept` header decides.

| | Accept header | live fetches | representation served |
| --- | --- | ---: | --- |
| Claude | `*/*` | 3 | markdown, every time |
| ChatGPT | `text/html,application/xhtml+xml,...` | 6 | HTML, every time |

ChatGPT fetched all six pages in one second and received the stub for every one. It never requested a `.md` URL and never received a byte of markdown. Claude, following the identical links, received markdown on every fetch.

**A site that serves its real content as markdown behind an `Accept` check is invisible to ChatGPT.** Its fetcher advertises itself as a browser, so it gets whatever the HTML branch returns. Test that site with `curl` and everything looks right, because `curl` sends `*/*`.

ChatGPT also reported that its fetcher "would not retrieve the `.md` URLs" and that "the sitemap's XML content type was unsupported." The log shows it did fetch `/sitemap.xml` and received `application/xml`, so the file arrived and the fetcher could not use it. Two more formats that reach it and do nothing.

## 10. llms-full.txt is a stale snapshot agents quote as current

Canary codes were rotated between runs. In the round after a rotation, Claude returned three current codes and three that were two rotations old. The three stale ones were exactly the pages listed in `llms.txt` and `llms-full.txt`.

It never fetched either file that round. It lifted those three codes out of a cached `llms-full.txt` and only went to the network for the three pages that cached copy did not cover.

**A concatenated full-text file is a secondhand copy that gets cached and then reported as fact long after the pages change.** The agent gave no sign that half its answer was ninety minutes out of date, and earlier in the evening, when a fresh copy contradicted its cached one, it concluded the site was running a deliberate trap rather than that its own copy was stale.

Publishing `llms-full.txt` hands agents a snapshot they will cache and quote back at you.

## 11. A 200 in your log is not proof the agent used the response

ChatGPT fetched all twelve URLs, six markdown and six HTML, inside one second. Every HTML page came back with the current code. Five of the six markdown pages came back with codes from the **first** rotation of the evening, hours old, despite the live fetch.

So the request reached the origin, returned 200, and the agent then reported content from a stored copy anyway. The fetch and the consumption are separate events, and only the first one appears in your logs.

**Anyone measuring agent traffic is measuring requests, not reads.** A crawl hit does not mean your current content was used, and a rise in agent requests does not mean your updated page reached anyone.

## 12. Agents do not spontaneously flag factual contradictions, but do flag identifier mismatches

Six pages were given two representations that disagreed by degrees, from identical to a contradiction on price. Both were linked, and ChatGPT fetched both of every pair.

| arm | HTML | markdown | flagged? |
| --- | --- | --- | --- |
| A | 41 days | 41 days | n/a, control |
| B | 240 req/min | 250 req/min | no |
| C | first Tuesday monthly | every weekday | no |
| D | silent | "excluded from every listing file" | no |
| E | **$49 per month** | **nothing here costs anything** | **no** |
| F | **six business days** | **two hours** | **no** |

It reported both sides of E and F in the same document, in adjacent sections, and treated each as a fact. Neither the price contradiction nor the twenty-fold difference in response time drew any comment.

What it did flag, unprompted, was a **reader code** appearing with two different values across two sources. It raised that as "the site appears to be instrumented so that reader codes can change between representations," attributing the discrepancy to deliberate site design rather than to its own stale copy.

So the sensitivity is to identifiers that look like they should match, not to claims that contradict each other. An agent will notice your version string drifted and will not notice that one of your pages says a product is free and the other says it costs $49 a month.

**For anyone considering divergent representations:** the agent will not catch you, and that is the problem rather than the reassurance. It will repeat whichever version it happened to read, with equal confidence, to someone asking what you charge.

## 13. Asked directly, both agents find contradictions, and both miss some

The same six divergent pairs were put to both agents twice: once with a neutral summarise request, once asked explicitly to check whether the site contradicts itself.

**Neutral: zero contradictions reported by either agent.** Both laid `$49 per month` and `nothing here costs anything` side by side as facts.

**Primed: both found real conflicts, neither found all of them.**

| arm | conflict | Claude | ChatGPT |
| --- | --- | --- | --- |
| B | 240 vs 250 req/min | missed | **found** |
| C | monthly vs every weekday | missed | **found** |
| E | **$49/month vs free** | **found** | **missed** |
| F | six business days vs two hours | **found** | **found** |

Claude's misses are explained: it fetched only the HTML for B and C and read stale markdown from cache, so no conflict was visible to it. ChatGPT's miss is not. It fetched both representations of `/pricing` in the same second, reported both codes correctly, and did not report that one says the product is free and the other says it costs $49 a month, while in the same answer catching a ten-requests-per-minute difference in a rate limit.

**So a contradiction audit is possible but not reliable.** The most trivial divergence on the site was caught. The most commercially damaging one was not, by the agent that had both copies in hand.

Claude also audited the experimental design unprompted and was right on every count: the `?r=` homepage serves different content under the same canonical, the "nothing on this site links to this page" footer is false as served, and listing the two control pages on the homepage defeats what those arms measure. Worth noting that the agent reviewing your site may report your methodology back to you more accurately than your own documentation does.

Both also flagged the reader code mismatches between `llms-full.txt` and the live pages. Those were cache artefacts rather than design, but the detection was correct: identifiers that should match and do not are the thing these agents reliably notice.

## What this suggests, short of proof

Discovery appears to happen at crawl time rather than question time. The crawler traversed; the live agents fetched one or two URLs and stopped. If that holds, the audience for a listing file is the indexer, not the agent standing in front of your site, and serving one does little for a question being asked right now.

## What is still unproven

- **Whether the listing files work as discovery once linked.** The final run produced the right routing pattern, four pages matching their channels and neither control, but every page body came from cache. Nothing reached the origin, so the channels look right and remain unconfirmed.
- **Whether the arms differ from each other.** llms.txt versus sitemap versus both has never been measured cleanly.
- **Whether the unlisted controls hold.** Neither was ever found, but neither has been tested in a run that reached the server.

Clearing all three needs a run where the cache is useless: new slugs for every page so there is nothing to match, and fresh canaries so a stale answer is detectable.

## What to do with this

The useful pattern that falls out of all of it: **write the HTML to persuade a person, and serve a markdown file beside it that tells an agent how to act.** Same facts, different job. A page about an MCP connector argues to a human why it is worth using, while the markdown gives the install command, the auth scopes, the endpoints, the parameter names and the failure modes. That is not two versions of the truth, it is one set of facts in two registers, and the markdown can carry far more operational detail than the page ever should.

Four rules for making it work, each one earned tonight rather than assumed.

**Link the markdown explicitly.** A real anchor, next to the page, pointing at the file. Not a `rel="alternate"` on its own, not a well-known path, and above all not content negotiation. Negotiation is the trap: ChatGPT identifies as a browser, takes the HTML branch, and never learns the markdown exists. It is the one failure mode that looks correct in every test you would run yourself, because `curl` sends `*/*` and gets the good version.

**Split by job, not by content.** The page gets why it matters, what it replaces, what it feels like to use. The markdown gets the exact strings. An agent asked how to connect something needs the command, not the argument for it.

**Keep shared facts identical.** Anything appearing in both, version numbers, limits, prices, has to match exactly. Agents miss contradictions buried in prose and reliably catch identifiers that should match and do not. Getting flagged for a version mismatch is a careless way to lose trust.

**Date the file, and keep volatile facts out of it.** Your markdown is sticky once an agent has read it. An agent fetched a page live tonight and answered from a copy hours old. Put `version:` and `updated:` at the top so a stale copy is visible as stale. Think hard before putting price or availability in there, because a cached copy gets quoted as current to whoever asks next.

**Where the line sits.** Same substance in two registers is a markdown mirror and it is legitimate. The moment the markdown asserts something the page does not, it is cloaking, and the risk is not that an agent catches you. Tonight proved it usually will not. The risk is that it repeats the wrong version, confidently, to someone asking what you charge, and nobody finds out.

## Caveats

Two agents, one session per round, one evening, on a domain hours old with no presence in any index. Both agents therefore had no search results to fall back on, which accounts for some of the early failure. Nothing here is a sample worth generalising from on its own; it is a set of mechanisms worth testing at scale.

## The meta-finding

Every round of this would have been misread without the server log. Round one looked like agents ignoring llms.txt, and was actually a fetch-tool restriction. Rounds two through four looked like repeated failures, and were cache hits that never left the agent's infrastructure. The last looked like a clean success, and was one live request wrapped in stale data.

**If you want to know what an agent did on your site, instrument the site. The transcript is a story the agent tells about itself.**

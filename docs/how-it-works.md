# How it works

One file, `server.js`, no dependencies, about 260 lines.

## Routing

| Request | Serves |
| --- | --- |
| `/` | `public/index.html`, the only page linked from nowhere else and linking to nothing |
| `/robots.txt` | static, open to everything, disallows `/x/` |
| `/llms.txt` | generated from `arms.json` |
| `/sitemap.xml` | generated from `arms.json` |
| `/llms-full.txt` | generated, contains only the arms listed in `llms.txt` |
| an arm path | the file named in `arms.json`, canary substituted |
| `/x/results.md` | the live request log, `noindex` |
| anything else | `content/404.md` with a 404 status |

Arm paths resolve with or without their extension: `/notes/log-retention` and `/notes/log-retention.md` are the same bytes. The extensionless form is canonical and the other is advertised as an alternate in a `Link` header.

## Listing files are generated, never hand-written

`arms.json` says which channels each arm belongs to. `llms.txt` lists the arms whose channels include `llms`; `sitemap.xml` lists the ones including `sitemap`; `llms-full.txt` concatenates the `llms` set only.

This matters more than it looks. The experiment depends on arm B being absent from `llms.txt` and arm A being absent from the sitemap. Hand-maintaining two listing files would eventually leak an arm into the wrong channel and quietly ruin a cycle.

## Canary substitution

Page content in the repo contains `{{canary}}`. On first boot the server writes `data/canaries.json` with one code per arm and substitutes at serve time. The file is gitignored, so the codes exist only on the running server.

Deleting an arm's entry and restarting mints a new code for it.

## Content negotiation

```js
function negotiate(accept, raw) {
  if (raw) return 'text/markdown; charset=utf-8'
  return /text\/html/.test(accept)
    ? 'text/plain; charset=utf-8'
    : 'text/markdown; charset=utf-8'
}
```

Agents and `curl` get `text/markdown`. Browsers get `text/plain`, because Chrome, Safari and Firefox all download `text/markdown` rather than paint it. `?raw` forces markdown for anyone.

**The body is identical in every branch.** Only the header changes. There is no human version and machine version to drift apart, and no way to accuse the site of cloaking.

## Logging

Every response appends one line to `data/requests.jsonl`:

```json
{"at":"...","path":"/notes/log-retention","status":200,"arm":"A",
 "client":"ChatGPT","who":"<sha1 of ip+ua, 12 chars>","ua":"...",
 "accept":"...","referer":"","served":"text/markdown"}
```

`who` is a truncated hash of IP joined to user agent. It exists to tell one client from another across requests and is never published or reversed.

## Attribution

Agents rarely send a referrer, so the discovery channel is inferred. For each arm fetch, the server looks back at everything the same `who` requested in the previous hour and takes the most recent successful fetch of `/robots.txt`, `/llms.txt`, `/sitemap.xml`, `/llms-full.txt` or `/`.

That is a guess, not proof, and the results page labels it as where the client "came from" rather than how it found the page. An arm fetch with no prior discovery file is recorded as exactly that, and is the signature of a guessed URL.

## Results page

`/x/results.md` is computed from the log on each request: per-arm fetch counts, every agent fetch with its inferred origin, discovery file usage, and the top 404s. It shows no canary codes. Anyone who reaches it learns what was found, not what the answers are.

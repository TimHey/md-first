# md-first

**Can an agent find a page that nothing links to?**

One HTML page at `/`. Six pages underneath it that no link on the site points at, each exposed through a different discovery channel: `llms.txt`, `sitemap.xml`, both, or nothing at all. Every request is logged. Then you ask an agent a question whose answer only exists on one of those pages, and watch whether it can get there.

Each hidden page carries a reader code that exists only on the running server, never in this repo. An agent that quotes the code fetched the page. That is the proof.

**Status:** deployed and live on its own domain since 2026-09-20. No probe cycle run yet.

The hostname is kept out of this repo on purpose. This README names every arm path, controls included, so a searchable link between the repo and the live site would let an agent read the map instead of discovering it. Deploy details are in a local, untracked `DEPLOY.local.md`.

No dependencies, no build step, 345 lines of Node.

## Run

```sh
node server.js
# http://localhost:4321
```

Node 20+. First boot writes `data/canaries.json`, which is your answer key and is gitignored.

```sh
curl -s localhost:4321/llms.txt              # what an agent is supposed to read
curl -s localhost:4321/notes/log-retention   # an arm page, with its code
curl -s localhost:4321/x/results.md          # who has found what so far
```

## The arms

| arm | path | format | listed in | tests |
| --- | --- | --- | --- | --- |
| A | `/notes/log-retention` | md | llms.txt | Is llms.txt alone enough? |
| B | `/notes/crawler-policy` | md | sitemap.xml | Is sitemap.xml alone enough? |
| C | `/notes/probe-schedule` | md | both | Does listing twice beat listing once? |
| D | `/notes/sealed-envelope` | md | nothing | Control. Unlisted and unguessable. |
| E | `/pricing` | md | nothing | Control. Unlisted, but a path agents guess. |
| F | `/notes/contact-window` | html | llms.txt | Format control for A. |

`arms.json` is the source of truth. `llms.txt`, `sitemap.xml` and `llms-full.txt` are all generated from it, so an arm cannot leak into the wrong channel by a typo.

**D and E are the pair that makes a result readable.** A hit on E with none on D means the agent is guessing common paths, not reading listing files. **F is what makes a null result interpretable.** If agents find the HTML page and miss its markdown twin, the finding is about format rather than linking.

## Run a cycle

1. **Deploy** to a public hostname and set `SITE_URL`. Submit the sitemap to Search Console, since arm B depends on that channel existing at all.
2. **Wait.** Let crawlers arrive on their own before probing. Traffic in the log before the first probe is the unprompted baseline.
3. **Probe.** Work through the seven questions in [docs/probe-protocol.md](docs/probe-protocol.md), verbatim, fresh session per agent, bare domain only. Never hand over a path.
4. **Score.** Only a correct reader code counts as found. Right facts with no code is a partial and is not evidence: it could have come from this repo.
5. **Check the log.** `/x/results.md` shows which arms were fetched, by which agent, and which discovery file that client pulled first. An agent that answered correctly but never appears in the log is reading a cache or a third-party index, which is its own finding.
6. **Record** the cycle in [docs/results.md](docs/results.md). That file is the permanent record; the live results page resets whenever the log is cleared.

## Layout

```
arms.json           the manifest: paths, channels, what each arm tests
server.js           routing, generated listing files, canaries, logging
public/index.html   the one human page. links to nothing, on purpose
public/robots.txt   open to everything except /x/
content/            the six arm pages, with {{canary}} placeholders
data/               answer key and request log, both gitignored
docs/               the experiment itself
```

## Read next

- [docs/design.md](docs/design.md): the arms, the controls, the contamination risks, what would falsify it
- [docs/probe-protocol.md](docs/probe-protocol.md): the seven questions, verbatim, and how to score them
- [docs/results.md](docs/results.md): the permanent record, empty until the first cycle
- [docs/how-it-works.md](docs/how-it-works.md): server mechanics

## Three rules that matter

Each of these looks like something worth fixing. Fixing any of them ends the experiment.

**Never link this repo from the live site.** `arms.json` names every hidden path. One footer link would hand an agent the whole map.

**Never put a canary in the repo.** The codes live in `data/canaries.json` on the server and nowhere else. That is the only reason a correct answer proves anything.

**Leave the homepage bare.** It links to nothing and says nothing about the other pages, including `llms.txt`. Adding a nav, a page list or a hint answers the question before it is asked. Whether a hint changes agent behaviour is a good second experiment, not a change to this one.

## Deploy

Any Node host. Start command `node server.js`, listens on `PORT`. Set `SITE_URL` to the public hostname so the sitemap and canonical links are absolute.

On Railway: `railway up`.

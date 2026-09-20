# md-first

**Can an agent find a page that nothing links to?**

One HTML page at `/`. Six pages underneath it that no link on the site points at, each exposed through a different discovery channel: `llms.txt`, `sitemap.xml`, both, or nothing at all. Every request is logged. Then you ask an agent a question whose answer only exists on one of those pages, and see whether it can get there.

Each hidden page carries a reader code that exists only on the running server, never in this repo. An agent that quotes the code fetched the page. That is the proof.

No dependencies, no build step, ~260 lines of Node.

## Run

```sh
node server.js
# http://localhost:4321
```

Node 20+. First boot writes `data/canaries.json`, which is your answer key and is gitignored.

```sh
curl -s localhost:4321/llms.txt          # what an agent is supposed to read
curl -s localhost:4321/notes/log-retention   # an arm page, with its code
curl -s localhost:4321/x/results.md      # who has found what so far
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

- [docs/design.md](docs/design.md) — the arms, the controls, the contamination risks, what would falsify it
- [docs/probe-protocol.md](docs/probe-protocol.md) — the seven questions, verbatim, and how to score them
- [docs/results.md](docs/results.md) — the permanent record, empty until the first cycle
- [docs/how-it-works.md](docs/how-it-works.md) — server mechanics

## Two rules that matter

**Never link this repo from the live site.** `arms.json` names every hidden path. One footer link would hand an agent the whole map.

**Never put a canary in the repo.** The codes live in `data/canaries.json` on the server and nowhere else. That is the only reason a correct answer proves anything.

## Deploy

Any Node host. Start command `node server.js`, listens on `PORT`. Set `SITE_URL` to the public hostname so the sitemap and canonical links are absolute.

On Railway: `railway up`.

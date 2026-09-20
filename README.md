# md-first

An experiment: can `.md` files replace `.html` files as the pages humans read?

One HTML page at `/`. Every other URL returns a markdown file read straight off disk, labelled `text/markdown` for agents and `text/plain` for browsers, with the same bytes either way. Wired into `robots.txt`, `llms.txt`, `llms-full.txt` and `sitemap.xml`.

No dependencies. No build step. About 200 lines of Node.

## Run

```sh
node server.js
# http://localhost:4321
```

Node 20+. Nothing to install.

```sh
curl -sI localhost:4321/thesis | grep -i content-type
# content-type: text/markdown; charset=utf-8

curl -sI -H 'Accept: text/html' localhost:4321/thesis | grep -i content-type
# content-type: text/plain; charset=utf-8
```

Same body both times. Only the label changes, because browsers download `text/markdown` instead of painting it.

## Layout

```
public/index.html   the one human page
public/robots.txt   open to everything, points at the sitemap
public/llms.txt     hand-written index, every entry a .md URL
content/*.md        every other page
server.js           routing, negotiation, headers, logging
```

Generated at request time: `/sitemap.xml`, `/llms-full.txt`, `/stats.md`.

## Add a page

Drop a `.md` file in `content/`. It is live on the next request. Add it to `public/llms.txt` by hand; the sitemap and full text pick it up on their own.

## Deploy

Any Node host, start command `node server.js`, listens on `PORT`. Set `SITE_URL` to the public hostname so canonical links and the sitemap are absolute.

On Railway: `railway up`.

## The rules

Written out at [/spec](content/spec.md). Ten of them, the important ones being: one HTML page, the bytes never change per reader, frontmatter ships instead of being stripped, no build step.

## What is being tested

Read [/experiment](content/experiment.md) for the hypothesis and what would falsify it. Short version: do agents read a markdown site more completely than an HTML one, does it cost less, and do humans tolerate it.

The honest weak spots are listed in [/thesis](content/thesis.md): no design, browsers refusing `text/markdown`, search engines indexing it inconsistently, no images or forms, no client-side analytics.

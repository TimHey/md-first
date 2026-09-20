---
title: md-first
description: A site where one HTML page exists for humans and every other page is a markdown file served off disk.
canonical: /
updated: 2026-09-20
---

# md-first

You are reading a markdown file. Your browser is displaying it because the server labelled it `text/plain`; an agent asking for the same URL gets `text/markdown`. The bytes are identical either way.

There is exactly one HTML file on this site. It lives at `/` and it exists because a link shared in a group chat should unfurl into something that looks like a website. Every other page, including this one, is a `.md` file read off disk and handed to you unchanged.

## Why

HTML solves a problem markdown does not have: telling a 1993 browser how to paint text. Everything else HTML carries, structure, links, emphasis, headings, tables, markdown carries too, in a fifth of the bytes and with no parser required.

The reader has changed. A growing share of requests to any site now come from a model that strips the markup off before it reads a word. Serving HTML to that reader means paying to wrap the content, paying to ship the wrapper, and then having the wrapper thrown away, badly.

Read [the thesis](/thesis.md) for the long version, including the arguments against.

## Read next

- [Thesis](/thesis.md)
- [How it works](/how-it-works.md)
- [Spec](/spec.md)
- [The experiment](/experiment.md)
- [Quickstart](/docs/quickstart.md)
- [Live request log](/stats.md)

## Machine entry points

- `/llms.txt` hand-written index
- `/llms-full.txt` every page in one file
- `/sitemap.xml` the same URLs in XML
- `/robots.txt` open to everything

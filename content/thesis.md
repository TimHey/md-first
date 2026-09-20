---
title: Thesis
description: Why HTML is the wrong default once most of your readers are models, and the strongest arguments against that claim.
canonical: /thesis
updated: 2026-09-20
---

# Thesis

**Bottom line:** HTML is a rendering instruction set for a reader that increasingly is not doing any rendering. Markdown carries the same semantics at a fraction of the cost and needs no toolchain. For a text site, HTML should be the exception rather than the default.

## The argument

**HTML encodes presentation, not meaning.** A `<div class="prose-lg">` tells a machine nothing. The heading levels, links and lists inside it do, and markdown expresses those directly. Everything else in a modern page, the wrapper divs, the class soup, the inlined framework state, is scaffolding for a painter.

**Models undo the wrapping before they read.** Every retrieval pipeline strips a fetched page back to something markdown-shaped. That conversion is lossy. Nav bars survive it, sidebars survive it, the actual article gets truncated. Serving markdown means the model reads what you wrote instead of a guess at what you wrote.

**The cost is real and one-sided.** A typical documentation page ships 40kb of HTML to carry 6kb of text. The reader pays for the transfer, the parse, and then the stripping. Nobody is better off.

**The toolchain disappears.** No static site generator, no framework, no build step, no hydration, no deploy pipeline beyond copying files. The content is the artifact. Edit a `.md` file, the page changed.

**Humans do fine.** Raw markdown in a browser tab is plain, monospaced and completely readable. Headings look like headings. Links show their target instead of hiding it. It is uglier than a designed page and more honest than most of them.

## The arguments against

Stated plainly, because a thesis that only lists its own evidence is marketing.

**No design.** Real brands need typography, color, images and layout. A markdown page has none of that. This is the strongest objection and it is why `/` is still HTML: the front door earns design, the reference material underneath it usually does not.

**Browsers refuse to render `text/markdown`.** Chrome, Safari and Firefox all treat it as a download. Getting markdown to display in a tab requires labelling it `text/plain`, which is a workaround, not a standard. See [content negotiation](/docs/content-negotiation.md).

**Search engines are not ready.** Google indexes markdown URLs inconsistently and there is no reliable way to control the snippet without `<meta>` tags. A site that lives on organic search traffic should not run this experiment on its money pages.

**No images, no interactivity, no forms.** Markdown links to an image; it cannot art-direct one. Anything interactive needs HTML, and pretending otherwise is how experiments turn into regrets.

**Analytics are harder.** No page to inject a script into means server-side logging only. That is arguably a feature, but it breaks every tool built on a client-side tag.

## What would change my mind

If agent traffic to markdown URLs turns out to convert or cite at the same rate as agent traffic to equivalent HTML pages, the whole thesis collapses into a preference about file formats. That is the measurement described in [the experiment](/experiment.md).

---

[Home](/) · [How it works](/how-it-works.md) · [The experiment](/experiment.md)

// md-first: can an agent find a page that nothing links to?
//
// One HTML page at /. A set of markdown pages that are linked from nowhere,
// each exposed through a different discovery channel (llms.txt, sitemap.xml,
// both, or neither). Every request is logged so we can see which channel an
// agent actually used.
//
// No dependencies. node server.js

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const PORT = process.env.PORT || 4321
const SITE = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '')
const ROOT = __dirname
const CONTENT = path.join(ROOT, 'content')
const PUBLIC = path.join(ROOT, 'public')
const DATA = path.join(ROOT, 'data')
const LOG = path.join(DATA, 'requests.jsonl')
const KEYS = path.join(DATA, 'canaries.json')

const ARMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'arms.json'), 'utf8')).arms
const DISCOVERY = ['/robots.txt', '/llms.txt', '/sitemap.xml', '/llms-full.txt', '/']

// ---------------------------------------------------------------------------
// canaries
//
// Each arm page carries a code that exists only on the running site and in
// data/canaries.json, which is gitignored. The page content in the repo holds
// a {{canary}} placeholder. An agent that reports the right code fetched the
// page; it cannot have read the code off GitHub, because the code was never
// there. That is the whole proof.
// ---------------------------------------------------------------------------

function canaries() {
  let keys = {}
  if (fs.existsSync(KEYS)) keys = JSON.parse(fs.readFileSync(KEYS, 'utf8'))
  let dirty = false
  for (const arm of ARMS) {
    if (!keys[arm.id]) {
      keys[arm.id] = `MDF-${arm.id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
      dirty = true
    }
  }
  if (dirty) fs.writeFileSync(KEYS, JSON.stringify(keys, null, 2) + '\n')
  return keys
}

const CANARY = canaries()

// ---------------------------------------------------------------------------
// generated discovery files
// ---------------------------------------------------------------------------

const inChannel = (c) => ARMS.filter((a) => a.channels.includes(c))

function llmsTxt() {
  const listed = inChannel('llms')
    .map((a) => `- [${a.title}](${a.path}${a.format === 'md' ? '.md' : ''}): ${a.description}`)
    .join('\n')
  return `# md-first

> An experiment in agent discovery. This site has one HTML page, at /, and it links to nothing. Everything else here is a page that no link on this site points at. The only way to reach those pages is a file like this one.

Each page below returns \`text/markdown\` unless the client asks for HTML, and carries a short code near the bottom. Quoting that code back is how a reader proves it opened the page rather than guessed at the contents.

## Pages

${listed}

## Full text

- [Everything above in one file](/llms-full.txt): the pages listed here, concatenated
`
}

function sitemapXml() {
  const entries = [`  <url>\n    <loc>${SITE}/</loc>\n  </url>`]
  for (const a of inChannel('sitemap')) {
    const alt = a.format === 'md' ? `\n    <xhtml:link rel="alternate" type="text/markdown" href="${SITE}${a.path}.md"/>` : ''
    entries.push(`  <url>\n    <loc>${SITE}${a.path}</loc>${alt}\n  </url>`)
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`
}

function llmsFullTxt() {
  const parts = inChannel('llms').map((a) => {
    const body = render(a).replace(/^---\n[\s\S]*?\n---\n/, '').trim()
    return `# ${SITE}${a.path}\n\n${body}`
  })
  return `# md-first: full text\n\nThe pages listed in /llms.txt, concatenated. Pages exposed through other channels are not included.\n\nOne of these pages is HTML and appears below as its source, stylesheet and all. That is not a mistake. It gets the same treatment as its markdown counterparts on purpose, and what it costs to carry is part of what is being measured.\n\n---\n\n${parts.join('\n\n---\n\n')}\n`
}

function render(arm) {
  const raw = fs.readFileSync(path.join(CONTENT, arm.file), 'utf8')
  return raw.replaceAll('{{canary}}', CANARY[arm.id])
}

// ---------------------------------------------------------------------------
// request log
// ---------------------------------------------------------------------------

const AGENTS = [
  ['ChatGPT', /GPTBot|ChatGPT-User|OAI-SearchBot/i],
  ['Claude', /ClaudeBot|Claude-Web|Claude-User|Claude-SearchBot|anthropic/i],
  ['Perplexity', /Perplexity/i],
  ['Gemini', /Google-Extended|Google-CloudVertexBot|GoogleOther/i],
  ['Googlebot', /Googlebot/i],
  ['Bing', /bingbot|BingPreview/i],
  ['Meta', /meta-externalagent|FacebookBot/i],
  ['Bytespider', /Bytespider/i],
  ['Amazon', /Amazonbot/i],
  ['Apple', /Applebot/i],
  ['cli', /curl|wget|HTTPie|python-requests|node-fetch|got\/|axios/i],
]

function classify(ua = '') {
  for (const [name, re] of AGENTS) if (re.test(ua)) return name
  if (/Mozilla\/5\.0/.test(ua) && /Safari|Chrome|Firefox|Gecko/.test(ua)) return 'browser'
  return 'unknown'
}

function log(entry) {
  try {
    fs.appendFileSync(LOG, JSON.stringify(entry) + '\n')
  } catch {}
}

function readLog() {
  if (!fs.existsSync(LOG)) return []
  return fs
    .readFileSync(LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// results
//
// For each arm fetch, look back at what else that same client asked for in the
// hour before. The most recent discovery file it pulled is the likeliest way
// it learned the URL. Not proof, but the only attribution available without
// a referrer, and agents rarely send one.
// ---------------------------------------------------------------------------

const WINDOW_MS = 60 * 60 * 1000

function attribute(hit, rows) {
  const t = Date.parse(hit.at)
  const prior = rows
    .filter(
      (r) =>
        r.who === hit.who &&
        DISCOVERY.includes(r.path) &&
        r.status === 200 &&
        Date.parse(r.at) <= t &&
        t - Date.parse(r.at) < WINDOW_MS,
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  return prior.length ? prior[0].path : 'no discovery file first'
}

function md(v) {
  return String(v).replace(/\|/g, '\\|')
}

function resultsPage() {
  const rows = readLog()
  const armPaths = new Map(ARMS.map((a) => [a.path, a]))
  const since = rows.length ? rows[0].at : 'never'

  const armRows = ARMS.map((a) => {
    const hits = rows.filter((r) => r.arm === a.id && r.status === 200)
    const agents = [...new Set(hits.filter((h) => h.client !== 'cli' && h.client !== 'browser').map((h) => h.client))]
    const channels = a.channels.length ? a.channels.join(' + ') : 'none'
    return `| ${a.id} | \`${a.path}\` | ${a.format} | ${channels} | ${hits.length} | ${agents.length ? agents.join(', ') : '-'} | ${hits.length ? hits[0].at.slice(0, 16).replace('T', ' ') : 'not yet'} |`
  }).join('\n')

  const found = rows
    .filter((r) => r.arm && r.status === 200 && r.client !== 'cli' && r.client !== 'browser')
    .map((r) => `| ${r.arm} | ${r.client} | ${r.at.slice(0, 16).replace('T', ' ')} | \`${attribute(r, rows)}\` |`)
    .join('\n')

  const channelRows = DISCOVERY.map((p) => {
    const hits = rows.filter((r) => r.path === p && r.status === 200)
    const who = [...new Set(hits.map((h) => h.client))]
    return `| \`${p}\` | ${hits.length} | ${who.length ? who.join(', ') : '-'} |`
  }).join('\n')

  const misses = {}
  for (const r of rows) if (r.status === 404) misses[r.path] = (misses[r.path] || 0) + 1
  const missRows = Object.entries(misses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([p, n]) => `| \`${md(p)}\` | ${n} |`)
    .join('\n')

  return `---
title: Results
description: Which arms have been found, by whom, and through which discovery channel.
robots: noindex
---

# Results

${rows.length} requests logged since ${since}. Canary codes are deliberately not shown here; they live in \`data/canaries.json\` on the server.

## Arms

| arm | path | format | listed in | fetches | agents | first fetch |
| --- | --- | --- | --- | ---: | --- | --- |
${armRows}

## Every agent fetch of an arm page

The "came from" column is the last discovery file that client pulled in the hour before, inferred rather than read off a referrer. Because the homepage links to nothing, a row that came from \`/\` means the agent guessed the path instead of reading a listing.

${found ? `| arm | agent | at | came from |\n| --- | --- | --- | --- |\n${found}` : '_No agent has fetched an arm page yet._'}

## Discovery files

| file | fetches | clients |
| --- | ---: | --- |
${channelRows}

## Paths that 404'd

Guessed URLs are free signal about what agents assume exists.

${missRows ? `| path | hits |\n| --- | ---: |\n${missRows}` : "_No request has 404'd yet._"}
`
}

// ---------------------------------------------------------------------------
// server
// ---------------------------------------------------------------------------

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.css': 'text/css; charset=utf-8',
}

// text/markdown is the honest label and every agent handles it. Browsers do
// not: Chrome, Safari and Firefox download it rather than paint it. So a
// client that asks for HTML gets the same bytes labelled text/plain. ?raw
// forces markdown for anyone.
function negotiate(accept = '', raw = false) {
  if (raw) return 'text/markdown; charset=utf-8'
  return /text\/html/.test(accept) ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8'
}

function findArm(pathname) {
  const bare = pathname.replace(/\.(md|html)$/, '').replace(/\/$/, '')
  return ARMS.find((a) => a.path === bare) || null
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, SITE)
  const pathname = decodeURIComponent(url.pathname)
  const ua = req.headers['user-agent'] || ''
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
  const client = classify(ua)
  const accept = req.headers.accept || ''
  const raw = url.searchParams.has('raw')

  const send = (status, type, body, extra = {}, arm = null) => {
    res.writeHead(status, {
      'content-type': type,
      'cache-control': 'public, max-age=60',
      'x-robots-tag': extra['x-robots-tag'] || 'all',
      vary: 'Accept',
      ...extra,
    })
    res.end(body)
    log({
      at: new Date().toISOString(),
      path: pathname,
      status,
      arm,
      client,
      who: crypto.createHash('sha1').update(ip + ua).digest('hex').slice(0, 12),
      ua: ua.slice(0, 250),
      accept: accept.slice(0, 120),
      referer: (req.headers.referer || '').slice(0, 200),
      served: type.split(';')[0],
    })
  }

  // the one human page. it links to nothing.
  if (pathname === '/' || pathname === '/index.html') {
    return send(200, 'text/html; charset=utf-8', fs.readFileSync(path.join(PUBLIC, 'index.html')))
  }

  if (pathname === '/llms.txt') return send(200, 'text/plain; charset=utf-8', llmsTxt())
  if (pathname === '/llms-full.txt') return send(200, 'text/plain; charset=utf-8', llmsFullTxt())
  if (pathname === '/sitemap.xml') return send(200, 'application/xml; charset=utf-8', sitemapXml())

  if (pathname === '/x/results' || pathname === '/x/results.md') {
    return send(200, negotiate(accept, raw), resultsPage(), { 'x-robots-tag': 'noindex, nofollow' })
  }

  const staticFile = path.join(PUBLIC, pathname.replace(/^\/+/, ''))
  if (staticFile.startsWith(PUBLIC) && fs.existsSync(staticFile) && fs.statSync(staticFile).isFile()) {
    return send(200, STATIC_TYPES[path.extname(staticFile)] || 'application/octet-stream', fs.readFileSync(staticFile))
  }

  const arm = findArm(pathname)
  if (arm) {
    const body = render(arm)
    const type = arm.format === 'html' ? 'text/html; charset=utf-8' : negotiate(accept, raw)
    const ext = arm.format === 'md' ? '.md' : '.html'
    return send(
      200,
      type,
      body,
      {
        link: `<${SITE}${arm.path}>; rel="canonical", <${SITE}${arm.path}${ext}>; rel="alternate"; type="${arm.format === 'md' ? 'text/markdown' : 'text/html'}"`,
        'x-md-source': `/${arm.file}`,
      },
      arm.id,
    )
  }

  send(404, negotiate(accept, raw), fs.readFileSync(path.join(CONTENT, '404.md'), 'utf8'))
})

server.listen(PORT, () => {
  console.log(`md-first listening on port ${PORT}, public url ${SITE}`)
  console.log(`${ARMS.length} arms, 1 html page, results at ${SITE}/x/results.md`)
  console.log(`answer key: ${KEYS}`)
})

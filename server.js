// md-first: one HTML page, everything else is markdown.
// No dependencies. node server.js

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const PORT = process.env.PORT || 4321
const SITE = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '')
const ROOT = __dirname
const CONTENT = path.join(ROOT, 'content')
const PUBLIC = path.join(ROOT, 'public')
const LOG = path.join(ROOT, 'data', 'requests.jsonl')

// ---------------------------------------------------------------------------
// content index
// ---------------------------------------------------------------------------

function walk(dir, base = '') {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel))
    else if (entry.name.endsWith('.md')) out.push(rel)
  }
  return out.sort()
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return {}
  const meta = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i === -1) continue
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return meta
}

function index() {
  return walk(CONTENT)
    .filter((f) => f !== '404.md')
    .map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT, file), 'utf8')
      const meta = parseFrontmatter(raw)
      const slug = file.replace(/\.md$/, '').replace(/(^|\/)index$/, '')
      return { file, slug, url: `${SITE}/${slug}`, meta, raw }
    })
}

// ---------------------------------------------------------------------------
// generated files
// ---------------------------------------------------------------------------

function llmsFull() {
  const parts = index().map((p) => `# ${p.url}\n\n${p.raw.replace(/^---\n[\s\S]*?\n---\n/, '')}`)
  return `# md-first: full text\n\nEvery page on this site, concatenated. Source of truth is the .md file at each URL.\n\n---\n\n${parts.join('\n\n---\n\n')}`
}

function sitemap() {
  const urls = index()
    .filter((p) => p.file !== 'index.md')
    .map((p) => `  <url>\n    <loc>${p.url}</loc>\n    <xhtml:link rel="alternate" type="text/markdown" href="${SITE}/${p.file.replace(/\.md$/, '')}.md"/>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  <url>\n    <loc>${SITE}/</loc>\n    <xhtml:link rel="alternate" type="text/markdown" href="${SITE}/index.md"/>\n  </url>\n${urls}\n</urlset>\n`
}

// ---------------------------------------------------------------------------
// request stats (in memory, plus a jsonl trail)
// ---------------------------------------------------------------------------

const AGENTS = [
  ['ChatGPT', /GPTBot|ChatGPT-User|OAI-SearchBot/i],
  ['Claude', /Claude-Web|ClaudeBot|Claude-User|Claude-SearchBot|anthropic/i],
  ['Perplexity', /Perplexity/i],
  ['Google', /Google-Extended|Googlebot|Google-CloudVertexBot/i],
  ['Bing', /bingbot|BingPreview/i],
  ['Meta', /meta-externalagent|FacebookBot/i],
  ['Bytespider', /Bytespider/i],
  ['cli', /curl|wget|HTTPie|python-requests|node-fetch|got|axios/i],
]

function classify(ua = '') {
  for (const [name, re] of AGENTS) if (re.test(ua)) return name
  if (/Mozilla\/5\.0/.test(ua) && /Safari|Chrome|Firefox|Gecko/.test(ua)) return 'browser'
  return 'unknown'
}

const stats = { started: new Date().toISOString(), total: 0, byClient: {}, byPath: {}, byType: {} }

function record(entry) {
  stats.total++
  stats.byClient[entry.client] = (stats.byClient[entry.client] || 0) + 1
  stats.byPath[entry.path] = (stats.byPath[entry.path] || 0) + 1
  stats.byType[entry.served] = (stats.byType[entry.served] || 0) + 1
  try {
    fs.appendFileSync(LOG, JSON.stringify(entry) + '\n')
  } catch {}
}

function table(obj) {
  const rows = Object.entries(obj).sort((a, b) => b[1] - a[1])
  if (!rows.length) return '_no requests yet_'
  return ['| key | hits |', '| --- | ---: |', ...rows.map(([k, v]) => `| \`${k}\` | ${v} |`)].join('\n')
}

function statsPage() {
  return `---
title: Live request log
description: Who is reading this site, and what content type they were handed.
type: generated
---

# Live request log

Counters reset when the server restarts. Started \`${stats.started}\`, **${stats.total}** requests since.

## By client

${table(stats.byClient)}

## By content type served

${table(stats.byType)}

## By path

${table(stats.byPath)}

---

[Home](/) · [The experiment](/experiment) · [How it works](/how-it-works)
`
}

// ---------------------------------------------------------------------------
// content negotiation
// ---------------------------------------------------------------------------

// The bytes never change. Only the label on them does.
//
// text/markdown is the honest type, and every agent, curl and fetch() handles
// it fine. Browsers do not: Chrome, Safari and Firefox all treat text/markdown
// as a download rather than something to paint. So when the caller says it
// prefers HTML -- which in practice means a browser window -- the same markdown
// goes out labelled text/plain so it renders in the tab instead of hitting the
// downloads folder.
//
// ?raw forces text/markdown no matter who is asking.
function negotiate(accept = '', raw = false) {
  if (raw) return 'text/markdown; charset=utf-8'
  return /text\/html/.test(accept) ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8'
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

function resolveContent(pathname) {
  const slug = pathname.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\.md$/, '')
  const candidates = slug ? [`${slug}.md`, `${slug}/index.md`] : ['index.md']
  for (const c of candidates) {
    const full = path.join(CONTENT, c)
    if (full.startsWith(CONTENT) && fs.existsSync(full)) return { file: c, full }
  }
  return null
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, SITE)
  const pathname = decodeURIComponent(url.pathname)
  const ua = req.headers['user-agent'] || ''
  const client = classify(ua)
  const accept = req.headers.accept || ''
  const raw = url.searchParams.has('raw')

  const send = (status, type, body, extra = {}) => {
    res.writeHead(status, {
      'content-type': type,
      'cache-control': 'public, max-age=60',
      'x-robots-tag': 'all',
      vary: 'Accept',
      ...extra,
    })
    res.end(body)
    record({
      at: new Date().toISOString(),
      path: pathname,
      status,
      client,
      ua: ua.slice(0, 200),
      accept: accept.slice(0, 120),
      served: type.split(';')[0],
    })
  }

  // the one human page
  if (pathname === '/' || pathname === '/index.html') {
    return send(200, 'text/html; charset=utf-8', fs.readFileSync(path.join(PUBLIC, 'index.html')), {
      link: `<${SITE}/index.md>; rel="alternate"; type="text/markdown"`,
    })
  }

  // generated
  if (pathname === '/llms-full.txt') return send(200, 'text/plain; charset=utf-8', llmsFull())
  if (pathname === '/sitemap.xml') return send(200, 'application/xml; charset=utf-8', sitemap())
  if (pathname === '/stats' || pathname === '/stats.md') {
    return send(200, negotiate(accept, raw), statsPage(), {
      link: `<${SITE}/stats.md>; rel="canonical"`,
    })
  }

  // static files in public/ (robots.txt, llms.txt, favicon)
  const staticFile = path.join(PUBLIC, pathname.replace(/^\/+/, ''))
  if (staticFile.startsWith(PUBLIC) && fs.existsSync(staticFile) && fs.statSync(staticFile).isFile()) {
    const type = STATIC_TYPES[path.extname(staticFile)] || 'application/octet-stream'
    return send(200, type, fs.readFileSync(staticFile))
  }

  // markdown
  const hit = resolveContent(pathname)
  if (hit) {
    const body = fs.readFileSync(hit.full, 'utf8')
    const canonical = `${SITE}/${hit.file.replace(/\.md$/, '').replace(/(^|\/)index$/, '')}`
    return send(200, negotiate(accept, raw), body, {
      link: `<${canonical}>; rel="canonical", <${canonical}.md>; rel="alternate"; type="text/markdown"`,
      'x-md-source': `/${hit.file}`,
    })
  }

  const notFound = fs.readFileSync(path.join(CONTENT, '404.md'), 'utf8')
  send(404, negotiate(accept, raw), notFound)
})

server.listen(PORT, () => {
  console.log(`md-first listening on ${SITE}`)
  console.log(`${index().length} markdown pages, 1 html page`)
})

# Content model

All copy, links, media, section order and colours live in this folder. The site code never
contains content, so a CMS only has to write these JSON files (or serve the same shapes from an API).

```
content/
  site.json            global: meta, theme colours, brand, contact, header, footer, section order
  sections/<id>.json   one file per section; "type" picks the template
```

## How a page is built

1. `assets/js/app.js` loads `site.json`, applies `theme.colors` as CSS variables, then loads
   every file listed in `site.json → sections`, in that order.
2. Each section's `type` maps to a template in `assets/js/sections/<type>.js`
   (see `sections/registry.js`). A template is a pure function `render(data, ctx) → HTML`,
   plus an optional `mount(el, data, ctx)` for behaviour.
3. Scene numbers ("SC 01, SC 02…") are assigned from the order, so reordering renumbers them.

Because the templates are pure functions with no browser dependency, the CMS can later run the
same code at publish time (Node) and write static HTML, which is better for SEO and first paint.

## Text formatting (any text field)

| Write | Renders as |
|---|---|
| `**bold**` | **bold** |
| `[חסר]` or `[חסר: what is missing]` | a highlighted "missing content" marker |
| a line break (`\n`) | `<br>` |

HTML is escaped, so editors cannot break the page. Hebrew/English mixing is handled by the browser.

## site.json

| Field | Notes |
|---|---|
| `meta.title`, `meta.description`, `meta.ogImage` | Also hard-coded in `index.html` for crawlers; the CMS should write both. |
| `theme.colors` | `set` (background), `ink` (outlines), `chalk` (text), `amber` (accent), `smoke` (meta text). All tints are derived from these. Keep `ink` on `amber` for text: white on amber fails contrast. |
| `brand` | `name`, `suffix`, `mark` (logo SVG path), `homeLabel` (screen-reader label). |
| `contact.whatsappNumber` | International, digits only, e.g. `972501234567`. Empty = WhatsApp links fall back to the form. |
| `contact.whatsappGreeting` | Prefilled message; the brief form appends its answers to it. |
| `header.nav[]`, `header.cta` | `{ label, href }` |
| `sections[]` | File names in `sections/` (without `.json`), in page order. Remove an id to hide a section. |
| `footer.links[]` | `{ label, href }`, `{ label, whatsapp: true }`, or `{ label }` for plain text. |

## Section types

Every section file has `type`. Most also have `id` (the `#anchor`) and `slate` (the small
label next to the scene number; sections without one are not numbered).

| type | Main fields |
|---|---|
| `hero` | `kicker`, `teaser` (shown before scrolling), `title[]` (one entry per line), `accentLine` (1-based), `lede`, `who`, `ctaPrimary`, `ctaSecondary`, `ghostWord`, `hud{ slate ("{sc}" = scene number), camera, exposure, focusLabel, stamp }` |
| `reel` | `aspect` ("2.39:1"), `clapper`, `caption`, `video{ mp4, webm, poster }`, `missing` (shown while there is no video) |
| `doors` | `title` (screen-reader heading), `items[]{ title, text, formats, href }` |
| `band` | `label`, `ariaLabel`, `items[]` (names; Latin names render LTR automatically) |
| `clips` | `title`, `aside`, `missingVideo`, `items[]{ title, artist, role, aspect, video (YouTube or Vimeo URL), poster, views, cast?, quote?{ text, by, lang } }`, `more`, `quotes`, `cta{ label, href, prefill }` |
| `films` | `title`, `intro`, `english{ lead, text, note }`, `items[]{ year, title, titleEn?, role, meta[] }`. Deliberately has no accent colour. |
| `ads` | `title`, `text`, `credits`, `logos`, `deliverables{ title, items[], note }` |
| `manifesto` | `text`, `accentFrom` (first word shown in the accent colour), `by` |
| `process` | `title`, `trackLabel`, `prevLabel`, `nextLabel`, `steps[]{ title, text, time, highlight? }` |
| `about` | `title`, `lede`, `paragraphs[]`, `note`, `facts[]`, `links[]`, `photo{ src, alt, aspect, missing }` |
| `faq` | `title`, `items[]{ q, a }` |
| `contact` | `title`, `text`, `direct`, `face{ src, alt, missing }`, `form{ stepLabel ("{n}", "{total}"), prev, next, submit, steps[], done{ title, text } }` |

### Brief form fields (`contact.form.steps[].fields[]`)

`kind`: `choice` (radio chips), `checks` (checkbox group), `check` (single checkbox), `select`,
`text`, `textarea`, `url`, `tel`, `email`. Common keys: `name`, `label`, `summary` (label used in
the WhatsApp message), `required`, `placeholder`, `options[]`, `autocomplete`, `half` (two
consecutive `half` fields share a row). Each step has `legend`, `error`, optional `note`.

A link anywhere can preselect answers: `cta.prefill: { "type": "קליפ" }`.

## Adding a new section type

1. Create `assets/js/sections/<type>.js` exporting `render(data, { site, sc })` and, if needed, `mount(el, data, ctx)`.
2. Register it in `assets/js/sections/registry.js`.
3. Add its styles to `assets/css/style.css`, using the colour variables only.
4. Add `content/sections/<id>.json` with `"type": "<type>"` and list the id in `site.json → sections`.

## Running locally

The page loads JSON with `fetch`, so it must be served over HTTP (opening `index.html` from disk
won't work):

```bash
python3 -m http.server 8913
```

# Content model

All copy, links, media, section order and colours live in this folder. The site code never
contains content, so a CMS only has to write these JSON files (or serve the same shapes from an API).

```
content/
  site.json            global: meta, theme colours, brand, contact, header, footer, section order
  sections/<id>.json   one file per section; "type" picks the template
```

## Edited in afias studio

The client edits the site in afias studio, which now holds the content. The files here are the
offline copy (and the shapes the studio's document maps to); the deployed `content/` is
written by the build from the studio:

1. "פרסום" in the studio sends a `repository_dispatch` (`afias-publish`) to this repo.
2. `.github/workflows/deploy.yml` builds with `CONTENT_SOURCE=http`: `.github/scripts/content.mjs`
   fetches the published document, `_afias/content.js` maps it to these files, and every section
   is rendered once as a check. If the studio can't be reached the build fails and the live site
   stays as it was. The run reports building / ready / failed back to the studio.
3. The page itself is unchanged: `app.js` still loads `content/*.json` from the site.

The deployed page also carries the studio's visit counter (`kit/v1/beacon.js`: page views and
WhatsApp / phone / email clicks, no cookies). The build adds it only when `STUDIO_URL` and
`SITE_SLUG` are set, so local builds count nothing. The brief's submit button has
`data-cta="whatsapp"` because it opens WhatsApp from a button, not a `wa.me` link.

| File | Role |
|---|---|
| `afias/blueprint.json` | What the editor exposes: fields, labels, limits, design-only fields. Paste changes into the studio (ניהול → סכמה ותוכן). |
| `_afias/content.js` | Studio document ⇄ these files. The one place their shapes meet. |
| `_afias/preview.html` | The editor's live preview: renders drafts with these templates (noindex). |

`npm run build` alone uses these local files. Against the studio:

```bash
CONTENT_SOURCE=http CONTENT_URL=https://studio.afias.dev/api/v1/sites/goatlib STUDIO_URL=https://studio.afias.dev npm run build
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
| `meta.title`, `meta.description`, `meta.ogTitle`, `meta.ogDescription`, `meta.ogImage` | Repeated in `index.html` for crawlers and link previews; the build writes them there (with `theme.colors.set` as the theme colour). |
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

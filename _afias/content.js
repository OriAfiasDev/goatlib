// afias studio document ⇄ this site's content files.
//
// The studio keeps the site as one document: { theme, settings, pages: [{ id, sections }] }.
// The site reads content/site.json plus one content/sections/<id>.json per section. The build
// (.github/scripts/build.mjs) and the editor's live preview (_afias/preview.js) both go through
// fromStudio(), so the editor shows exactly what gets published.
//
// The shapes match, except:
//   - site.json is split: theme → doc.theme, the section order → the page's section list,
//     everything else → doc.settings. A hidden section is left out of the order.
//   - a section's "id" (its #anchor) is data.anchor, the key the studio's link picker reads.
//     Section files are named after the studio's section ids.
//   - media are studio image/video values ({ src, alt, width, height }) so the client can upload
//     them: the reel video and poster, clip posters, the about photo, the contact face. What the
//     site keeps beside a file sits next to it: about.photoAspect, about.photoMissing and
//     contact.faceMissing (the "[חסר…]" text shown until the file arrives).
//   - list items carry the studio's _id: kept for the preview's field paths, not written to files.
//   - { "$missing": "…" } from the studio becomes this site's own marker, "[חסר: …]".
//   - a button with no label, and a clip quote with no text, are left out (the templates show
//     whatever is present, so an emptied field would render an empty button).

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const srcOf = (v) => (isObject(v) && typeof v.src === 'string' ? v.src : '');
const pickImage = ({ src = '', alt = '', width, height } = {}) => ({ src, alt, ...(width && height ? { width, height } : {}) });
const isWebm = (src) => /\.webm([?#]|$)/i.test(src);
const labelled = (key, link) => (isObject(link) && link.label ? { [key]: link } : {});

/* ---------- site → studio (registering the site's current content) ---------- */

const toSection = {
  reel: ({ video = {}, ...d }) => ({ ...d, video: { src: video.mp4 || video.webm || '' }, poster: { src: video.poster || '' } }),
  clips: (d) => ({ ...d, items: (d.items || []).map((it) => ({ ...it, poster: { src: it.poster || '' } })) }),
  about: ({ photo = {}, ...d }) => ({ ...d, photo: pickImage(photo), photoAspect: photo.aspect, photoMissing: photo.missing }),
  contact: ({ face = {}, ...d }) => ({ ...d, face: pickImage(face), faceMissing: face.missing }),
};

/**
 * @param {object} site   content/site.json
 * @param {Record<string, object>} files   every content/sections/<id>.json, by id
 */
export function toStudio(site, files) {
  const { theme = {}, sections: order = [], ...settings } = site;
  const ids = [...order.filter((id) => files[id]), ...Object.keys(files).filter((id) => !order.includes(id))];
  return {
    theme,
    settings,
    pages: [{
      id: 'home',
      sections: ids.map((id) => {
        const { type, id: anchor, ...rest } = files[id];
        const data = (toSection[type] || ((d) => d))(rest);
        return { id, type, ...(order.includes(id) ? {} : { hidden: true }), data: anchor === undefined ? data : { anchor, ...data } };
      }),
    }],
  };
}

/* ---------- studio → site ---------- */

const fromSection = {
  hero: ({ ctaPrimary, ctaSecondary, ...d }) => ({ ...d, ...labelled('ctaPrimary', ctaPrimary), ...labelled('ctaSecondary', ctaSecondary) }),
  reel: ({ video, poster, ...d }) => {
    const src = srcOf(video);
    return { ...d, video: { mp4: isWebm(src) ? '' : src, webm: isWebm(src) ? src : '', poster: srcOf(poster) } };
  },
  clips: ({ cta, ...d }) => ({
    ...d,
    items: (d.items || []).map(({ poster, quote, ...it }) => ({ ...it, poster: srcOf(poster), ...(quote?.text ? { quote } : {}) })),
    ...labelled('cta', cta),
  }),
  about: ({ photo, photoAspect, photoMissing, ...d }) => ({ ...d, photo: { ...pickImage(isObject(photo) ? photo : {}), aspect: photoAspect, missing: photoMissing } }),
  contact: ({ face, faceMissing, form, ...d }) => ({
    ...d,
    face: { ...pickImage(isObject(face) ? face : {}), missing: faceMissing },
    // a brief field added in the editor has no name yet: without one its answer would never
    // reach the WhatsApp message
    ...(form ? { form: { ...form, steps: (form.steps || []).map((s) => ({ ...s, fields: (s.fields || []).map((f) => ({ ...f, name: f.name || f._id })) })) } } : {}),
  }),
};

// The studio's missing-content marker → the site's "[חסר: …]" text (rendered as a highlight).
function markers(v) {
  if (Array.isArray(v)) return v.map(markers);
  if (!isObject(v)) return v;
  if (typeof v.$missing === 'string' && Object.keys(v).length === 1) return v.$missing ? `[חסר: ${v.$missing}]` : '[חסר]';
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, markers(x)]));
}

function stripIds(v) {
  if (Array.isArray(v)) return v.map(stripIds);
  if (!isObject(v)) return v;
  return Object.fromEntries(Object.entries(v).filter(([k]) => k !== '_id').map(([k, x]) => [k, stripIds(x)]));
}

/**
 * The studio's document as this site's content: site.json and the visible sections, in order.
 * @param {object} doc   the studio document (published, or a draft in the preview)
 * @param {{ pageId?: string, ids?: boolean }} [opts]   ids: keep list items' _id (preview)
 * @returns {{ site: object, sections: { id: string, data: object }[] }}
 */
export function fromStudio(doc, { pageId = 'home', ids = false } = {}) {
  const clean = ids ? (v) => v : stripIds;
  const page = (doc.pages || []).find((p) => p.id === pageId) || { sections: [] };
  const visible = (page.sections || []).filter((s) => !s.hidden);
  const { header, ...settings } = markers(doc.settings || {});

  const site = clean({
    ...settings,
    theme: doc.theme || {},
    ...(header ? { header: (({ cta, ...h }) => ({ ...h, ...labelled('cta', cta) }))(header) } : {}),
    sections: visible.map((s) => s.id),
  });
  const sections = visible.map((s) => {
    const { anchor, ...data } = markers(s.data || {});
    const shaped = (fromSection[s.type] || ((d) => d))(data);
    return { id: s.id, data: clean({ type: s.type, ...(anchor === undefined ? {} : { id: anchor }), ...shaped }) };
  });
  return { site, sections };
}

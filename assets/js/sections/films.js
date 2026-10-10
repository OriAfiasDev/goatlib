// Restrained by design: no amber anywhere in this section.
import { af, esc, inline, key, slate, afText } from '../core/format.js';

export function render(d, ctx) {
  const { sc } = ctx;
  const en = d.english;
  const credits = (d.items || [])
    .map((f, i) => {
      const p = `items.${key(f, i)}`;
      return `
      <li class="credit">
        <p class="credit__year" dir="ltr"${af(ctx, `${p}.year`, f.year)}>${esc(f.year)}</p>
        <h3 class="credit__title">${afText(ctx, `${p}.title`, f.title, esc(f.title))}${f.titleEn ? ` <span lang="en" dir="ltr"${af(ctx, `${p}.titleEn`, f.titleEn)}>${esc(f.titleEn)}</span>` : ''}</h3>
        <p class="credit__role"${af(ctx, `${p}.role`, f.role)}>${inline(f.role)}</p>
        ${(f.meta || []).map((m, j) => `<p class="credit__meta"${af(ctx, `${p}.meta.${j}`, m)}>${inline(m)}</p>`).join('')}
      </li>`;
    })
    .join('');

  return `
<section class="films" id="${esc(d.id || 'films')}" aria-labelledby="films-title">
  <div class="wrap films__grid">
    <header class="films__head">
      ${slate(d.slate, sc, 'quiet', ctx)}
      <h2 id="films-title" class="h-display"${af(ctx, 'title', d.title)}>${esc(d.title)}</h2>
      <p${af(ctx, 'intro', d.intro)}>${inline(d.intro)}</p>
      ${en ? `<div class="films__en">
        <p lang="en" dir="ltr"><strong${af(ctx, 'english.lead', en.lead)}>${esc(en.lead)}</strong> ${afText(ctx, 'english.text', en.text, esc(en.text))}</p>
        ${en.note ? `<p${af(ctx, 'english.note', en.note)}>${inline(en.note)}</p>` : ''}
      </div>` : ''}
    </header>
    <ol class="credits">${credits}</ol>
  </div>
</section>`;
}

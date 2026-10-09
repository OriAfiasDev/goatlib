import { esc, inline, isMissing, parseVideo, ratio, slate } from '../core/format.js';
import { track } from '../core/analytics.js';

const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function thumb(it, v) {
  if (it.poster) return `<img class="frame__media" src="${esc(it.poster)}" alt="" loading="lazy">`;
  if (v?.provider === 'youtube') {
    // maxres when it exists; mount() falls back to hqdefault
    return `<img class="frame__media" src="https://i.ytimg.com/vi/${esc(v.id)}/maxresdefault.jpg" alt="" loading="lazy" data-yt="${esc(v.id)}">`;
  }
  return '';
}

function frame(it, missingText) {
  const v = parseVideo(it.video);
  const name = isMissing(it.title) ? it.artist : `${it.title}, ${it.artist}`;
  const button = v
    ? `<button class="frame__play" type="button" data-provider="${v.provider}" data-id="${esc(v.id)}" aria-label="${esc(`לנגן: ${name}`)}">
          ${thumb(it, v)}
          <span class="frame__icon">${PLAY}</span>
        </button>`
    : `<button class="frame__play" type="button" aria-label="${esc(name)}" disabled>${inline(missingText)}</button>`;
  return `
      <div class="frame${v ? ' frame--video' : ''}" style="--ar: ${ratio(it.aspect)}">
        ${button}
        <span class="frame__ar" dir="ltr">${esc(it.aspect)}</span>
        ${it.views ? `<span class="frame__tc" dir="ltr">${inline(it.views)}</span>` : ''}
      </div>`;
}

function item(it, missingText) {
  const q = it.quote;
  return `
    <article class="work__item">
      ${frame(it, missingText)}
      <div class="work__meta">
        <h3 class="work__title">${inline(it.title)}</h3>
        <p class="work__artist">${esc(it.artist)}</p>
        <p class="work__role">${esc(it.role)}</p>
        ${it.cast ? `<p class="work__cast">${inline(it.cast)}</p>` : ''}
      </div>
      ${q ? `<blockquote class="work__quote"${q.lang === 'en' ? ' lang="en" dir="ltr"' : ''}><p>${esc(q.text)}</p><footer>${esc(q.by)}</footer></blockquote>` : ''}
    </article>`;
}

export function render(d, { sc }) {
  // never the same formula twice: items alternate between two offset columns
  const items = d.items || [];
  const col = (parity) => items.filter((_, i) => i % 2 === parity).map((it) => item(it, d.missingVideo)).join('');
  const cta = d.cta;
  return `
<section class="clips" id="${esc(d.id || 'clips')}" aria-labelledby="clips-title">
  <div class="wrap">
    <header class="section-head section-head--split">
      <div>
        ${slate(d.slate, sc)}
        <h2 id="clips-title" class="h-display">${esc(d.title)}</h2>
      </div>
      <p class="section-head__aside">${inline(d.aside)}</p>
    </header>
    <div class="work">
      <div class="work__col work__col--start">${col(0)}</div>
      <div class="work__col work__col--end">${col(1)}</div>
    </div>
    <div class="clips__foot">
      ${d.more ? `<p class="clips__more">${inline(d.more)}</p>` : ''}
      ${d.quotes ? `<p class="clips__quotes">${inline(d.quotes)}</p>` : ''}
      ${cta ? `<a class="link-arrow" href="${esc(cta.href)}"${cta.prefill ? ` data-prefill="${esc(JSON.stringify(cta.prefill))}"` : ''}>${esc(cta.label)}</a>` : ''}
    </div>
  </div>
  <dialog class="player" aria-label="נגן וידאו">
    <button class="player__close" type="button" aria-label="סגירה">${CLOSE}</button>
    <div class="player__screen"></div>
  </dialog>
</section>`;
}

// thumbnails stay plain images; the player (and YouTube's scripts) load only on click,
// in a 16:9 dialog so a 9:16 frame doesn't letterbox the clip
export function mount(el) {
  el.querySelectorAll('img[data-yt]').forEach((img) => {
    const fallback = () => {
      if (!img.src.includes('hqdefault')) img.src = `https://i.ytimg.com/vi/${img.dataset.yt}/hqdefault.jpg`;
    };
    img.addEventListener('error', fallback);
    // a missing maxres is served as a 120×90 placeholder, not a 404
    img.addEventListener('load', () => img.naturalWidth <= 120 && fallback());
  });

  const dialog = el.querySelector('.player');
  const screen = dialog.querySelector('.player__screen');
  let opener = null;
  const close = () => dialog.open && dialog.close();

  dialog.addEventListener('close', () => {
    screen.replaceChildren();
    opener?.focus();
  });
  dialog.querySelector('.player__close').addEventListener('click', close);
  dialog.addEventListener('click', (e) => e.target === dialog && close());

  el.querySelectorAll('.frame__play[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { provider, id } = btn.dataset;
      const iframe = document.createElement('iframe');
      iframe.src = provider === 'vimeo'
        ? `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`
        : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      iframe.title = btn.getAttribute('aria-label');
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      screen.replaceChildren(iframe);
      opener = btn;
      dialog.showModal();
      track('video_play', { provider, video: id });
    });
  });
}

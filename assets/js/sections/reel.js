import { af, esc, inline, ratio, afText } from '../core/format.js';

export function render(d, ctx) {
  const v = d.video || {};
  const hasVideo = v.mp4 || v.webm;
  const media = hasVideo
    ? `<video class="frame__media" muted loop playsinline preload="none"${v.poster ? ` poster="${esc(v.poster)}"` : ''} data-reel>` +
      (v.webm ? `<source src="${esc(v.webm)}" type="video/webm">` : '') +
      (v.mp4 ? `<source src="${esc(v.mp4)}" type="video/mp4">` : '') +
      `</video>`
    : `<div class="frame__missing"><span class="frame__slate" dir="ltr"${af(ctx, 'clapper', d.clapper)}>${esc(d.clapper)}</span>${afText(ctx, 'missing', d.missing, inline(d.missing))}</div>`;

  return `
<section class="reel" id="${esc(d.id || 'reel')}" aria-label="${esc(d.caption)}">
  <div class="wrap">
    <figure class="reel__figure">
      <div class="frame frame--scope" style="--ar: ${ratio(d.aspect)}"${af(ctx, 'video', null)}>
        ${media}
        <span class="frame__ar" dir="ltr"${af(ctx, 'aspect', null)}>${esc(d.aspect)}</span>
        <span class="frame__tc" dir="ltr" data-timecode>00:00:00:00</span>
      </div>
      <figcaption class="reel__cap"${af(ctx, 'caption', d.caption)}>${esc(d.caption)}</figcaption>
    </figure>
  </div>
</section>`;
}

// muted loop that only plays on screen; respects Save-Data and reduced motion
export function mount(el) {
  const video = el.querySelector('[data-reel]');
  if (!video) return;
  const saveData = navigator.connection && navigator.connection.saveData;
  const still = saveData || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        video.preload = 'auto';
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, { threshold: 0.25 }).observe(video);
  }
  const tc = el.querySelector('[data-timecode]');
  const pad = (n) => String(Math.floor(n)).padStart(2, '0');
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    tc.textContent = `00:${pad(t / 60)}:${pad(t % 60)}:${pad((t % 1) * 25)}`;
  });
}

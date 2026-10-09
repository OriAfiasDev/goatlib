// Hero: a pinned stage where the goat charges the lens and the glass gives way.
// The markup below is also the finished, static hero (no JS / reduced motion).
import { esc, inline } from '../core/format.js';
// static import: the sequence must take over before the first paint, or the
// finished shot would flash on screen for a frame
import { heroSequence } from '../fx/hero-sequence.js';

export function render(d, { site, sc }) {
  const hud = d.hud || {};
  const fill = (s = '') => s.replace('{sc}', sc);
  const lines = (d.title || [])
    .map((t, i) => `<span class="hero__line${i + 1 === d.accentLine ? ' hero__line--accent' : ''}">${esc(t)}</span>`)
    .join(' ');

  return `
<section class="hero" id="${esc(d.id || 'top')}" aria-labelledby="hero-title" data-hero>
  <div class="hero__stage">
    <div class="hero__cam">
      <div class="hero__set" aria-hidden="true">
        <div class="hero__light"></div>
        <div class="hero__flood"></div>
        <p class="hero__ghost" dir="ltr">${esc(d.ghostWord || site.brand?.name)}</p>
      </div>
      <div class="hero__charger" aria-hidden="true">
        <div class="hero__goat-glow"></div>
        <img src="${esc(site.brand?.mark)}" alt="" width="253" height="306">
      </div>
      <div class="hero__goat" aria-hidden="true">
        <div class="hero__goat-glow"></div>
        <img src="${esc(site.brand?.mark)}" alt="" width="253" height="306" fetchpriority="high">
      </div>
      <div class="hero__copy">
        <p class="slate hero__kicker"><span dir="ltr">${esc(sc)}</span> ${esc(d.kicker)}</p>
        <h1 class="hero__title" id="hero-title">${lines}</h1>
        <div class="hero__side">
          <p class="hero__lede">${inline(d.lede)}</p>
          ${d.who ? `<p class="hero__who">${inline(d.who)}</p>` : ''}
          <div class="hero__actions">
            ${d.ctaPrimary ? `<a class="btn" href="${esc(d.ctaPrimary.href)}">${esc(d.ctaPrimary.label)}</a>` : ''}
            ${d.ctaSecondary ? `<a class="link-arrow" href="${esc(d.ctaSecondary.href)}">${esc(d.ctaSecondary.label)}</a>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="hero__glass" aria-hidden="true"></div>
    <svg class="hero__cracks" aria-hidden="true" focusable="false"></svg>
    <div class="hero__shards" aria-hidden="true"></div>
    <canvas class="hero__fx" aria-hidden="true"></canvas>

    <div class="hero__hud" aria-hidden="true" dir="ltr">
      <i class="hud__corner hud__corner--tl"></i><i class="hud__corner hud__corner--tr"></i>
      <i class="hud__corner hud__corner--bl"></i><i class="hud__corner hud__corner--br"></i>
      <p class="hud__tl"><span class="hud__rec">REC</span> ${esc(fill(hud.slate))}</p>
      <p class="hud__tr">${esc(hud.camera)}</p>
      <p class="hud__bl">TC <span data-tc>00:00:00:00</span></p>
      <p class="hud__br"><span>${esc(hud.focusLabel || 'FOCUS')} <b data-focus>2.4</b> M</span><span class="hud__exp">${esc(hud.exposure)}</span></p>
      <div class="hud__af" data-af><i></i><i></i><i></i><i></i><span>AF</span></div>
      <p class="hud__stamp" data-stamp>${esc(hud.stamp)}</p>
    </div>

    <p class="hero__teaser" aria-hidden="true">${esc(d.teaser)}<span class="hero__cue"></span></p>
    <div class="hero__bars" aria-hidden="true"><i></i><i></i></div>
    <div class="hero__flash" aria-hidden="true"></div>
  </div>
</section>`;
}

export function mount(el) {
  heroSequence(el);
}

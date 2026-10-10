// "How it works" as a strip of film: each step is a frame, and scrolling down
// pulls the strip sideways through a pinned stage. Without JS or with reduced
// motion it is a plain horizontal scroller with prev/next buttons.
import { af, esc, inline, key, slate } from '../core/format.js';

export function render(d, ctx) {
  const { sc } = ctx;
  const steps = d.steps || [];
  const frames = steps
    .map((s, i) => {
      const n = String(i + 1).padStart(2, '0');
      const p = `steps.${key(s, i)}`;
      return `
        <li class="film__frame${s.highlight ? ' film__frame--hot' : ''}">
          <div class="film__pic">
            <p class="step__tc" dir="ltr">TC ${n}</p>
            <h3 class="step__title"${af(ctx, `${p}.title`, s.title)}>${esc(s.title)}</h3>
            <p class="step__text"${af(ctx, `${p}.text`, s.text)}>${inline(s.text)}</p>
            ${s.time ? `<p class="step__time"${af(ctx, `${p}.time`, s.time)}>${inline(s.time)}</p>` : ''}
          </div>
          <span class="film__edge" dir="ltr" aria-hidden="true">GOATLIB 35 ▸ ${n}${i % 2 ? '' : 'A'}</span>
        </li>`;
    })
    .join('');

  return `
<section class="process" id="${esc(d.id || 'process')}" aria-labelledby="process-title" data-process>
  <div class="process__stage">
    <div class="wrap">
      <header class="section-head section-head--split process__head">
        <div>
          ${slate(d.slate, sc, '', ctx)}
          <h2 id="process-title" class="h-display"${af(ctx, 'title', d.title)}>${esc(d.title)}</h2>
        </div>
        <div class="process__nav">
          <button class="icon-btn" type="button" data-scroll="prev" aria-label="${esc(d.prevLabel)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
          <button class="icon-btn" type="button" data-scroll="next" aria-label="${esc(d.nextLabel)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
        </div>
      </header>
    </div>
    <div class="process__track" tabindex="0" role="region" aria-label="${esc(d.trackLabel)}" data-track>
      <ol class="film" data-film>${frames}</ol>
    </div>
  </div>
</section>`;
}

export function mount(el) {
  const track = el.querySelector('[data-track]');
  const film = el.querySelector('[data-film]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rtl = getComputedStyle(track).direction === 'rtl';

  // fallback mode: native horizontal scroll + buttons
  el.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const frame = film.querySelector('.film__frame');
      const w = frame ? frame.getBoundingClientRect().width + 14 : 320;
      const sign = btn.dataset.scroll === 'next' ? 1 : -1;
      track.scrollBy({ left: sign * (rtl ? -1 : 1) * w, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  if (reduce) return;

  // pinned mode: the section is as tall as the strip is long
  el.classList.add('process--pinned');
  let travel = 0, current = 0, target = 0, running = false, inView = false;

  const layout = () => {
    // the track keeps a gutter on both sides, so the last frame stops clear of the edge
    const cs = getComputedStyle(track);
    const inner = track.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    travel = Math.max(0, film.scrollWidth - inner);
    el.style.height = `calc(100svh + ${travel}px)`;
  };
  const measure = () => {
    target = travel ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / travel)) : 0;
  };
  const paint = () => {
    // the strip leans a little with speed, like film running through a gate
    const lean = Math.max(-3, Math.min(3, (target - current) * 120));
    film.style.transform = `translate3d(${((rtl ? 1 : -1) * current * travel).toFixed(1)}px, 0, 0) skewX(${lean.toFixed(2)}deg)`;
  };
  const tick = () => {
    measure();
    current += (target - current) * 0.18;
    if (Math.abs(target - current) < 0.0002) current = target;
    paint();
    if (inView) requestAnimationFrame(tick);
    else running = false;
  };

  layout();
  measure();
  current = target;
  paint();
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView && !running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }).observe(el);
  new ResizeObserver(() => {
    layout();
    measure();
    paint();
  }).observe(track);
}

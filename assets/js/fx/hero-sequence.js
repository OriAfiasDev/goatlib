// The hero, as a shot list driven by the scrollbar:
//   A. approach  the goat charges the lens out of the dark; letterbox tightens, AF locks
//   B. impact    horns hit the glass: cracks and a flash
//   C. shatter   the glass blows toward the viewer, sparks, the goat passes the camera
//   D. title     the headline slams in, line by line, under an amber flood
//   E. settle    the goat drops back in (one camera jolt on touch-down), the copy and CTA land, "TAKE 1 · PRINT"
// Everything is a pure function of scroll progress, so scrubbing back rewinds it exactly.
// Only transform / opacity are animated on DOM nodes; sparks and dust live on one canvas.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const inCubic = (t) => t * t * t;
const outCubic = (t) => 1 - (1 - t) ** 3;
const outExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
const outBack = (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;
const spike = (p, at, width) => clamp(1 - Math.abs(p - at) / width);
function bounce(t) {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// shot list, as fractions of the pinned scroll distance
const T = {
  approach: [0.02, 0.4],
  crack: [0.4, 0.445],
  flash: 0.425,
  shatter: [0.445, 0.63],
  pass: [0.445, 0.495],
  flood: [0.46, 0.56],
  kicker: [0.48, 0.54],
  lines: { start: 0.5, step: 0.045, dur: 0.035 },
  land: [0.64, 0.76],
  side: [0.72, 0.82],
  stamp: [0.86, 0.9],
};
const LAND_CONTACT = T.land[0] + (T.land[1] - T.land[0]) * (1 / 2.75); // first bounce touch-down

// impact point on the goat mark: the crown between the horns (fraction of its box)
const OX = 0.703;
const OY = 0.31;

export function heroSequence(hero) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  hero.classList.add('hero--seq');

  const $ = (s) => hero.querySelector(s);
  const stage = $('.hero__stage');
  const cam = $('.hero__cam');
  const goat = $('.hero__goat');
  const charger = $('.hero__charger');
  const ghost = $('.hero__ghost');
  const light = $('.hero__light');
  const flood = $('.hero__flood');
  const glass = $('.hero__glass');
  const cracks = $('.hero__cracks');
  const shardBox = $('.hero__shards');
  const canvas = $('.hero__fx');
  const ctx = canvas.getContext('2d');
  const kicker = $('.hero__kicker');
  const lines = [...hero.querySelectorAll('.hero__line')];
  const side = $('.hero__side');
  const teaser = $('.hero__teaser');
  const hud = $('.hero__hud');
  const tc = $('[data-tc]');
  const focus = $('[data-focus]');
  const af = $('[data-af]');
  const afCorners = [...af.querySelectorAll('i')];
  const stamp = $('[data-stamp]');
  const [barTop, barBottom] = hero.querySelectorAll('.hero__bars i');
  const flash = $('.hero__flash');

  const css = getComputedStyle(document.documentElement);
  const chalk = css.getPropertyValue('--chalk').trim() || '#F6F4F0';
  const amber = css.getPropertyValue('--amber').trim() || '#F79634';

  let W = 0, H = 0, D = 0, cx = 0, cy = 0, dpr = 1;
  let geo = null, cw = 0, ch = 0;
  let shards = [], crackEls = [], sparks = [], dust = [], puff = [];

  /* ---------------- geometry ---------------- */

  function layout() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    cx = W / 2;
    cy = H * 0.5;
    D = Math.hypot(W / 2, H / 2);
    // the goat's resting spot is pure CSS; we animate relative to it
    geo = { x: goat.offsetLeft, y: goat.offsetTop, w: goat.offsetWidth, h: goat.offsetHeight };
    // the charging goat is laid out at its impact size and only ever scaled down
    // (crisp raster), with the crown of its head pinned to the centre of the frame
    ch = H * 1.6;
    cw = ch * (252.8 / 306.2);
    Object.assign(charger.style, {
      width: `${cw}px`,
      height: `${ch}px`,
      left: `${cx - cw * OX}px`,
      top: `${cy - ch * OY}px`,
    });

    dpr = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    buildGlass();
    buildParticles();
  }

  function buildGlass() {
    const R = rng(1977);
    const small = W < 700;
    const N = small ? 9 : 12;
    const rings = small ? [0, 0.1, 0.28, 0.6, 1.3] : [0, 0.07, 0.19, 0.38, 0.7, 1.3];
    const turn = R() * Math.PI;
    const angles = Array.from({ length: N }, (_, j) => ((j + 0.5 + (R() - 0.5) * 0.6) / N) * Math.PI * 2 + turn);
    const V = rings.map((r, k) =>
      angles.map((a) => {
        if (k === 0) return [cx, cy];
        const rr = r * D * (1 + (R() - 0.5) * 0.24);
        const aa = a + (R() - 0.5) * 0.14;
        return [cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr];
      })
    );

    // cracks: radial lines first, then the rings between them
    const paths = [];
    for (let j = 0; j < N; j++) {
      let d = `M${cx} ${cy}`;
      for (let k = 1; k < rings.length; k++) {
        const [x, y] = V[k][j];
        const [px, py] = V[k - 1][j];
        const mx = (x + px) / 2 + (R() - 0.5) * 14;
        const my = (y + py) / 2 + (R() - 0.5) * 14;
        d += ` L${mx.toFixed(1)} ${my.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      paths.push({ d, delay: R() * 0.15, cls: 'crack crack--radial' });
    }
    for (let k = 1; k < rings.length - 1; k++) {
      for (let j = 0; j < N; j++) {
        if (R() < 0.22) continue;
        const [x1, y1] = V[k][j];
        const [x2, y2] = V[k][(j + 1) % N];
        paths.push({ d: `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, delay: 0.25 + k * 0.12 + R() * 0.1, cls: 'crack' });
      }
    }
    cracks.setAttribute('viewBox', `0 0 ${W} ${H}`);
    cracks.innerHTML =
      paths.map((p) => `<path class="${p.cls}" d="${p.d}" pathLength="1"/>`).join('') +
      `<circle class="crack__core" cx="${cx}" cy="${cy}" r="${Math.max(10, D * 0.025)}"/>`;
    crackEls = [...cracks.querySelectorAll('path')].map((el, i) => ({ el, delay: paths[i].delay }));

    // shards: one cell of the crack web each, flying toward the lens
    shards = [];
    let html = '';
    for (let k = 0; k < rings.length - 1; k++) {
      for (let j = 0; j < N; j++) {
        const j1 = (j + 1) % N;
        const poly = k === 0 ? [V[0][j], V[1][j], V[1][j1]] : [V[k][j], V[k + 1][j], V[k + 1][j1], V[k][j1]];
        const xs = poly.map((p) => p[0]);
        const ys = poly.map((p) => p[1]);
        const bx = Math.min(...xs), by = Math.min(...ys);
        const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
        if (bx > W || by > H || bx + bw < 0 || by + bh < 0) continue;
        const mx = xs.reduce((a, b) => a + b) / xs.length;
        const my = ys.reduce((a, b) => a + b) / ys.length;
        const len = Math.hypot(mx - cx, my - cy) || 1;
        shards.push({
          dx: (mx - cx) / len,
          dy: (my - cy) / len,
          dist: D * (0.16 + k * 0.1 + R() * 0.28),
          z: Math.min(860, (380 + R() * 480) * (1.3 - k * 0.16)),
          rx: (R() - 0.5) * 260,
          ry: (R() - 0.5) * 260,
          rz: (R() - 0.5) * 100,
          fall: H * (0.12 + R() * 0.4),
        });
        const pts = poly.map(([x, y]) => `${(x - bx).toFixed(1)},${(y - by).toFixed(1)}`).join(' ');
        html += `<div class="shard${R() < 0.25 ? ' shard--glint' : ''}" style="left:${bx.toFixed(1)}px;top:${by.toFixed(1)}px;width:${bw.toFixed(1)}px;height:${bh.toFixed(1)}px;transform-origin:${(mx - bx).toFixed(1)}px ${(my - by).toFixed(1)}px"><svg viewBox="0 0 ${bw.toFixed(1)} ${bh.toFixed(1)}"><polygon points="${pts}"/></svg></div>`;
      }
    }
    shardBox.innerHTML = html;
    [...shardBox.children].forEach((el, i) => (shards[i].el = el));
  }

  // soft round sprites, drawn once: cheaper and softer than arcs
  function sprite(color) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }
  const softChalk = sprite(chalk);
  const softAmber = sprite(amber);

  function buildParticles() {
    const R = rng(42);
    const small = W < 700;
    sparks = Array.from({ length: small ? 90 : 170 }, () => ({
      a: R() * Math.PI * 2,
      v: 0.25 + R() * 1.05,
      z: R() * 0.9,
      g: 0.4 + R(),
      size: 0.8 + R() * 2.4,
      warm: R() < 0.45,
      alpha: 0.5 + R() * 0.5,
    }));
    dust = Array.from({ length: small ? 36 : 70 }, () => ({
      x: R() * W,
      y: R() * H,
      r: 0.5 + R() * 1.8,
      vx: (R() - 0.5) * 0.012,
      vy: -0.004 - R() * 0.012,
      ph: R() * Math.PI * 2,
      a: 0.08 + R() * 0.3,
    }));
    puff = Array.from({ length: small ? 22 : 40 }, () => ({
      dir: R() < 0.5 ? -1 : 1,
      v: 0.2 + R() * 0.9,
      up: R() * 0.35,
      r: 2 + R() * 7,
      a: 0.08 + R() * 0.16,
    }));
  }

  /* ---------------- one frame ---------------- */

  let lastTc = '';
  let prevP = 0, joltAt = null;
  function frame(p, t, clock) {
    /* A. approach: the charger grows toward the lens */
    const a = seg(p, ...T.approach);
    const ae = inCubic(a);
    let k = 0, bob = 0, rot = 0, cOp = 1;
    if (p < T.pass[0]) {
      const breathe = Math.sin(t * 1.7) * 0.012 * (1 - a);
      const hit = spike(p, T.flash, 0.02);
      k = lerp(0.24 / 1.6, 1, ae) * (1 + breathe) * (1 - hit * 0.04);
      bob = Math.sin(a * Math.PI * 14) * H * 0.012 * (0.35 + a) + (1 - ae) * H * 0.03;
      rot = Math.sin(a * Math.PI * 14 + 1.2) * 2.2 * a;
    } else {
      // through the glass and under the camera: it grows and dives out of frame
      const ps = seg(p, ...T.pass);
      k = lerp(1, 3.2, outCubic(ps));
      bob = lerp(0, H * 1.6, inCubic(ps));
      rot = lerp(0, -8, ps);
      cOp = 1 - seg(ps, 0.7, 1);
    }
    charger.style.transform = `translate3d(0, ${bob.toFixed(2)}px, 0) scale(${k.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
    charger.style.opacity = cOp.toFixed(3);

    // the resting goat only appears to land at the end
    const l = seg(p, ...T.land);
    goat.style.opacity = p >= T.land[0] ? 1 : 0;
    goat.style.transform = `translate3d(0, ${lerp(-(geo.y + geo.h + 60), 0, bounce(l)).toFixed(2)}px, 0)`;

    /* set */
    ghost.style.transform = `translate(-50%, -50%) scale(${(1 + a * 0.12).toFixed(4)})`;
    ghost.style.opacity = (lerp(1, 0.55, a) * (1 - seg(p, 0.44, 0.5))).toFixed(3);
    light.style.opacity = (1 - seg(p, 0.46, 0.56) * 0.6).toFixed(3);
    flood.style.opacity = seg(p, ...T.flood).toFixed(3);

    /* letterbox tightens with the charge, opens on the burst */
    const bar = H * 0.11 * ae * (1 - seg(p, T.shatter[0], T.shatter[0] + 0.06));
    barTop.style.transform = `scaleY(${(bar / H).toFixed(4)})`;
    barBottom.style.transform = barTop.style.transform;

    teaser.style.opacity = (1 - seg(p, 0.015, 0.09)).toFixed(3);

    /* B. glass + cracks */
    const broken = p >= T.shatter[0];
    glass.style.opacity = broken ? 0 : 1;
    const c = seg(p, ...T.crack);
    cracks.style.opacity = c > 0 && !broken ? 1 : 0;
    if (c > 0 && !broken) {
      for (const { el, delay } of crackEls) {
        el.style.strokeDashoffset = (1 - seg(c, delay, delay + 0.5)).toFixed(3);
      }
    }
    flash.style.opacity = (spike(p, T.flash, 0.007) * 0.7).toFixed(3);

    /* C. shatter */
    const sh = seg(p, ...T.shatter);
    shardBox.style.visibility = broken && sh < 1 ? 'visible' : 'hidden';
    if (broken && sh < 1) {
      const e = outCubic(sh);
      const op = (1 - seg(sh, 0.45, 0.92)).toFixed(3);
      for (const q of shards) {
        q.el.style.transform =
          `translate3d(${(q.dx * q.dist * e).toFixed(1)}px, ${(q.dy * q.dist * e + q.fall * sh * sh).toFixed(1)}px, ${(q.z * e).toFixed(1)}px) ` +
          `rotateX(${(q.rx * e).toFixed(1)}deg) rotateY(${(q.ry * e).toFixed(1)}deg) rotateZ(${(q.rz * e).toFixed(1)}deg)`;
        q.el.style.opacity = op;
      }
    }

    /* D. headline */
    const kk = seg(p, ...T.kicker);
    kicker.style.opacity = kk.toFixed(3);
    kicker.style.transform = `translateY(${((1 - kk) * 14).toFixed(1)}px)`;
    lines.forEach((el, i) => {
      const st = T.lines.start + i * T.lines.step;
      const k = seg(p, st, st + T.lines.dur);
      const e = outExpo(k);
      el.style.opacity = clamp(k * 4).toFixed(3);
      el.style.transform = `scale(${lerp(1.75, 1, e).toFixed(4)})`;
      el.style.setProperty('--ca', `${((1 - e) * 14).toFixed(1)}px`);
    });

    /* E. settle */
    const sd = seg(p, ...T.side);
    side.style.opacity = sd.toFixed(3);
    side.style.transform = `translateY(${((1 - outCubic(sd)) * 22).toFixed(1)}px)`;
    side.inert = sd < 0.5;
    const stp = seg(p, ...T.stamp);
    stamp.style.opacity = stp.toFixed(3);
    stamp.style.transform = `rotate(-4deg) scale(${lerp(1.5, 1, outBack(stp)).toFixed(4)})`;

    /* one short jolt when the head hits the ground, only on the way down.
       Time-based so it dies out in ~0.3s even if the scroll stops right there,
       and cut completely before the subtitle starts to appear. */
    if (prevP < LAND_CONTACT && p >= LAND_CONTACT) joltAt = t;
    prevP = p;
    let amp = 0;
    if (joltAt !== null) {
      amp = 14 * Math.exp(-(t - joltAt) / 0.08) * (1 - seg(p, T.side[0] - 0.015, T.side[0]));
      if (amp < 0.3) {
        amp = 0;
        joltAt = null;
      }
    }
    cam.style.transform = amp
      ? `translate3d(${(Math.sin(t * 95) * amp).toFixed(2)}px, ${(Math.cos(t * 83) * amp * 0.7).toFixed(2)}px, 0)`
      : '';

    /* HUD */
    hud.style.opacity = (1 - seg(p, 0.46, 0.55) * 0.5).toFixed(3);
    focus.textContent = p < T.crack[0] ? lerp(14, 0.3, ae).toFixed(1) : p < T.land[0] ? '0.0' : '2.4';
    const tcText = timecode(clock);
    if (tcText !== lastTc) tc.textContent = lastTc = tcText;
    placeAF(a, k, bob);

    drawFx(p, t);
  }

  function placeAF(a, k, bob) {
    const on = a > 0.02 && a < 0.82;
    af.style.opacity = on ? 1 : 0;
    af.classList.toggle('is-locked', a > 0.07);
    if (!on) return;
    const w = cw * k, h = ch * k;
    const left = cx - w * OX;
    const top = cy - h * OY + bob;
    const x1 = Math.max(12, left + w * 0.28), x2 = Math.min(W - 12, left + w * 0.95);
    const y1 = Math.max(12, top + h * 0.12), y2 = Math.min(H - 12, top + h * 0.78);
    const pos = [[x1, y1], [x2, y1], [x1, y2], [x2, y2]];
    afCorners.forEach((el, i) => (el.style.transform = `translate(${pos[i][0].toFixed(1)}px, ${pos[i][1].toFixed(1)}px)`));
    af.querySelector('span').style.transform = `translate(${x1.toFixed(1)}px, ${(y1 - 22).toFixed(1)}px)`;
  }

  // the clock runs until the take is printed
  function timecode(clock) {
    const f = Math.floor(clock * 25);
    const pad = (n) => String(n).padStart(2, '0');
    return `00:${pad(Math.floor(f / 1500) % 60)}:${pad(Math.floor(f / 25) % 60)}:${pad(f % 25)}`;
  }

  /* ---------------- canvas: dust, sparks, landing puff ---------------- */

  function drawFx(p, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const scene = seg(p, ...T.flood);

    // dust in the light (time-driven)
    ctx.globalCompositeOperation = 'lighter';
    for (const m of dust) {
      const x = ((m.x + m.vx * t * 1000) % W + W) % W;
      const y = ((m.y + m.vy * t * 1000) % H + H) % H;
      const cone = clamp(1 - Math.abs(x - cx) / (W * 0.55)) * clamp(1.2 - y / H);
      const al = m.a * (0.55 + 0.45 * Math.sin(t * 2 + m.ph)) * (0.25 + cone * 0.75) * (1 + scene * 0.6);
      if (al < 0.01) continue;
      ctx.globalAlpha = Math.min(1, al * 1.6);
      const r = m.r * 2.4;
      ctx.drawImage(scene > 0.5 ? softAmber : softChalk, x - r, y - r, r * 2, r * 2);
    }

    // sparks and glass glitter from the impact (scroll-driven, reversible)
    const tau = seg(p, T.flash - 0.004, T.shatter[1] + 0.04);
    if (tau > 0 && tau < 1) {
      const pos = (sp, tt) => {
        const persp = 1 / (1 - sp.z * tt * 0.8);
        const dist = sp.v * tt ** 0.6 * D * 1.15 * persp;
        return [cx + Math.cos(sp.a) * dist, cy + Math.sin(sp.a) * dist + tt * tt * H * 0.35 * sp.g, persp];
      };
      ctx.lineCap = 'round';
      for (const sp of sparks) {
        const [x0, y0] = pos(sp, Math.max(0, tau - 0.035));
        const [x1, y1, k] = pos(sp, tau);
        ctx.globalAlpha = (1 - tau) ** 1.3 * sp.alpha;
        ctx.strokeStyle = sp.warm ? amber : chalk;
        ctx.lineWidth = sp.size * k;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }

    // dust kicked up where the goat lands
    const pt = seg(p, LAND_CONTACT - 0.004, LAND_CONTACT + 0.09);
    if (pt > 0 && pt < 1) {
      ctx.globalCompositeOperation = 'source-over';
      const bx = geo.x + geo.w * 0.6;
      const by = geo.y + geo.h * 0.97;
      const e = outCubic(pt);
      for (const d of puff) {
        const r = d.r * (2 + e * 4);
        ctx.globalAlpha = d.a * (1 - pt) ** 1.5;
        ctx.drawImage(softChalk, bx + d.dir * d.v * e * geo.w * 0.7 - r, by - d.up * e * geo.h * 0.25 - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- loop ---------------- */

  let target = 0, current = 0, running = false, inView = false, raf = 0;
  const t0 = performance.now();
  let last = t0, clock = 0;

  function measure() {
    const travel = hero.offsetHeight - H;
    target = travel > 0 ? clamp(-hero.getBoundingClientRect().top / travel) : 0;
  }

  function tick(now) {
    const dt = Math.min(64, now - last);
    last = now;
    measure();
    current += (target - current) * (1 - Math.pow(1 - 0.14, dt / 16.7));
    if (Math.abs(target - current) < 0.00005) current = target;
    if (current < T.stamp[0]) clock += dt / 1000;
    frame(current, (now - t0) / 1000, clock);
    if (running) raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running || !inView || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  layout();
  measure();
  current = prevP = target;
  frame(current, 0, 0);

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    inView ? start() : stop();
  }).observe(hero);
  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layout();
      frame(current, (performance.now() - t0) / 1000, clock);
    }, 80);
  }).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

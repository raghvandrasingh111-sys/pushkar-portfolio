(() => {
  'use strict';

  /* Motion: full by default. Set to true to start in "motion off" when the visitor's OS asks for reduced motion.
     Visitors can always switch it with the Motion button in the footer (saved in localStorage). */
  const HONOR_OS_REDUCED_MOTION = false;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };
  if (HONOR_OS_REDUCED_MOTION && matchMedia('(prefers-reduced-motion: reduce)').matches && !store.get('motion')) root.dataset.motion = 'off';
  const motionOn = () => root.dataset.motion !== 'off';

  $('#year').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------- split headings into rising words */
  function splitWords(el, baseDelay = 0) {
    const text = el.textContent.trim();
    el.textContent = '';
    text.split(/\s+/).forEach((word, i, all) => {
      const w = document.createElement('span'); w.className = 'w';
      const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = word; wi.style.setProperty('--i', i);
      w.appendChild(wi); el.appendChild(w);
      if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.style.setProperty('--base', baseDelay + 'ms');
  }
  $$('.hero-title .split').forEach((el, i) => splitWords(el, 200 + i * 260));
  $$('.split').filter((el) => !el.closest('.hero-title')).forEach((el) => splitWords(el, 0));

  /* ---------------------------------------------------------------- stagger helpers */
  $$('.proj-list li').forEach((li, i) => { li.dataset.fade = ''; li.style.setProperty('--dl', i * 70 + 'ms'); });
  $$('.tools .tool').forEach((li, i) => { li.dataset.fade = ''; li.style.setProperty('--dl', (i % 3) * 90 + 'ms'); });
  $$('.svc li').forEach((li) => { li.dataset.fade = ''; });
  $$('.acc-item').forEach((li, i) => { li.dataset.fade = ''; li.style.setProperty('--dl', i * 60 + 'ms'); });
  $$('.facts').forEach((f) => $$('div', f).forEach((d, k) => d.style.setProperty('--k', k)));
  $$('.hero-copy [data-fade]').forEach((el, i) => el.style.setProperty('--dl', 650 + i * 130 + 'ms'));
  $$('.about-side [data-fade]').forEach((el, i) => el.style.setProperty('--dl', i * 120 + 'ms'));
  $$('.stats > div').forEach((el, i) => { el.dataset.fade = ''; el.style.setProperty('--dl', i * 120 + 'ms'); });
  $('.contact-grid').dataset.fade = ''; $('.c-actions').dataset.fade = '';

  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.classList.contains('stats')) countUp();
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('.split, [data-fade], .timeline li, .stats').forEach((el) => io.observe(el));
  // above-the-fold hero: don't wait for the observer
  setTimeout(() => $$('.hero .split, .hero [data-fade]').forEach((el) => el.classList.add('in')), 60);

  /* count-up for the numbers */
  function countUp() {
    $$('[data-count]').forEach((el) => {
      const end = +el.dataset.count;
      if (!motionOn()) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1500;
      const step = (now) => {
        const p = clamp((now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = 0; requestAnimationFrame(step);
    });
  }

  /* ---------------------------------------------------------------- scroll-linked effects (one rAF loop) */
  const bar = $('.bar'), progress = $('.progress i');
  const lede = $('#lede');
  const ledeWords = [];
  {
    const walker = lede.textContent.trim().split(/\s+/);
    lede.textContent = '';
    walker.forEach((w, i) => {
      const s = document.createElement('span'); s.className = 'lw'; s.textContent = w; lede.appendChild(s); ledeWords.push(s);
      if (i < walker.length - 1) lede.appendChild(document.createTextNode(' '));
    });
  }
  const timeline = $('#timeline');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    bar.classList.toggle('scrolled', y > 24);
    const max = root.scrollHeight - vh;
    progress.style.setProperty('--p', max > 0 ? clamp(y / max).toFixed(4) : 0);
    if (motionOn()) {
      const r = lede.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25));
      const n = Math.round(p * ledeWords.length);
      ledeWords.forEach((w, i) => w.classList.toggle('on', i < n));
      const t = timeline.getBoundingClientRect();
      timeline.style.setProperty('--p', clamp((vh * 0.72 - t.top) / t.height).toFixed(3));
    } else {
      ledeWords.forEach((w) => w.classList.add('on')); timeline.style.setProperty('--p', 1);
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------------------------------------------------------------- nav */
  const menu = $('#menu'), burger = $('.burger');
  const setMenu = (open) => {
    menu.classList.toggle('open', open); bar.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('.menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  const navLinks = $$('.menu a[href^="#"]:not(.menu-cta)');
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const s = $(a.getAttribute('href')); s && spy.observe(s); });

  /* ---------------------------------------------------------------- shared: media status overlay */
  function wireStatus(video, box) {
    const set = (state, msg) => { if (!state) { box.hidden = true; return; } box.hidden = false; box.dataset.state = state; box.textContent = msg || ''; };
    video.addEventListener('waiting', () => set('loading'));
    ['canplay', 'playing', 'loadeddata'].forEach((e) => video.addEventListener(e, () => set(null)));
    video.addEventListener('error', () => { if (video.getAttribute('src')) set('error', 'This video could not be loaded. Please check your connection and try again.'); });
    return set;
  }

  /* ---------------------------------------------------------------- shared: custom player bar */
  function buildBar(barEl, video, fsTarget, chapterCb) {
    barEl.innerHTML = `
      <button class="pb pb-play" type="button" aria-label="Play"><svg class="i-pl" viewBox="0 0 24 24"><use href="#i-play"/></svg><svg class="i-p" viewBox="0 0 24 24"><use href="#i-pause"/></svg></button>
      <span class="pb-time" aria-hidden="true">0:00 / 0:00</span>
      <label class="pb-seek"><span class="sr">Seek</span><input type="range" min="0" max="1000" value="0" step="1" aria-label="Seek"></label>
      <button class="pb pb-mute" type="button" aria-label="Mute"><svg viewBox="0 0 24 24"><use href="#i-vol"/></svg></button>
      <button class="pb pb-full" type="button" aria-label="Fullscreen"><svg viewBox="0 0 24 24"><use href="#i-full"/></svg></button>`;
    const play = $('.pb-play', barEl), mute = $('.pb-mute', barEl), full = $('.pb-full', barEl);
    const seek = $('input', barEl), time = $('.pb-time', barEl);
    const toggle = () => (video.paused ? video.play().catch(() => {}) : video.pause());
    play.addEventListener('click', toggle);
    video.addEventListener('play', () => { play.classList.add('is-playing'); play.setAttribute('aria-label', 'Pause'); });
    video.addEventListener('pause', () => { play.classList.remove('is-playing'); play.setAttribute('aria-label', 'Play'); });
    const upd = () => {
      const d = video.duration || 0, t = video.currentTime || 0;
      seek.value = d ? (t / d) * 1000 : 0; seek.style.setProperty('--p', d ? (t / d) * 100 + '%' : '0%');
      time.textContent = `${fmt(t)} / ${fmt(d)}`;
      chapterCb && chapterCb(t);
    };
    video.addEventListener('timeupdate', upd); video.addEventListener('loadedmetadata', upd);
    seek.addEventListener('input', () => { if (video.duration) video.currentTime = (seek.value / 1000) * video.duration; });
    mute.addEventListener('click', () => { video.muted = !video.muted; mute.classList.toggle('muted', video.muted); mute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute'); });
    full.addEventListener('click', () => {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      (fsTarget.requestFullscreen || fsTarget.webkitRequestFullscreen || (() => video.webkitEnterFullscreen && video.webkitEnterFullscreen())).call(fsTarget);
    });
    fsTarget.addEventListener('keydown', (e) => {
      if (e.target === seek || e.target.closest('.chapters')) return;
      if (e.key === 'ArrowRight') video.currentTime = Math.min(video.duration || 0, video.currentTime + 3);
      if (e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 3);
      if (e.key === ' ' && e.target === fsTarget) { e.preventDefault(); toggle(); }
    });
    video.addEventListener('click', toggle);
    return { upd, mute: () => { mute.classList.toggle('muted', video.muted); mute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute'); } };
  }

  /* ---------------------------------------------------------------- hero stage */
  const hv = $('#heroVideo'), htc = $('#heroTc'), htoggle = $('#heroToggle');
  let heroUserPaused = false;
  const setHeroBtn = () => {
    const playing = !hv.paused;
    htoggle.setAttribute('aria-label', playing ? 'Pause preview' : 'Play preview');
    $('use', htoggle).setAttribute('href', playing ? '#i-pause' : '#i-play');
  };
  const heroPlay = () => { if (motionOn() && !heroUserPaused) hv.play().catch(() => {}); };
  hv.addEventListener('play', setHeroBtn); hv.addEventListener('pause', setHeroBtn);
  htoggle.addEventListener('click', () => { if (hv.paused) { heroUserPaused = false; hv.play().catch(() => {}); } else { heroUserPaused = true; hv.pause(); } });
  heroPlay();
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => addEventListener(ev, heroPlay, { once: true, passive: true }));
  new IntersectionObserver(([e]) => { e.isIntersecting ? heroPlay() : hv.pause(); }, { threshold: 0.1 }).observe(hv);
  const pad = (n) => String(n).padStart(2, '0');
  (function tick() {
    const t = hv.currentTime || 0;
    htc.textContent = `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t) % 60)}:${pad(Math.floor((t % 1) * 24))}`;
    requestAnimationFrame(tick);
  })();

  /* ---------------------------------------------------------------- work: project bin + monitor */
  const data = $$('#projData > div').map((d) => ({
    id: d.dataset.id, ratio: +d.dataset.ratio, title: d.dataset.title, cat: d.dataset.cat, meta: d.dataset.meta,
    desc: d.dataset.desc, tech: d.dataset.tech.split('|'), note: d.dataset.note,
  }));
  const POSTER_W = { '01': [640, 1280], '02': [640, 1280], '03': [480, 720], '04': [480, 720], '05': [480, 480], '06': [480, 480] };
  const rows = $$('.proj');
  const canvas = $('#canvas'), screen = $('#screen'), poster = $('#mPoster'), mv = $('#mVideo');
  const setStatus = wireStatus(mv, $('#mStatus'));
  const mBar = $('#mBar'), mPlay = $('#mPlay'), info = $('#info');
  let cur = -1, mode = 'preview', layoutRatio = 1.654, hoverTimer = 0;

  function layout(ratio = layoutRatio) {
    layoutRatio = ratio;
    const pad = innerWidth < 600 ? 14 : 28;
    const cw = canvas.clientWidth - pad * 2;
    if (innerWidth <= 1000) canvas.style.height = Math.min(Math.round(innerHeight * 0.6), Math.round(cw / ratio) + pad * 2) + 'px';
    else canvas.style.height = '';
    const ch = canvas.clientHeight - pad * 2;
    let w = cw, h = cw / ratio;
    if (h > ch) { h = ch; w = ch * ratio; }
    screen.style.width = Math.floor(w) + 'px'; screen.style.height = Math.floor(h) + 'px';
  }
  new ResizeObserver(() => layout()).observe(canvas);

  const player = buildBar(mBar, mv, screen);

  function fillInfo(p) {
    $('#iTitle').textContent = p.title; $('#iMeta').textContent = `${p.cat} — ${p.meta}`;
    $('#iDesc').textContent = p.desc;
    $('#iTech').innerHTML = ''; p.tech.forEach((t) => { const li = document.createElement('li'); li.textContent = t; $('#iTech').appendChild(li); });
    const note = $('#iNote'); note.textContent = p.note; note.hidden = !p.note;
  }
  function setPreview(p) {
    mode = 'preview';
    screen.classList.remove('full', 'live');
    mBar.hidden = true; mv.controls = false; mv.loop = true; mv.muted = true; player.mute();
    mv.pause(); setStatus(null);
    if (motionOn()) {
      mv.src = `media/p${p.id}-preview.mp4`; mv.load();
      mv.play().then(() => screen.classList.add('live')).catch(() => {});
    } else { mv.removeAttribute('src'); mv.load(); }
  }
  function select(i, opts = {}) {
    if (i === cur) return;
    const first = cur === -1;
    cur = i;
    const p = data[i];
    rows.forEach((r, k) => r.setAttribute('aria-current', String(k === i)));
    const swapMs = !first && motionOn() ? 260 : 0;
    screen.classList.add('swap'); info.classList.add('swap');
    layout(p.ratio);
    setTimeout(() => {
      if (cur !== i) return;
      const [sm, lg] = POSTER_W[p.id];
      poster.removeAttribute('srcset');
      poster.src = `media/p${p.id}.webp`;
      if (sm !== lg) { poster.srcset = `media/p${p.id}-sm.webp ${sm}w, media/p${p.id}.webp ${lg}w`; poster.sizes = '(max-width: 1000px) 92vw, 700px'; }
      poster.width = lg; poster.height = Math.round(lg / p.ratio);
      poster.alt = `Still from ${p.title}`;
      fillInfo(p); setPreview(p);
      requestAnimationFrame(() => { screen.classList.remove('swap'); info.classList.remove('swap'); });
    }, swapMs);
    if (opts.scroll && innerWidth <= 1000) $('#monitor').scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'start' });
  }
  function playFull() {
    const p = data[cur]; if (!p) return;
    mode = 'full';
    mv.pause(); mv.src = `media/p${p.id}.mp4`;
    mv.loop = false; mv.muted = false; mv.controls = false; player.mute();
    screen.classList.add('full', 'live'); mBar.hidden = false; setStatus('loading'); mv.load();
    mv.play().catch(() => { setStatus(null); });
  }
  mv.addEventListener('ended', () => { if (mode === 'full') setPreview(data[cur]); });
  mPlay.addEventListener('click', playFull);
  poster.addEventListener('click', () => mode === 'preview' && playFull());
  rows.forEach((r, i) => {
    r.addEventListener('click', () => { clearTimeout(hoverTimer); select(i, { scroll: true }); });
    r.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || mode === 'full' || innerWidth <= 1000) return;
      clearTimeout(hoverTimer); hoverTimer = setTimeout(() => select(i), 170);
    });
    r.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
    r.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return; e.preventDefault();
      const n = clamp(i + d, 0, rows.length - 1); rows[n].focus(); select(n);
    });
  });
  // pause the preview when the monitor is off-screen
  new IntersectionObserver(([e]) => {
    if (mode !== 'preview' || !motionOn()) return;
    e.isIntersecting ? mv.play().catch(() => {}) : mv.pause();
  }, { threshold: 0.1 }).observe($('#monitor'));
  layout(1.654); select(0);

  /* ---------------------------------------------------------------- breakdown accordion */
  const items = $$('.acc-item');
  items.forEach((it, idx) => {
    const btn = $('.acc-btn', it);
    if (idx === 0) it.classList.add('open');
    btn.addEventListener('click', () => {
      const open = !it.classList.contains('open');
      items.forEach((o) => { o.classList.remove('open'); $('.acc-btn', o).setAttribute('aria-expanded', 'false'); });
      if (open) { it.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------------------------------------------------------------- showreel modal */
  const dlg = $('#reel'), rv = $('#reelVideo'), rScreen = $('#reelScreen'), rPlay = $('#reelPlay');
  const rStatus = wireStatus(rv, $('#reelStatus'));
  const chapterBtns = $$('#chapters button');
  const starts = chapterBtns.map((b) => +b.dataset.t);
  const rBar = buildBar($('#reelBar'), rv, rScreen, (t) => {
    let on = 0; starts.forEach((s, i) => { if (t >= s - 0.05) on = i; });
    chapterBtns.forEach((b, i) => b.classList.toggle('on', i === on && t > 0));
  });
  let opener = null;
  rv.addEventListener('play', () => rScreen.classList.add('playing'));
  rv.addEventListener('pause', () => rScreen.classList.remove('playing'));
  rv.addEventListener('ended', () => rScreen.classList.remove('playing'));
  const startReel = (t = null) => {
    rv.preload = 'auto';
    const go = () => { if (t !== null) rv.currentTime = t; rv.muted = false; rBar.mute(); rv.play().catch(() => rStatus(null)); };
    rv.readyState >= 1 ? go() : (rv.addEventListener('loadedmetadata', go, { once: true }), rv.load());
  };
  rPlay.addEventListener('click', () => startReel());
  chapterBtns.forEach((b) => b.addEventListener('click', () => startReel(+b.dataset.t)));
  $$('[data-open-reel]').forEach((b) => b.addEventListener('click', () => {
    opener = b; dlg.showModal(); root.style.overflow = 'hidden'; startReel(0);
  }));
  const closeReel = () => dlg.close();
  $('.reel-x').addEventListener('click', closeReel);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeReel(); });
  dlg.addEventListener('close', () => { rv.pause(); rv.currentTime = 0; root.style.overflow = ''; opener && opener.focus(); });

  /* ---------------------------------------------------------------- copy email */
  const live = $('#copyLive');
  $$('.copy').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); live.textContent = 'Email address copied.'; b.textContent = 'Copied'; }
    catch { live.textContent = 'Copy is not available here — please select the address instead.'; }
    setTimeout(() => { b.textContent = 'Copy email'; live.textContent = ''; }, 2400);
  }));

  /* ---------------------------------------------------------------- motion toggle */
  const mt = $('#motionToggle');
  const showMotion = () => { const on = motionOn(); mt.setAttribute('aria-pressed', on); $('span', mt).textContent = on ? 'On' : 'Off'; };
  mt.addEventListener('click', () => {
    if (motionOn()) { root.dataset.motion = 'off'; store.set('motion', 'off'); hv.pause(); mv.pause(); }
    else { delete root.dataset.motion; store.set('motion', 'on'); heroPlay(); if (mode === 'preview') setPreview(data[cur]); }
    showMotion(); onScroll();
  });
  showMotion();
  if (!motionOn()) { $$('.split, [data-fade], .timeline li, .stats').forEach((el) => el.classList.add('in')); countUp(); }
})();

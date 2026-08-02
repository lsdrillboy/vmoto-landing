/* При перезагрузке всегда открываем страницу с начала: скролл-сцены
   рассчитаны на просмотр сверху, восстановление позиции ломает их. */
(function startAtTop() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: 'instant' });
})();

/* ============================================================
   HERO: покадровая промотка по скроллу (image sequence)
   Кадры assets/seq/hero/f001…f162.webp нарезаны из видео
   (18 fps, 1920px, WebP q80 — пайплайн описан в README.md).
   Прогресс скролла -> номер кадра -> canvas.
   Против лагов: окно ImageBitmap вокруг кадра-цели (декод вне
   главного потока), точный кадр всегда доступен из <img>;
   обновление коалесцируется в один draw на кадр дисплея через rAF.
   ============================================================ */
(function heroScrub() {
  const wrapper = document.querySelector('.hero-scroll');
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const fallback = document.getElementById('heroFallback');
  const intro = document.getElementById('heroIntro');
  const mid = document.getElementById('heroMid');
  const finalBlock = document.getElementById('heroFinal');
  const frameNow = document.getElementById('frameNow');
  const frameLine = document.getElementById('frameLine');

  const FRAME_COUNT = 216; // 9 c исходника в родные 24 fps — ровный шаг движения
  const SMOOTH_TAU = 0.11; // сек: постоянная времени доводки
  // телефонам — комплект 960px (вдвое меньше трафика и декода);
  // порог по физическим пикселям канвы, dpr капнут как в resize()
  const SEQ_DIR = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) <= 1100
    ? 'assets/seq/hero24-m/' : 'assets/seq/hero24/';
  const framePath = (i) => SEQ_DIR + 'f' + String(i + 1).padStart(3, '0') + '.webp';

  // Кадры держим как <img>: браузер хранит сжатые данные (~10 МБ) и сам
  // управляет кэшем декода — вкладка не падает по памяти. Для плавного
  // скраба поверх — окно ImageBitmap вокруг текущего кадра; при отсутствии
  // битмапа рисуем точный кадр прямо из <img> (без пропусков кадров).
  const imgs = new Array(FRAME_COUNT);
  const bmps = new Array(FRAME_COUNT);
  const decoding = new Set();
  const AHEAD_F = 24; // запас декода по ходу движения
  const AHEAD_B = 8;  // и против хода
  const CULL = 34;    // дальше от кадра — битмап выселяется
  const MAX_FPS = 90; // потолок скорости показа (кадров/с)
  const DECODE_PAR = 6; // одновременных декодов
  const supportsBitmap = typeof createImageBitmap === 'function';
  let winCenter = 0;
  let scrubDir = 1;   // направление скролла: 1 вниз, -1 вверх
  let prevTarget = 0;
  let displayFrame = 0;   // дробный номер кадра (сглаженный)
  let drawnKey = -1;      // что сейчас нарисовано (кэш)
  let rafId = null;
  let heroInView = true;
  let lastTime = 0;
  let lastRafTime = 0;

  function loadImg(i, done) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      imgs[i] = img;
      if (i >= winCenter - AHEAD_B && i <= winCenter + AHEAD_F) decodeFrame(i);
      kick();
      done && done();
    };
    img.onerror = () => { done && done(); };
    img.src = framePath(i);
  }
  function decodeFrame(i) {
    if (!supportsBitmap || bmps[i] || decoding.has(i)) return;
    if (decoding.size >= DECODE_PAR) return;
    const img = imgs[i];
    if (!img || !img.naturalWidth) return;
    decoding.add(i);
    createImageBitmap(img)
      .then((bmp) => {
        bmps[i] = bmp;
        decoding.delete(i);
        kick();                  // кадр готов — можно рисовать
        ensureWindow(winCenter); // и занять освободившийся слот декода
      })
      .catch(() => decoding.delete(i));
  }
  // окно декода вытянуто по ходу движения; ближние кадры — первыми
  function ensureWindow(center) {
    if (!supportsBitmap) return;
    winCenter = center;
    const fwd = scrubDir >= 0 ? AHEAD_F : AHEAD_B;
    const back = scrubDir >= 0 ? AHEAD_B : AHEAD_F;
    for (let d = 0; d <= Math.max(fwd, back); d++) {
      if (d <= fwd && center + d < FRAME_COUNT) decodeFrame(center + d);
      if (d && d <= back && center - d >= 0) decodeFrame(center - d);
    }
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (bmps[i] && (i < center - CULL || i > center + CULL)) {
        if (bmps[i].close) bmps[i].close();
        bmps[i] = null;
      }
    }
  }
  function freeAll() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (bmps[i]) { if (bmps[i].close) bmps[i].close(); bmps[i] = null; }
    }
  }
  loadImg(0, () => {
    canvas.classList.add('is-ready');
    fallback.classList.add('is-hidden');
    drawnKey = -1;
    kick();
  });
  // ограниченная параллельность, чтобы кадры приходили по порядку
  (function loadQueue() {
    let next = 1;
    const CONCURRENCY = 8;
    function pump() {
      if (next >= FRAME_COUNT) return;
      loadImg(next++, pump);
    }
    for (let k = 0; k < CONCURRENCY; k++) pump();
  })();

  // --- канвас под размер вьюпорта (с учётом retina) ---
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawnKey = -1; // перерисовать
    kick();
  }
  window.addEventListener('resize', resize, { passive: true });

  function blit(src) {
    const iw = src.naturalWidth || src.width;
    const ih = src.naturalHeight || src.height;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
  function nearestImg(index) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (index - d >= 0 && imgs[index - d] && imgs[index - d].naturalWidth) return index - d;
      if (index + d < FRAME_COUNT && imgs[index + d] && imgs[index + d].naturalWidth) return index + d;
    }
    return -1;
  }
  // Рисуем только готовые битмапы — ноль синхронного декода в главном
  // потоке. Если точный кадр ещё декодируется, берём лучший готовый по
  // ходу движения и никогда не откатываемся назад (нет дёрганий).
  function draw(frameFloat) {
    const want = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frameFloat)));
    if (!supportsBitmap) { // старые браузеры: рисуем <img> напрямую
      const j = nearestImg(want);
      if (j >= 0 && j !== drawnKey) { blit(imgs[j]); drawnKey = j; }
      return;
    }
    let i = -1;
    if (bmps[want]) i = want;
    else if (drawnKey >= 0) {
      if (scrubDir >= 0) {
        for (let j = want; j > drawnKey; j--) if (bmps[j]) { i = j; break; }
      } else {
        for (let j = want; j < drawnKey; j++) if (bmps[j]) { i = j; break; }
      }
      if (i < 0) return; // дождёмся декода — он уже в пути
    } else {
      for (let d = 0; d < FRAME_COUNT && i < 0; d++) {
        if (want - d >= 0 && bmps[want - d]) i = want - d;
        else if (want + d < FRAME_COUNT && bmps[want + d]) i = want + d;
      }
      if (i < 0) { // самый первый показ: битмапов ещё нет вовсе
        const j = nearestImg(want);
        if (j >= 0) { blit(imgs[j]); drawnKey = j; }
        return;
      }
    }
    if (i === drawnKey) return;
    blit(bmps[i]);
    drawnKey = i;
  }

  function getProgress() {
    const total = wrapper.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -wrapper.getBoundingClientRect().top / total));
  }

  // 0 -> 1 на отрезке [a, b]
  const ramp = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

  function updateScenes(progress) {
    // сцена 1: заголовок гаснет и уезжает вверх, уступая кадр продукту
    const introOut = ramp(progress, 0.05, 0.3);
    intro.style.opacity = String(1 - introOut);
    intro.style.transform = 'translateY(calc(-54% - ' + (introOut * 64).toFixed(1) + 'px))';
    intro.style.visibility = introOut >= 1 ? 'hidden' : 'visible';

    // сцена 2: одна строка на чистом кадре
    mid.style.opacity = String(ramp(progress, 0.42, 0.5) * (1 - ramp(progress, 0.62, 0.7)));

    // сцена 3: оффер на финальном ракурсе
    const finalIn = ramp(progress, 0.8, 0.92);
    finalBlock.style.opacity = String(finalIn);
    finalBlock.style.transform = 'translateY(calc(-54% + ' + ((1 - finalIn) * 28).toFixed(1) + 'px))';
    finalBlock.style.visibility = finalIn <= 0 ? 'hidden' : 'visible';
  }

  function updateCounter() {
    if (!frameNow) return;
    frameNow.textContent = String(Math.round(displayFrame) + 1).padStart(3, '0');
    frameLine.style.transform = 'scaleX(' + (displayFrame / (FRAME_COUNT - 1)).toFixed(4) + ')';
  }

  function update(now) {
    const dt = Math.min(((now || performance.now()) - lastTime) / 1000, 0.05) || 0.016;
    lastTime = now || performance.now();

    const progress = getProgress();
    updateScenes(progress);

    const targetFrame = progress * (FRAME_COUNT - 1);
    if (targetFrame > prevTarget + 0.01) scrubDir = 1;
    else if (targetFrame < prevTarget - 0.01) scrubDir = -1;
    prevTarget = targetFrame;
    // независимое от fps сглаживание + потолок скорости показа:
    // спрос на кадры всегда ниже скорости декода — рывков нет
    const k = 1 - Math.exp(-dt / SMOOTH_TAU);
    let step = (targetFrame - displayFrame) * k;
    const maxStep = MAX_FPS * dt;
    if (step > maxStep) step = maxStep; else if (step < -maxStep) step = -maxStep;
    displayFrame += step;
    if (Math.abs(targetFrame - displayFrame) < 0.25) displayFrame = targetFrame;
    ensureWindow(Math.round(displayFrame));
    draw(displayFrame);
    updateCounter();
    return displayFrame !== targetFrame; // ещё доводим?
  }

  function tick(now) {
    lastRafTime = now;
    const busy = update(now);
    rafId = heroInView && busy ? requestAnimationFrame(tick) : null;
  }

  function kick() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  // скролл лишь будит rAF-цикл: не больше одного draw на кадр дисплея,
  // сколько бы scroll-событий ни пришло (тачпады шлют их пачками)
  window.addEventListener('scroll', () => {
    kick();
    // страховка: rAF молчит (фоновая вкладка и т.п.) — обновимся напрямую
    if (performance.now() - lastRafTime > 120) update();
  }, { passive: true });

  const io = new IntersectionObserver((entries) => {
    heroInView = entries[0].isIntersecting;
    if (heroInView) { drawnKey = -1; kick(); }
    else freeAll(); // секция вне экрана — растровые кадры не держим
  });
  io.observe(wrapper);

  window.__vmotoScrub = window.__vmotoScrub || {};
  window.__vmotoScrub.hero = {
    get frame() { return drawnKey; },
    get decoded() { let n = 0; for (let i = 0; i < FRAME_COUNT; i++) if (bmps[i]) n++; return n; },
  };

  lastTime = performance.now();
  resize();
})();

/* ============ OUTRO: промотка + появление формы заявки ============ */
(function outroScrub() {
  const wrapper = document.querySelector('.outro-scroll');
  if (!wrapper) return;
  const canvas = document.getElementById('outroCanvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const fallback = document.getElementById('outroFallback');
  const formBlock = document.getElementById('outroForm');

  const FRAME_COUNT = 361; // весь исходник в родные 24 fps (см. hero)
  const SMOOTH_TAU = 0.11;
  const SEQ_DIR = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) <= 1100
    ? 'assets/seq/outro24-m/' : 'assets/seq/outro24/';
  const framePath = (i) => SEQ_DIR + 'f' + String(i + 1).padStart(3, '0') + '.webp';

  // та же схема, что в hero: <img> — источник, битмапы — окно-ускоритель
  // Кадры держим как <img>: браузер хранит сжатые данные (~10 МБ) и сам
  // управляет кэшем декода — вкладка не падает по памяти. Для плавного
  // скраба поверх — окно ImageBitmap вокруг текущего кадра; при отсутствии
  // битмапа рисуем точный кадр прямо из <img> (без пропусков кадров).
  const imgs = new Array(FRAME_COUNT);
  const bmps = new Array(FRAME_COUNT);
  const decoding = new Set();
  const AHEAD_F = 24; // запас декода по ходу движения
  const AHEAD_B = 8;  // и против хода
  const CULL = 34;    // дальше от кадра — битмап выселяется
  const MAX_FPS = 90; // потолок скорости показа (кадров/с)
  const DECODE_PAR = 6; // одновременных декодов
  const supportsBitmap = typeof createImageBitmap === 'function';
  let winCenter = 0;
  let scrubDir = 1;   // направление скролла: 1 вниз, -1 вверх
  let prevTarget = 0;
  let displayFrame = 0;
  let drawnKey = -1;
  let rafId = null;
  let inView = true;
  let lastTime = 0;
  let lastRafTime = 0;
  let loadingStarted = false;

  function loadImg(i, done) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      imgs[i] = img;
      if (i >= winCenter - AHEAD_B && i <= winCenter + AHEAD_F) decodeFrame(i);
      kick();
      done && done();
    };
    img.onerror = () => { done && done(); };
    img.src = framePath(i);
  }
  function decodeFrame(i) {
    if (!supportsBitmap || bmps[i] || decoding.has(i)) return;
    if (decoding.size >= DECODE_PAR) return;
    const img = imgs[i];
    if (!img || !img.naturalWidth) return;
    decoding.add(i);
    createImageBitmap(img)
      .then((bmp) => {
        bmps[i] = bmp;
        decoding.delete(i);
        kick();                  // кадр готов — можно рисовать
        ensureWindow(winCenter); // и занять освободившийся слот декода
      })
      .catch(() => decoding.delete(i));
  }
  // окно декода вытянуто по ходу движения; ближние кадры — первыми
  function ensureWindow(center) {
    if (!supportsBitmap) return;
    winCenter = center;
    const fwd = scrubDir >= 0 ? AHEAD_F : AHEAD_B;
    const back = scrubDir >= 0 ? AHEAD_B : AHEAD_F;
    for (let d = 0; d <= Math.max(fwd, back); d++) {
      if (d <= fwd && center + d < FRAME_COUNT) decodeFrame(center + d);
      if (d && d <= back && center - d >= 0) decodeFrame(center - d);
    }
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (bmps[i] && (i < center - CULL || i > center + CULL)) {
        if (bmps[i].close) bmps[i].close();
        bmps[i] = null;
      }
    }
  }
  function freeAll() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (bmps[i]) { if (bmps[i].close) bmps[i].close(); bmps[i] = null; }
    }
  }
  // кадры не грузим при открытии страницы — только когда секция близко
  function startLoading() {
    if (loadingStarted) return;
    loadingStarted = true;
    loadImg(0, () => {
      canvas.classList.add('is-ready');
      fallback.classList.add('is-hidden');
      drawnKey = -1;
      kick();
    });
    let next = 1;
    const CONCURRENCY = 8;
    function pump() {
      if (next >= FRAME_COUNT) return;
      loadImg(next++, pump);
    }
    for (let k = 0; k < CONCURRENCY; k++) pump();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawnKey = -1;
    kick();
  }
  window.addEventListener('resize', resize, { passive: true });

  function blit(src) {
    const iw = src.naturalWidth || src.width;
    const ih = src.naturalHeight || src.height;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
  function nearestImg(index) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (index - d >= 0 && imgs[index - d] && imgs[index - d].naturalWidth) return index - d;
      if (index + d < FRAME_COUNT && imgs[index + d] && imgs[index + d].naturalWidth) return index + d;
    }
    return -1;
  }
  // Рисуем только готовые битмапы — ноль синхронного декода в главном
  // потоке. Если точный кадр ещё декодируется, берём лучший готовый по
  // ходу движения и никогда не откатываемся назад (нет дёрганий).
  function draw(frameFloat) {
    const want = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frameFloat)));
    if (!supportsBitmap) { // старые браузеры: рисуем <img> напрямую
      const j = nearestImg(want);
      if (j >= 0 && j !== drawnKey) { blit(imgs[j]); drawnKey = j; }
      return;
    }
    let i = -1;
    if (bmps[want]) i = want;
    else if (drawnKey >= 0) {
      if (scrubDir >= 0) {
        for (let j = want; j > drawnKey; j--) if (bmps[j]) { i = j; break; }
      } else {
        for (let j = want; j < drawnKey; j++) if (bmps[j]) { i = j; break; }
      }
      if (i < 0) return; // дождёмся декода — он уже в пути
    } else {
      for (let d = 0; d < FRAME_COUNT && i < 0; d++) {
        if (want - d >= 0 && bmps[want - d]) i = want - d;
        else if (want + d < FRAME_COUNT && bmps[want + d]) i = want + d;
      }
      if (i < 0) { // самый первый показ: битмапов ещё нет вовсе
        const j = nearestImg(want);
        if (j >= 0) { blit(imgs[j]); drawnKey = j; }
        return;
      }
    }
    if (i === drawnKey) return;
    blit(bmps[i]);
    drawnKey = i;
  }

  function getProgress() {
    const total = wrapper.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -wrapper.getBoundingClientRect().top / total));
  }
  const ramp = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

  function updateScenes(progress) {
    // форма плавно проявляется на финальных кадрах
    const f = ramp(progress, 0.66, 0.86);
    formBlock.style.opacity = String(f);
    formBlock.style.transform = 'translateY(' + ((1 - f) * 36).toFixed(1) + 'px)';
    formBlock.style.pointerEvents = f > 0.55 ? 'auto' : 'none';
  }

  function update(now) {
    const dt = Math.min(((now || performance.now()) - lastTime) / 1000, 0.05) || 0.016;
    lastTime = now || performance.now();
    const progress = getProgress();
    updateScenes(progress);
    const targetFrame = progress * (FRAME_COUNT - 1);
    if (targetFrame > prevTarget + 0.01) scrubDir = 1;
    else if (targetFrame < prevTarget - 0.01) scrubDir = -1;
    prevTarget = targetFrame;
    const k = 1 - Math.exp(-dt / SMOOTH_TAU);
    let step = (targetFrame - displayFrame) * k;
    const maxStep = MAX_FPS * dt;
    if (step > maxStep) step = maxStep; else if (step < -maxStep) step = -maxStep;
    displayFrame += step;
    if (Math.abs(targetFrame - displayFrame) < 0.25) displayFrame = targetFrame;
    if (loadingStarted) ensureWindow(Math.round(displayFrame));
    draw(displayFrame);
    return displayFrame !== targetFrame;
  }
  function tick(now) {
    lastRafTime = now;
    const busy = update(now);
    rafId = inView && busy ? requestAnimationFrame(tick) : null;
  }
  function kick() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }
  // старт загрузки, когда секция ближе двух экранов
  function maybeStartLoading() {
    if (!loadingStarted && wrapper.getBoundingClientRect().top < window.innerHeight * 2) {
      startLoading();
    }
  }
  window.addEventListener('scroll', () => {
    maybeStartLoading();
    kick();
    if (performance.now() - lastRafTime > 120) update();
  }, { passive: true });

  // промотка активна, пока секция видна
  const io = new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
      if (entries[0].isIntersecting) startLoading();
      if (inView) { drawnKey = -1; kick(); }
      else freeAll(); // вне экрана — растровые кадры не держим
    },
    { rootMargin: '150% 0px' }
  );
  io.observe(wrapper);

  window.__vmotoScrub = window.__vmotoScrub || {};
  window.__vmotoScrub.outro = {
    get frame() { return drawnKey; },
    get decoded() { let n = 0; for (let i = 0; i < FRAME_COUNT; i++) if (bmps[i]) n++; return n; },
  };

  lastTime = performance.now();
  resize();
  maybeStartLoading();
})();

/* ============ Header: при скролле уезжает, остаётся бургер ============ */
(function headerScroll() {
  const header = document.getElementById('header');
  const fab = document.getElementById('menuFab');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > 120);
    fab.classList.toggle('is-show', y > 160);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============ Полноэкранное меню ============ */
(function fullscreenMenu() {
  const fab = document.getElementById('menuFab');
  const overlay = document.getElementById('menuOverlay');

  const menuVideo = document.getElementById('menuVideo');

  let litTimer = null;

  function setLit(on) {
    overlay.classList.toggle('is-lit', on);
  }

  function setOpen(open) {
    overlay.classList.toggle('is-open', open);
    fab.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';

    clearTimeout(litTimer);
    if (open) {
      setLit(false);
      if (menuVideo) {
        // проигрываем с начала до последнего кадра и остаёмся на нём (без loop)
        try { menuVideo.currentTime = 0; } catch (e) {}
        menuVideo.play().catch(() => {});
      }
      // пункты появляются сразу после раскрытия шторки
      litTimer = setTimeout(() => setLit(true), 250);
    } else {
      if (menuVideo) menuVideo.pause();
      setLit(false);
    }
  }
  fab.addEventListener('click', () => setOpen(!overlay.classList.contains('is-open')));
  overlay.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

/* ============ Подсветка активного пункта меню ============ */
(function scrollSpy() {
  const links = document.querySelectorAll('.nav a[href^="#"]');
  const map = new Map();
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) map.set(section, link);
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-current'));
        map.get(entry.target).classList.add('is-current');
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  map.forEach((_, section) => io.observe(section));
})();

/* ============ Reveal-анимации при скролле ============ */
(function reveals() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();

/* ============ Витрина моделей: переключение слайдов ============ */
(function showcase() {
  const slides = Array.from(document.querySelectorAll('.showcase__slide'));
  if (!slides.length) return;
  const tabs = Array.from(document.querySelectorAll('.showcase__tabs button'));
  const arrows = document.querySelectorAll('.showcase__arrow');
  let current = 0;

  function go(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      const video = slide.querySelector('video');
      if (!video) return;
      if (active) { video.play().catch(() => {}); }
      else video.pause();
    });
    tabs.forEach((tab, i) => tab.classList.toggle('is-active', i === current));
  }

  tabs.forEach((tab, i) => tab.addEventListener('click', () => go(i)));
  arrows.forEach((btn) => btn.addEventListener('click', () => go(current + Number(btn.dataset.dir))));

  // видео активной модели крутится, только пока секция на экране
  const io = new IntersectionObserver((entries) => {
    const video = slides[current].querySelector('video');
    if (!video) return;
    if (entries[0].isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, { threshold: 0.15 });
  io.observe(document.getElementById('models'));
})();

/* ============ Витрина: выбор цвета — смена видео ============ */
(function colorSwatches() {
  document.querySelectorAll('.showcase__slide').forEach((slide) => {
    const swatches = slide.querySelectorAll('.swatch');
    if (!swatches.length) return;
    const video = slide.querySelector('video');
    swatches.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-active')) return;
        swatches.forEach((b) => b.classList.toggle('is-active', b === btn));
        video.classList.add('is-swapping');
        setTimeout(() => {
          video.poster = btn.dataset.poster;
          video.src = btn.dataset.video;
          video.play().catch(() => {});
          video.addEventListener(
            'loadeddata',
            () => video.classList.remove('is-swapping'),
            { once: true }
          );
          setTimeout(() => video.classList.remove('is-swapping'), 900);
        }, 320);
      });
    });
  });
})();

/* ============ Счётчики в блоке преимуществ ============ */
(function counters() {
  const values = document.querySelectorAll('.feature-item__num b');
  if (!values.length) return;
  const DURATION = 1100;

  function animate(el) {
    const match = el.textContent.match(/^(\d+)([\s\S]*)$/);
    if (!match) return;
    const target = +match[1];
    const suffix = match[2];
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
    // страховка: гарантированно финальное значение
    setTimeout(() => { el.textContent = target + suffix; }, DURATION + 150);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        animate(entry.target);
      });
    },
    { threshold: 0.8 }
  );
  values.forEach((el) => io.observe(el));
})();

/* ============ Промо-видео: автоплей в зоне видимости ============ */
(function promo() {
  const video = document.getElementById('promoVideo');
  if (!video) return;
  const btn = document.getElementById('promoSound');

  let userMuted = false; // пользователь сам выключил звук
  let inView = false;

  function syncBtn() {
    btn.classList.toggle('is-on', !video.muted);
    btn.setAttribute('aria-label', window.i18nT ? i18nT(video.muted ? 'promo.soundOn' : 'promo.soundOff') : (video.muted ? 'Unmute' : 'Mute'));
  }

  // пытаемся играть со звуком сразу; если браузер запрещает автозвук
  // (не было ещё ни одного клика по странице) — играем без звука,
  // а звук включится при первом же жесте пользователя
  function tryPlay() {
    if (userMuted) { video.play().catch(() => {}); return; }
    video.muted = false;
    const p = video.play();
    if (p && p.catch) {
      p.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
        syncBtn();
      });
    }
    syncBtn();
  }

  const io = new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
      if (inView) tryPlay();
      else video.pause();
    },
    { threshold: 0.35 }
  );
  io.observe(video);

  // первый жест где угодно на странице снимает запрет автозвука
  function onGesture(e) {
    if (btn.contains(e.target)) return; // кнопкой управляет клик ниже
    if (!inView) return;
    if (video.muted && !userMuted) { video.muted = false; syncBtn(); }
    // строгие браузеры (iOS в энергосбережении и т.п.) блокируют даже
    // беззвучный автоплей — первый жест запускает и само видео
    if (video.paused) video.play().catch(() => {});
  }
  ['pointerdown', 'keydown', 'touchend'].forEach((t) =>
    window.addEventListener(t, onGesture, { capture: true, passive: true })
  );

  btn.addEventListener('click', () => {
    video.muted = !video.muted;
    userMuted = video.muted;
    if (!video.muted && video.paused && inView) video.play().catch(() => {});
    syncBtn();
  });
})();

/* ============ Галерея деталей ============ */
(function gallery() {
  const track = document.getElementById('galleryTrack');
  if (!track) return;
  const items = Array.from(track.querySelectorAll('.gallery__item'));
  const progress = document.getElementById('galleryProgress');
  const drawer = document.getElementById('galleryDrawer');
  const drawerImg = document.getElementById('drawerImg');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerText = document.getElementById('drawerText');
  const drawerDots = document.getElementById('drawerDots');
  let current = 0;

  // появление кадров с каскадом
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const delay = (items.indexOf(entry.target) % 3) * 120;
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
      });
    },
    { threshold: 0.25 }
  );
  items.forEach((el) => io.observe(el));

  // перетаскивание мышью
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let moved = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    // указатель НЕ захватываем сразу: захват ретаргетирует клики
    // на ленту, и кнопки внутри карточек перестают нажиматься
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (!moved && Math.abs(e.clientX - startX) > 5) {
      moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    }
    if (moved) track.scrollLeft = startScroll - (e.clientX - startX);
  });
  ['pointerup', 'pointercancel'].forEach((ev) =>
    track.addEventListener(ev, () => {
      dragging = false;
      track.classList.remove('is-dragging');
    })
  );

  // прогресс промотки
  function updateProgress() {
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    progress.style.transform = 'scaleX(' + Math.max(0.06, p).toFixed(4) + ')';
  }
  track.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  // стрелки: листаем по одной карточке
  const step = () => (items[0] ? items[0].offsetWidth + 20 : 400);
  document.querySelectorAll('.gallery__arrows .gallery__arrow').forEach((btn) => {
    btn.addEventListener('click', () => {
      track.scrollBy({ left: step() * Number(btn.dataset.dir), behavior: 'smooth' });
    });
  });

  // --- панель с подробностями ---
  items.forEach((item, i) => {
    drawerDots.appendChild(document.createElement('span'));
    const open = (e) => { e.stopPropagation(); openDrawer(i); };
    item.querySelector('.gallery__plus').addEventListener('click', open);
    item.addEventListener('click', () => { if (!moved) openDrawer(i); });
  });
  const dots = Array.from(drawerDots.children);

  function fillDrawer(i) {
    current = (i + items.length) % items.length;
    const item = items[current];
    drawerImg.src = item.querySelector('img').src;
    drawerImg.alt = item.querySelector('img').alt;
    drawerTitle.textContent = item.querySelector('figcaption b').textContent;
    drawerText.innerHTML = item.querySelector('.gallery__detail').innerHTML;
    dots.forEach((d, k) => d.classList.toggle('is-active', k === current));
  }
  function openDrawer(i) {
    fillDrawer(i);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  drawer.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeDrawer));
  drawer.querySelectorAll('[data-nav]').forEach((btn) =>
    btn.addEventListener('click', () => fillDrawer(current + Number(btn.dataset.nav)))
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
})();

/* ============ Форма (заглушка отправки) ============ */
(function leadForm() {
  const form = document.getElementById('leadForm');

  // «Другое» в локации — раскрывает поле для своего варианта
  const locSelect = document.getElementById('locationSelect');
  const locOther = document.getElementById('locationOther');
  locSelect.addEventListener('change', () => {
    const isOther = locSelect.value === 'other';
    locOther.hidden = !isOther;
    locOther.required = isOther;
    if (isOther) locOther.focus();
    else locOther.value = '';
  });

  // отправка заявки в Битрикс24: контакт + сделка в воронке VMOTO
  const B24_WEBHOOK = 'https://b24-rdq24l.bitrix24.com/rest/1/9i2i9qvtic4ffp80/';
  const B24_PIPELINE_VMOTO = 2; // ID воронки VMOTO
  const t = (key, fallback) => (window.i18nT ? i18nT(key) : fallback);

  let status = form.querySelector('.cta-form__status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'cta-form__status';
    form.appendChild(status);
  }

  const b24 = (method, fields) =>
    fetch(B24_WEBHOOK + method + '.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    }).then((r) => r.json());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    const messenger = form.elements.messenger.value;
    let location = form.elements.location.value;
    if (location === 'other') location = form.elements.locationOther.value.trim() || 'Other';
    const comments = 'Мессенджер: ' + messenger + '\nЛокация: ' + location +
      '\nЯзык сайта: ' + document.documentElement.lang.toUpperCase();

    btn.disabled = true;
    btn.textContent = t('form.sending', 'Sending…');
    status.textContent = '';

    b24('crm.contact.add', {
      NAME: name,
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      SOURCE_ID: 'WEB',
      COMMENTS: comments
    })
      .then((c) => {
        if (!c || !c.result) throw new Error((c && c.error_description) || 'contact failed');
        return b24('crm.deal.add', {
          TITLE: 'Заявка с сайта — ' + name,
          CATEGORY_ID: B24_PIPELINE_VMOTO,
          CONTACT_ID: c.result,
          SOURCE_ID: 'WEB',
          SOURCE_DESCRIPTION: 'Форма на лендинге',
          COMMENTS: comments
        });
      })
      .then((d) => {
        if (!d || !d.result) throw new Error((d && d.error_description) || 'deal failed');
        btn.textContent = t('form.sent', 'Request sent');
        form.querySelectorAll('input, select').forEach((el) => { el.disabled = true; });
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = t('form.send', 'Send');
        status.textContent = t('form.error', 'Could not send — please message us on WhatsApp');
      });
  });
})();

/* ============ Карта станций: тёмный Leaflet в стиле мини-аппа ============ */
(function stationsMap() {
  const el = document.getElementById('stMap');
  if (!el || !window.L) return;

  const map = L.map(el, {
    center: [9.7385, 100.018],
    zoom: 11,
    zoomSnap: 0.25,
    minZoom: 10,
    maxZoom: 14,
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,   // не перехватываем скролл страницы
    doubleClickZoom: false,
    touchZoom: false,
    keyboard: false,
    dragging: !L.Browser.mobile
  });

  // кадрируем остров справа от стеклянной панели (на мобильных — по центру)
  const ISLAND = L.latLngBounds([[9.648, 99.92], [9.818, 100.1]]);
  function frame() {
    map.invalidateSize();
    const wide = window.innerWidth > 960;
    map.fitBounds(ISLAND, {
      // на мобильных остров вписывается в нижнее окно под стеклянной панелью
      paddingTopLeft: wide ? [Math.min(700, window.innerWidth * 0.42), 48] : [20, Math.max(24, el.clientHeight - 360)],
      paddingBottomRight: wide ? [64, 48] : [20, 40]
    });
  }
  setTimeout(frame, 0);
  window.addEventListener('resize', frame, { passive: true });

  // тёмные тайлы без подписей (CARTO dark_nolabels, бесплатно, без ключа)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // точки будущих станций
  const POINTS = [
    [9.7861, 99.9705],  // Zen Beach
    [9.7712, 99.9694],  // Srithanu
    [9.7134, 99.9899],  // Thong Sala
    [9.6772, 100.0670], // Haad Rin
    [9.7996, 100.0136]  // Chaloklum
  ];
  POINTS.forEach((ll) => {
    L.marker(ll, {
      icon: L.divIcon({ className: 'st-marker', iconSize: [12, 12], iconAnchor: [6, 6] }),
      interactive: false,
      keyboard: false
    }).addTo(map);
  });

  // подпись острова, как в референсе
  L.marker([9.744, 100.022], {
    icon: L.divIcon({ className: 'st-isle-label', html: 'Ko Pha-ngan', iconSize: [110, 16], iconAnchor: [55, 8] }),
    interactive: false
  }).addTo(map);

  document.getElementById('stZoomIn')?.addEventListener('click', () => map.zoomIn());
  document.getElementById('stZoomOut')?.addEventListener('click', () => map.zoomOut());
})();

/* ============ Business Solutions: закреплённые сцены по сегментам ============ */
(function b2bSlider() {
  const wrap = document.getElementById('b2bScroll');
  if (!wrap) return;
  const slides = [...wrap.querySelectorAll('.b2b-slide')];
  const cats = [...wrap.querySelectorAll('.b2b-head__cats .label')];
  const N = slides.length;
  if (N < 2) return;

  const ramp = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const ease = (x) => x * x * (3 - 2 * x); // smoothstep

  const TW = 0.16; // полуширина зоны перехода (в «слайдах»)

  function update() {
    const total = wrap.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const r = wrap.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const x = p * (N - 1); // позиция в «слайдах»

    slides.forEach((s, k) => {
      // вес слайда: появляется на границе k-0.5, исчезает на k+0.5
      const tin = k === 0 ? 1 : ease(ramp(x, k - 0.5 - TW, k - 0.5 + TW));
      const tout = k === N - 1 ? 0 : ease(ramp(x, k + 0.5 - TW, k + 0.5 + TW));
      const w = tin * (1 - tout);
      s.style.opacity = String(w);
      s.style.pointerEvents = w > 0.5 ? 'auto' : 'none';

      // камера: чётные наезжают, нечётные приближаются из глубины
      const local = ramp(x, k - 0.5, k + 0.5);
      const bg = s.querySelector('.b2b-slide__bg');
      bg.style.transform = k % 2 === 0
        ? 'scale(' + (1.02 + local * 0.1).toFixed(4) + ')'
        : 'scale(' + (1.14 - local * 0.11).toFixed(4) + ')';

      // текст: входит позже кадра, уходит раньше
      const inner = s.querySelector('.b2b-slide__inner');
      const cin = k === 0 ? 1 : ease(ramp(x, k - 0.42, k - 0.18));
      const cout = k === N - 1 ? 0 : ease(ramp(x, k + 0.18, k + 0.42));
      inner.style.opacity = String(cin * (1 - cout));
      inner.style.transform = 'translateY(' + (((1 - cin) * 34) - cout * 34).toFixed(1) + 'px)';
    });

    // категория над заголовком следует за активной сценой
    const idx = Math.max(0, Math.min(N - 1, Math.round(x)));
    cats.forEach((el, k) => el.classList.toggle('is-active', k === idx));

  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

/* ============ FAQ: байкер едет синхронно со скроллом ============ */
(function faqRide() {
  const list = document.querySelector('.faq__list');
  const wrap = document.getElementById('faqScroll');
  if (!list || !wrap) return;
  const items = [...list.querySelectorAll('.faq__item')];
  const rider = document.getElementById('faqRider');
  const trail = list.querySelector('.faq__trail');
  if (!rider || !trail || !items.length) return;

  const N = items.length;
  const TAU = 0.1; // сек: демпфер движения
  let displayY = 0;
  let overrideY = null; // цель после ручного клика (до следующего скролла)
  let programmatic = false;
  let rafId = null;
  let lastT = 0;

  // стопы трека по «закрытой» геометрии (только высоты вопросов):
  // позиции стабильны во время анимаций высоты, поэтому цель монотонна
  // при скролле в обе стороны — байк не застревает и не пятится
  function stops() {
    const arr = [];
    let acc = 1; // верхний бордер первого вопроса
    for (const d of items) {
      const h = d.querySelector('summary').offsetHeight;
      arr.push(acc + h / 2);
      acc += h + 1;
    }
    // финиш: конец реального трека (с открытым последним ответом)
    arr.push(list.getBoundingClientRect().height - 4);
    return arr;
  }

  function progress() {
    const total = wrap.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / total));
  }

  // позиция байка — линейная интерполяция между стопами по прогрессу скролла:
  // к вопросу он подъезжает ровно в момент открытия
  function scrollTarget() {
    const S = stops();
    const t = progress() * (S.length - 1);
    const i = Math.min(S.length - 2, Math.floor(t));
    return S[i] + (S[i + 1] - S[i]) * (t - i);
  }

  function setActive(idx) {
    if (items[idx].open) return;
    programmatic = true;
    items.forEach((d, k) => { d.open = k === idx; });
    programmatic = false;
  }

  function apply(y) {
    rider.style.setProperty('--y', y.toFixed(1) + 'px');
    trail.style.height = y.toFixed(1) + 'px';
  }

  function tick(now) {
    const dt = Math.min(((now || performance.now()) - lastT) / 1000, 0.05) || 0.016;
    lastT = now || performance.now();
    const target = overrideY !== null ? overrideY : scrollTarget();
    const k = 1 - Math.exp(-dt / TAU);
    displayY += (target - displayY) * k;
    if (Math.abs(target - displayY) < 0.3) displayY = target;
    apply(displayY);
    rafId = displayY !== target || overrideY !== null ? requestAnimationFrame(tick) : null;
  }
  function kick() { if (rafId === null) rafId = requestAnimationFrame(tick); }

  function onScroll() {
    const r = wrap.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    overrideY = null; // скролл возвращает управление скрабу
    setActive(Math.min(N - 1, Math.floor(progress() * N)));
    kick();
    // страховка: rAF молчит — обновимся напрямую
    if (performance.now() - lastT > 120) { displayY = scrollTarget(); apply(displayY); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { displayY = scrollTarget(); apply(displayY); }, { passive: true });

  // ручной клик: байк едет к выбранному вопросу (до следующего скролла)
  items.forEach((d, i) => {
    d.addEventListener('toggle', () => {
      if (programmatic) return;
      if (d.open) {
        programmatic = true;
        items.forEach((x, k) => { if (k !== i) x.open = false; });
        programmatic = false;
        const l = list.getBoundingClientRect();
        const s = d.querySelector('summary').getBoundingClientRect();
        overrideY = s.top - l.top + s.height / 2;
        kick();
        setTimeout(() => { if (overrideY !== null) { const s2 = d.querySelector('summary').getBoundingClientRect(); const l2 = list.getBoundingClientRect(); overrideY = s2.top - l2.top + s2.height / 2; kick(); } }, 600);
      }
    });
  });

  // старт
  programmatic = true;
  items.forEach((d, k) => { d.open = k === 0; });
  programmatic = false;
  displayY = scrollTarget();
  apply(displayY);
})();

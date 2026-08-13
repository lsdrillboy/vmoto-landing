/* При перезагрузке всегда открываем страницу с начала: скролл-сцены
   рассчитаны на просмотр сверху, восстановление позиции ломает их. */
(function startAtTop() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: 'instant' });
})();

/* ==== B2B-режим «мотопарк»: заголовки формы и пометка заявки ====
   Включается ссылкой из бизнес-секции, путём /fleet или параметром ?fleet=1
   (рекламные кампании ведут владельцев бизнеса именно сюда). */
window.__fleetMode = false;
function enableFleetMode() {
  window.__fleetMode = true;
  const t = window.i18nT;
  if (!t) return;
  const title = document.querySelector('#outroForm .contacts__title');
  const sub = document.querySelector('#outroForm .contacts__sub');
  if (title) {
    title.removeAttribute('data-i18n-html');
    title.setAttribute('data-i18n', 'fleet.formTitle');
    title.textContent = t('fleet.formTitle');
  }
  if (sub) { sub.setAttribute('data-i18n', 'fleet.formSub'); sub.textContent = t('fleet.formSub'); }
}
(function fleetEntry() {
  const wantsFleet = /\/fleet\/?$/.test(location.pathname)
    || /[?&]fleet=1/.test(location.search);
  if (!wantsFleet) return;
  // скрипт подключён в конце body: DOM и i18n уже готовы, ждать load
  // нельзя — на проде он наступает только после загрузки сотен кадров
  enableFleetMode();
  // убираем /fleet и ?fleet=1 из адресной строки — режим уже применён
  const clean = location.pathname.replace(/\/?fleet\/?$/, '');
  history.replaceState(null, '', (clean || '/') + location.hash);
  const biz = document.getElementById('business');
  if (biz) {
    window.scrollTo({ top: biz.offsetTop, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
    biz.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }
})();

/* ==== Якорь Contacts: сразу к форме (конец кино-секции), а не к её началу ==== */
(function contactsAnchor() {
  document.querySelectorAll('a[href="#contacts"]').forEach((a) => {
    a.addEventListener('click', () => {
      if (a.hasAttribute('data-fleet')) enableFleetMode();
    });
  });
})();

/* ==== Страховка якорей: раскрываем reveal-элементы секции назначения,
   даже если пользователь попал туда без «правильного» скролла ==== */
(function anchorNav() {
  const padding = 92; // высота шапки, как scroll-padding-top в CSS
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      // прокручиваем сами: браузер иначе допишет #якорь в адресную строку
      e.preventDefault();
      const top = id === 'hero' ? 0 : target.getBoundingClientRect().top + window.scrollY - padding;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      // контент секции показываем, даже если пользователь «телепортировался»
      setTimeout(() => {
        target.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      }, 700);
    });
  });
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

  // чипы: мессенджеров можно выбрать несколько, локация — одна
  const locOther = document.getElementById('locationOther');
  form.querySelectorAll('.pick').forEach((group) => {
    const hidden = group.querySelector('input[type="hidden"]');
    const multi = group.id === 'pickMessenger';
    const btns = [...group.querySelectorAll('.pick__btn')];
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (multi) {
          btn.classList.toggle('is-active');
          hidden.value = btns.filter((b) => b.classList.contains('is-active'))
            .map((b) => b.dataset.value).join(', ');
          return;
        }
        hidden.value = btn.dataset.value;
        btns.forEach((b) => b.classList.toggle('is-active', b === btn));
        const isOther = hidden.value === 'other';
        locOther.hidden = !isOther;
        locOther.required = isOther;
        if (isOther) locOther.focus();
        else locOther.value = '';
      });
    });
  });

  // отправка заявки через серверный прокси /api/lead:
  // вебхук Битрикс24 живёт в env Vercel и в браузер не попадает
  const t = (key, fallback) => (window.i18nT ? i18nT(key) : fallback);

  let status = form.querySelector('.cta-form__status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'cta-form__status';
    form.appendChild(status);
  }

  // закрытие модального окна успеха
  const successModal = document.getElementById('formSuccess');
  function closeSuccess() {
    if (!successModal || successModal.hidden) return;
    successModal.classList.remove('is-on');
    setTimeout(() => { successModal.hidden = true; }, 350);
  }
  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal || e.target.closest('.success-modal__close')) closeSuccess();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSuccess(); });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    const messenger = form.elements.messenger.value;
    let location = form.elements.location.value;
    if (!messenger || !location) {
      status.textContent = t('form.choose', 'Please choose a messenger and location');
      return;
    }
    if (location === 'other') location = form.elements.locationOther.value.trim() || 'Other';

    btn.disabled = true;
    btn.textContent = t('form.sending', 'Sending…');
    status.textContent = '';

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        phone: phone,
        messenger: messenger,
        location: location,
        lang: document.documentElement.lang,
        fleet: window.__fleetMode === true
      })
    })
      .then((r) => r.json().catch(() => null).then((data) => ({ httpOk: r.ok, data })))
      .then(({ httpOk, data }) => {
        if (!httpOk || !data || !data.ok) throw new Error((data && data.error) || 'submit failed');
        const leadType = window.__fleetMode ? 'fleet' : 'retail';
        if (window.fbq) fbq('track', 'Lead', { content_category: leadType });
        if (window.gtag) gtag('event', 'generate_lead', { lead_type: leadType });
        // модальное окно успеха + сброс формы под ним
        const ok = document.getElementById('formSuccess');
        if (ok) {
          ok.hidden = false;
          requestAnimationFrame(() => ok.classList.add('is-on'));
        }
        form.reset();
        form.querySelectorAll('.pick__btn').forEach((b) => b.classList.remove('is-active'));
        form.querySelectorAll('.pick input[type="hidden"]').forEach((i) => { i.value = ''; });
        locOther.hidden = true;
        locOther.required = false;
        btn.disabled = false;
        btn.textContent = t('form.send', 'Send');
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = t('form.send', 'Send');
        status.textContent = t('form.error', 'Could not send — please message us on WhatsApp');
      });
  });
})();

/* ==== Meta Pixel: клик по мессенджеру — событие Contact ==== */
(function pixelContacts() {
  document.querySelectorAll('a[href*="wa.me"], a[href*="t.me"], a[href*="m.me"]').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.fbq) fbq('track', 'Contact');
      if (window.gtag) {
        const via = a.href.includes('wa.me') ? 'whatsapp' : a.href.includes('t.me') ? 'telegram' : 'messenger';
        gtag('event', 'contact_click', { method: via });
      }
    });
  });
})();

/* ==== Messenger: m.me не умеет готовый текст в ссылке — копируем
   локализованное приветствие в буфер и подсказываем вставить ==== */
(function fbGreeting() {
  const btn = document.getElementById('msgrFb');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const t = window.i18nT;
    const text = t ? t('msgr.hello') : 'Hi! I’m interested in VMoto electric bikes.';
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = t ? t('fb.copied') : 'Greeting copied — paste it in the chat';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-on'));
    setTimeout(() => { toast.classList.remove('is-on'); setTimeout(() => toast.remove(), 400); }, 2600);
  });
})();

/* ============ Карта станций: тёмный Leaflet в стиле мини-аппа ============ */
(function stationsMap() {
  const el = document.getElementById('stMap');
  if (!el || !window.L) return;
  // Leaflet и тайлы не грузим при открытии страницы — только когда
  // секция станций на подходе (минус ~1–2 МБ у первой загрузки)
  let inited = false;
  function initMap() {
    if (inited) return;
    inited = true;


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
  }
  const lazyIo = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { initMap(); lazyIo.disconnect(); }
  }, { rootMargin: '900px 0px' });
  const section = document.getElementById('stations') || el;
  lazyIo.observe(section);
  // страховка на случай молчащего IntersectionObserver
  function maybeInit() {
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    if (!inited && section.getBoundingClientRect().top < vh * 2) initMap();
  }
  window.addEventListener('scroll', maybeInit, { passive: true });
  maybeInit();
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

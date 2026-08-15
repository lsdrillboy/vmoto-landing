/* Плавающий бургер и полноэкранное меню — то же, что на лендинге.
   Стили и поведение перенесены из style.css / main.js, чтобы страницы
   вели себя один в один: при прокрутке шапка уезжает вверх, справа
   появляется бургер, он раскрывает меню занавесом.
   Используется генераторами build-pages.mjs и build-legal.mjs. */

export const MENU_CSS = `
    /* шапка уезжает вверх при прокрутке — её место занимает бургер */
    .site-header { transition: transform .5s cubic-bezier(.22, 1, .36, 1), background .3s, border-color .3s; }
    .site-header.is-hidden { transform: translateY(-100%); }

    .menu-fab {
      position: fixed;
      top: 22px;
      right: clamp(20px, 2.5vw, 40px);
      z-index: 320;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, .22);
      background: rgba(10, 11, 10, .55);
      backdrop-filter: blur(10px);
      cursor: pointer;
      display: grid;
      place-items: center;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: opacity .35s, visibility .35s, transform .35s, border-color .25s, background .25s;
    }
    .menu-fab.is-show, .menu-fab.is-open { opacity: 1; visibility: visible; transform: none; }
    .menu-fab:hover { border-color: var(--accent); background: rgba(217, 79, 61, .15); }
    .menu-fab span {
      display: block;
      width: 22px;
      height: 1.5px;
      background: var(--text);
      grid-area: 1 / 1;
      transition: transform .35s cubic-bezier(.22, 1, .36, 1);
    }
    .menu-fab span:first-child { transform: translateY(-4px); }
    .menu-fab span:last-child { transform: translateY(4px); }
    .menu-fab.is-open span:first-child { transform: rotate(45deg); }
    .menu-fab.is-open span:last-child { transform: rotate(-45deg); }

    /* занавес: раскрывается сверху вниз, закрывается обратно вверх */
    .menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 310;
      background:
        radial-gradient(60% 50% at 78% 20%, rgba(217, 79, 61, .08), transparent 65%),
        linear-gradient(rgba(8, 9, 8, .82), rgba(8, 9, 8, .82)),
        #080908 url('/assets/poster/menu.jpg') center / cover no-repeat;
      backdrop-filter: blur(18px);
      clip-path: inset(0 0 100% 0);
      visibility: hidden;
      transition: clip-path .8s cubic-bezier(.76, 0, .24, 1), visibility 0s linear .8s;
    }
    .menu-overlay.is-open {
      clip-path: inset(0 0 0% 0);
      visibility: visible;
      transition: clip-path 1s cubic-bezier(.16, 1, .3, 1);
    }
    /* акцентная нить бежит по нижней кромке занавеса */
    .menu-overlay::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent) 18%, #fff 50%, var(--accent) 82%, transparent);
      box-shadow: 0 0 26px rgba(217, 79, 61, .85);
      opacity: 0;
      transform: translateY(0);
      pointer-events: none;
      z-index: 2;
      transition: transform .8s cubic-bezier(.76, 0, .24, 1), opacity .3s ease .5s;
    }
    .menu-overlay.is-open::after {
      opacity: 1;
      transform: translateY(100vh);
      transition: transform 1s cubic-bezier(.16, 1, .3, 1), opacity .25s ease;
    }
    .menu-overlay__media {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      opacity: 0;
      transform: scale(1.1);
      transition: opacity .35s ease, transform .5s ease;
    }
    .menu-overlay.is-open .menu-overlay__media {
      opacity: 1;
      transform: none;
      transition: opacity .9s ease .15s, transform 1.6s cubic-bezier(.16, 1, .3, 1) .15s;
    }
    .menu-overlay__media video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .menu-overlay__media::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(8, 9, 8, .78) 0%, rgba(8, 9, 8, .35) 55%, rgba(8, 9, 8, .2) 100%),
        linear-gradient(180deg, rgba(8, 9, 8, .45) 0%, transparent 30%, transparent 62%, rgba(8, 9, 8, .72) 100%);
    }
    .menu-overlay__inner {
      position: relative;
      z-index: 1;
      height: 100%;
      width: min(1240px, 100% - 48px);
      margin-inline: auto;
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      grid-template-rows: 1fr auto;
      align-items: center;
      gap: 40px clamp(40px, 6vw, 96px);
      padding: 90px 0 44px;
    }
    .menu-overlay__nav { display: grid; gap: clamp(6px, 1.6vh, 16px); grid-column: 1; grid-row: 1; }
    .menu-overlay__nav a { display: block; width: fit-content; text-decoration: none; }
    /* пункты проявляются светом, когда занавес прошёл треть пути */
    .menu-overlay__nav b {
      display: inline-block;
      font-family: var(--heading-font);
      font-weight: 500;
      font-size: clamp(30px, 5.4vh, 60px);
      line-height: 1.08;
      color: rgba(242, 241, 238, .82);
      opacity: 0;
      filter: blur(12px) brightness(2.2);
      transform: translateY(26px);
      transition: opacity .3s ease, filter .3s ease, transform .3s ease, color .25s;
    }
    .menu-overlay.is-lit .menu-overlay__nav b {
      opacity: 1;
      filter: none;
      transform: none;
      transition:
        opacity .95s ease var(--d, 0s),
        filter .95s ease var(--d, 0s),
        transform 1.05s cubic-bezier(.16, 1, .3, 1) var(--d, 0s),
        color .25s;
    }
    .menu-overlay__nav a:hover b { color: var(--accent); }
    .menu-overlay__nav a:nth-child(1) b { --d: 0s; }
    .menu-overlay__nav a:nth-child(2) b { --d: .09s; }
    .menu-overlay__nav a:nth-child(3) b { --d: .18s; }
    .menu-overlay__nav a:nth-child(4) b { --d: .27s; }
    .menu-overlay__nav a:nth-child(5) b { --d: .36s; }
    .menu-overlay__nav a:nth-child(6) b { --d: .45s; }
    .menu-overlay__nav a:nth-child(7) b { --d: .54s; }
    .menu-overlay__aside {
      grid-column: 1 / -1;
      grid-row: 2;
      display: flex;
      align-items: center;
      gap: 36px;
      flex-wrap: wrap;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity .5s ease .3s, transform .5s cubic-bezier(.22, 1, .36, 1) .3s;
    }
    .menu-overlay.is-lit .menu-overlay__aside { opacity: 1; transform: none; }
    .menu-overlay__label {
      margin: 0;
      font-size: 11px;
      font-weight: 400;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .menu-overlay__social { margin: 0; font-size: 13px; color: var(--muted); }
    .menu-overlay__social a { color: inherit; text-decoration: none; transition: color .2s; }
    .menu-overlay__social a:hover { color: var(--accent); }
    .menu-overlay__lang { display: flex; gap: 8px; }
    .menu-overlay__lang button, .menu-overlay__lang a {
      display: inline-block;
      min-width: 44px;
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, .22);
      border-radius: 999px;
      background: transparent;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      color: var(--muted);
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .06em;
      transition: color .2s, border-color .2s;
    }
    .menu-overlay__lang button:hover, .menu-overlay__lang a:hover { color: var(--text); border-color: rgba(255, 255, 255, .45); }
    .menu-overlay__lang .is-active { color: var(--accent); border-color: var(--accent); }

    @media (max-width: 880px) {
      /* семь пунктов в строку не помещаются — уходим в бургер раньше */
      .page-nav, .header-social { display: none; }
      .header-inner { grid-template-columns: auto 1fr; }
      .header-right { grid-column: 2; justify-self: end; margin-right: 52px; }
      .menu-fab { opacity: 1; visibility: visible; transform: none; top: 12px; }
    }
    @media (max-width: 700px) {
      .menu-overlay__inner { grid-template-columns: 1fr; padding: 96px 0 36px; }
    }
`;

/* links: [{ href, label, anchor }], lang: готовая разметка кнопок/ссылок */
export const menuMarkup = ({ links, lang, label, menuAria }) => `  <button class="menu-fab" id="menuFab" aria-label="${menuAria}" aria-expanded="false">
    <span></span><span></span>
  </button>

  <div class="menu-overlay" id="menuOverlay" aria-hidden="true">
    <div class="menu-overlay__media" aria-hidden="true">
      <video id="menuVideo" src="/assets/video/menu.mp4" poster="/assets/poster/menu.jpg" muted playsinline preload="none"></video>
    </div>
    <div class="menu-overlay__inner">
      <nav class="menu-overlay__nav">
${links.map((l) => `        <a href="${l.href}"${l.anchor ? ` data-anchor="${l.anchor}"` : ''}><b${l.key ? ` data-f="${l.key}"` : ''}>${l.label}</b></a>`).join('\n')}
      </nav>
      <div class="menu-overlay__aside">
        <p class="menu-overlay__label"${label.key ? ` data-f="${label.key}"` : ''}>${label.text}</p>
        <div class="menu-overlay__lang">${lang}</div>
        <p class="menu-overlay__social"><a href="https://www.facebook.com/profile.php?id=61592273703567" target="_blank" rel="noopener">Facebook</a></p>
      </div>
    </div>
  </div>
`;

/* поведение: пороги прокрутки те же, что в main.js лендинга */
export const MENU_JS = `
      const header = document.querySelector('.site-header');
      const fab = document.getElementById('menuFab');
      const overlay = document.getElementById('menuOverlay');
      const menuVideo = document.getElementById('menuVideo');
      let litTimer = null;

      const onScroll = () => {
        const y = window.scrollY;
        header.classList.toggle('is-scrolled', y > 40);
        header.classList.toggle('is-hidden', y > 120 && !overlay.classList.contains('is-open'));
        fab.classList.toggle('is-show', y > 160);
      };
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      function setMenu(open) {
        overlay.classList.toggle('is-open', open);
        fab.classList.toggle('is-open', open);
        fab.setAttribute('aria-expanded', String(open));
        overlay.setAttribute('aria-hidden', String(!open));
        document.body.style.overflow = open ? 'hidden' : '';
        clearTimeout(litTimer);
        overlay.classList.remove('is-lit');
        if (open) {
          if (menuVideo) { try { menuVideo.currentTime = 0; } catch (e) {} menuVideo.play().catch(() => {}); }
          litTimer = setTimeout(() => overlay.classList.add('is-lit'), 320);
        } else if (menuVideo) {
          menuVideo.pause();
        }
      }

      fab.addEventListener('click', () => setMenu(!overlay.classList.contains('is-open')));
      overlay.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
      addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
`;

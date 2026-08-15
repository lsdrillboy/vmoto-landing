/* Генератор юридических страниц: privacy.html и terms.html.
   Формат — как на canvasspv.com/privacy: липкая шапка с переключателем
   языков, надзаголовок, нумерованные разделы с разделителями, блок
   реквизитов. Четыре языка живут в одном файле и переключаются без
   перезагрузки; выбор пишется в тот же ключ localStorage, что и на
   лендинге ('vmoto-lang'). Запуск: node scripts/build-legal.mjs */
import { writeFileSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const LANGS_ALL = ['en', 'th', 'ru', 'zh'];

/* словарь лендинга: подписи подвала уже переведены там */
const sandbox = {
  window: {},
  navigator: { languages: ['en'], language: 'en' },
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    documentElement: { getAttribute: () => null, setAttribute: () => {}, lang: 'en' },
    title: '', querySelector: () => null, querySelectorAll: () => [],
    getElementById: () => null, addEventListener: () => {},
  },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync('i18n.js', 'utf8'), sandbox);
const DICT = sandbox.window.__DICT;
if (!DICT || !DICT.ru) throw new Error('DICT не извлечён из i18n.js');

/* подписи подвала по языкам — подставляются переключателем без перезагрузки */
const FOOT_KEYS = ['footer.locations', 'loc.samui', 'loc.phangan', 'footer.contacts',
  'footer.messengers', 'footer.navigation', 'footer.compare', 'footer.fleets',
  'footer.faqPage', 'footer.copy', 'footer.dealer', 'footer.privacy', 'footer.terms',
  'footer.top', 'nav.models', 'b2b.label', 'lang.aria'];
const HOME = { en: 'Home', ru: 'Главная', th: 'หน้าแรก', zh: '首页' };
const FAQ_NAV = { en: 'FAQ', ru: 'Вопросы', th: 'คำถามที่พบบ่อย', zh: '常见问题' };
const FOOT = Object.fromEntries(LANGS_ALL.map((l) => [l, {
  ...Object.fromEntries(FOOT_KEYS.map((k) => [k, (DICT[l] && DICT[l][k]) || DICT.en[k]])),
  home: HOME[l],
  faq: FAQ_NAV[l],
}]));

const SITE = 'https://www.vmotobikes.com';
const COMPANY = 'CANVAS SPV Co., Ltd';
const ADDRESS = '52/57 Moo 1, Na Jomtien Subdistrict,<br>Sattahip District, Chonburi Province 20250, Thailand';
const PHONE = '+66 96 224 4666';
const LANGS = LANGS_ALL;

const UI = {
  back: { en: 'Back', th: 'กลับ', ru: 'Назад', zh: '返回' },
  privacy: { en: 'Privacy Policy', th: 'นโยบายความเป็นส่วนตัว', ru: 'Политика конфиденциальности', zh: '隐私政策' },
  terms: { en: 'Terms of Use', th: 'ข้อกำหนดการใช้งาน', ru: 'Пользовательское соглашение', zh: '使用条款' },
};

const shell = ({ slug, title, desc, docs }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${SITE}/${slug}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="VMOTO">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${SITE}/${slug}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/img/favicon-96.png" type="image/png" sizes="96x96">
  <link rel="icon" href="/assets/img/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <meta name="theme-color" content="#0a0b0a">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&family=Manrope:wght@400;500;600&family=Michroma&family=Kanit:wght@400;600&family=Noto+Sans+SC:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0b0a;
      --surface: #101211;
      --text: #f2f1ee;
      --muted: rgba(242, 241, 238, .52);
      --body: rgba(242, 241, 238, .78);
      --line: rgba(255, 255, 255, .09);
      --accent: #d94f3d;
      --heading-font: 'Exo 2', 'Kanit', 'Noto Sans SC', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', 'Kanit', 'Noto Sans SC', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    /* шапка повторяет лендинг: фиксированная, фон появляется при прокрутке */
    .site-header {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: 100;
      border-bottom: 1px solid transparent;
      transition: background .3s, border-color .3s;
    }
    .site-header.is-scrolled {
      background: rgba(10, 11, 10, .82);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom-color: var(--line);
    }
    .header-inner {
      width: min(1360px, 100% - 72px);
      margin-inline: auto;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 24px;
      padding: 26px 0;
    }
    .logo {
      justify-self: start;
      display: inline-flex;
      align-items: center;
      gap: .5em;
      font-family: 'Michroma', 'Exo 2', sans-serif;
      font-weight: 400;
      font-size: 15px;
      letter-spacing: .14em;
      -webkit-text-stroke: .028em currentColor;
      text-decoration: none;
      color: var(--text);
    }
    .logo img { height: 1.15em; width: auto; display: block; transform: translateY(-.04em); }
    .page-nav { display: flex; gap: 32px; }
    .page-nav a {
      font-size: 12px;
      letter-spacing: .12em;
      text-transform: uppercase;
      text-decoration: none;
      white-space: nowrap;
      color: var(--text);
      transition: color .2s;
    }
    .page-nav a:hover { color: var(--accent); }
    .header-right { justify-self: end; display: flex; align-items: center; gap: 14px; }

    .lang { position: relative; }
    .lang__btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 12px;
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 999px;
      background: rgba(10, 11, 10, .42);
      backdrop-filter: blur(8px);
      cursor: pointer;
      color: var(--text);
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .08em;
      transition: color .2s, border-color .2s;
    }
    .lang__btn:hover { color: var(--accent); border-color: rgba(217, 79, 61, .6); }
    .lang__btn > svg:first-child, .lang__chev { color: var(--accent); }
    .lang__chev { transition: transform .25s; }
    .lang:hover .lang__chev, .lang:focus-within .lang__chev { transform: rotate(180deg); }
    .lang__list {
      position: absolute;
      top: calc(100% + 10px);
      left: 50%;
      min-width: 74px;
      padding: 6px;
      margin: 0;
      list-style: none;
      background: rgba(12, 13, 12, .92);
      backdrop-filter: blur(16px);
      border: 1px solid var(--line);
      border-radius: 14px;
      opacity: 0;
      visibility: hidden;
      transform: translate(-50%, -6px);
      transition: opacity .25s, visibility .25s, transform .25s;
      z-index: 200;
    }
    .lang:hover .lang__list, .lang:focus-within .lang__list { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
    .lang__list button {
      display: block;
      width: 100%;
      padding: 9px 12px;
      border: none;
      border-radius: 9px;
      background: none;
      cursor: pointer;
      text-align: center;
      color: var(--muted);
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      transition: color .2s, background .2s;
    }
    .lang__list button:hover { color: var(--text); background: rgba(255, 255, 255, .06); }
    .lang__list button.active { color: var(--accent); }
    .header-social {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, .14);
      background: rgba(10, 11, 10, .42);
      backdrop-filter: blur(8px);
      color: var(--accent);
      transition: color .2s, border-color .2s, transform .2s;
    }
    .header-social:hover { color: var(--text); border-color: rgba(217, 79, 61, .6); transform: translateY(-1px); }

    .page-wrap { max-width: 800px; margin: 0 auto; padding: 138px 32px 100px; }
    .page-eyebrow {
      font-family: var(--heading-font);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 16px;
    }
    .page-title {
      font-family: var(--heading-font);
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 700;
      letter-spacing: -.02em;
      text-transform: uppercase;
      line-height: 1.15;
      margin-bottom: 12px;
    }
    .page-meta {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--line);
    }
    .page-intro { font-size: 16px; line-height: 1.75; color: var(--body); margin-bottom: 48px; }

    .section-title {
      font-family: var(--heading-font);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--text);
      margin: 48px 0 16px;
      padding-top: 32px;
      border-top: 1px solid var(--line);
    }
    .section-title:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }
    p { font-size: 15px; color: var(--body); margin-bottom: 12px; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    li { font-size: 15px; color: var(--body); margin-bottom: 6px; }
    strong { color: var(--text); font-weight: 600; }
    a { color: var(--accent); }

    .company-block {
      border-left: 3px solid var(--accent);
      padding: 16px 20px;
      margin: 16px 0;
      background: rgba(217, 79, 61, .06);
      border-radius: 0 8px 8px 0;
    }
    .company-block strong { display: block; margin-bottom: 4px; }
    .company-block span { font-size: 14px; color: var(--muted); line-height: 1.6; }

    /* подвал повторяет подвал лендинга — правила перенесены из style.css */
    .container { width: min(1240px, 100% - 48px); margin-inline: auto; }
    .footer {
      border-top: 1px solid var(--line);
      padding: clamp(48px, 6vw, 84px) 0 36px;
      background: #070808;
    }
    .footer__brand {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 28px;
      flex-wrap: wrap;
      margin-bottom: clamp(60px, 7.5vw, 100px);
    }
    .footer__brand .logo { font-size: 17px; }
    .footer__tag {
      text-align: right;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--muted);
      line-height: 1.8;
      margin: 0;
    }
    .footer__grid { display: grid; grid-template-columns: repeat(4, 1fr) auto; gap: 36px 44px; align-items: start; }
    .footer__label {
      font-size: 11px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 600;
      margin: 0;
    }
    .footer__col ul { display: grid; gap: 11px; margin: 22px 0 0; padding: 0; list-style: none; }
    .footer__col li { font-size: 14.5px; color: rgba(242, 241, 238, .85); margin: 0; }
    .footer__col li a {
      text-decoration: none;
      color: inherit;
      padding-bottom: 2px;
      background-image: linear-gradient(currentColor, currentColor);
      background-size: 0% 1px;
      background-repeat: no-repeat;
      background-position: 0 100%;
      transition: color .25s, background-size .35s cubic-bezier(.22, 1, .36, 1);
    }
    .footer__col li a:hover { color: var(--text); background-size: 100% 1px; }
    .footer__col li i {
      font-style: normal;
      display: inline-block;
      color: var(--muted);
      font-size: 12px;
      transition: color .25s, transform .3s cubic-bezier(.22, 1, .36, 1);
    }
    .footer__col li a:hover i { color: var(--accent); transform: translate(3px, -3px); }
    /* иерархия колонок: контакты ярче всех, локации спокойнее всех */
    .footer__grid .footer__col:nth-child(1) li { color: rgba(242, 241, 238, .5); font-size: 13.5px; }
    .footer__grid .footer__col:nth-child(2) li { color: rgba(242, 241, 238, .96); font-size: 15.5px; }
    .footer__grid .footer__col:nth-child(3) li { color: rgba(242, 241, 238, .8); }
    .footer__grid .footer__col:nth-child(4) li { color: rgba(242, 241, 238, .62); font-size: 14px; }
    .footer__bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      border-top: 1px solid var(--line);
      margin-top: clamp(40px, 5vw, 64px);
      padding-top: 26px;
    }
    .footer__copy {
      margin: 0;
      color: var(--muted);
      font-size: 11.5px;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .footer__law { margin: 4px 0 0; font-size: 11px; color: rgba(242, 241, 238, .35); }
    .footer__legal { display: flex; gap: 22px; }
    .footer__legal a { font-size: 12px; color: rgba(242, 241, 238, .45); text-decoration: none; transition: color .2s; }
    .footer__legal a:hover { color: var(--text); }
    .footer__end { display: flex; align-items: center; gap: 26px; }
    .footer__slogan { margin: 0; color: var(--muted); font-size: 11.5px; letter-spacing: .18em; text-transform: uppercase; }
    .footer__up {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, .18);
      border-radius: 50%;
      background: none;
      cursor: pointer;
      color: var(--muted);
      font-family: inherit;
      font-size: 16px;
      transition: color .25s, border-color .25s, transform .3s cubic-bezier(.22, 1, .36, 1);
    }
    .footer__up:hover { color: var(--accent); border-color: var(--accent); transform: translateY(-3px); }

    @media (max-width: 960px) {
      .footer__grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 700px) {
      .header-inner { width: calc(100% - 32px); grid-template-columns: auto 1fr; gap: 10px 16px; padding: 14px 0; }
      .logo { font-size: 13px; letter-spacing: .12em; }
      .header-right { grid-column: 2; }
      .page-nav { order: 3; grid-column: 1 / -1; gap: 18px; }
      .page-nav a { font-size: 11px; letter-spacing: .1em; }
      .page-wrap { padding: 124px 16px 80px; }
    }

    .lang-content { display: none; }
    .lang-content.active { display: block; }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo" data-nav="home" aria-label="VMOTO"><img src="/assets/img/logo-mark.png" alt="">VMOTO</a>
      <nav class="page-nav">
        <a href="/models" data-nav="models" data-f="nav.models"></a>
        <a href="/business" data-nav="business" data-f="b2b.label"></a>
        <a href="/faq" data-nav="faq" data-f="faq"></a>
      </nav>
      <div class="header-right">
        <div class="lang" id="lang-toggle">
          <button class="lang__btn" type="button" aria-haspopup="true" data-f-aria="lang.aria">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.4 4 5.6 4 9.2s-1.4 6.8-4 9.2c-2.6-2.4-4-5.6-4-9.2s1.4-6.8 4-9.2z"/></svg>
            <span class="lang__cur">EN</span>
            <svg class="lang__chev" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <ul class="lang__list">
            <li><button type="button" data-lang="en">EN</button></li>
            <li><button type="button" data-lang="ru">RU</button></li>
            <li><button type="button" data-lang="th">ไทย</button></li>
            <li><button type="button" data-lang="zh">中文</button></li>
          </ul>
        </div>
        <a class="header-social" href="https://www.facebook.com/profile.php?id=61592273703567" target="_blank" rel="noopener" aria-label="Facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 8.5V7c0-.8.7-1.5 1.5-1.5H17V2.6h-2.8C11.9 2.6 10 4.5 10 6.8v1.7H7.5V12H10v9.4h4V12h2.6l.6-3.5H14z"/></svg>
        </a>
      </div>
    </div>
  </header>

  <main class="page-wrap">
${docs}
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer__brand">
        <a href="/" class="logo" aria-label="VMOTO"><img src="/assets/img/logo-mark.png" alt="">VMOTO</a>
        <p class="footer__tag">Electric Mobility<br>Made for Island Life</p>
      </div>

      <div class="footer__grid">
        <div class="footer__col">
          <p class="footer__label" data-f="footer.locations"></p>
          <ul><li data-f="loc.samui"></li><li data-f="loc.phangan"></li></ul>
        </div>
        <div class="footer__col">
          <p class="footer__label" data-f="footer.contacts"></p>
          <ul><li><a href="tel:+66962244666">${PHONE}</a></li></ul>
        </div>
        <div class="footer__col">
          <p class="footer__label" data-f="footer.messengers"></p>
          <ul>
            <li><a href="https://t.me/+66962244666" target="_blank" rel="noopener">Telegram&ensp;<i aria-hidden="true">↗</i></a></li>
            <li><a href="https://wa.me/66962244666" target="_blank" rel="noopener">WhatsApp&ensp;<i aria-hidden="true">↗</i></a></li>
            <li><a href="https://www.facebook.com/profile.php?id=61592273703567" target="_blank" rel="noopener">Facebook&ensp;<i aria-hidden="true">↗</i></a></li>
          </ul>
        </div>
        <div class="footer__col">
          <p class="footer__label" data-f="footer.navigation"></p>
          <ul>
            <li><a href="/" data-nav="home" data-f="home"></a></li>
            <li><a href="/models" data-nav="models" data-f="footer.compare"></a></li>
            <li><a href="/business" data-nav="business" data-f="footer.fleets"></a></li>
            <li><a href="/faq" data-nav="faq" data-f="footer.faqPage"></a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <div>
          <p class="footer__copy" data-f="footer.copy"></p>
          <p class="footer__law"><span data-f="footer.dealer"></span> · ${COMPANY} · 52/57 Moo 1, Na Jomtien, Sattahip, Chonburi 20250, Thailand</p>
        </div>
        <div class="footer__legal">
          <a href="/privacy" data-f="footer.privacy"></a>
          <a href="/terms" data-f="footer.terms"></a>
        </div>
        <div class="footer__end">
          <p class="footer__slogan">Silent. Electric. Free.</p>
          <button class="footer__up" type="button" data-f-aria="footer.top">↑</button>
        </div>
      </div>
    </div>
  </footer>

  <script>
    (() => {
      const LANGS = ['en', 'th', 'ru', 'zh'];
      const FOOT = ${JSON.stringify(FOOT)};
      const stored = localStorage.getItem('vmoto-lang');
      switchLang(LANGS.includes(stored) ? stored : 'en');

      document.getElementById('lang-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-lang]');
        if (!btn) return;
        switchLang(btn.dataset.lang);
        localStorage.setItem('vmoto-lang', btn.dataset.lang);
      });

      function switchLang(l) {
        document.querySelectorAll('.lang__list button').forEach((b) => {
          b.classList.toggle('active', b.dataset.lang === l);
        });
        document.querySelector('.lang__cur').textContent = l === 'zh' ? 'CN' : l.toUpperCase();
        document.querySelectorAll('.lang-content').forEach((c) => {
          c.classList.toggle('active', c.dataset.langContent === l);
        });
        /* подвал: подписи и ссылки на языковые версии разделов */
        const f = FOOT[l] || FOOT.en;
        document.querySelectorAll('[data-f]').forEach((e) => { e.textContent = f[e.dataset.f]; });
        document.querySelectorAll('[data-f-aria]').forEach((e) => { e.setAttribute('aria-label', f[e.dataset.fAria]); });
        const base = l === 'en' ? '' : '/' + l;
        document.querySelectorAll('[data-nav]').forEach((a) => {
          a.href = a.dataset.nav === 'home' ? (base || '/') : base + '/' + a.dataset.nav;
        });
        document.documentElement.lang = l;
      }

      /* фон шапки появляется при прокрутке — как на лендинге */
      const header = document.querySelector('.site-header');
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      document.querySelector('.footer__up')
        .addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    })();
  </script>
</body>
</html>
`;

const companyBlock = `      <div class="company-block">
        <strong>${COMPANY}</strong>
        <span>${ADDRESS}</span>
      </div>`;

function renderDoc(lang, d) {
  const sections = d.sections
    .map((s, i) => `      <h2 class="section-title">${i + 1}. ${s.h}</h2>\n${s.body}`)
    .join('\n\n');
  return `    <div class="lang-content${lang === 'en' ? ' active' : ''}" data-lang-content="${lang}">
      <div class="page-eyebrow">${d.eyebrow}</div>
      <h1 class="page-title">${d.title}</h1>
      <div class="page-meta">${d.updated}</div>
      <p class="page-intro">${d.intro}</p>

${sections}
    </div>`;
}

const p = (...lines) => lines.map((l) => `      <p>${l}</p>`).join('\n');
const ul = (...items) => `      <ul>\n${items.map((i) => `        <li>${i}</li>`).join('\n')}\n      </ul>`;

/* ─────────────────────── ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ ─────────────────────── */

const PRIVACY = {
  en: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    updated: 'Last updated: 14 August 2026',
    intro: `This Privacy Policy explains what data ${COMPANY} may collect through the website vmotobikes.com, how it is used, stored and protected, and what rights users have.`,
    sections: [
      { h: 'Data Controller', body: companyBlock },
      { h: 'Data We Collect', body: ul(
        '<strong>Data you provide in the form:</strong> name, phone number, preferred messenger and location (Koh Samui, Koh Phangan or your own option).',
        '<strong>Technical data:</strong> IP address, device and browser type, language, date and time of visit, pages viewed.',
        '<strong>Cookies and similar identifiers</strong> set for proper website operation and analytics, including your language choice stored in the browser (localStorage).',
      ) },
      { h: 'How We Use Data', body: ul(
        'To respond to your enquiry, arrange a test ride, delivery or service.',
        'To keep a record of enquiries in our customer system (CRM).',
        'To measure advertising performance and show relevant ads.',
        'To improve the website, service quality and ensure security.',
        'To comply with applicable legislation.',
      ) },
      { h: 'Legal Basis for Processing', body: ul(
        'Your consent (including the checkbox confirmation in the form).',
        'Pre-contractual actions at your request.',
        'Legitimate interest of the Company (security, abuse prevention, service improvement).',
        'Legal obligations.',
      ) },
      { h: 'Cookies and Similar Technologies', body: p(
        'We use cookies and browser storage to remember your language, for analytics and for advertising measurement. You can limit or disable cookies in your browser settings — the website will keep working.',
      ) },
      { h: 'Third-Party Data Sharing', body: p('We do not sell personal data. Transfer is possible only when necessary:') + '\n' + ul(
        '<strong>Bitrix24</strong> — customer system where enquiries are stored;',
        '<strong>Meta Platforms</strong> and <strong>Google Analytics</strong> — advertising and website analytics;',
        '<strong>Vercel</strong> — website hosting;',
        'to government authorities, if required by law.',
      ) },
      { h: 'International Data Transfer', body: p(
        'Some data may be processed outside Thailand when using cloud services. We choose providers with reasonable protection measures and lawful data transfer mechanisms.',
      ) },
      { h: 'Data Retention Period', body: p(
        'Data is stored for as long as necessary to handle your enquiry and maintain the customer relationship, or longer if required by law, accounting or protection of rights in disputes.',
      ) },
      { h: 'Security', body: p(
        'We apply reasonable technical and organisational measures to protect data from loss, unauthorised access, alteration and disclosure. Form submissions are transmitted over an encrypted connection.',
      ) },
      { h: 'Your Rights', body: p(
        `Depending on applicable legislation, you may request access, correction or deletion of your data and withdraw your consent for processing — write to us on WhatsApp at ${PHONE} or call the same number.`,
      ) },
      { h: 'Third-Party Websites', body: p(
        'The website contains links to third-party services (WhatsApp, Telegram, Facebook, Instagram). Their privacy policies apply separately.',
      ) },
      { h: 'Policy Changes', body: p(
        'We may update this Policy. The current version is always published on this page with the update date.',
      ) },
    ],
  },

  ru: {
    eyebrow: 'Правовая информация',
    title: 'Политика конфиденциальности',
    updated: 'Обновлено: 14 августа 2026',
    intro: `Настоящая Политика конфиденциальности объясняет, какие данные ${COMPANY} может собирать через сайт vmotobikes.com, как они используются, хранятся и защищаются, и какие права есть у пользователей.`,
    sections: [
      { h: 'Оператор данных', body: companyBlock },
      { h: 'Какие данные мы собираем', body: ul(
        '<strong>Данные, которые вы указываете в форме:</strong> имя, номер телефона, предпочитаемый мессенджер и локация (Самуи, Панган или свой вариант).',
        '<strong>Технические данные:</strong> IP-адрес, тип устройства и браузера, язык, дата и время визита, просмотренные страницы.',
        '<strong>Cookies и аналогичные идентификаторы</strong> для корректной работы сайта и аналитики, включая выбранный язык, сохраняемый в браузере (localStorage).',
      ) },
      { h: 'Как мы используем данные', body: ul(
        'Чтобы ответить на заявку, организовать тест-драйв, доставку или обслуживание.',
        'Чтобы вести учёт обращений в CRM-системе.',
        'Чтобы измерять эффективность рекламы и показывать релевантные объявления.',
        'Чтобы улучшать сайт, качество сервиса и обеспечивать безопасность.',
        'Чтобы соблюдать требования применимого законодательства.',
      ) },
      { h: 'Правовые основания обработки', body: ul(
        'Ваше согласие (в том числе отметка в чекбоксе формы).',
        'Преддоговорные действия по вашему запросу.',
        'Законный интерес компании (безопасность, предотвращение злоупотреблений, улучшение сервиса).',
        'Требования законодательства.',
      ) },
      { h: 'Cookies и похожие технологии', body: p(
        'Мы используем cookies и хранилище браузера, чтобы запоминать язык, для аналитики и оценки эффективности рекламы. Вы можете ограничить или отключить cookies в настройках браузера — сайт продолжит работать.',
      ) },
      { h: 'Передача данных третьим лицам', body: p('Мы не продаём персональные данные. Передача возможна только при необходимости:') + '\n' + ul(
        '<strong>Bitrix24</strong> — CRM-система, где хранятся заявки;',
        '<strong>Meta Platforms</strong> и <strong>Google Analytics</strong> — рекламная и веб-аналитика;',
        '<strong>Vercel</strong> — хостинг сайта;',
        'государственным органам, если этого требует закон.',
      ) },
      { h: 'Международная передача данных', body: p(
        'Часть данных может обрабатываться за пределами Таиланда при использовании облачных сервисов. Мы выбираем провайдеров с разумными мерами защиты и законными механизмами передачи данных.',
      ) },
      { h: 'Срок хранения данных', body: p(
        'Данные хранятся столько, сколько необходимо для обработки заявки и поддержания отношений с клиентом, либо дольше, если это требуется законом, бухгалтерским учётом или защитой прав в спорах.',
      ) },
      { h: 'Безопасность', body: p(
        'Мы применяем разумные технические и организационные меры для защиты данных от потери, несанкционированного доступа, изменения и раскрытия. Данные формы передаются по зашифрованному соединению.',
      ) },
      { h: 'Ваши права', body: p(
        `В зависимости от применимого законодательства вы можете запросить доступ к данным, их исправление или удаление, а также отозвать согласие на обработку — напишите нам в WhatsApp на ${PHONE} или позвоните по этому же номеру.`,
      ) },
      { h: 'Сторонние сайты', body: p(
        'На сайте есть ссылки на сторонние сервисы (WhatsApp, Telegram, Facebook, Instagram). Их политики конфиденциальности действуют отдельно.',
      ) },
      { h: 'Изменения политики', body: p(
        'Мы можем обновлять Политику. Актуальная версия всегда публикуется на этой странице с датой обновления.',
      ) },
    ],
  },

  th: {
    eyebrow: 'ข้อมูลทางกฎหมาย',
    title: 'นโยบายความเป็นส่วนตัว',
    updated: 'อัปเดตล่าสุด: 14 สิงหาคม 2026',
    intro: `นโยบายความเป็นส่วนตัวนี้อธิบายว่า ${COMPANY} อาจเก็บรวบรวมข้อมูลใดบ้างผ่านเว็บไซต์ vmotobikes.com ใช้งาน จัดเก็บ และปกป้องข้อมูลอย่างไร และผู้ใช้มีสิทธิ์อะไรบ้าง`,
    sections: [
      { h: 'ผู้ควบคุมข้อมูล', body: companyBlock },
      { h: 'ข้อมูลที่เราเก็บรวบรวม', body: ul(
        '<strong>ข้อมูลที่คุณกรอกในแบบฟอร์ม:</strong> ชื่อ หมายเลขโทรศัพท์ แอปที่ต้องการให้ติดต่อ และสถานที่ (เกาะสมุย เกาะพะงัน หรือระบุเอง)',
        '<strong>ข้อมูลทางเทคนิค:</strong> ที่อยู่ IP ประเภทอุปกรณ์และเบราว์เซอร์ ภาษา วันและเวลาที่เข้าชม หน้าที่เปิดดู',
        '<strong>คุกกี้และตัวระบุที่คล้ายกัน</strong> เพื่อให้เว็บไซต์ทำงานถูกต้องและเพื่อการวิเคราะห์ รวมถึงภาษาที่เลือกซึ่งบันทึกไว้ในเบราว์เซอร์ (localStorage)',
      ) },
      { h: 'เราใช้ข้อมูลอย่างไร', body: ul(
        'เพื่อตอบกลับคำขอของคุณ นัดหมายทดลองขับ จัดส่ง หรือบริการหลังการขาย',
        'เพื่อบันทึกคำขอไว้ในระบบลูกค้าสัมพันธ์ (CRM)',
        'เพื่อวัดผลโฆษณาและแสดงโฆษณาที่เกี่ยวข้อง',
        'เพื่อปรับปรุงเว็บไซต์ คุณภาพบริการ และรักษาความปลอดภัย',
        'เพื่อปฏิบัติตามกฎหมายที่บังคับใช้',
      ) },
      { h: 'ฐานทางกฎหมายในการประมวลผล', body: ul(
        'ความยินยอมของคุณ (รวมถึงการติ๊กยืนยันในแบบฟอร์ม)',
        'การดำเนินการก่อนทำสัญญาตามคำขอของคุณ',
        'ประโยชน์โดยชอบด้วยกฎหมายของบริษัท (ความปลอดภัย การป้องกันการใช้งานในทางที่ผิด การพัฒนาบริการ)',
        'หน้าที่ตามกฎหมาย',
      ) },
      { h: 'คุกกี้และเทคโนโลยีที่คล้ายกัน', body: p(
        'เราใช้คุกกี้และพื้นที่จัดเก็บของเบราว์เซอร์เพื่อจดจำภาษาที่เลือก เพื่อการวิเคราะห์ และเพื่อวัดผลโฆษณา คุณสามารถจำกัดหรือปิดคุกกี้ได้ในการตั้งค่าเบราว์เซอร์ เว็บไซต์จะยังใช้งานได้ตามปกติ',
      ) },
      { h: 'การเปิดเผยข้อมูลแก่บุคคลที่สาม', body: p('เราไม่ขายข้อมูลส่วนบุคคล การส่งต่อข้อมูลจะเกิดขึ้นเท่าที่จำเป็นเท่านั้น:') + '\n' + ul(
        '<strong>Bitrix24</strong> — ระบบ CRM ที่จัดเก็บคำขอ',
        '<strong>Meta Platforms</strong> และ <strong>Google Analytics</strong> — การวิเคราะห์โฆษณาและเว็บไซต์',
        '<strong>Vercel</strong> — โฮสติ้งเว็บไซต์',
        'หน่วยงานราชการ หากกฎหมายกำหนด',
      ) },
      { h: 'การโอนข้อมูลระหว่างประเทศ', body: p(
        'ข้อมูลบางส่วนอาจถูกประมวลผลนอกประเทศไทยเมื่อใช้บริการคลาวด์ เราเลือกผู้ให้บริการที่มีมาตรการคุ้มครองที่เหมาะสมและกลไกการโอนข้อมูลที่ชอบด้วยกฎหมาย',
      ) },
      { h: 'ระยะเวลาการเก็บรักษาข้อมูล', body: p(
        'เราเก็บข้อมูลไว้เท่าที่จำเป็นต่อการดำเนินการตามคำขอและการรักษาความสัมพันธ์กับลูกค้า หรือนานกว่านั้นหากกฎหมาย การบัญชี หรือการคุ้มครองสิทธิในข้อพิพาทกำหนด',
      ) },
      { h: 'ความปลอดภัย', body: p(
        'เราใช้มาตรการทางเทคนิคและองค์กรที่เหมาะสมเพื่อปกป้องข้อมูลจากการสูญหาย การเข้าถึงโดยไม่ได้รับอนุญาต การเปลี่ยนแปลง และการเปิดเผย ข้อมูลจากแบบฟอร์มถูกส่งผ่านการเชื่อมต่อที่เข้ารหัส',
      ) },
      { h: 'สิทธิของคุณ', body: p(
        `ตามกฎหมายที่บังคับใช้ คุณสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลของคุณ และเพิกถอนความยินยอมได้ — ทักหาเราทาง WhatsApp ที่ ${PHONE} หรือโทรที่หมายเลขเดียวกัน`,
      ) },
      { h: 'เว็บไซต์ของบุคคลที่สาม', body: p(
        'เว็บไซต์มีลิงก์ไปยังบริการของบุคคลที่สาม (WhatsApp, Telegram, Facebook, Instagram) ซึ่งมีนโยบายความเป็นส่วนตัวของตนเองแยกต่างหาก',
      ) },
      { h: 'การเปลี่ยนแปลงนโยบาย', body: p(
        'เราอาจปรับปรุงนโยบายนี้ ฉบับปัจจุบันจะเผยแพร่บนหน้านี้พร้อมวันที่อัปเดตเสมอ',
      ) },
    ],
  },

  zh: {
    eyebrow: '法律信息',
    title: '隐私政策',
    updated: '最后更新：2026年8月14日',
    intro: `本隐私政策说明 ${COMPANY} 可能通过网站 vmotobikes.com 收集哪些数据，如何使用、存储和保护这些数据，以及用户享有哪些权利。`,
    sections: [
      { h: '数据控制者', body: companyBlock },
      { h: '我们收集的数据', body: ul(
        '<strong>您在表单中填写的信息：</strong>姓名、电话号码、希望使用的通讯软件以及所在位置（苏梅岛、帕岸岛或自行填写）。',
        '<strong>技术数据：</strong>IP 地址、设备与浏览器类型、语言、访问日期与时间、浏览过的页面。',
        '<strong>Cookie 及类似标识符</strong>，用于网站正常运行和数据分析，包括保存在浏览器中的语言选择（localStorage）。',
      ) },
      { h: '我们如何使用数据', body: ul(
        '回复您的咨询，安排试驾、交付或售后服务。',
        '在客户管理系统（CRM）中记录咨询。',
        '衡量广告效果并展示相关广告。',
        '改进网站与服务质量，保障安全。',
        '遵守适用法律的要求。',
      ) },
      { h: '处理数据的法律依据', body: ul(
        '您的同意（包括在表单中勾选确认）。',
        '应您的请求所进行的合同前准备。',
        '公司的合法利益（安全、防止滥用、改进服务）。',
        '法律义务。',
      ) },
      { h: 'Cookie 与类似技术', body: p(
        '我们使用 Cookie 和浏览器存储来记住您的语言选择、进行分析并衡量广告效果。您可以在浏览器设置中限制或禁用 Cookie，网站仍可正常使用。',
      ) },
      { h: '向第三方共享数据', body: p('我们不出售个人数据。仅在必要时才会传输：') + '\n' + ul(
        '<strong>Bitrix24</strong> — 存储咨询记录的 CRM 系统；',
        '<strong>Meta Platforms</strong> 与 <strong>Google Analytics</strong> — 广告与网站分析；',
        '<strong>Vercel</strong> — 网站托管；',
        '法律要求时提供给政府主管部门。',
      ) },
      { h: '数据跨境传输', body: p(
        '使用云服务时，部分数据可能在泰国境外处理。我们选择具备合理保护措施和合法传输机制的服务提供商。',
      ) },
      { h: '数据保存期限', body: p(
        '数据保存时间以处理您的咨询和维持客户关系所需为限；若法律、会计或争议中的权利保护另有要求，则相应延长。',
      ) },
      { h: '安全', body: p(
        '我们采取合理的技术和组织措施，防止数据丢失、未经授权的访问、篡改和泄露。表单数据通过加密连接传输。',
      ) },
      { h: '您的权利', body: p(
        `根据适用法律，您可以要求访问、更正或删除您的数据，并撤回处理同意 — 通过 WhatsApp ${PHONE} 联系我们，或拨打同一号码。`,
      ) },
      { h: '第三方网站', body: p(
        '本网站包含指向第三方服务的链接（WhatsApp、Telegram、Facebook、Instagram），其隐私政策单独适用。',
      ) },
      { h: '政策变更', body: p(
        '我们可能更新本政策。最新版本始终发布在本页面并注明更新日期。',
      ) },
    ],
  },
};

/* ──────────────────────── ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ ──────────────────────── */

const TERMS = {
  en: {
    eyebrow: 'Legal',
    title: 'Terms of Use',
    updated: 'Last updated: 14 August 2026',
    intro: `These Terms govern the use of the website vmotobikes.com, operated by ${COMPANY}. By using the website you accept these Terms.`,
    sections: [
      { h: 'Website Operator', body: companyBlock + '\n' + p('The website presents VMoto electric bikes and serves to request a test ride or a consultation.') },
      { h: 'Prices and Availability', body: p(
        'Prices are listed in Thai Baht and are indicative. Final price, configuration, availability and delivery terms are confirmed when the sale is arranged. Product images may differ from the actual configuration.',
      ) },
      { h: 'No Public Offer', body: p(
        'Nothing on this website constitutes a binding public offer. A purchase is concluded by a separate agreement between you and the Company.',
      ) },
      { h: 'Warranty', body: p(
        'Warranty terms for the bikes, including the 3-year warranty, are set out in the sale documents provided at purchase.',
      ) },
      { h: 'Enquiries Through the Website', body: p(
        'By submitting the form you confirm that the details provided are correct and consent to being contacted regarding your enquiry. Personal data is processed under the <a href="/privacy">Privacy Policy</a>.',
      ) },
      { h: 'Intellectual Property', body: p(
        'Texts, photographs and graphics on this website belong to the Company or are used with permission. Copying or reuse without our consent is not allowed. The VMoto trademark belongs to its respective owner.',
      ) },
      { h: 'Liability', body: p(
        'The website is provided «as is». We do our best to keep the information accurate, but we are not liable for occasional errors, interruptions, or the content of external services linked from the site (WhatsApp, Telegram, Facebook and others).',
      ) },
      { h: 'Governing Law', body: p('These Terms are governed by the laws of the Kingdom of Thailand.') },
      { h: 'Changes', body: p('We may update these Terms. The current version is always published on this page with the update date.') },
      { h: 'Contact', body: p(`Questions about these Terms: ${PHONE} (phone or WhatsApp).`) },
    ],
  },

  ru: {
    eyebrow: 'Правовая информация',
    title: 'Пользовательское соглашение',
    updated: 'Обновлено: 14 августа 2026',
    intro: `Настоящие Условия регулируют использование сайта vmotobikes.com, который принадлежит компании ${COMPANY}. Используя сайт, вы принимаете эти Условия.`,
    sections: [
      { h: 'Владелец сайта', body: companyBlock + '\n' + p('Сайт представляет электробайки VMoto и служит для записи на тест-драйв и консультацию.') },
      { h: 'Цены и наличие', body: p(
        'Цены указаны в тайских батах и являются ориентировочными. Итоговая цена, комплектация, наличие и условия доставки подтверждаются при оформлении покупки. Изображения могут отличаться от фактической комплектации.',
      ) },
      { h: 'Не публичная оферта', body: p(
        'Информация на сайте не является публичной офертой. Покупка оформляется отдельным договором между вами и компанией.',
      ) },
      { h: 'Гарантия', body: p(
        'Условия гарантии на байки, включая гарантию 3 года, определяются документами, оформляемыми при покупке.',
      ) },
      { h: 'Заявки через сайт', body: p(
        'Отправляя форму, вы подтверждаете корректность указанных данных и согласие на связь с вами по вашей заявке. Персональные данные обрабатываются в соответствии с <a href="/privacy">Политикой конфиденциальности</a>.',
      ) },
      { h: 'Интеллектуальная собственность', body: p(
        'Тексты, фотографии и графика на сайте принадлежат компании или используются с разрешения. Копирование и использование без нашего согласия не допускается. Товарный знак VMoto принадлежит его правообладателю.',
      ) },
      { h: 'Ответственность', body: p(
        'Сайт предоставляется «как есть». Мы стараемся поддерживать информацию актуальной, но не несём ответственности за возможные неточности, перерывы в работе и содержание внешних сервисов, на которые ведут ссылки (WhatsApp, Telegram, Facebook и другие).',
      ) },
      { h: 'Применимое право', body: p('Настоящие Условия регулируются законодательством Королевства Таиланд.') },
      { h: 'Изменения', body: p('Мы можем обновлять Условия. Актуальная версия всегда публикуется на этой странице с датой обновления.') },
      { h: 'Контакты', body: p(`Вопросы по Условиям: ${PHONE} (телефон или WhatsApp).`) },
    ],
  },

  th: {
    eyebrow: 'ข้อมูลทางกฎหมาย',
    title: 'ข้อกำหนดการใช้งาน',
    updated: 'อัปเดตล่าสุด: 14 สิงหาคม 2026',
    intro: `ข้อกำหนดนี้ใช้บังคับกับการใช้งานเว็บไซต์ vmotobikes.com ซึ่งดำเนินการโดย ${COMPANY} การใช้เว็บไซต์ถือว่าคุณยอมรับข้อกำหนดเหล่านี้`,
    sections: [
      { h: 'ผู้ดำเนินการเว็บไซต์', body: companyBlock + '\n' + p('เว็บไซต์นำเสนอรถจักรยานยนต์ไฟฟ้า VMoto และใช้สำหรับนัดหมายทดลองขับหรือขอคำปรึกษา') },
      { h: 'ราคาและความพร้อมจำหน่าย', body: p(
        'ราคาแสดงเป็นเงินบาทไทยและเป็นราคาโดยประมาณ ราคาสุดท้าย รุ่นย่อย ความพร้อมจำหน่าย และเงื่อนไขการจัดส่งจะยืนยันเมื่อทำการซื้อขาย ภาพสินค้าอาจแตกต่างจากรุ่นจริง',
      ) },
      { h: 'ไม่ถือเป็นคำเสนอต่อสาธารณะ', body: p(
        'ข้อมูลบนเว็บไซต์ไม่ถือเป็นคำเสนอที่ผูกพันตามกฎหมาย การซื้อขายจะทำผ่านสัญญาแยกต่างหากระหว่างคุณกับบริษัท',
      ) },
      { h: 'การรับประกัน', body: p(
        'เงื่อนไขการรับประกันรถ รวมถึงการรับประกัน 3 ปี เป็นไปตามเอกสารที่มอบให้ในวันซื้อ',
      ) },
      { h: 'การส่งคำขอผ่านเว็บไซต์', body: p(
        'เมื่อส่งแบบฟอร์ม คุณยืนยันว่าข้อมูลที่ให้ถูกต้องและยินยอมให้เราติดต่อกลับเกี่ยวกับคำขอของคุณ ข้อมูลส่วนบุคคลจะประมวลผลตาม<a href="/privacy">นโยบายความเป็นส่วนตัว</a>',
      ) },
      { h: 'ทรัพย์สินทางปัญญา', body: p(
        'ข้อความ ภาพถ่าย และกราฟิกบนเว็บไซต์เป็นของบริษัทหรือใช้โดยได้รับอนุญาต ห้ามคัดลอกหรือนำไปใช้โดยไม่ได้รับความยินยอมจากเรา เครื่องหมายการค้า VMoto เป็นของเจ้าของสิทธิ์',
      ) },
      { h: 'ความรับผิด', body: p(
        'เว็บไซต์ให้บริการ «ตามสภาพที่เป็นอยู่» เราพยายามรักษาข้อมูลให้เป็นปัจจุบัน แต่ไม่รับผิดชอบต่อความคลาดเคลื่อน การหยุดชะงักของบริการ หรือเนื้อหาของบริการภายนอกที่ลิงก์จากเว็บไซต์ (WhatsApp, Telegram, Facebook และอื่น ๆ)',
      ) },
      { h: 'กฎหมายที่ใช้บังคับ', body: p('ข้อกำหนดนี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย') },
      { h: 'การเปลี่ยนแปลง', body: p('เราอาจปรับปรุงข้อกำหนดนี้ ฉบับปัจจุบันจะเผยแพร่บนหน้านี้พร้อมวันที่อัปเดตเสมอ') },
      { h: 'ติดต่อ', body: p(`สอบถามเกี่ยวกับข้อกำหนด: ${PHONE} (โทรศัพท์หรือ WhatsApp)`) },
    ],
  },

  zh: {
    eyebrow: '法律信息',
    title: '使用条款',
    updated: '最后更新：2026年8月14日',
    intro: `本条款适用于由 ${COMPANY} 运营的网站 vmotobikes.com。使用本网站即表示您接受这些条款。`,
    sections: [
      { h: '网站运营方', body: companyBlock + '\n' + p('本网站介绍 VMoto 电动车，并用于预约试驾或咨询。') },
      { h: '价格与供货', body: p(
        '价格以泰铢标示，仅供参考。最终价格、配置、供货情况及交付条件在成交时确认。产品图片可能与实际配置存在差异。',
      ) },
      { h: '非公开要约', body: p(
        '网站上的信息不构成具有法律约束力的公开要约。购买通过您与公司之间的单独协议完成。',
      ) },
      { h: '质保', body: p('包括 3 年质保在内的整车质保条款，以购车时提供的销售文件为准。') },
      { h: '通过网站提交咨询', body: p(
        '提交表单即表示您确认所填信息真实，并同意我们就您的咨询与您联系。个人数据依照<a href="/privacy">隐私政策</a>处理。',
      ) },
      { h: '知识产权', body: p(
        '网站上的文字、照片和图形归公司所有或经许可使用。未经我们同意不得复制或再利用。VMoto 商标归其权利人所有。',
      ) },
      { h: '责任', body: p(
        '本网站按「现状」提供。我们尽力保持信息准确，但对偶发错误、服务中断以及站外链接服务（WhatsApp、Telegram、Facebook 等）的内容不承担责任。',
      ) },
      { h: '适用法律', body: p('本条款适用泰王国法律。') },
      { h: '变更', body: p('我们可能更新本条款。最新版本始终发布在本页面并注明更新日期。') },
      { h: '联系方式', body: p(`条款相关问题：${PHONE}（电话或 WhatsApp）。`) },
    ],
  },
};

const build = (slug, data, title, desc) => {
  const docs = LANGS.map((l) => renderDoc(l, data[l])).join('\n\n');
  const html = shell({ slug, title, desc, docs });
  writeFileSync(`${slug}.html`, html);
  console.log(`${slug}.html: ${(html.length / 1024).toFixed(0)} KB`);
};

build('privacy', PRIVACY,
  'Privacy Policy — VMOTO electric bikes Thailand',
  `How ${COMPANY} collects, uses and protects personal data submitted through vmotobikes.com. Available in English, Thai, Russian and Chinese.`);

build('terms', TERMS,
  'Terms of Use — VMOTO electric bikes Thailand',
  `Terms of use for vmotobikes.com operated by ${COMPANY}: prices, warranty, liability and governing law. English, Thai, Russian and Chinese.`);

console.log('done');

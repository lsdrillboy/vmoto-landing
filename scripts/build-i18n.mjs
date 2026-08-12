/* Генератор статических языковых версий: /ru/ /th/ /zh/
   Берёт index.html + словарь из i18n.js, подставляет переводы в
   data-i18n-атрибуты, абсолютизирует пути и проставляет hreflang.
   Запуск: node scripts/build-i18n.mjs (из корня проекта). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const SITE = 'https://www.vmotobikes.com';
const LANGS = ['ru', 'th', 'zh'];

/* --- словарь из i18n.js (исполняем с заглушками браузера) --- */
const sandbox = {
  window: {},
  navigator: { languages: ['en'], language: 'en' },
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    documentElement: { getAttribute: () => null, setAttribute: () => {}, lang: 'en' },
    title: '',
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
  },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync('i18n.js', 'utf8'), sandbox);
const DICT = sandbox.window.__DICT;
if (!DICT || !DICT.ru) throw new Error('DICT не извлечён из i18n.js');

const src = readFileSync('index.html', 'utf8');

const HREFLANG = `  <link rel="alternate" hreflang="en" href="${SITE}/">
  <link rel="alternate" hreflang="ru" href="${SITE}/ru/">
  <link rel="alternate" hreflang="th" href="${SITE}/th/">
  <link rel="alternate" hreflang="zh" href="${SITE}/zh/">
  <link rel="alternate" hreflang="x-default" href="${SITE}/">`;

function absolutify(html) {
  return html
    .replace(/(src|href)="assets\//g, '$1="/assets/')
    .replace(/href="(style\.css[^"]*)"/g, 'href="/$1"')
    .replace(/src="(main\.js[^"]*)"/g, 'src="/$1"')
    .replace(/src="(i18n\.js[^"]*)"/g, 'src="/$1"')
    .replace(/href="(privacy\.html|terms\.html)"/g, 'href="/$1"')
    .replace(/href="#/g, 'href="#'); // якоря не трогаем
}

function translate(html, lang) {
  const d = { ...DICT.en, ...DICT[lang] };
  const t = (k) => (k in d ? d[k] : null);

  // текстовые подстановки: data-i18n и data-i18n-html
  for (const kind of ['data-i18n-html', 'data-i18n']) {
    const re = new RegExp(`<([a-z0-9]+)([^>]*?\\s${kind}="([^"]+)"[^>]*)>`, 'g');
    let out = '';
    let pos = 0;
    let m2;
    while ((m2 = re.exec(html)) !== null) {
      const [openTag, tagName, , key] = m2;
      const val = t(key);
      out += html.slice(pos, m2.index) + openTag;
      const close = `</${tagName}>`;
      const closeIdx = html.indexOf(close, re.lastIndex);
      if (val === null || closeIdx === -1) { pos = re.lastIndex; continue; }
      out += val;
      pos = closeIdx; // содержимое заменено, закрывающий тег остаётся
      re.lastIndex = closeIdx;
    }
    html = out + html.slice(pos);
  }

  // placeholder и aria-label
  html = html.replace(/data-i18n-ph="([^"]+)"([^>]*?)placeholder="[^"]*"/g,
    (all, key, mid) => { const v = t(key); return v === null ? all : `data-i18n-ph="${key}"${mid}placeholder="${v}"`; });
  html = html.replace(/placeholder="[^"]*"([^>]*?)data-i18n-ph="([^"]+)"/g,
    (all, mid, key) => { const v = t(key); return v === null ? all : `placeholder="${v}"${mid}data-i18n-ph="${key}"`; });
  html = html.replace(/data-i18n-aria="([^"]+)"([^>]*?)aria-label="[^"]*"/g,
    (all, key, mid) => { const v = t(key); return v === null ? all : `data-i18n-aria="${key}"${mid}aria-label="${v}"`; });
  html = html.replace(/aria-label="[^"]*"([^>]*?)data-i18n-aria="([^"]+)"/g,
    (all, mid, key) => { const v = t(key); return v === null ? all : `aria-label="${v}"${mid}data-i18n-aria="${key}"`; });

  // язык документа, title, description, canonical, og
  html = html.replace('<html lang="en">', `<html lang="${lang}" data-lang-default="${lang}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${d['meta.title']}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${d['meta.desc']}$2`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}/${lang}/$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${SITE}/${lang}/$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${d['meta.title']}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${d['meta.title']}$2`);
  return html;
}

/* корневая EN-страница получает hreflang-кластер */
let root = src;
if (!root.includes('hreflang')) {
  root = root.replace('  <link rel="canonical"', HREFLANG + '\n  <link rel="canonical"');
  writeFileSync('index.html', root);
}

for (const lang of LANGS) {
  let page = translate(root, lang);
  page = absolutify(page);
  mkdirSync(lang, { recursive: true });
  writeFileSync(`${lang}/index.html`, page);
  console.log(`${lang}/index.html: ${(page.length / 1024).toFixed(0)} KB`);
}
console.log('done');

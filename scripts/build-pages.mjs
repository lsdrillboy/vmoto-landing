/* Генератор индексируемых страниц-разделов на четырёх языках:
     /models   /ru/models   /th/models   /zh/models
     /business /ru/business /th/business /zh/business
     /faq      /ru/faq      /th/faq      /zh/faq
   Заголовки начинаются с темы (без бренда в начале) — именно первые
   слова <title> Google берёт подписью сайтлинка. У каждой страницы свой
   canonical, кластер hreflang, хлебные крошки и видимая навигация по
   разделам: без заметных внутренних ссылок сайтлинки не появляются.
   Запуск: node scripts/build-pages.mjs (из корня проекта). */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { MENU_CSS, menuMarkup, MENU_JS } from './lib/menu.mjs';
import { ANALYTICS, FORM_CSS, formMarkup, formJs } from './lib/leadform.mjs';

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
const t = (lang, key) => (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;

const SITE = 'https://www.vmotobikes.com';
const LANGS = ['en', 'ru', 'th', 'zh'];
const SLUGS = ['models', 'business', 'faq'];
const COMPANY = 'CANVAS SPV Co., Ltd';
const ADDRESS = '52/57 Moo 1, Na Jomtien, Sattahip, Chonburi 20250, Thailand';

/* префикс языка: en живёт в корне, остальные — в своей папке */
const path = (lang, slug) => (lang === 'en' ? `/${slug}` : `/${lang}/${slug}`);
const home = (lang) => (lang === 'en' ? '/' : `/${lang}`);

/* ─────────────────────────── интерфейс ─────────────────────────── */

/* заголовок и подпись окна заявки */
const LEAD = {
  en: { title: 'Book a test ride', sub: 'Leave your contact — we bring the bikes to a meeting point and answer everything on the spot.' },
  ru: { title: 'Запись на тест-драйв', sub: 'Оставьте контакт — привезём байки в удобное место и ответим на все вопросы на месте.' },
  th: { title: 'จองทดลองขับ', sub: 'ทิ้งช่องทางติดต่อไว้ เราจะนำรถไปยังจุดนัดพบและตอบทุกคำถามให้ที่นั่น' },
  zh: { title: '预约试驾', sub: '留下联系方式 — 我们把车送到约定地点，并当场解答所有问题。' },
};
const LEAD_FLEET = {
  en: { title: 'Fleet enquiry', sub: 'Tell us the size of the fleet and where it will operate — we will prepare terms for your business.' },
  ru: { title: 'Заявка на парк', sub: 'Напишите, какой нужен парк и где он будет работать, — подготовим условия под ваш бизнес.' },
  th: { title: 'สอบถามเรื่องฟลีต', sub: 'บอกเราว่าต้องการฟลีตขนาดเท่าไรและใช้งานที่ไหน เราจะจัดเงื่อนไขให้ธุรกิจของคุณ' },
  zh: { title: '车队咨询', sub: '告诉我们车队规模和运营地点，我们会为您的业务准备方案。' },
};

const UI = {
  en: {
    nav: { models: 'Models', business: 'For business', faq: 'FAQ' },
    home: 'Home',
    cta: 'Book a test ride',
    dealer: 'Official VMoto dealer in Thailand',
  },
  ru: {
    nav: { models: 'Модели', business: 'Для бизнеса', faq: 'Вопросы' },
    home: 'Главная',
    cta: 'Записаться на тест-драйв',
    dealer: 'Официальный дилер VMoto в Таиланде',
  },
  th: {
    nav: { models: 'รุ่นรถ', business: 'สำหรับธุรกิจ', faq: 'คำถามที่พบบ่อย' },
    home: 'หน้าแรก',
    cta: 'จองทดลองขับ',
    dealer: 'ตัวแทนจำหน่าย VMoto อย่างเป็นทางการในประเทศไทย',
  },
  zh: {
    nav: { models: '车型', business: '企业方案', faq: '常见问题' },
    home: '首页',
    cta: '预约试驾',
    dealer: '泰国 VMoto 官方经销商',
  },
};

/* ──────────────────────────── контент ──────────────────────────── */

const p = (...l) => l.map((x) => `      <p>${x}</p>`).join('\n');
const ul = (...l) => `      <ul>\n${l.map((x) => `        <li>${x}</li>`).join('\n')}\n      </ul>`;
const table = (head, rows) => `      <div class="table-wrap"><table class="ptable">
        <tr><th>&nbsp;</th><th>${head[0]}</th><th>${head[1]}</th></tr>
${rows.map((r) => (r.length === 2
    ? `        <tr><td>${r[0]}</td><td colspan="2"><b>${r[1]}</b></td></tr>`
    : `        <tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td><b>${r[2]}</b></td></tr>`)).join('\n')}
      </table></div>`;

const MODELS = {
  en: {
    title: 'Electric bikes CITI and CPX — prices and specs | VMOTO',
    desc: 'VMoto CITI (฿95,000, 107 km) and VMoto CPX (฿120,000, 130 km) compared: range, speed, charging, weight. Official dealer on Koh Samui and Koh Phangan.',
    h1: 'Electric bikes CITI and CPX',
    lead: 'Two electric bikes for island life. CITI is the light everyday commuter; CPX is the 125cc-class flagship with more range and more comfort. Both come with two removable batteries and a charger, and both carry a 3-year warranty.',
    sections: [
      { h: 'Side by side', body: table(['VMoto CITI', 'VMoto CPX'], [
        ['Price', '฿95,000', '฿120,000'],
        ['Range', '107 km', '130 km'],
        ['Top speed', '80 km/h', '90 km/h'],
        ['Fast charge', '20 min', '20 min'],
        ['Weight', '92 kg', '107 kg'],
        ['Batteries', 'Two removable batteries + charger included'],
        ['Warranty', '3 years on every part, service on the island'],
      ]) },
      { h: 'Which one is for you', body: `      <h3>Take the CITI if…</h3>\n` + ul(
        'you ride mostly around town, to the beach and back;',
        'you want the lightest bike to handle and park;',
        '฿95,000 is the budget you had in mind.',
      ) + `\n      <h3>Take the CPX if…</h3>\n` + ul(
        'you cross the island daily and want range to spare;',
        'you ride two-up or carry cargo;',
        'you want the taller screen and the calmer ride at speed.',
      ) },
      { h: 'What both models give you', body: ul(
        '<b>Instant torque.</b> Off the line an electric drive beats petrol 125cc scooters — no gears, no lag.',
        '<b>About ฿25 a day</b> of electricity instead of ฿150–200 on petrol.',
        '<b>Silence.</b> No engine roar, no fumes — you hear the island, not the bike.',
        '<b>Minimal maintenance.</b> No oil, belts or spark plugs.',
      ) },
    ],
    cta: 'Not sure which model fits? Ride both — we bring the bikes to a meeting point on Koh Phangan, free and with no obligation.',
  },
  ru: {
    title: 'Электробайки CITI и CPX — цены и характеристики | VMOTO',
    desc: 'Сравнение VMoto CITI (95 000 ฿, 107 км) и VMoto CPX (120 000 ฿, 130 км): запас хода, скорость, зарядка, вес. Официальный дилер на Самуи и Пангане.',
    h1: 'Электробайки CITI и CPX',
    lead: 'Два электробайка для жизни на острове. CITI — лёгкий байк на каждый день, CPX — флагман класса 125 кубов с большим запасом хода и комфортом. У обоих две съёмные батареи и зарядка в комплекте, гарантия 3 года.',
    sections: [
      { h: 'Сравнение', body: table(['VMoto CITI', 'VMoto CPX'], [
        ['Цена', '95 000 ฿', '120 000 ฿'],
        ['Запас хода', '107 км', '130 км'],
        ['Максимальная скорость', '80 км/ч', '90 км/ч'],
        ['Быстрая зарядка', '20 минут', '20 минут'],
        ['Вес', '92 кг', '107 кг'],
        ['Батареи', 'Две съёмные батареи и зарядное устройство в комплекте'],
        ['Гарантия', '3 года на всё, сервис на острове'],
      ]) },
      { h: 'Какой выбрать', body: `      <h3>Берите CITI, если…</h3>\n` + ul(
        'ездите в основном по посёлку, до пляжа и обратно;',
        'нужен самый лёгкий байк — удобнее в управлении и парковке;',
        'бюджет 95 000 ฿.',
      ) + `\n      <h3>Берите CPX, если…</h3>\n` + ul(
        'каждый день пересекаете остров и хотите запас хода с запасом;',
        'ездите вдвоём или возите груз;',
        'важнее высокое ветровое стекло и спокойный ход на скорости.',
      ) },
      { h: 'Что дают обе модели', body: ul(
        '<b>Мгновенная тяга.</b> На старте электромотор уверенно обходит бензиновые 125-кубовые скутеры — без передач и задержки.',
        '<b>Около 25 ฿ в день</b> на электричество вместо 150–200 ฿ на бензин.',
        '<b>Тишина.</b> Ни рёва мотора, ни выхлопа — слышно остров, а не байк.',
        '<b>Минимум обслуживания.</b> Нет масла, ремней и свечей.',
      ) },
    ],
    cta: 'Не знаете, какая модель ваша? Прокатитесь на обеих — привезём байки в удобное место на Пангане, бесплатно и без обязательств.',
  },
  th: {
    title: 'มอเตอร์ไซค์ไฟฟ้า CITI และ CPX — ราคาและสเปก | VMOTO',
    desc: 'เปรียบเทียบ VMoto CITI (฿95,000 ระยะทาง 107 กม.) กับ VMoto CPX (฿120,000 ระยะทาง 130 กม.): ระยะทาง ความเร็ว การชาร์จ น้ำหนัก ตัวแทนจำหน่ายอย่างเป็นทางการบนเกาะสมุยและเกาะพะงัน',
    h1: 'มอเตอร์ไซค์ไฟฟ้า CITI และ CPX',
    lead: 'มอเตอร์ไซค์ไฟฟ้าสองรุ่นสำหรับชีวิตบนเกาะ CITI เป็นรุ่นเบาสำหรับใช้งานทุกวัน ส่วน CPX เป็นรุ่นเรือธงระดับ 125 ซีซี ที่วิ่งได้ไกลกว่าและนั่งสบายกว่า ทั้งสองรุ่นมาพร้อมแบตเตอรี่ถอดได้สองก้อนและที่ชาร์จ พร้อมการรับประกัน 3 ปี',
    sections: [
      { h: 'เปรียบเทียบ', body: table(['VMoto CITI', 'VMoto CPX'], [
        ['ราคา', '฿95,000', '฿120,000'],
        ['ระยะทางต่อการชาร์จ', '107 กม.', '130 กม.'],
        ['ความเร็วสูงสุด', '80 กม./ชม.', '90 กม./ชม.'],
        ['ชาร์จเร็ว', '20 นาที', '20 นาที'],
        ['น้ำหนัก', '92 กก.', '107 กก.'],
        ['แบตเตอรี่', 'แบตเตอรี่ถอดได้ 2 ก้อน พร้อมที่ชาร์จ'],
        ['การรับประกัน', '3 ปีทุกชิ้นส่วน พร้อมบริการบนเกาะ'],
      ]) },
      { h: 'เลือกรุ่นไหนดี', body: `      <h3>เลือก CITI ถ้า…</h3>\n` + ul(
        'คุณขี่ในตัวเมืองเป็นหลัก ไปหาดแล้วกลับ',
        'คุณต้องการรถที่เบาที่สุด ควบคุมและจอดง่าย',
        'งบประมาณของคุณคือ ฿95,000',
      ) + `\n      <h3>เลือก CPX ถ้า…</h3>\n` + ul(
        'คุณข้ามเกาะทุกวันและอยากได้ระยะทางเผื่อไว้',
        'คุณซ้อนสองหรือบรรทุกของ',
        'คุณต้องการบังลมสูงและการขับขี่ที่นิ่งกว่าเมื่อใช้ความเร็ว',
      ) },
      { h: 'สิ่งที่ได้จากทั้งสองรุ่น', body: ul(
        '<b>แรงบิดทันที</b> ออกตัวได้ดีกว่าสกูตเตอร์น้ำมัน 125 ซีซี ไม่มีเกียร์ ไม่มีดีเลย์',
        '<b>ค่าไฟราววันละ ฿25</b> แทนค่าน้ำมัน ฿150–200',
        '<b>เงียบสนิท</b> ไม่มีเสียงเครื่องยนต์ ไม่มีควัน คุณได้ยินเสียงของเกาะ ไม่ใช่เสียงรถ',
        '<b>ดูแลรักษาน้อย</b> ไม่มีน้ำมันเครื่อง สายพาน หรือหัวเทียน',
      ) },
    ],
    cta: 'ยังไม่แน่ใจว่ารุ่นไหนเหมาะกับคุณ? ลองขี่ทั้งสองรุ่นได้เลย เรานำรถไปยังจุดนัดพบบนเกาะพะงัน ฟรีและไม่มีข้อผูกมัด',
  },
  zh: {
    title: '电动车 CITI 与 CPX — 价格与参数 | VMOTO',
    desc: 'VMoto CITI（฿95,000，续航 107 公里）与 VMoto CPX（฿120,000，续航 130 公里）对比：续航、速度、充电、重量。苏梅岛与帕岸岛官方经销商。',
    h1: '电动车 CITI 与 CPX',
    lead: '两款适合海岛生活的电动车。CITI 轻便，适合日常代步；CPX 是 125cc 级别的旗舰，续航更长、乘坐更舒适。两款均配备两块可拆卸电池和充电器，享 3 年质保。',
    sections: [
      { h: '参数对比', body: table(['VMoto CITI', 'VMoto CPX'], [
        ['价格', '฿95,000', '฿120,000'],
        ['续航', '107 公里', '130 公里'],
        ['最高时速', '80 公里/小时', '90 公里/小时'],
        ['快充', '20 分钟', '20 分钟'],
        ['重量', '92 公斤', '107 公斤'],
        ['电池', '两块可拆卸电池，含充电器'],
        ['质保', '整车 3 年质保，岛上提供服务'],
      ]) },
      { h: '如何选择', body: `      <h3>选择 CITI，如果…</h3>\n` + ul(
        '您主要在镇上代步，往返海滩；',
        '您想要最轻便、好操控好停放的车；',
        '预算在 ฿95,000 左右。',
      ) + `\n      <h3>选择 CPX，如果…</h3>\n` + ul(
        '您每天穿越全岛，希望续航有余量；',
        '您经常载人或带货；',
        '您需要更高的风挡和高速下更稳的行驶质感。',
      ) },
      { h: '两款车的共同优势', body: ul(
        '<b>瞬时扭矩。</b>起步优于 125cc 燃油踏板车 — 无挡位、无迟滞。',
        '<b>每天约 ฿25 电费</b>，而燃油需要 ฿150–200。',
        '<b>安静。</b>没有轰鸣与尾气 — 听见的是海岛，而不是车。',
        '<b>保养极少。</b>无需机油、皮带和火花塞。',
      ) },
    ],
    cta: '不确定选哪一款？两款都可以试骑 — 我们把车送到帕岸岛的约定地点，免费且无任何购买义务。',
  },
};

const BUSINESS = {
  en: {
    title: 'Electric bikes for business — fleets on Samui and Phangan | VMOTO',
    desc: 'Fleet terms for retreat centres, villas, hotels and rental businesses on Koh Samui and Koh Phangan: volume pricing, registration, service and charging handled.',
    h1: 'Electric bikes for business',
    lead: 'We assemble fleets for rentals, villas, hotels, retreats and delivery services on Koh Samui and Koh Phangan — with warranty, registration and on-island support.',
    features: [
      ['shield', 'Warranty &amp; service'],
      ['doc', 'Registration included'],
      ['truck', 'Delivery to your location'],
      ['support', 'On-island support'],
    ],
    whyLabel: 'Why VMOTO',
    whyTitle: 'Advantages for your business',
    advantages: [
      ['chart', 'Low operating costs', 'Around ฿25 of electricity per day against ฿150–200 on petrol. The difference stays with you.'],
      ['wrench', 'Minimum maintenance', 'No oil, belts or spark plugs. A 3-year warranty on every part and full service on the island.'],
      ['bolt', 'Simple and reliable', 'Two batteries and a 20-minute fast charge keep your fleet running, not waiting in the shop.'],
    ],
    segLabel: 'Who it is for',
    segTitle: 'Two ways to put a fleet to work',
    segments: [
      { img: 'hotels', t: 'Retreat centres, villas and hotels',
        x: 'A fleet of silent e-bikes is a real upgrade to your service: guests move around the island with no noise and no fumes — in tune with the place. No rental hunting on arrival, extra value for every stay, an eco-friendly image, and rental income if you charge for the bikes.' },
      { img: 'rental', t: 'Opening a rental business',
        x: 'Launching e-bike rental on the island comes with dedicated terms: volume pricing, registration handled for you, staff training and service support. Electric bikes cut the two things that hurt rental margins most — fuel and maintenance.' },
    ],
    incTitle: 'What a fleet package includes',
    included: [
      'volume pricing on VMoto CITI and CPX',
      'registration and plates arranged for every unit',
      'delivery across Koh Samui and Koh Phangan',
      'service and spare parts on the island, mobile team for fleets',
      'charging setup advice',
      'access to our charging network as it opens',
    ],
    ctaTitle: 'Every business is different.',
    ctaText: 'Tell us the size of the fleet and where it will operate — we will prepare terms for your business: pricing, service and charging.',
    trust: ['Official VMoto dealer', 'Samui &amp; Phangan', 'On-island support', 'Warranty &amp; service'],
  },

  ru: {
    title: 'Электробайки для бизнеса — парки на Самуи и Пангане | VMOTO',
    desc: 'Условия для ретрит-центров, вилл, отелей и прокатов на Самуи и Пангане: цены на парк, регистрация, сервис и зарядка — берём на себя.',
    h1: 'Электробайки для бизнеса',
    lead: 'Собираем парки для прокатов, вилл, отелей, ретрит-центров и служб доставки на Самуи и Пангане — с гарантией, регистрацией и поддержкой на острове.',
    features: [
      ['shield', 'Гарантия и сервис'],
      ['doc', 'Регистрация включена'],
      ['truck', 'Доставка на место'],
      ['support', 'Поддержка на острове'],
    ],
    whyLabel: 'Почему VMOTO',
    whyTitle: 'Преимущества для вашего бизнеса',
    advantages: [
      ['chart', 'Низкие расходы на ход', 'Около 25 ฿ электричества в день против 150–200 ฿ на бензин. Разница остаётся у вас.'],
      ['wrench', 'Минимум обслуживания', 'Нет масла, ремней и свечей. Гарантия 3 года на всё и полный сервис на острове.'],
      ['bolt', 'Просто и надёжно', 'Две батареи и быстрая зарядка за 20 минут держат парк на линии, а не в мастерской.'],
    ],
    segLabel: 'Кому подходит',
    segTitle: 'Два способа заставить парк работать',
    segments: [
      { img: 'hotels', t: 'Ретрит-центры, виллы и отели',
        x: 'Парк бесшумных электробайков — реальный апгрейд сервиса: гости перемещаются по острову без шума и выхлопа, в согласии с местом. Не нужно искать прокат по приезде, каждая ночь становится ценнее, плюс экологичный образ и доход с аренды, если байки платные.' },
      { img: 'rental', t: 'Открытие проката',
        x: 'Для запуска проката электробайков на острове действуют отдельные условия: цена за парк, регистрация под ключ, обучение персонала и поддержка сервиса. Электробайки убирают две главные статьи, которые съедают маржу проката, — топливо и обслуживание.' },
    ],
    incTitle: 'Что входит в условия для парка',
    included: [
      'цена за объём на VMoto CITI и CPX',
      'регистрация и номера на каждую единицу',
      'доставка по Самуи и Пангану',
      'сервис и запчасти на острове, выездная бригада',
      'помощь с организацией зарядки',
      'доступ к нашей сети станций по мере запуска',
    ],
    ctaTitle: 'Каждый бизнес уникален.',
    ctaText: 'Напишите, какой нужен парк и где он будет работать, — подготовим условия под ваш бизнес: цены, сервис и зарядку.',
    trust: ['Официальный дилер VMoto', 'Самуи и Панган', 'Поддержка на острове', 'Гарантия и сервис'],
  },

  th: {
    title: 'มอเตอร์ไซค์ไฟฟ้าสำหรับธุรกิจ — ฟลีตบนเกาะสมุยและพะงัน | VMOTO',
    desc: 'เงื่อนไขสำหรับรีทรีตเซ็นเตอร์ วิลล่า โรงแรม และธุรกิจให้เช่าบนเกาะสมุยและเกาะพะงัน: ราคาต่อจำนวน การจดทะเบียน บริการ และการชาร์จ',
    h1: 'มอเตอร์ไซค์ไฟฟ้าสำหรับธุรกิจ',
    lead: 'เราจัดฟลีตให้ธุรกิจให้เช่า วิลล่า โรงแรม รีทรีตเซ็นเตอร์ และบริการจัดส่งบนเกาะสมุยและเกาะพะงัน พร้อมการรับประกัน การจดทะเบียน และการดูแลบนเกาะ',
    features: [
      ['shield', 'รับประกันและบริการ'],
      ['doc', 'รวมการจดทะเบียน'],
      ['truck', 'จัดส่งถึงที่'],
      ['support', 'ทีมดูแลบนเกาะ'],
    ],
    whyLabel: 'ทำไมต้อง VMOTO',
    whyTitle: 'ข้อดีสำหรับธุรกิจของคุณ',
    advantages: [
      ['chart', 'ต้นทุนใช้งานต่ำ', 'ค่าไฟราววันละ ฿25 เทียบกับค่าน้ำมัน ฿150–200 ส่วนต่างอยู่กับคุณ'],
      ['wrench', 'ดูแลรักษาน้อย', 'ไม่มีน้ำมันเครื่อง สายพาน หรือหัวเทียน รับประกัน 3 ปีทุกชิ้นส่วน พร้อมบริการเต็มรูปแบบบนเกาะ'],
      ['bolt', 'ง่ายและเชื่อถือได้', 'แบตเตอรี่สองก้อนและชาร์จเร็ว 20 นาที ทำให้ฟลีตวิ่งได้ต่อเนื่อง ไม่ต้องรอในอู่'],
    ],
    segLabel: 'เหมาะกับใคร',
    segTitle: 'สองรูปแบบการใช้ฟลีตให้เกิดรายได้',
    segments: [
      { img: 'hotels', t: 'รีทรีตเซ็นเตอร์ วิลล่า และโรงแรม',
        x: 'ฟลีตมอเตอร์ไซค์ไฟฟ้าที่เงียบสนิทคือการยกระดับบริการอย่างแท้จริง แขกเดินทางรอบเกาะโดยไม่มีเสียงและควัน สอดคล้องกับบรรยากาศของสถานที่ ไม่ต้องออกไปหาที่เช่ารถเมื่อมาถึง เพิ่มมูลค่าให้ทุกการเข้าพัก สร้างภาพลักษณ์รักษ์โลก และมีรายได้จากค่าเช่าหากคิดค่าบริการ' },
      { img: 'rental', t: 'เปิดธุรกิจให้เช่า',
        x: 'การเริ่มธุรกิจให้เช่ามอเตอร์ไซค์ไฟฟ้าบนเกาะมีเงื่อนไขเฉพาะ: ราคาตามจำนวน ดำเนินการจดทะเบียนให้ อบรมพนักงาน และสนับสนุนงานบริการ รถไฟฟ้าช่วยตัดสองรายจ่ายที่กินกำไรของธุรกิจเช่ามากที่สุด คือค่าน้ำมันและค่าบำรุงรักษา' },
    ],
    incTitle: 'แพ็กเกจฟลีตประกอบด้วย',
    included: [
      'ราคาตามจำนวนสำหรับ VMoto CITI และ CPX',
      'จดทะเบียนและป้ายทะเบียนให้ทุกคัน',
      'จัดส่งทั่วเกาะสมุยและเกาะพะงัน',
      'บริการและอะไหล่บนเกาะ พร้อมทีมเคลื่อนที่',
      'คำแนะนำการติดตั้งจุดชาร์จ',
      'สิทธิ์เข้าถึงเครือข่ายสถานีชาร์จของเราเมื่อเปิดให้บริการ',
    ],
    ctaTitle: 'ทุกธุรกิจไม่เหมือนกัน',
    ctaText: 'บอกเราว่าต้องการฟลีตขนาดเท่าไรและใช้งานที่ไหน เราจะจัดเงื่อนไขให้ธุรกิจของคุณ ทั้งราคา บริการ และการชาร์จ',
    trust: ['ตัวแทนจำหน่าย VMoto อย่างเป็นทางการ', 'สมุยและพะงัน', 'ทีมดูแลบนเกาะ', 'รับประกันและบริการ'],
  },

  zh: {
    title: '企业电动车方案 — 苏梅岛与帕岸岛车队 | VMOTO',
    desc: '面向静修中心、别墅、酒店和租赁企业的车队方案：批量价格、上牌、岛上服务与充电，全部由我们负责。',
    h1: '企业电动车方案',
    lead: '我们为苏梅岛和帕岸岛的租赁企业、别墅、酒店、静修中心和配送服务组建车队 — 含质保、上牌与岛上支持。',
    features: [
      ['shield', '质保与服务'],
      ['doc', '含注册上牌'],
      ['truck', '送车上门'],
      ['support', '岛上支持'],
    ],
    whyLabel: '为什么选择 VMOTO',
    whyTitle: '对您业务的价值',
    advantages: [
      ['chart', '使用成本低', '每天约 ฿25 电费，而燃油需要 ฿150–200。差额留在您手里。'],
      ['wrench', '保养极少', '无需机油、皮带和火花塞。整车 3 年质保，岛上提供完整服务。'],
      ['bolt', '简单可靠', '两块电池加 20 分钟快充，让车队持续运营，而不是在修理厂等待。'],
    ],
    segLabel: '适合谁',
    segTitle: '车队创造收益的两种方式',
    segments: [
      { img: 'hotels', t: '静修中心、别墅与酒店',
        x: '一支安静的电动车队是服务品质的实质提升：客人环岛出行没有噪音和尾气，与环境相得益彰。抵达后无需再去找车行，每一晚的住宿都更有价值，同时带来环保形象；若收费出租，还能形成一项收入。' },
      { img: 'rental', t: '开设租赁业务',
        x: '在岛上开展电动车租赁享有专门条件：批量价格、代办上牌、员工培训与服务支持。电动车削减了最侵蚀租赁利润的两项成本 — 燃油与维修。' },
    ],
    incTitle: '车队方案包含',
    included: [
      'VMoto CITI 与 CPX 的批量价格',
      '每台车的注册与牌照办理',
      '苏梅岛与帕岸岛全岛配送',
      '岛上服务与备件，车队上门团队',
      '充电方案建议',
      '充电网络开通后的接入权',
    ],
    ctaTitle: '每一家企业都不一样。',
    ctaText: '告诉我们车队规模和运营地点，我们会为您的业务准备方案：价格、服务与充电。',
    trust: ['VMoto 官方经销商', '苏梅岛与帕岸岛', '岛上支持', '质保与服务'],
  },
};

/* блок о зарядной инфраструктуре на странице «Для бизнеса».
   Фото появится само, как только файл ляжет в assets/business/ */
const CHARGE_IMG = 'assets/business/stations.avif';
const CHARGE = {
  en: {
    label: 'Charging',
    title: 'Charging infrastructure for your fleet',
    text: 'Every bike carries two removable batteries and a charger, so a fleet runs off ordinary sockets from day one — no construction, no separate connection. When you need more throughput, we advise where to put chargers on your property and how many a fleet of your size needs.',
    facts: [
      ['plug', 'Ordinary socket', 'A battery charges from any 220 V outlet with the charger in the box.'],
      ['clock', '20 minutes', 'A fast charge at our stations — a bike is back on the road within a coffee break.'],
      ['battery', 'Two per bike', 'One battery rides, the second charges: the unit never waits by a socket.'],
    ],
    note: 'Our own station network on Samui and Phangan is being built — fleet clients get access as it opens.',
  },
  ru: {
    label: 'Зарядка',
    title: 'Зарядная инфраструктура для вашего парка',
    text: 'У каждого байка две съёмные батареи и зарядное устройство, поэтому парк работает от обычных розеток с первого дня — без стройки и отдельного подключения. Когда нужна большая пропускная способность, подскажем, где разместить зарядки на территории и сколько их нужно парку вашего размера.',
    facts: [
      ['plug', 'Обычная розетка', 'Батарея заряжается от любой розетки 220 В зарядным устройством из комплекта.'],
      ['clock', '20 минут', 'Быстрая зарядка на наших станциях — байк возвращается на линию за время кофе-брейка.'],
      ['battery', 'Две на байк', 'Одна батарея едет, вторая заряжается: техника не простаивает у розетки.'],
    ],
    note: 'Собственная сеть станций на Самуи и Пангане строится — клиентам с парком доступ по мере запуска.',
  },
  th: {
    label: 'การชาร์จ',
    title: 'โครงสร้างพื้นฐานการชาร์จสำหรับฟลีตของคุณ',
    text: 'รถทุกคันมาพร้อมแบตเตอรี่ถอดได้สองก้อนและที่ชาร์จ ฟลีตจึงใช้งานได้จากปลั๊กธรรมดาตั้งแต่วันแรก ไม่ต้องก่อสร้างหรือขอไฟเพิ่ม และเมื่อคุณต้องการรองรับการชาร์จมากขึ้น เราจะแนะนำว่าควรติดตั้งจุดชาร์จตรงไหนและต้องมีกี่จุดสำหรับฟลีตขนาดของคุณ',
    facts: [
      ['plug', 'ปลั๊กธรรมดา', 'แบตเตอรี่ชาร์จได้จากปลั๊ก 220V ทั่วไปด้วยที่ชาร์จที่ให้มาในกล่อง'],
      ['clock', '20 นาที', 'ชาร์จเร็วที่สถานีของเรา รถกลับไปวิ่งได้ภายในเวลาพักกาแฟ'],
      ['battery', 'สองก้อนต่อคัน', 'ก้อนหนึ่งใช้วิ่ง อีกก้อนชาร์จ รถจึงไม่ต้องจอดรอที่ปลั๊ก'],
    ],
    note: 'เครือข่ายสถานีชาร์จของเราบนเกาะสมุยและพะงันกำลังก่อสร้าง ลูกค้าฟลีตจะได้สิทธิ์เข้าใช้เมื่อเปิดบริการ',
  },
  zh: {
    label: '充电',
    title: '为您的车队配套充电方案',
    text: '每台车配两块可拆卸电池和充电器，因此车队从第一天起就能用普通插座运转 — 无需施工，也不必单独报装。当吞吐量需要提升时，我们会建议充电桩应该装在场地的哪个位置、您这种规模的车队需要几台。',
    facts: [
      ['plug', '普通插座', '用随车充电器即可在任意 220V 插座充电。'],
      ['clock', '20 分钟', '在我们的站点快充 — 一杯咖啡的时间，车就能重新上路。'],
      ['battery', '每车两块', '一块在路上，一块在充电：车不必停在插座旁等待。'],
    ],
    note: '我们在苏梅岛与帕岸岛的自建充电网络正在建设中，车队客户将在开通后获得接入权。',
  },
};

/* иконки шапки преимуществ — контурные, наследуют цвет */
const ICONS = {
  shield: '<path d="M12 3l7 3v5.5c0 4.3-2.9 7.4-7 8.5-4.1-1.1-7-4.2-7-8.5V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  doc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  truck: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  support: '<path d="M4 13v-1a8 8 0 0116 0v1"/><rect x="2.5" y="13" width="4" height="6" rx="1.6"/><rect x="17.5" y="13" width="4" height="6" rx="1.6"/><path d="M19 19v1a3 3 0 01-3 3h-3"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3.5-4 3 2.5L20 7"/><path d="M20 11V7h-4"/>',
  wrench: '<path d="M15.5 3.5a5.5 5.5 0 00-6.9 7l-5 5a2 2 0 002.9 2.9l5-5a5.5 5.5 0 007-6.9L15 9.6 12.4 9l-.6-2.6 3.7-2.9z"/>',
  bolt: '<path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  plug: '<path d="M9 3v5M15 3v5"/><path d="M6.5 8h11v3a5.5 5.5 0 0 1-11 0V8z"/><path d="M12 16.5V21"/>',
  battery: '<rect x="3" y="7" width="15" height="10" rx="2"/><path d="M21 10.5v3"/><path d="M7 10.5v3M11 10.5v3"/>',
};
const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

/* вопросы вынесены отдельно: из них же собирается разметка FAQPage */
const FAQ_QA = {
  en: [
    ['Can foreigners buy a bike?', 'Yes — foreigners can officially buy and own a VMoto. We handle all the paperwork.'],
    ['Registration and plates?', 'We take care of the registration and plates ourselves right after the purchase.'],
    ['Do I need a licence?', 'Yes, same as any scooter: a Thai or an international motorcycle licence. We’ll advise how to get a local one.'],
    ['Can I charge at home?', 'Yes — each battery charges from a regular outlet with the included charger. A fast charge at our stations takes about 20 minutes. Both batteries are removable, so you can carry them inside instead of parking next to a socket.'],
    ['Where is the bike serviced?', 'On the island: our own service, parts in stock and a mobile team for Samui and Phangan. An electric drive needs no oil, belts or spark plugs, so routine maintenance is minimal.'],
    ['How does a test ride work?', 'We meet on Koh Phangan — you come to us, or we arrange a convenient spot individually. 15–20 minutes, free, no obligations.'],
    ['What does it cost to run?', 'About ฿25 of electricity a day against ฿150–200 you would spend on petrol — plus no oil changes and no engine servicing.'],
    ['What is covered by the warranty?', 'Three years on every part of the bike, with parts and service available on the island.'],
  ],
  ru: [
    ['Может ли иностранец купить байк?', 'Да — иностранец может официально купить и владеть VMoto. Все документы оформляем мы.'],
    ['Регистрация и номера?', 'Регистрацию и номера оформляем сами сразу после покупки.'],
    ['Нужны ли права?', 'Да, как и на любой скутер: тайские или международные права категории «мотоцикл». Подскажем, как получить местные.'],
    ['Можно заряжать дома?', 'Да — каждая батарея заряжается от обычной розетки зарядным устройством из комплекта. Быстрая зарядка на наших станциях занимает около 20 минут. Обе батареи съёмные, так что их можно занести домой, а не парковаться у розетки.'],
    ['Где обслуживать байк?', 'На острове: собственный сервис, запчасти в наличии и выездная бригада на Самуи и Пангане. Электромотору не нужны масло, ремни и свечи, поэтому регулярное обслуживание минимально.'],
    ['Как проходит тест-драйв?', 'Встречаемся на Пангане — вы приезжаете к нам или договариваемся об удобном месте индивидуально. 15–20 минут, бесплатно и без обязательств.'],
    ['Сколько стоит эксплуатация?', 'Около 25 ฿ электричества в день против 150–200 ฿ на бензин — плюс нет замены масла и обслуживания двигателя.'],
    ['Что покрывает гарантия?', 'Три года на все узлы байка, запчасти и сервис доступны на острове.'],
  ],
  th: [
    ['ชาวต่างชาติซื้อรถได้ไหม', 'ได้ — ชาวต่างชาติสามารถซื้อและถือครอง VMoto ได้อย่างถูกต้อง เราดำเนินเอกสารทั้งหมดให้'],
    ['การจดทะเบียนและป้ายทะเบียน', 'เราดำเนินการจดทะเบียนและทำป้ายให้เองทันทีหลังการซื้อ'],
    ['ต้องมีใบขับขี่ไหม', 'ต้องมี เช่นเดียวกับสกูตเตอร์ทั่วไป: ใบขับขี่รถจักรยานยนต์ของไทยหรือใบขับขี่สากล เราแนะนำวิธีทำใบขับขี่ในไทยให้ได้'],
    ['ชาร์จที่บ้านได้ไหม', 'ได้ — แบตเตอรี่แต่ละก้อนชาร์จจากปลั๊กบ้านทั่วไปด้วยที่ชาร์จที่ให้มา ส่วนการชาร์จเร็วที่สถานีของเราใช้เวลาราว 20 นาที แบตเตอรี่ถอดได้ทั้งสองก้อน จึงยกเข้าบ้านได้โดยไม่ต้องจอดรถข้างปลั๊ก'],
    ['ซ่อมบำรุงที่ไหน', 'บนเกาะ: ศูนย์บริการของเราเอง มีอะไหล่พร้อม และทีมเคลื่อนที่สำหรับสมุยและพะงัน มอเตอร์ไฟฟ้าไม่ต้องใช้น้ำมันเครื่อง สายพาน หรือหัวเทียน การบำรุงรักษาจึงน้อยมาก'],
    ['ทดลองขับอย่างไร', 'นัดพบกันที่เกาะพะงัน — คุณมาหาเรา หรือนัดจุดที่สะดวกเป็นรายบุคคล ใช้เวลา 15–20 นาที ฟรี ไม่มีข้อผูกมัด'],
    ['ค่าใช้จ่ายในการใช้งานเท่าไร', 'ค่าไฟราววันละ ฿25 เทียบกับค่าน้ำมัน ฿150–200 อีกทั้งไม่ต้องเปลี่ยนถ่ายน้ำมันเครื่องหรือดูแลเครื่องยนต์'],
    ['การรับประกันครอบคลุมอะไรบ้าง', 'รับประกัน 3 ปีทุกชิ้นส่วนของรถ พร้อมอะไหล่และบริการบนเกาะ'],
  ],
  zh: [
    ['外国人可以购买吗？', '可以 — 外国人能够合法购买并持有 VMoto。所有手续由我们办理。'],
    ['注册与牌照怎么办？', '购车后我们会立即代为办理注册和牌照。'],
    ['需要驾照吗？', '需要，与普通踏板车一样：泰国摩托车驾照或国际驾照。我们会指导如何办理本地驾照。'],
    ['可以在家充电吗？', '可以 — 每块电池都能用随车充电器在普通插座充电。在我们的站点快充约 20 分钟。两块电池均可拆卸，可以拿回室内充电，无需把车停在插座旁。'],
    ['在哪里保养维修？', '就在岛上：我们自己的服务点、常备配件，以及苏梅岛和帕岸岛的上门团队。电驱动无需机油、皮带和火花塞，日常保养极少。'],
    ['试驾如何安排？', '我们在帕岸岛见面 — 您来找我们，或另约方便的地点。15–20 分钟，免费，无任何购买义务。'],
    ['日常使用成本是多少？', '每天约 ฿25 电费，而燃油需要 ฿150–200 — 而且无需换机油和发动机保养。'],
    ['质保包含哪些内容？', '整车所有部件 3 年质保，岛上提供配件与服务。'],
  ],
};

const FAQ_META = {
  en: {
    title: 'Questions before buying an electric bike in Thailand | VMOTO',
    desc: 'Can foreigners buy? Registration, licence, home charging, service and how a test ride works — answers for buyers on Koh Samui and Koh Phangan.',
    h1: 'Questions before buying',
    lead: 'Everything foreigners usually ask before buying an electric bike on Koh Samui or Koh Phangan. Something missing? Message us on WhatsApp — we answer within the hour.',
    cta: 'Still deciding? Book a free test ride and answer the question with your hands on the bars.',
  },
  ru: {
    title: 'Вопросы перед покупкой электробайка в Таиланде | VMOTO',
    desc: 'Может ли иностранец купить? Регистрация, права, зарядка дома, сервис и как проходит тест-драйв — ответы для покупателей на Самуи и Пангане.',
    h1: 'Вопросы перед покупкой',
    lead: 'Всё, что обычно спрашивают иностранцы перед покупкой электробайка на Самуи или Пангане. Чего-то не хватает? Напишите в WhatsApp — отвечаем в течение часа.',
    cta: 'Ещё выбираете? Запишитесь на бесплатный тест-драйв и ответьте на вопрос руками, а не текстом.',
  },
  th: {
    title: 'คำถามก่อนซื้อมอเตอร์ไซค์ไฟฟ้าในประเทศไทย | VMOTO',
    desc: 'ชาวต่างชาติซื้อได้ไหม การจดทะเบียน ใบขับขี่ การชาร์จที่บ้าน การบริการ และการทดลองขับ — คำตอบสำหรับผู้ซื้อบนเกาะสมุยและเกาะพะงัน',
    h1: 'คำถามก่อนซื้อ',
    lead: 'ทุกเรื่องที่ชาวต่างชาติมักถามก่อนซื้อมอเตอร์ไซค์ไฟฟ้าบนเกาะสมุยหรือเกาะพะงัน ไม่เจอคำตอบที่ต้องการ? ทักมาทาง WhatsApp เราตอบภายในหนึ่งชั่วโมง',
    cta: 'ยังตัดสินใจไม่ได้? จองทดลองขับฟรี แล้วให้มือของคุณเป็นคนตอบ',
  },
  zh: {
    title: '在泰国购买电动车前的常见问题 | VMOTO',
    desc: '外国人能否购买？注册、驾照、家用充电、维修保养以及试驾流程 — 面向苏梅岛与帕岸岛买家的解答。',
    h1: '购车前的常见问题',
    lead: '外国人在苏梅岛或帕岸岛购买电动车前最常问的问题都在这里。没找到答案？通过 WhatsApp 联系我们，一小时内回复。',
    cta: '还在犹豫？预约免费试驾，用手感来回答这个问题。',
  },
};

const faqDoc = (lang) => ({
  ...FAQ_META[lang],
  sections: FAQ_QA[lang].map(([q, a]) => ({ h: q, body: p(a) })),
});


/* плитки под заголовком героя: только проверяемые факты */
const HERO_TILES = {
  models: {
    en: [['bolt', 'Range up to 130 km'], ['clock', '20-minute fast charge'], ['shield', '3-year warranty'], ['battery', 'Two removable batteries']],
    ru: [['bolt', 'Запас хода до 130 км'], ['clock', 'Зарядка 20 минут'], ['shield', 'Гарантия 3 года'], ['battery', 'Две съёмные батареи']],
    th: [['bolt', 'ระยะทางสูงสุด 130 กม.'], ['clock', 'ชาร์จเร็ว 20 นาที'], ['shield', 'รับประกัน 3 ปี'], ['battery', 'แบตเตอรี่ถอดได้ 2 ก้อน']],
    zh: [['bolt', '续航最高 130 公里'], ['clock', '20 分钟快充'], ['shield', '3 年质保'], ['battery', '两块可拆卸电池']],
  },
  faq: {
    en: [['support', 'We answer within the hour'], ['doc', 'Paperwork handled for you'], ['pin', 'Samui &amp; Phangan'], ['shield', '3-year warranty']],
    ru: [['support', 'Отвечаем в течение часа'], ['doc', 'Документы оформляем мы'], ['pin', 'Самуи и Панган'], ['shield', 'Гарантия 3 года']],
    th: [['support', 'ตอบภายในหนึ่งชั่วโมง'], ['doc', 'เราจัดการเอกสารให้'], ['pin', 'สมุยและพะงัน'], ['shield', 'รับประกัน 3 ปี']],
    zh: [['support', '一小时内回复'], ['doc', '手续由我们办理'], ['pin', '苏梅岛与帕岸岛'], ['shield', '3 年质保']],
  },
};

/* фон героя и точка кадрирования: текст должен лечь на затемнённую часть.
   Для «Вопросов» ждём отдельный кадр; пока его нет — остаётся прокат. */
const FAQ_HERO = 'assets/business/faq-hero.avif';
const HERO_IMG = {
  models: ['/assets/img/hero-bg.avif', '78% 50%'],
  business: ['/assets/business/retreat.avif', '72% 50%'],
  faq: [existsSync(FAQ_HERO) ? `/${FAQ_HERO}` : '/assets/business/rental.avif', '58% 50%'],
};

const CONTENT = {
  models: MODELS,
  business: BUSINESS,
  faq: Object.fromEntries(LANGS.map((l) => [l, faqDoc(l)])),
};

/* ──────────────────────────── шаблон ──────────────────────────── */

/* общий герой с фотографией — одинаковый на всех страницах-разделах */
function hero(slug, lang, ui, h1, lead, tiles) {
  const [img, pos] = HERO_IMG[slug];
  const feats = tiles
    .map(([ic, t]) => `        <div class="biz-feat"><i>${icon(ic)}</i><span>${t}</span></div>`)
    .join('\n');
  return `    <section class="biz-hero">
      <div class="biz-hero__bg" aria-hidden="true"><img src="${img}" alt="" style="object-position:${pos}" fetchpriority="high"></div>
      <div class="biz-hero__shade" aria-hidden="true"></div>
      <div class="biz-hero__fade" aria-hidden="true"></div>
      <div class="wide biz-hero__inner">
        <p class="page-eyebrow">${ui.dealer}</p>
        <h1>${h1}</h1>
        <p class="biz-hero__lead">${lead}</p>
        <div class="biz-feats">
${feats}
        </div>
        <button type="button" class="btn" data-lead>${ui.cta}&ensp;→</button>
      </div>
    </section>`;
}

/* плашка с предложением — общий низ всех разделов */
function outro(d, ui, lang) {
  return `    <div class="wide biz-cta">
      <div class="biz-cta__l">
        <i>${icon('calendar', 24)}</i>
        <p>${d.ctaTitle ? `<b>${d.ctaTitle}</b>` : ''}${d.ctaText || d.cta}</p>
      </div>
      <button type="button" class="btn" data-lead>${ui.cta}&ensp;→</button>
    </div>`;
}

/* «Модели» и «Вопросы»: герой, затем содержимое в широких секциях */
function docMain(d, ui, lang, slug) {
  let body;
  if (slug === 'faq') {
    const rows = d.sections
      .map((s, i) => `        <div class="qa__row">
          <div class="qa__q"><i>${String(i + 1).padStart(2, '0')}</i><h2>${s.h}</h2></div>
          <p class="qa__a">${s.body.replace(/<\/?p>/g, '').trim()}</p>
        </div>`)
      .join('\n');
    body = `    <section class="wide biz-section">
      <div class="qa">
${rows}
      </div>
    </section>`;
  } else {
    body = d.sections
      .map((s) => `    <section class="wide biz-section">
      <h2 class="biz-h2">${s.h}</h2>
      <div class="biz-rule" aria-hidden="true"></div>
      <div class="doc-body">
${s.body}
      </div>
    </section>`)
      .join('\n\n');
  }
  return `  <main>
${hero(slug, lang, ui, d.h1, d.lead, HERO_TILES[slug][lang])}

${body}

${outro(d, ui, lang)}
  </main>`;
}

/* страница «Для бизнеса»: герой, преимущества, сегменты, состав условий */
function bizMain(d, ui, lang) {
  const cards = d.advantages
    .map(([ic, t, x]) => `        <div class="biz-card"><i>${icon(ic, 22)}</i><h3>${t}</h3><p>${x}</p></div>`)
    .join('\n');
  const segs = d.segments
    .map((s) => `        <article class="biz-seg__card">
          <img src="/assets/business/${s.img}.webp" alt="" loading="lazy">
          <div class="biz-seg__txt"><h2>${s.t}</h2><p>${s.x}</p></div>
        </article>`)
    .join('\n');
  const inc = d.included
    .map((x) => `        <li>${icon('check', 18)}<span>${x}</span></li>`)
    .join('\n');
  const c = CHARGE[lang];
  const facts = c.facts
    .map(([ic, t, x]) => `            <li><i>${icon(ic, 20)}</i><div><b>${t}</b><span>${x}</span></div></li>`)
    .join('\n');
  /* пока снимка нет — колонка с фото не выводится, текст идёт в одну колонку */
  const hasPhoto = existsSync(CHARGE_IMG);
  const chargePhoto = hasPhoto
    ? `        <div class="biz-charge__photo" style="background-image:url('/${CHARGE_IMG}')" aria-hidden="true"></div>\n`
    : '';

  return `  <main>
${hero('business', lang, ui, d.h1, d.lead, d.features)}

    <section class="wide biz-section">
      <p class="biz-label">${d.whyLabel}</p>
      <h2 class="biz-h2">${d.whyTitle}</h2>
      <div class="biz-rule" aria-hidden="true"></div>
      <div class="biz-cards">
${cards}
      </div>
    </section>

    <section class="wide biz-section">
      <p class="biz-label">${d.segLabel}</p>
      <h2 class="biz-h2">${d.segTitle}</h2>
      <div class="biz-rule" aria-hidden="true"></div>
      <div class="biz-seg">
${segs}
      </div>
    </section>

    <section class="wide biz-section">
      <p class="biz-label">${c.label}</p>
      <h2 class="biz-h2">${c.title}</h2>
      <div class="biz-rule" aria-hidden="true"></div>
      <div class="biz-charge${hasPhoto ? '' : ' biz-charge--flat'}">
${chargePhoto}        <div class="biz-charge__text">
          <p>${c.text}</p>
          <ul class="biz-charge__facts">
${facts}
          </ul>
          <p class="biz-charge__note">${c.note}</p>
        </div>
      </div>
    </section>

    <section class="wide biz-section">
      <h2 class="biz-h2">${d.incTitle}</h2>
      <div class="biz-rule" aria-hidden="true"></div>
      <ul class="biz-inc">
${inc}
      </ul>
    </section>

${outro(d, ui, lang)}
  </main>`;
}

function render(slug, lang) {
  const d = CONTENT[slug][lang];
  const ui = UI[lang];
  const url = SITE + path(lang, slug);

  const hreflang = LANGS.map((l) => `  <link rel="alternate" hreflang="${l}" href="${SITE}${path(l, slug)}">`).join('\n') +
    `\n  <link rel="alternate" hreflang="x-default" href="${SITE}${path('en', slug)}">`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'VMOTO', item: SITE + home(lang) },
      { '@type': 'ListItem', position: 2, name: ui.nav[slug], item: url },
    ],
  };

  const schemas = [breadcrumb];
  if (slug === 'faq') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: lang,
      mainEntity: FAQ_QA[lang].map(([q, a]) => ({
        '@type': 'Question', name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }

  /* видимая навигация по разделам — то, из чего Google собирает сайтлинки */
  const nav = SLUGS.map((s) => (s === slug
    ? `<span class="page-nav__cur">${ui.nav[s]}</span>`
    : `<a href="${path(lang, s)}">${ui.nav[s]}</a>`)).join('');

  const LABEL = { en: 'EN', ru: 'RU', th: 'ไทย', zh: '中文' };
  const langLinks = LANGS.map((l) => `<li><a href="${path(l, slug)}" hreflang="${l}"${l === lang ? ' class="is-active" aria-current="true"' : ''}>${LABEL[l]}</a></li>`).join('');

  const main = slug === 'business' ? bizMain(d, ui, lang) : docMain(d, ui, lang, slug);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${d.title}</title>
  <meta name="description" content="${d.desc}">
  <link rel="canonical" href="${url}">
${hreflang}
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="VMOTO">
  <meta property="og:title" content="${d.title}">
  <meta property="og:description" content="${d.desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/img/og-cover-3.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/img/favicon-96.png" type="image/png" sizes="96x96">
  <link rel="icon" href="/assets/img/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <meta name="theme-color" content="#0a0b0a">
${ANALYTICS}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&family=Manrope:wght@400;500;600&family=Michroma&family=Kanit:wght@400;600&family=Noto+Sans+SC:wght@400;600&display=swap" rel="stylesheet">
${schemas.map((s) => `  <script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n  </script>`).join('\n')}
  <style>
    :root {
      --bg: #0a0b0a;
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
    /* шапка повторяет лендинг: фиксированная, прозрачная над фото */
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
    .page-nav a, .page-nav__cur {
      font-size: 12px;
      letter-spacing: .12em;
      text-transform: uppercase;
      text-decoration: none;
      white-space: nowrap;
      transition: color .2s;
    }
    .page-nav a { color: var(--text); }
    .page-nav a:hover { color: var(--accent); }
    .page-nav__cur { color: var(--accent); }
    .header-right { justify-self: end; display: flex; align-items: center; gap: 14px; }

    /* переключатель языка: вид как на лендинге, но обычными ссылками */
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
    .lang__list a {
      display: block;
      padding: 9px 12px;
      border-radius: 9px;
      text-align: center;
      text-decoration: none;
      color: var(--muted);
      font-size: 13px;
      font-weight: 500;
      transition: color .2s, background .2s;
    }
    .lang__list a:hover { color: var(--text); background: rgba(255, 255, 255, .06); }
    .lang__list .is-active { color: var(--accent); }
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

    .page-eyebrow {
      font-family: var(--heading-font);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 16px;
    }
    h1 {
      font-family: var(--heading-font);
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 700;
      letter-spacing: -.02em;
      line-height: 1.15;
      margin-bottom: 20px;
    }
    h3 { font-family: var(--heading-font); font-size: 16px; font-weight: 600; margin: 24px 0 8px; }
    p { font-size: 15px; color: var(--body); margin-bottom: 12px; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    li { font-size: 15px; color: var(--body); margin-bottom: 6px; }
    b, strong { color: var(--text); font-weight: 600; }
    a { color: var(--accent); }

    /* узкий экран: таблица прокручивается, а не ломает значения по слогам */
    .table-wrap { overflow-x: auto; margin: 16px 0; }
    .ptable { width: 100%; min-width: 480px; border-collapse: collapse; font-size: 15px; }
    .ptable td:not(:first-child) { white-space: nowrap; }
    .ptable td[colspan] { white-space: normal; }
    .ptable th, .ptable td { padding: 13px 14px; border-bottom: 1px solid var(--line); text-align: left; }
    .ptable th {
      font-size: 12px;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 600;
    }
    .ptable td:first-child { color: var(--muted); white-space: nowrap; }
    .ptable b { color: var(--text); }

    /* красная кнопка — те же метрики, что у .btn--accent на лендинге */
    .btn {
      display: inline-block;
      padding: 15px 34px;
      border: 1px solid var(--text);
      border-radius: 999px;
      background: var(--accent);
      color: #fff;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      /* у <button> браузер ставит line-height: normal — задаём как у ссылок лендинга */
      line-height: 1.65;
      letter-spacing: .02em;
      text-decoration: none;
      cursor: pointer;
      transition: opacity .25s, transform .25s, filter .25s;
    }
    .btn:hover { opacity: .85; transform: translateY(-1px); filter: brightness(1.08); }

    /* подвал повторяет подвал лендинга — правила перенесены из style.css */
    .container { width: min(1240px, 100% - 48px); margin-inline: auto; }
    .footer {
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

    /* вопросы: минималистичный список «вопрос — ответ» */
    .qa { max-width: 1020px; margin-inline: auto; border-top: 1px solid var(--line); }
    .qa__row {
      display: grid;
      grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr);
      gap: 20px 56px;
      padding: 32px 0;
      border-bottom: 1px solid var(--line);
    }
    .qa__q { display: flex; gap: 14px; }
    .qa__q i {
      font-family: var(--heading-font);
      font-style: normal;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .14em;
      color: var(--accent);
      padding-top: 5px;
    }
    .qa__q h2 { font-family: var(--heading-font); font-size: 18px; font-weight: 600; line-height: 1.4; margin: 0; }
    .qa__a { font-size: 15px; color: var(--body); margin: 0; }

    @media (max-width: 960px) {
      .footer__grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 760px) {
      .qa__row { grid-template-columns: 1fr; gap: 10px; padding: 26px 0; }
    }
    @media (max-width: 700px) {
      .header-inner { width: calc(100% - 32px); padding: 16px 0; }
      /* таблица целиком влезает в экран: подписи переносятся, значения — нет */
      .ptable { min-width: 0; font-size: 13px; }
      .ptable th, .ptable td { padding: 11px 6px; }
      .ptable td:first-child { white-space: normal; }
    }

    /* ─── страница «Для бизнеса»: полноширинная посадочная вёрстка ─── */
    .wide { width: min(1360px, 100% - 72px); margin-inline: auto; }
    .biz-hero { position: relative; display: flex; align-items: center; min-height: 540px; overflow: hidden; }
    .biz-hero__bg { position: absolute; inset: 0; }
    .biz-hero__bg img { width: 100%; height: 100%; object-fit: cover; object-position: 72% 50%; }
    .biz-hero__shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(10,11,10,.96) 0%, rgba(10,11,10,.9) 42%, rgba(10,11,10,.5) 68%, rgba(10,11,10,.12) 100%);
    }
    /* нижняя кромка кадра: снимок уходит в размытие и растворяется в фоне,
       иначе фото обрывается прямой линией по стыку с секцией */
    .biz-hero__fade {
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 190px;
      pointer-events: none;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      mask-image: linear-gradient(180deg, transparent 0%, #000 62%);
      -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 62%);
      background: linear-gradient(180deg, rgba(10, 11, 10, 0) 0%, rgba(10, 11, 10, .72) 55%, var(--bg) 100%);
    }
    /* карточки сегментов: тот же приём на нижней кромке снимка */
    .biz-seg__card::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 130px;
      z-index: 1;
      pointer-events: none;
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
      mask-image: linear-gradient(180deg, transparent 0%, #000 70%);
      -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 70%);
    }
    .biz-hero__inner { position: relative; padding: 132px 0 76px; }
    /* текстовая колонка не выходит за затемнённую часть кадра */
    .biz-hero__inner > * { max-width: 820px; }
    .biz-hero h1 {
      font-size: clamp(32px, 5.2vw, 60px);
      text-transform: uppercase;
      max-width: 13ch;
      margin-bottom: 22px;
    }
    .biz-hero__lead { max-width: 48ch; font-size: 16px; color: var(--body); margin-bottom: 36px; }
    .biz-feats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px 0; margin-bottom: 36px; }
    .biz-feat { display: flex; align-items: center; gap: 12px; padding: 0 22px; border-left: 1px solid var(--line); }
    .biz-feat:first-child { padding-left: 0; border-left: none; }
    .biz-feat i {
      flex: none;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(217, 79, 61, .45);
      border-radius: 50%;
      color: var(--accent);
    }
    .biz-feat span {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .1em;
      text-transform: uppercase;
      line-height: 1.4;
      max-width: 15ch;
    }

    .biz-section { padding: 84px 0 0; }
    .biz-label {
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 14px;
    }
    .biz-h2 {
      text-align: center;
      font-family: var(--heading-font);
      font-size: clamp(23px, 3vw, 34px);
      font-weight: 600;
      margin-bottom: 14px;
    }
    .biz-rule { width: 44px; height: 2px; background: var(--accent); margin: 0 auto 46px; }
    .biz-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .biz-card { padding: 30px; border: 1px solid var(--line); border-radius: 18px; background: rgba(255, 255, 255, .03); }
    .biz-card i {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border: 1px solid rgba(217, 79, 61, .45);
      border-radius: 50%;
      color: var(--accent);
      margin-bottom: 20px;
    }
    .biz-card h3 { font-size: 14px; letter-spacing: .07em; text-transform: uppercase; margin: 0 0 10px; }
    .biz-card p { font-size: 14px; margin: 0; }

    .biz-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
    .biz-seg__card { position: relative; display: flex; align-items: flex-end; min-height: 380px; border-radius: 20px; overflow: hidden; }
    .biz-seg__card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .biz-seg__card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(10,11,10,.1) 14%, rgba(10,11,10,.7) 48%, rgba(10,11,10,.98) 100%);
    }
    /* текст поверх затемнения: ::after рисуется последним */
    .biz-seg__txt { position: relative; z-index: 1; padding: 30px; }
    .biz-seg__txt h2 { font-family: var(--heading-font); font-size: 20px; font-weight: 600; margin-bottom: 10px; }
    .biz-seg__txt p { font-size: 14px; margin: 0; }

    /* зарядная инфраструктура: снимок и три факта рядом */
    .biz-charge { display: grid; grid-template-columns: 1.05fr .95fr; gap: 28px; align-items: stretch; }
    .biz-charge__photo {
      position: relative;
      min-height: 380px;
      border-radius: 20px;
      background: #0f110f center / cover no-repeat;
      overflow: hidden;
    }
    .biz-charge__photo::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(10, 11, 10, .1) 45%, rgba(10, 11, 10, .55) 100%);
    }
    .biz-charge--flat { grid-template-columns: 1fr; max-width: 900px; margin-inline: auto; }
    .biz-charge__text { align-self: center; }
    .biz-charge__text > p { font-size: 15px; margin-bottom: 26px; }
    .biz-charge__facts { display: grid; gap: 18px; padding: 0; margin: 0 0 22px; list-style: none; }
    .biz-charge__facts li { display: flex; gap: 14px; margin: 0; }
    .biz-charge__facts i {
      flex: none;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(217, 79, 61, .45);
      border-radius: 50%;
      color: var(--accent);
    }
    .biz-charge__facts b { display: block; font-size: 14px; margin-bottom: 3px; }
    .biz-charge__facts span { font-size: 13.5px; color: var(--muted); line-height: 1.55; }
    .biz-charge__note {
      margin: 0;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      font-size: 13px;
      color: rgba(242, 241, 238, .5);
    }

    .biz-inc { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 36px; max-width: 860px; padding: 0; margin: 0 auto; }
    .biz-inc li { display: flex; gap: 12px; align-items: flex-start; list-style: none; margin: 0; }
    .biz-inc svg { flex: none; margin-top: 3px; color: var(--accent); }

    .doc-body { max-width: 900px; margin-inline: auto; }
    .doc-body h3:first-child { margin-top: 0; }

    .biz-cta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 26px;
      margin: 84px auto 0;
      padding: 32px 34px;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: rgba(255, 255, 255, .03);
    }
    .biz-cta__l { display: flex; align-items: center; gap: 20px; flex: 1 1 420px; min-width: 0; }
    .biz-cta .btn { flex: none; }
    .biz-cta__l i {
      flex: none;
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border: 1px solid rgba(217, 79, 61, .45);
      border-radius: 50%;
      color: var(--accent);
    }
    .biz-cta__l p { margin: 0; font-size: 15px; }
    .biz-cta__l b { display: block; }


    @media (max-width: 1040px) {
      /* плитки в две колонки: в одну строку они уже не читаются */
      .biz-feats { grid-template-columns: 1fr 1fr; gap: 18px 16px; max-width: 560px; }
      .biz-feat:nth-child(odd) { padding-left: 0; border-left: none; }
      .biz-hero__shade { background: linear-gradient(90deg, rgba(10,11,10,.96) 0%, rgba(10,11,10,.92) 45%, rgba(10,11,10,.55) 78%, rgba(10,11,10,.2) 100%); }
    }
    @media (max-width: 900px) {
      .biz-cards, .biz-seg, .biz-inc, .biz-charge { grid-template-columns: 1fr; }
      .biz-charge__photo { min-height: 260px; }
    }
    @media (max-width: 700px) {
      .wide { width: calc(100% - 32px); }
      .biz-hero { min-height: 0; }
      .biz-hero__fade { height: 120px; backdrop-filter: none; -webkit-backdrop-filter: none; }
      .biz-seg__card::before { backdrop-filter: none; -webkit-backdrop-filter: none; }
      .biz-hero__bg img { object-position: 66% 50%; }
      .biz-hero__shade { background: linear-gradient(180deg, rgba(10,11,10,.86) 0%, rgba(10,11,10,.9) 45%, rgba(10,11,10,.96) 100%); }
      .biz-hero__inner { padding: 118px 0 44px; }
      .biz-hero h1 { max-width: none; }
      .biz-feats { grid-template-columns: 1fr 1fr; gap: 18px 14px; max-width: none; }
      .biz-feat { padding: 0; border-left: none; }
      .biz-feat span { font-size: 10px; }
      .biz-section { padding-top: 56px; }
      .biz-cta { margin-top: 56px; padding: 26px 22px; }
    }
${MENU_CSS}${FORM_CSS}
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a href="${home(lang)}" class="logo" aria-label="VMOTO"><img src="/assets/img/logo-mark.png" alt="">VMOTO</a>
      <nav class="page-nav">${nav}</nav>
      <div class="header-right">
        <div class="lang">
          <button class="lang__btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${t(lang, 'lang.aria')}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.4 4 5.6 4 9.2s-1.4 6.8-4 9.2c-2.6-2.4-4-5.6-4-9.2s1.4-6.8 4-9.2z"/></svg>
            <span>${LABEL[lang]}</span>
            <svg class="lang__chev" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <ul class="lang__list">${langLinks}</ul>
        </div>
        <a class="header-social" href="https://www.facebook.com/profile.php?id=61592273703567" target="_blank" rel="noopener" aria-label="Facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 8.5V7c0-.8.7-1.5 1.5-1.5H17V2.6h-2.8C11.9 2.6 10 4.5 10 6.8v1.7H7.5V12H10v9.4h4V12h2.6l.6-3.5H14z"/></svg>
        </a>
      </div>
    </div>
  </header>

${menuMarkup({
    links: [
      { href: `${home(lang)}#benefits`, label: t(lang, 'nav.benefits') },
      { href: `${home(lang)}#models`, label: t(lang, 'nav.models') },
      { href: `${home(lang)}#gallery`, label: t(lang, 'nav.gallery') },
      { href: `${home(lang)}#stations`, label: t(lang, 'st.label') },
      { href: `${home(lang)}#business`, label: t(lang, 'b2b.label') },
      { href: `${home(lang)}#faq`, label: 'FAQ' },
      { href: `${home(lang)}#contacts`, label: t(lang, 'nav.contacts') },
    ],
    lang: LANGS.map((l) => `<a href="${path(l, slug)}" hreflang="${l}"${l === lang ? ' class="is-active"' : ''}>${LABEL[l]}</a>`).join(''),
    label: { text: t(lang, 'menu.label') },
    menuAria: t(lang, 'menu.aria'),
  })}

${main}

${formMarkup({
    t, lang,
    title: (slug === 'business' ? LEAD_FLEET : LEAD)[lang].title,
    sub: (slug === 'business' ? LEAD_FLEET : LEAD)[lang].sub,
  })}
  <footer class="footer">
    <div class="container">
      <div class="footer__brand">
        <a href="${home(lang)}" class="logo" aria-label="VMOTO"><img src="/assets/img/logo-mark.png" alt="">VMOTO</a>
        <p class="footer__tag">Electric Mobility<br>Made for Island Life</p>
      </div>

      <div class="footer__grid">
        <div class="footer__col">
          <p class="footer__label">${t(lang, 'footer.locations')}</p>
          <ul><li>${t(lang, 'loc.samui')}</li><li>${t(lang, 'loc.phangan')}</li></ul>
        </div>
        <div class="footer__col">
          <p class="footer__label">${t(lang, 'footer.contacts')}</p>
          <ul><li><a href="tel:+66962244666">+66 96 224 4666</a></li></ul>
        </div>
        <div class="footer__col">
          <p class="footer__label">${t(lang, 'footer.messengers')}</p>
          <ul>
            <li><a href="https://t.me/+66962244666" target="_blank" rel="noopener">Telegram&ensp;<i aria-hidden="true">↗</i></a></li>
            <li><a href="https://wa.me/66962244666" target="_blank" rel="noopener">WhatsApp&ensp;<i aria-hidden="true">↗</i></a></li>
            <li><a href="https://www.facebook.com/profile.php?id=61592273703567" target="_blank" rel="noopener">Facebook&ensp;<i aria-hidden="true">↗</i></a></li>
          </ul>
        </div>
        <div class="footer__col">
          <p class="footer__label">${t(lang, 'footer.navigation')}</p>
          <ul>
            <li><a href="${home(lang)}">${ui.home}</a></li>
            <li><a href="${path(lang, 'models')}">${t(lang, 'footer.compare')}</a></li>
            <li><a href="${path(lang, 'business')}">${t(lang, 'footer.fleets')}</a></li>
            <li><a href="${path(lang, 'faq')}">${t(lang, 'footer.faqPage')}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <div>
          <p class="footer__copy">${t(lang, 'footer.copy')}</p>
          <p class="footer__law">${ui.dealer} · ${COMPANY} · ${ADDRESS}</p>
        </div>
        <div class="footer__legal">
          <a href="/privacy">${t(lang, 'footer.privacy')}</a>
          <a href="/terms">${t(lang, 'footer.terms')}</a>
        </div>
        <div class="footer__end">
          <p class="footer__slogan">Silent. Electric. Free.</p>
          <button class="footer__up" type="button" aria-label="${t(lang, 'footer.top')}">↑</button>
        </div>
      </div>
    </div>
  </footer>

  <script>
    (() => {
${MENU_JS}
${formJs({
    fleet: slug === 'business',
    lang,
    strings: {
      choose: t(lang, 'form.choose'),
      sending: t(lang, 'form.sending'),
      send: t(lang, 'form.send'),
      error: t(lang, 'form.error'),
    },
  })}
      document.querySelector('.footer__up')
        .addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    })();
  </script>
</body>
</html>
`;
}

/* ──────────────────────────── сборка ──────────────────────────── */

for (const slug of SLUGS) {
  for (const lang of LANGS) {
    const html = render(slug, lang);
    const file = lang === 'en' ? `${slug}.html` : `${lang}/${slug}.html`;
    if (lang !== 'en') mkdirSync(lang, { recursive: true });
    writeFileSync(file, html);
    console.log(`${file}: ${(html.length / 1024).toFixed(0)} KB`);
  }
}

/* карта сайта: лендинг + все разделы + юридические страницы */
const cluster = (paths) => paths
  .map((u) => `    <xhtml:link rel="alternate" hreflang="${u.lang}" href="${SITE}${u.path}"/>`)
  .join('\n');

const landing = LANGS.map((l) => ({ lang: l, path: home(l) }));
const urls = [];
urls.push(`  <url>
    <loc>${SITE}/</loc>
${cluster(landing)}
    <lastmod>2026-08-15</lastmod>
    <priority>1.0</priority>
  </url>`);
for (const l of LANGS.filter((x) => x !== 'en')) {
  urls.push(`  <url>
    <loc>${SITE}${home(l)}</loc>
${cluster(landing)}
    <lastmod>2026-08-15</lastmod>
    <priority>0.9</priority>
  </url>`);
}
for (const slug of SLUGS) {
  const set = LANGS.map((l) => ({ lang: l, path: path(l, slug) }));
  for (const l of LANGS) {
    urls.push(`  <url>
    <loc>${SITE}${path(l, slug)}</loc>
${cluster(set)}
    <lastmod>2026-08-15</lastmod>
    <priority>${l === 'en' ? '0.9' : '0.8'}</priority>
  </url>`);
  }
}
for (const legal of ['privacy', 'terms']) {
  urls.push(`  <url>
    <loc>${SITE}/${legal}</loc>
    <lastmod>2026-08-15</lastmod>
    <priority>0.3</priority>
  </url>`);
}

writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
console.log(`sitemap.xml: ${urls.length} URLs`);
console.log('done');

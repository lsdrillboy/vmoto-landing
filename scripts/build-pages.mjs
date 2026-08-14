/* Генератор индексируемых страниц-разделов: /business /faq /models
   Тексты живут здесь (расширенные версии секций лендинга), общая
   обвязка — ниже в PAGE(). Запуск: node scripts/build-pages.mjs
   После правок обязательно перегенерировать sitemap вручную. */
import { writeFileSync } from 'node:fs';

const SITE = 'https://www.vmotobikes.com';
const CSS = 'style.css?v=117';

const HEAD = (slug, title, desc) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${SITE}/${slug}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="VMOTO">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${SITE}/${slug}">
  <meta property="og:image" content="${SITE}/assets/img/og-cover-3.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/img/favicon-96.png" type="image/png" sizes="96x96">
  <link rel="icon" href="/assets/img/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <meta name="theme-color" content="#0a0a0c">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&family=Manrope:wght@400;500;600&family=Michroma&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/${CSS}">
  <style>
    .page { max-width: 900px; margin: 0 auto; padding: 120px 24px 96px; }
    .page__back { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-ui); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); margin-bottom: 34px; }
    .page h1 { font-family: var(--font-display); font-weight: 700; font-size: clamp(32px, 5vw, 56px); line-height: 1.06; margin-bottom: 18px; }
    .page__lead { font-size: 17px; color: rgba(242,241,238,.78); max-width: 62ch; margin-bottom: 14px; }
    .page h2 { font-family: var(--font-display); font-weight: 600; font-size: clamp(22px, 2.6vw, 30px); margin: 52px 0 14px; }
    .page h3 { font-family: var(--font-display); font-weight: 600; font-size: 18px; margin: 26px 0 8px; }
    .page p, .page li { color: rgba(242,241,238,.78); line-height: 1.75; }
    .page ul { padding-left: 20px; margin: 10px 0; }
    .page li { margin-bottom: 6px; }
    .ptable { width: 100%; border-collapse: collapse; margin: 22px 0; font-size: 15px; }
    .ptable th, .ptable td { padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,.1); text-align: left; }
    .ptable th { font-family: var(--font-ui); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: rgba(242,241,238,.55); }
    .ptable td:first-child { color: rgba(242,241,238,.6); }
    .ptable b { color: var(--text); }
    .page__cta { margin-top: 56px; padding: 30px; border: 1px solid rgba(255,255,255,.1); border-radius: 22px; background: rgba(255,255,255,.03); }
    .page__cta p { margin-bottom: 18px; }
    .page__links { margin-top: 44px; padding-top: 26px; border-top: 1px solid rgba(255,255,255,.1); display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; }
    .page__links a { color: rgba(242,241,238,.7); }
    .page__links a:hover { color: var(--accent); }
    .page__law { margin-top: 40px; font-size: 12px; color: rgba(242,241,238,.35); }
  </style>
</head>
<body>
  <div class="page">
    <a class="page__back" href="/">← VMOTO</a>
`;

const CTA = (text) => `
    <div class="page__cta">
      <p>${text}</p>
      <a class="btn btn--accent" href="/#contacts">Book a test ride&ensp;→</a>
    </div>`;

const LINKS = (slug) => {
  const all = [
    ['/models', 'Models — CITI &amp; CPx'],
    ['/business', 'For business'],
    ['/faq', 'FAQ'],
    ['/', 'Home'],
  ].filter(([href]) => href !== `/${slug}`);
  return `
    <nav class="page__links">${all.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>
    <p class="page__law">Official VMoto dealer in Thailand · CANVAS SPV Co., Ltd · 52/57 Moo 1, Na Jomtien, Sattahip, Chonburi 20250, Thailand</p>
  </div>
</body>
</html>
`;
};

/* ────────────────────────── страницы ────────────────────────── */

const pages = [
  {
    slug: 'models',
    title: 'VMoto CITI vs CPx — specs & prices on Koh Samui | VMOTO',
    desc: 'Compare VMoto CITI (฿95,000, 107 km) and VMoto CPx (฿120,000, 130 km): range, speed, charging, weight. Official dealer on Koh Samui and Koh Phangan.',
    body: `
    <h1>VMoto CITI vs CPx</h1>
    <p class="page__lead">Two electric bikes for island life. CITI is the light everyday commuter; CPx is the 125cc-class flagship with more range and more comfort. Both come with two removable batteries and a charger, and both carry a 3-year warranty.</p>

    <h2>Side by side</h2>
    <table class="ptable">
      <tr><th>&nbsp;</th><th>VMoto CITI</th><th>VMoto CPx</th></tr>
      <tr><td>Price</td><td><b>฿95,000</b></td><td><b>฿120,000</b></td></tr>
      <tr><td>Range</td><td><b>107 km</b></td><td><b>130 km</b></td></tr>
      <tr><td>Top speed</td><td><b>80 km/h</b></td><td><b>90 km/h</b></td></tr>
      <tr><td>Fast charge</td><td><b>20 min</b></td><td><b>20 min</b></td></tr>
      <tr><td>Weight</td><td><b>92 kg</b></td><td><b>107 kg</b></td></tr>
      <tr><td>Batteries</td><td colspan="2"><b>Two removable batteries + charger included</b></td></tr>
      <tr><td>Warranty</td><td colspan="2"><b>3 years on every part, service on the island</b></td></tr>
    </table>

    <h2>Which one is for you</h2>
    <h3>Take the CITI if…</h3>
    <ul>
      <li>you ride mostly around town, to the beach and back;</li>
      <li>you want the lightest bike to handle and park;</li>
      <li>฿95,000 is the budget you had in mind.</li>
    </ul>
    <h3>Take the CPx if…</h3>
    <ul>
      <li>you cross the island daily and want range to spare;</li>
      <li>you ride two-up or carry cargo;</li>
      <li>you want the taller screen and the calmer ride at speed.</li>
    </ul>

    <h2>What both models give you</h2>
    <ul>
      <li><b>Instant torque.</b> Off the line an electric drive beats petrol 125cc scooters — no gears, no lag.</li>
      <li><b>About ฿25 a day</b> of electricity instead of ฿150–200 on petrol.</li>
      <li><b>Silence.</b> No engine roar, no fumes — you hear the island, not the bike.</li>
      <li><b>Minimal maintenance.</b> No oil, belts or spark plugs.</li>
    </ul>
${CTA('Not sure which model fits? Ride both — we bring the bikes to a meeting point on Koh Phangan, free and with no obligation.')}`,
  },
  {
    slug: 'business',
    title: 'Electric bike fleets for hotels, villas & rentals in Thailand | VMOTO',
    desc: 'Fleet terms for retreat centres, villas, hotels and rental businesses on Koh Samui and Koh Phangan: volume pricing, registration, service and charging handled.',
    body: `
    <h1>Electric bikes for business</h1>
    <p class="page__lead">We build fleets for rental businesses, villas, hotels, retreat centres and delivery services on Koh Samui and Koh Phangan — with warranty, registration and service on the island.</p>

    <h2>Retreat centres, villas and hotels</h2>
    <p>A fleet of silent e-bikes is a real upgrade to your service: guests move around the island with no noise and no fumes — in tune with the place. No rental hunting on arrival, extra value for every stay, an eco-friendly image, and rental income if you charge for the bikes.</p>

    <h2>Opening a rental business</h2>
    <p>Launching e-bike rental on the island comes with dedicated terms: volume pricing, registration handled for you, staff training and service support. Electric bikes cut the two things that hurt rental margins most — fuel and maintenance.</p>

    <h2>The economics</h2>
    <ul>
      <li><b>Running costs.</b> About ฿25 of electricity a day against ฿150–200 on petrol — the margin stays with you.</li>
      <li><b>Minimal maintenance.</b> No oil, belts or spark plugs. A 3-year warranty on every part and service on the island.</li>
      <li><b>Downtime.</b> Two batteries per bike and a 20-minute fast charge keep units on the road instead of in the shop.</li>
    </ul>

    <h2>What a fleet package includes</h2>
    <ul>
      <li>volume pricing on VMoto CITI and CPx;</li>
      <li>registration and plates arranged for every unit;</li>
      <li>delivery across Koh Samui and Koh Phangan;</li>
      <li>service and spare parts on the island, mobile team for fleets;</li>
      <li>charging setup advice, and access to our charging network as it opens.</li>
    </ul>
${CTA('Tell us the size of the fleet and where it will operate — we will prepare terms for your business: pricing, service and charging.')}`,
  },
  {
    slug: 'faq',
    title: 'Buying an electric bike in Thailand — FAQ | VMOTO Samui & Phangan',
    desc: 'Can foreigners buy? Registration, licence, home charging, service and how a test ride works — answers for buyers of VMoto electric bikes on Koh Samui and Koh Phangan.',
    body: `
    <h1>Questions before buying</h1>
    <p class="page__lead">Everything foreigners usually ask before buying an electric bike on Koh Samui or Koh Phangan. Something missing? Message us on WhatsApp — we answer within the hour.</p>

    <h2>Can foreigners buy a bike?</h2>
    <p>Yes — foreigners can officially buy and own a VMoto. We handle all the paperwork.</p>

    <h2>Registration and plates?</h2>
    <p>We take care of the registration and plates ourselves right after the purchase.</p>

    <h2>Do I need a licence?</h2>
    <p>Yes, same as any scooter: a Thai or an international motorcycle licence. We’ll advise how to get a local one.</p>

    <h2>Can I charge at home?</h2>
    <p>Yes — each battery charges from a regular outlet with the included charger. A fast charge at our stations takes about 20 minutes. Both batteries are removable, so you can carry them inside instead of parking next to a socket.</p>

    <h2>Where is the bike serviced?</h2>
    <p>On the island: our own service, parts in stock and a mobile team for Samui and Phangan. An electric drive needs no oil, belts or spark plugs, so routine maintenance is minimal.</p>

    <h2>How does a test ride work?</h2>
    <p>We meet on Koh Phangan — you come to us, or we arrange a convenient spot individually. 15–20 minutes, free, no obligations.</p>

    <h2>What does it cost to run?</h2>
    <p>About ฿25 of electricity a day against ฿150–200 you would spend on petrol — plus no oil changes and no engine servicing.</p>

    <h2>What is covered by the warranty?</h2>
    <p>Three years on every part of the bike, with parts and service available on the island.</p>
${CTA('Still deciding? Book a free test ride and answer the question with your hands on the bars.')}`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        ['Can foreigners buy a bike?', 'Yes — foreigners can officially buy and own a VMoto. We handle all the paperwork.'],
        ['Registration and plates?', 'We take care of the registration and plates ourselves right after the purchase.'],
        ['Do I need a licence?', 'Yes, same as any scooter: a Thai or an international motorcycle licence. We’ll advise how to get a local one.'],
        ['Can I charge at home?', 'Yes — each battery charges from a regular outlet with the included charger. A fast charge at our stations takes about 20 minutes.'],
        ['Where is the bike serviced?', 'On the island: our own service, parts in stock and a mobile team for Samui and Phangan.'],
        ['How does a test ride work?', 'We meet on Koh Phangan — you come to us, or we arrange a convenient spot individually. 15–20 minutes, free, no obligations.'],
      ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  },
];

for (const p of pages) {
  const schema = p.schema
    ? `  <script type="application/ld+json">\n${JSON.stringify(p.schema, null, 2)}\n  </script>\n`
    : '';
  const html = HEAD(p.slug, p.title, p.desc).replace('</head>', schema + '</head>') + p.body + LINKS(p.slug);
  writeFileSync(`${p.slug}.html`, html);
  console.log(`${p.slug}.html: ${(html.length / 1024).toFixed(0)} KB`);
}
console.log('done');

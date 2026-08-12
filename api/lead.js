// api/lead.js — прокси лид-формы VMOTO в Битрикс24.
// Вебхук живёт только на сервере (env B24_WEBHOOK_BASE), в браузер не попадает.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const base = (process.env.B24_WEBHOOK_BASE || '').trim();
  if (!base) return res.status(500).json({ ok: false, error: 'Server not configured' });
  const PIPELINE = Number(process.env.B24_PIPELINE_VMOTO || 2); // воронка VMOTO

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const clip = (v, n) => String(v || '').trim().slice(0, n);
  const name = clip(body.name, 120);
  const phone = clip(body.phone, 40);
  const messenger = clip(body.messenger, 80);
  const location = clip(body.location, 120);
  const lang = clip(body.lang, 5).toUpperCase();
  const fleet = body.fleet === true;
  if (!name || !phone || !messenger || !location) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  const comments = (fleet ? 'Тип: МОТОПАРК (B2B)\n' : '') +
    'Мессенджер: ' + messenger + '\nЛокация: ' + location +
    '\nЯзык сайта: ' + lang;

  const baseUrl = base.replace(/\/?$/, '/');
  const b24 = async (method, fields) => {
    const r = await fetch(baseUrl + method + '.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data || data.error) {
      throw new Error((data && (data.error_description || data.error)) || 'Request failed');
    }
    return data;
  };

  try {
    const c = await b24('crm.contact.add', {
      NAME: name,
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      SOURCE_ID: 'WEB',
      COMMENTS: comments
    });
    if (!c.result) throw new Error('contact failed');
    const d = await b24('crm.deal.add', {
      TITLE: (fleet ? 'Мотопарк (B2B) — ' : 'Заявка с сайта — ') + name,
      CATEGORY_ID: PIPELINE,
      CONTACT_ID: c.result,
      SOURCE_ID: 'WEB',
      SOURCE_DESCRIPTION: 'Форма на лендинге',
      COMMENTS: comments
    });
    if (!d.result) throw new Error('deal failed');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('VMOTO lead failed:', (err && err.message) || err);
    return res.status(502).json({ ok: false, error: 'Submit failed' });
  }
};

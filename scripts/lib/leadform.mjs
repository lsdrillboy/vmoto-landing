/* Модальная форма заявки для страниц-разделов.
   Поля и контракт те же, что у формы на лендинге: POST /api/lead →
   контакт и сделка в Битрикс24. На /business заявка уходит с флагом
   fleet: сделка попадает в CRM как «Мотопарк (B2B)».
   Используется генератором build-pages.mjs. */

/* аналитика — те же счётчики, что на лендинге, иначе заявки со страниц
   разделов не видны в Ads Manager и GA4 */
export const ANALYTICS = `  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-76MRL44BDC"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-76MRL44BDC');
  </script>

  <!-- Meta Pixel -->
  <script>
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '1058643233306082');
    fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none" alt=""
    src="https://www.facebook.com/tr?id=1058643233306082&ev=PageView&noscript=1"></noscript>`;

export const FORM_CSS = `
    /* ─── модальная форма заявки ─── */
    .lead-modal {
      position: fixed;
      inset: 0;
      z-index: 340;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(6, 7, 6, .72);
      backdrop-filter: blur(10px);
      opacity: 0;
      visibility: hidden;
      transition: opacity .3s ease, visibility .3s ease;
    }
    .lead-modal.is-on { opacity: 1; visibility: visible; }
    .lead-modal__card {
      position: relative;
      width: min(520px, 100%);
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      padding: 34px;
      border: 1px solid rgba(255, 255, 255, .1);
      border-radius: 22px;
      background: #0e100f;
      transform: translateY(14px) scale(.98);
      transition: transform .4s cubic-bezier(.16, 1, .3, 1);
    }
    .lead-modal.is-on .lead-modal__card { transform: none; }
    .lead-modal__close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 50%;
      background: none;
      cursor: pointer;
      color: var(--muted);
      font-size: 16px;
      line-height: 1;
      transition: color .2s, border-color .2s;
    }
    .lead-modal__close:hover { color: var(--accent); border-color: var(--accent); }
    .lead-modal__title { font-family: var(--heading-font); font-size: 24px; font-weight: 600; margin-bottom: 6px; }
    .lead-modal__sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }

    .lead-form { display: grid; gap: 16px; }
    .lead-form input[type="text"], .lead-form input[type="tel"] {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 12px;
      background: rgba(255, 255, 255, .03);
      color: var(--text);
      font-family: inherit;
      font-size: 15px;
      transition: border-color .2s;
    }
    .lead-form input::placeholder { color: rgba(242, 241, 238, .38); }
    .lead-form input:focus { outline: none; border-color: var(--accent); }
    .pick__label {
      display: block;
      margin-bottom: 9px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .pick__row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .pick__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 12px 8px;
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 12px;
      background: rgba(255, 255, 255, .03);
      cursor: pointer;
      color: rgba(242, 241, 238, .72);
      font-family: inherit;
      font-size: 13px;
      transition: color .2s, border-color .2s, background .2s;
    }
    .pick__btn:hover { color: var(--text); border-color: rgba(255, 255, 255, .28); }
    .pick__btn.is-active { color: var(--text); border-color: var(--accent); background: rgba(217, 79, 61, .12); }
    .lead-form .consent { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
    .lead-form .consent input { position: absolute; opacity: 0; width: 0; height: 0; }
    .consent__box {
      flex: none;
      width: 18px;
      height: 18px;
      margin-top: 2px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, .22);
      border-radius: 5px;
      color: transparent;
      transition: border-color .2s, background .2s, color .2s;
    }
    .consent input:checked + .consent__box { border-color: var(--accent); background: var(--accent); color: #fff; }
    .consent__text { font-size: 12.5px; line-height: 1.5; color: var(--muted); }
    .consent__text a { color: var(--muted); text-decoration: underline; }
    .consent__text a:hover { color: var(--accent); }
    .lead-form .btn, .lead-done .btn { width: 100%; }
    .lead-form .btn[disabled] { opacity: .6; cursor: default; }
    .lead-form__note { margin: 0; font-size: 12px; color: var(--accent); min-height: 1em; }

    .lead-done { display: none; text-align: center; padding: 12px 0 6px; }
    .lead-modal.is-done .lead-form, .lead-modal.is-done .lead-modal__sub, .lead-modal.is-done .lead-modal__title { display: none; }
    .lead-modal.is-done .lead-done { display: block; }
    .lead-done svg { color: var(--accent); margin-bottom: 16px; }
    .lead-done__title { font-family: var(--heading-font); font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    .lead-done__text { font-size: 14px; color: var(--muted); margin-bottom: 22px; }

    @media (max-width: 560px) {
      .lead-modal { padding: 12px; }
      .lead-modal__card { padding: 26px 20px; }
      .pick__row { grid-template-columns: 1fr 1fr; }
    }
`;

const WA_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.1-.7l.5-.6c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z"/></svg>';
const TG_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.4 2.9 11.7c-.9.4-.9 1.7.1 2l4.8 1.5 1.8 5.6c.3.9 1.4 1 2 .4l2.6-2.5 4.9 3.6c.7.5 1.7.1 1.9-.8l3-15.4c.2-1-.8-1.8-1.7-1.4l-.4.1zM8.5 14.9l9.4-6.8c.2-.2.5.1.3.3l-7.5 7.2-.3 3-1.9-3.7z"/></svg>';
const CALL_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9z"/></svg>';

/* t — функция перевода генератора, title/sub — заголовок окна */
export const formMarkup = ({ t, lang, title, sub }) => `  <div class="lead-modal" id="leadModal" role="dialog" aria-modal="true" aria-labelledby="leadTitle" hidden>
    <div class="lead-modal__card">
      <button type="button" class="lead-modal__close" id="leadClose" aria-label="${t(lang, 'form.close')}">✕</button>
      <p class="lead-modal__title" id="leadTitle">${title}</p>
      <p class="lead-modal__sub">${sub}</p>

      <form class="lead-form" id="leadForm">
        <input type="text" name="name" placeholder="${t(lang, 'form.name')}" autocomplete="name" required>
        <input type="tel" name="phone" placeholder="${t(lang, 'form.phone')}" autocomplete="tel" required>

        <div class="pick" id="pickMessenger">
          <span class="pick__label">${t(lang, 'form.messenger')}</span>
          <div class="pick__row">
            <button type="button" class="pick__btn" data-value="WhatsApp">${WA_ICON}WhatsApp</button>
            <button type="button" class="pick__btn" data-value="Telegram">${TG_ICON}Telegram</button>
            <button type="button" class="pick__btn" data-value="Call">${CALL_ICON}${t(lang, 'form.call')}</button>
          </div>
          <input type="hidden" name="messenger" value="">
        </div>

        <div class="pick" id="pickLocation">
          <span class="pick__label">${t(lang, 'form.location')}</span>
          <div class="pick__row">
            <button type="button" class="pick__btn" data-value="Phangan">${t(lang, 'loc.phangan')}</button>
            <button type="button" class="pick__btn" data-value="Samui">${t(lang, 'loc.samui')}</button>
            <button type="button" class="pick__btn" data-value="other">${t(lang, 'loc.other')}</button>
          </div>
          <input type="hidden" name="location" value="">
          <input type="text" name="locationOther" id="leadLocOther" placeholder="${t(lang, 'form.locationOther')}" hidden>
        </div>

        <label class="consent">
          <input type="checkbox" name="consent" required>
          <span class="consent__box" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 10 18.5 20 6"/></svg>
          </span>
          <span class="consent__text">${t(lang, 'form.consent')}</span>
        </label>

        <button type="submit" class="btn" id="leadSend">${t(lang, 'form.send')}</button>
        <p class="lead-form__note" id="leadNote"></p>
      </form>

      <div class="lead-done">
        <svg width="54" height="54" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="29" stroke="currentColor" stroke-width="2.5"/>
          <path d="M20 33.5 28.5 42 44 24" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="lead-done__title">${t(lang, 'form.successTitle')}</p>
        <p class="lead-done__text">${t(lang, 'form.successText')}</p>
        <button type="button" class="btn" id="leadDoneClose">${t(lang, 'form.close')}</button>
      </div>
    </div>
  </div>
`;

/* fleet — заявки со страницы «Для бизнеса» уходят в CRM как B2B */
export const formJs = ({ fleet, lang, strings }) => `
      const modal = document.getElementById('leadModal');
      const form = document.getElementById('leadForm');
      const note = document.getElementById('leadNote');
      const send = document.getElementById('leadSend');
      const locOther = document.getElementById('leadLocOther');
      const S = ${JSON.stringify(strings)};
      let lastFocus = null;

      function openLead(e) {
        if (e) e.preventDefault();
        lastFocus = document.activeElement;
        modal.hidden = false;
        void modal.offsetWidth; /* reflow: у перехода должно быть стартовое состояние */
        modal.classList.add('is-on');
        document.body.style.overflow = 'hidden';
        setTimeout(() => form.querySelector('input[name="name"]').focus(), 260);
      }
      function closeLead() {
        modal.classList.remove('is-on');
        document.body.style.overflow = '';
        setTimeout(() => { modal.hidden = true; }, 300);
        if (lastFocus) lastFocus.focus();
      }
      document.querySelectorAll('[data-lead]').forEach((b) => b.addEventListener('click', openLead));
      document.getElementById('leadClose').addEventListener('click', closeLead);
      document.getElementById('leadDoneClose').addEventListener('click', closeLead);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeLead(); });
      addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeLead(); });

      /* мессенджеров можно выбрать несколько, локация — одна */
      document.querySelectorAll('#pickMessenger .pick__btn').forEach((b) => {
        b.addEventListener('click', () => {
          b.classList.toggle('is-active');
          const picked = [...document.querySelectorAll('#pickMessenger .pick__btn.is-active')].map((x) => x.dataset.value);
          form.querySelector('input[name="messenger"]').value = picked.join(', ');
        });
      });
      document.querySelectorAll('#pickLocation .pick__btn').forEach((b) => {
        b.addEventListener('click', () => {
          document.querySelectorAll('#pickLocation .pick__btn').forEach((x) => x.classList.toggle('is-active', x === b));
          form.querySelector('input[name="location"]').value = b.dataset.value;
          const other = b.dataset.value === 'other';
          locOther.hidden = !other;
          if (other) locOther.focus();
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.name.value.trim();
        const phone = form.phone.value.trim();
        const messenger = form.querySelector('input[name="messenger"]').value;
        let location = form.querySelector('input[name="location"]').value;
        /* имя, телефон и согласие проверяет сам браузер — здесь только выбор чипами */
        if (!messenger || !location) { note.textContent = S.choose; return; }
        if (location === 'other') location = locOther.value.trim() || 'Other';

        note.textContent = '';
        send.disabled = true;
        send.textContent = S.sending;

        fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, messenger, location, lang: '${lang}', fleet: ${fleet} })
        })
          .then((r) => r.json().catch(() => null).then((data) => ({ ok: r.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data || !data.ok) throw new Error('submit failed');
            const leadType = ${fleet} ? 'fleet' : 'retail';
            if (window.fbq) fbq('track', 'Lead', { content_category: leadType });
            if (window.gtag) gtag('event', 'generate_lead', { lead_type: leadType });
            modal.classList.add('is-done');
            form.reset();
            document.querySelectorAll('.pick__btn').forEach((b) => b.classList.remove('is-active'));
            document.querySelectorAll('.pick input[type="hidden"]').forEach((i) => { i.value = ''; });
            locOther.hidden = true;
          })
          .catch(() => { note.textContent = S.error; })
          .then(() => { send.disabled = false; send.textContent = S.send; });
      });
`;

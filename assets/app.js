/* Рабочая копия админки InSales. Данные — localStorage. */
'use strict';

/* ---------------- store ---------------- */
const KEY = 'insales-clone-v1';
let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* повреждённые данные — берём эталон */ }
  return JSON.parse(JSON.stringify(SEED));
}
function save() { localStorage.setItem(KEY, JSON.stringify(DB)); }
function reset() { localStorage.removeItem(KEY); DB = load(); toast('Данные восстановлены'); render(); }
function nextId(list) { return list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1; }

/* ---------------- helpers ---------------- */
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => Number(String(v == null ? 0 : v).replace(',', '.')) || 0;
const money = v => num(v).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' руб';
const money0 = v => num(v).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function go(hash) { location.hash = hash; }
function statusTitle(k) { const s = STATUSES.find(x => x.key === k); return s ? s.title : k; }
function firstVariant(p) { return (p.variants && p.variants[0]) || {}; }
function clientById(id) { return DB.clients.find(c => c.id === id) || {}; }
function slugify(s) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
    н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',
    э:'e',ю:'yu',я:'ya',' ':'-' };
  return String(s).toLowerCase().split('').map(c => map[c] !== undefined ? map[c] : c)
    .join('').replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

/* ---------------- confirm modal ---------------- */
function confirmDialog(text, onYes) {
  const root = $('#modalroot');
  root.innerHTML = `<div class="modal-bg"><div class="modal">
    <h3>Подтверждение</h3><div class="body">${esc(text)}</div>
    <div class="foot"><button class="btn" data-no>Отменить</button>
    <button class="btn primary" data-yes>Удалить</button></div></div></div>`;
  const close = () => (root.innerHTML = '');
  $('[data-no]', root).onclick = close;
  $('[data-yes]', root).onclick = () => { close(); onYes(); };
  $('.modal-bg', root).onclick = e => { if (e.target === e.currentTarget) close(); };
}

/* ---------------- navigation ---------------- */
/* Иконки Material Design Icons — тот же набор, что использует оригинал
   (mdi-house, mdi-cart, mdi-product, mdi-truck, mdi-chart-line-up и далее). */
const ICO = {
  home:'M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z',
  order:'M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.25,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z',
  box:'M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15Z',
  truck:'M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z',
  chart:'M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z',
  promo:'M12,8H4A2,2 0 0,0 2,10V14A2,2 0 0,0 4,16H5V20A1,1 0 0,0 6,21H8A1,1 0 0,0 9,20V16H12L17,20V4L12,8M21.5,12C21.5,13.71 20.54,15.26 19,16V8C20.53,8.75 21.5,10.3 21.5,12Z',
  users:'M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z',
  chat:'M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13.08,16H20V4H4V16H10M6,7H18V9H6V7M6,11H15V13H6V11Z',
  site:'M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z',
  help:'M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z',
  plug:'M20.5,11H19V7C19,5.89 18.1,5 17,5H13V3.5A2.5,2.5 0 0,0 10.5,1A2.5,2.5 0 0,0 8,3.5V5H4A2,2 0 0,0 2,7V10.8H3.5C5,10.8 6.2,12 6.2,13.5C6.2,15 5,16.2 3.5,16.2H2V20A2,2 0 0,0 4,22H7.8V20.5C7.8,19 9,17.8 10.5,17.8C12,17.8 13.2,19 13.2,20.5V22H17A2,2 0 0,0 19,20V16H20.5A2.5,2.5 0 0,0 23,13.5A2.5,2.5 0 0,0 20.5,11Z',
  wallet:'M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z',
  gear:'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
};
function icon(name){
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICO[name] || ICO.box}"/></svg>`;
}

const NAV = [
  { t: 'Главная', i: 'home', r: '#/home' },
  { t: 'Заказы', i: 'order', r: '#/orders', badge: () => DB.orders.filter(o => o.custom_status === 'novy').length,
    sub: [ ['Все заказы', '#/orders'], ['Отгрузки', '#/stub/Отгрузки'], ['Задачи', '#/stub/Задачи'] ] },
  { t: 'Товары', i: 'box', r: '#/products',
    sub: [ ['Каталог товаров', '#/products'], ['Импорт/Экспорт', '#/import'], ['Цены и остатки', '#/prices'],
           ['Товарные выгрузки', '#/stub/Товарные выгрузки'], ['Отзывы', '#/stub/Отзывы о товарах'] ] },
  { t: 'Доставка', i: 'truck', r: '#/delivery' },
  { t: 'Аналитика', i: 'chart', r: '#/stub/Аналитика' },
  { t: 'Продвижение', i: 'promo', r: '#/stub/Продвижение', tag: 'new' },
  { t: 'Клиенты', i: 'users', r: '#/clients',
    sub: [ ['Все клиенты', '#/clients'], ['Скидки', '#/discounts'] ] },
  { t: 'Диалоги', i: 'chat', r: '#/stub/Диалоги' },
  { label: 'Каналы продаж' },
  { t: 'Сайт', i: 'site', r: '#/branding',
    sub: [ ['Дизайн', '#/stub/Дизайн'], ['Данные сайта', '#/branding'],
           ['Страницы и документы', '#/pages'], ['Блог и статьи', '#/blogs'],
           ['Файлы', '#/stub/Файлы'], ['Домены', '#/domains'],
           ['Способы доставки', '#/delivery'], ['Способы оплаты', '#/payments'],
           ['Счётчики и коды', '#/codes'] ] },
];
const NAV_FOOT = [
  { t: 'Помощь', i: 'help', r: '#/stub/Помощь' },
  { t: 'Расширения', i: 'plug', r: '#/stub/Расширения' },
  { t: 'Услуги и оплата', i: 'wallet', r: '#/invoices' },
  { t: 'Настройки', i: 'gear', r: '#/settings' },
];

function renderNav() {
  const route = location.hash || '#/home';
  const isOpen = it => it.sub && (route === it.r || it.sub.some(s => route.startsWith(s[1])) ||
    (it.r !== '#/home' && route.startsWith(it.r)));
  const item = it => {
    if (it.label) return `<div class="side-label"><span>${esc(it.label)}</span>
      <button class="plus" title="Добавить канал">+</button></div>`;
    const open = isOpen(it);
    const active = route === it.r || open;
    const badge = it.badge ? it.badge() : 0;
    let html = `<div class="nav-group"><a class="nav-item${active ? ' active' : ''}" href="${it.r}" data-t="${esc(it.t)}">
      <span class="ico">${icon(it.i)}</span><span class="lbl">${esc(it.t)}</span>
      ${badge ? `<span class="badge">${badge}</span>` : ''}
      ${it.tag ? `<span class="badge new">${esc(it.tag)}</span>` : ''}</a>`;
    if (open) {
      html += `<div class="sub">` + it.sub.map(([t, r]) =>
        `<a href="${r}" class="${route === r ? 'active' : ''}">${esc(t)}</a>`).join('') + `</div>`;
    }
    return html + `</div>`;
  };
  $('#nav').innerHTML = NAV.map(item).join('');
  $('#navfoot').innerHTML = NAV_FOOT.map(item).join('');
}

/* ---------------- shared UI ---------------- */
function head(title, extra) {
  return `<div class="page-head"><h1 class="title">${esc(title)}</h1>
    <span class="hint"><span class="q">?</span> Инструкция к разделу</span>
    <span class="sp"></span>${extra || ''}</div>`;
}
function pager(n) {
  return `<div class="pager">Показывать на странице: <b>25</b><span>50</span><span>100</span>
    <span style="color:var(--ink-3);cursor:default;margin-left:10px">всего: ${n}</span></div>`;
}
function backTo(href, text) { return `<div class="crumbs"><a href="${href}">← ${esc(text)}</a></div>`; }

/* ---------------- views ---------------- */
const V = {};

V.home = () => {
  const nw = DB.orders.filter(o => o.custom_status === 'novy');
  const pr = DB.orders.filter(o => o.custom_status === 'obrabotka');
  const ok = DB.orders.filter(o => o.custom_status === 'soglasovan');
  const sum = a => a.reduce((s, o) => s + num(o.total_price), 0);
  const lowStock = DB.products.filter(p => num(firstVariant(p).quantity) <= 5);
  return head('Главная') + `
    <div class="stats">
      <div class="stat"><div class="k"><i style="background:var(--red)"></i>Новые заказы</div>
        <div class="v">${nw.length} <small>на ${money0(sum(nw))}</small></div></div>
      <div class="stat"><div class="k"><i style="background:var(--amber)"></i>В обработке</div>
        <div class="v">${pr.length} <small>на ${money0(sum(pr))}</small></div></div>
      <div class="stat"><div class="k"><i style="background:var(--green)"></i>Согласован, нуждается в отправке</div>
        <div class="v">${ok.length} <small>на ${money0(sum(ok))}</small></div></div>
      <div class="stat"><div class="k"><i style="background:var(--blue)"></i>Товаров в каталоге</div>
        <div class="v">${DB.products.length} <small>из них скрыто ${DB.products.filter(p => p.is_hidden).length}</small></div></div>
    </div>
    ${lowStock.length ? `<div class="notice">Заканчиваются на складе: ${lowStock.map(p =>
      `<a href="#/products/${p.id}">${esc(p.title)}</a> — ${num(firstVariant(p).quantity)} шт`).join(', ')}</div>` : ''}
    <div class="card"><h3>Последние заказы</h3><div class="tablewrap" style="border:0">
      <table class="grid"><thead><tr><th>№</th><th>Создан</th><th>Покупатель</th>
        <th class="num">Сумма</th><th>Статус</th><th>Оплата</th></tr></thead><tbody>
      ${DB.orders.slice(0, 5).map(o => `<tr>
        <td><a href="#/orders/${o.id}" class="rowlink">${o.number}</a></td>
        <td>${fmtDate(o.created_at)}</td>
        <td>${esc(o.shipping_address.full_name)}</td>
        <td class="num">${money(o.total_price)}</td>
        <td><span class="pill ${PILL[o.custom_status]}">${esc(statusTitle(o.custom_status))}</span></td>
        <td><span class="flag ${o.financial_status === 'paid' ? 'paid' : ''}">${o.financial_status === 'paid' ? 'Оплачен' : 'Не оплачен'}</span></td>
      </tr>`).join('')}
      </tbody></table></div></div>`;
};

/* ---- orders ---- */
V.orders = () => {
  const q = (state.q || '').toLowerCase();
  const f = state.filter || 'all';
  let list = DB.orders.slice();
  if (f === 'open') list = list.filter(o => ['novy', 'obrabotka', 'soglasovan'].includes(o.custom_status));
  if (f === 'closed') list = list.filter(o => ['dostavlen', 'otmenen', 'vozvrat'].includes(o.custom_status));
  if (f === 'deleted') list = list.filter(o => o.archived);
  if (q) list = list.filter(o => String(o.number).includes(q) ||
    (o.shipping_address.full_name || '').toLowerCase().includes(q) ||
    (o.shipping_address.city || '').toLowerCase().includes(q));
  return head('Заказы') + `
    <div class="tabs">
      <a href="#" data-f="all" class="${f === 'all' ? 'active' : ''}">Все</a>
      <a href="#" data-f="open" class="${f === 'open' ? 'active' : ''}">Открытые</a>
      <a href="#" data-f="closed" class="${f === 'closed' ? 'active' : ''}">Закрытые</a>
      <a href="#" data-f="deleted" class="${f === 'deleted' ? 'active' : ''}">Удалённые</a>
      <a href="#/order_views">Виды заказов</a>
    </div>
    <div class="toolbar">
      <button class="btn" id="neworder">+ Заказ</button>
      <button class="btn" id="exportorders">Экспорт ▾</button>
      <span class="sp"></span>
      <input class="field-search" id="oq" placeholder="Номер заказа, адрес доставки или данные покупателя" value="${esc(state.q || '')}">
      <button class="btn" id="ocols" title="Настроить колонки">⚙</button>
      <button class="btn" id="ofind"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg> Найти</button>
    </div>
    <div class="tablewrap"><table class="grid"><thead><tr>
      <th style="width:34px"></th><th>№</th><th>Создан</th><th>Доставить</th>
      <th class="num">Сумма</th><th>ФИО получателя</th><th>Статус</th><th>Оплата</th><th>Доставка</th><th></th>
    </tr></thead><tbody>
    ${list.length ? list.map(o => `<tr class="${o.custom_status === 'novy' ? 'striped' : ''}">
      <td><input type="checkbox"></td>
      <td><a href="#/orders/${o.id}" class="rowlink">${o.number}</a></td>
      <td>${fmtDate(o.created_at)}</td>
      <td>${esc(o.delivery_date || '')}</td>
      <td class="num">${money(o.total_price)}</td>
      <td>${esc(o.shipping_address.full_name)}</td>
      <td><span class="pill ${PILL[o.custom_status]}">${esc(statusTitle(o.custom_status))}</span></td>
      <td><span class="flag ${o.financial_status === 'paid' ? 'paid' : ''}">${o.financial_status === 'paid' ? 'Оплачен' : 'Не оплачен'}</span></td>
      <td>${esc(o.delivery_title)}</td>
      <td><button class="btn sm danger" data-del="${o.id}">Удалить</button></td>
    </tr>`).join('') : `<tr><td colspan="10"><div class="empty"><h3>Заказов нет</h3>
      <p>По выбранным условиям ничего не найдено.</p></div></td></tr>`}
    </tbody></table>${pager(list.length)}</div>`;
};
V.orders.bind = () => {
  document.querySelectorAll('.tabs a[data-f]').forEach(a => a.onclick = e => {
    e.preventDefault(); state.filter = a.dataset.f; render();
  });
  const inp = $('#oq');
  $('#ofind').onclick = () => { state.q = inp.value; render(); };
  inp.onkeydown = e => { if (e.key === 'Enter') { state.q = inp.value; render(); } };
  $('#neworder').onclick = () => { toast('Создание заказа вручную — в разработке'); };
  $('#ocols').onclick = () => toast('Настройка колонок таблицы заказов');
  $('#exportorders').onclick = () => exportCsv('orders.csv',
    ['Номер', 'Создан', 'Покупатель', 'Сумма', 'Статус', 'Оплата', 'Доставка'],
    DB.orders.map(o => [o.number, o.created_at, o.shipping_address.full_name,
      o.total_price, statusTitle(o.custom_status), o.financial_status, o.delivery_title]));
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить заказ безвозвратно?', () => {
      DB.orders = DB.orders.filter(o => o.id !== +b.dataset.del); save(); toast('Заказ удалён'); render();
    }));
};

V.order = (id) => {
  const o = DB.orders.find(x => x.id === +id);
  if (!o) return `<div class="empty"><h3>Заказ не найден</h3></div>`;
  const c = clientById(o.client_id);
  const itemsSum = o.order_lines.reduce((s, l) => s + num(l.total), 0);
  return backTo('#/orders', 'Все заказы') + `
    <div class="page-head"><h1 class="title">Заказ ${o.number} от ${fmtDate(o.created_at)}</h1>
      <span class="sp"></span>
      <button class="btn">Оформить доставку</button>
      <button class="btn" id="copyorder">Копировать</button></div>
    <div class="cols" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start">
      <div>
        <div class="card"><h3>Позиции заказа</h3><div class="tablewrap" style="border:0">
        <table class="grid"><thead><tr><th></th><th>Фото</th><th>Артикул</th><th>Наименование</th>
          <th class="num">Цена</th><th class="num">Вес</th><th class="num">Кол-во</th>
          <th class="num">Резерв</th><th class="num">Остаток</th><th class="num">Сумма</th></tr></thead><tbody>
        ${o.order_lines.map((l, i) => `<tr>
          <td>${i + 1}</td><td><div class="thumb">▦</div></td>
          <td class="mono">${esc(l.sku)}</td>
          <td><a href="#/products/${l.product_id}">${esc(l.title)}</a></td>
          <td class="num">${money(l.price)}</td><td class="num">${num(l.weight)}</td>
          <td class="num">${l.quantity} шт</td><td class="num">${l.reserved} шт</td>
          <td class="num">${l.stock} шт</td><td class="num">${money(l.total)}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="body" style="display:flex;gap:8px;align-items:center">
          <button class="btn sm">Позиция</button><button class="btn sm">Скидка</button>
          <button class="btn sm">Купон</button><span class="sp" style="flex:1"></span>
          <span style="color:var(--ink-3)">Товары:</span> <b>${money(itemsSum)}</b>
          <span style="color:var(--ink-3);margin-left:14px">Доставка:</span> <b>${money(o.delivery_price)}</b>
          <span style="color:var(--ink-3);margin-left:14px">Итого:</span>
          <b style="font-size:16px">${money(o.total_price)}</b>
        </div></div>

        <div class="card"><h3>Покупатель и доставка</h3><div class="body">
          <dl class="kv">
            <dt>Покупатель</dt><dd><a href="#/clients/${c.id}">${esc(o.shipping_address.full_name)}</a></dd>
            <dt>Телефон</dt><dd>${esc(o.shipping_address.phone)}</dd>
            <dt>Почта</dt><dd>${esc(c.email || '')}</dd>
            <dt>Адрес</dt><dd>${esc([o.shipping_address.zip, o.shipping_address.city,
              o.shipping_address.street, o.shipping_address.house && 'д. ' + o.shipping_address.house,
              o.shipping_address.apartment && 'кв. ' + o.shipping_address.apartment].filter(Boolean).join(', '))}</dd>
            <dt>Способ доставки</dt><dd>${esc(o.delivery_title)}</dd>
            <dt>Дата доставки</dt><dd>${esc(o.delivery_date || '—')}</dd>
            <dt>Комментарий</dt><dd>${esc(o.comment || '—')}</dd>
          </dl></div></div>

        <div class="card"><h3>Источник заказа</h3><div class="body"><dl class="kv">
          <dt>Источник</dt><dd>${esc(o.first_source || '—')}</dd>
          <dt>Поисковый запрос</dt><dd>${esc(o.first_query || '—')}</dd>
          <dt>Переход с</dt><dd>${esc(o.first_referer || '—')}</dd>
          <dt>Домен источника</dt><dd>${esc(o.source_domain || '—')}</dd>
        </dl>
        <div class="help">InSales пишет эти поля в каждый заказ. При переносе теряются первыми.</div>
        </div></div>
      </div>

      <div>
        <div class="card"><h3>Статусы</h3><div class="body">
          <div class="row" style="grid-template-columns:1fr"><label>Статус заказа</label>
            <select id="ost">${STATUSES.map(s =>
              `<option value="${s.key}" ${s.key === o.custom_status ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></div>
          <div class="row" style="grid-template-columns:1fr"><label>Статус оплаты</label>
            <select id="ofin">
              <option value="not_paid" ${o.financial_status !== 'paid' ? 'selected' : ''}>Не оплачен</option>
              <option value="paid" ${o.financial_status === 'paid' ? 'selected' : ''}>Оплачен</option>
            </select></div>
          <div class="row" style="grid-template-columns:1fr"><label>Способ оплаты</label>
            <select id="opay">${DB.payment_gateways.map(p =>
              `<option ${p.id === o.payment_gateway_id ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select></div>
          <div class="row" style="grid-template-columns:1fr"><label>Комментарий менеджера</label>
            <textarea id="omc" style="min-height:70px">${esc(o.manager_comment || '')}</textarea></div>
          <button class="btn primary" id="osave">Сохранить</button>
        </div></div>
        <div class="card"><h3>Действия</h3><div class="body" style="display:flex;flex-wrap:wrap;gap:8px">
          <button class="btn sm" onclick="window.print()">Печать</button>
          <button class="btn sm">Отправить письмо</button>
          <button class="btn sm">Чат</button>
        </div></div>
      </div>
    </div>`;
};
V.order.bind = (id) => {
  const o = DB.orders.find(x => x.id === +id); if (!o) return;
  $('#osave').onclick = () => {
    o.custom_status = $('#ost').value;
    o.financial_status = $('#ofin').value;
    o.payment_title = $('#opay').value;
    const pg = DB.payment_gateways.find(p => p.title === o.payment_title);
    if (pg) o.payment_gateway_id = pg.id;
    o.manager_comment = $('#omc').value;
    if (o.financial_status === 'paid') o.paid_amount = o.total_price;
    save(); toast('Заказ сохранён'); render();
  };
  $('#copyorder').onclick = () => {
    const copy = JSON.parse(JSON.stringify(o));
    copy.id = nextId(DB.orders); copy.number = DB.account.next_order_number++;
    copy.created_at = new Date().toISOString(); copy.custom_status = 'novy';
    copy.financial_status = 'not_paid'; copy.paid_amount = '0.0';
    DB.orders.unshift(copy); save(); toast('Заказ скопирован'); go('#/orders/' + copy.id);
  };
};

/* ---- products ---- */
V.products = () => {
  const col = state.col || 'all';
  const q = (state.pq || '').toLowerCase();
  let list = DB.products.slice();
  if (col !== 'all') list = list.filter(p => (p.collections_ids || []).includes(+col));
  if (q) list = list.filter(p => p.title.toLowerCase().includes(q) ||
    (firstVariant(p).sku || '').toLowerCase().includes(q));
  const tree = DB.collections.filter(c => !c.parent_id);
  const kids = pid => DB.collections.filter(c => c.parent_id === pid);
  return head('Все товары', `<button class="btn primary" id="addproduct">Добавить товар</button>
      <button class="btn" id="prodactions">Другие действия ▾</button>`) + `
    <div class="split">
      <div class="treecol">
        <div class="tt"><button class="btn icon sm" id="addcol" title="Добавить категорию">+</button>
          <button class="btn icon sm" title="Удалить">×</button>
          <button class="btn icon sm" title="Переименовать">✎</button>
          <input class="field-search" style="min-width:0;flex:1" placeholder="Поиск"></div>
        <div class="tree">
          <a href="#" data-col="all" class="${col === 'all' ? 'active' : ''}">Все</a>
          ${tree.map(c => `<a href="#" data-col="${c.id}" class="${col == c.id ? 'active' : ''}">${esc(c.title)}</a>` +
            kids(c.id).map(k => `<a href="#" data-col="${k.id}" class="child ${col == k.id ? 'active' : ''}">${esc(k.title)}</a>`).join('')).join('')}
        </div>
      </div>
      <div>
        <div class="toolbar">
          <input class="field-search" id="pq" placeholder="Поиск по названию или артикулу" value="${esc(state.pq || '')}">
          <button class="btn" id="pfind"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg> Найти</button><span class="sp"></span>
          <button class="btn" id="pexport">Экспорт CSV</button>
        </div>
        ${list.length ? `<div class="tablewrap"><table class="grid"><thead><tr>
          <th style="width:34px"><input type="checkbox" id="selall"></th><th>Фото</th><th>Артикул</th><th>Название</th>
          <th class="num">Цена</th><th class="num">Остаток</th><th>Показывать</th><th></th></tr></thead><tbody>
        ${list.map(p => { const v = firstVariant(p); return `<tr>
          <td><input type="checkbox" data-sel="${p.id}"></td><td><div class="thumb">▦</div></td>
          <td class="mono">${esc(v.sku || '')}</td>
          <td><a href="#/products/${p.id}" class="rowlink">${esc(p.title)}</a>
            ${p.is_hidden ? ' <span class="pill grey">скрыт</span>' : ''}</td>
          <td class="num">${money(v.price)}</td>
          <td class="num" style="${num(v.quantity) <= 5 ? 'color:var(--red)' : ''}">${num(v.quantity)} шт</td>
          <td><input type="checkbox" ${!p.is_hidden ? 'checked' : ''} data-vis="${p.id}"></td>
          <td><button class="btn sm danger" data-delp="${p.id}">Удалить</button></td></tr>`; }).join('')}
        </tbody></table>${pager(list.length)}</div>`
        : `<div class="empty"><h3>Добавьте товары</h3>
            <p>Здесь вы будете добавлять товары и управлять ими. Можно добавить вручную или загрузить из файла.</p>
            <button class="btn primary" id="addproduct2">Добавить товар</button></div>`}
      </div>
    </div>`;
};
V.products.bind = () => {
  document.querySelectorAll('[data-col]').forEach(a => a.onclick = e => {
    e.preventDefault(); state.col = a.dataset.col; render();
  });
  const inp = $('#pq');
  $('#pfind').onclick = () => { state.pq = inp.value; render(); };
  inp.onkeydown = e => { if (e.key === 'Enter') { state.pq = inp.value; render(); } };
  const add = () => go('#/products/new');
  $('#addproduct').onclick = add;
  if ($('#addproduct2')) $('#addproduct2').onclick = add;
  const selected = () => Array.from(document.querySelectorAll('[data-sel]:checked')).map(c => +c.dataset.sel);
  if ($('#selall')) $('#selall').onchange = e =>
    document.querySelectorAll('[data-sel]').forEach(c => { c.checked = e.target.checked; });
  $('#prodactions').onclick = () => {
    const ids = selected();
    if (!ids.length) return toast('Отметьте товары галочками');
    const acts = [
      ['make_hidden', 'Скрыть'], ['remove_hidden', 'Показать'],
      ['batch_set_category', 'Назначить категорию'],
      ['set_no_delivery', 'Запретить доставку'], ['clear_no_delivery', 'Разрешить доставку'],
      ['add_characteristic', 'Добавить характеристику'], ['group_destroy', 'Удалить'],
    ];
    const root = $('#modalroot');
    root.innerHTML = `<div class="modal-bg"><div class="modal">
      <h3>Другие действия — выбрано ${ids.length}</h3>
      <div class="body">${acts.map(([k, t]) =>
        `<div style="padding:7px 0;border-bottom:1px solid var(--line)">
          <a href="#" data-act="${k}">${t}</a>
          <span class="mono help" style="float:right">${k}</span></div>`).join('')}
        <div class="help" style="margin-top:12px">Это реальные маршруты групповых операций,
          найденные в каталоге InSales.</div></div>
      <div class="foot"><button class="btn" data-no>Закрыть</button></div></div></div>`;
    const close = () => (root.innerHTML = '');
    $('[data-no]', root).onclick = close;
    root.querySelectorAll('[data-act]').forEach(a => a.onclick = ev => {
      ev.preventDefault();
      const k = a.dataset.act;
      const hit = p => ids.includes(p.id);
      if (k === 'make_hidden') DB.products.forEach(p => { if (hit(p)) p.is_hidden = true; });
      if (k === 'remove_hidden') DB.products.forEach(p => { if (hit(p)) p.is_hidden = false; });
      if (k === 'set_no_delivery') DB.products.forEach(p => { if (hit(p)) p.available = false; });
      if (k === 'clear_no_delivery') DB.products.forEach(p => { if (hit(p)) p.available = true; });
      if (k === 'batch_set_category') {
        const c = prompt('ID категории витрины\n' + DB.collections.map(x => x.id + ' — ' + x.title).join('\n'));
        if (c) DB.products.forEach(p => { if (hit(p) && !p.collections_ids.includes(+c)) p.collections_ids.push(+c); });
      }
      if (k === 'add_characteristic') {
        const t = prompt('Название характеристики');
        if (t) DB.products.forEach(p => { if (hit(p)) p.characteristics.push({ title: t }); });
      }
      if (k === 'group_destroy') {
        close();
        return confirmDialog(`Удалить товаров: ${ids.length}?`, () => {
          DB.products = DB.products.filter(p => !ids.includes(p.id));
          save(); toast('Удалено: ' + ids.length); render();
        });
      }
      save(); close(); toast('Применено к товарам: ' + ids.length); render();
    });
  };
  $('#addcol').onclick = () => {
    const t = prompt('Название категории'); if (!t) return;
    DB.collections.push({ id: nextId(DB.collections), parent_id: 56930233, title: t,
      permalink: slugify(t), url: '/collection/' + slugify(t), is_hidden: false,
      position: DB.collections.length + 1, sort_type: 7,
      html_title: null, meta_description: null, meta_keywords: null, description: null });
    save(); toast('Категория создана'); render();
  };
  $('#pexport').onclick = () => exportCsv('products.csv',
    ['Артикул', 'Название', 'Цена', 'Старая цена', 'Себестоимость', 'Остаток', 'Штрихкод', 'Вес', 'Пермалинк'],
    DB.products.map(p => { const v = firstVariant(p);
      return [v.sku, p.title, v.price, v.old_price, v.cost_price, v.quantity, v.barcode, v.weight, p.permalink]; }));
  document.querySelectorAll('[data-vis]').forEach(cb => cb.onchange = () => {
    const p = DB.products.find(x => x.id === +cb.dataset.vis);
    p.is_hidden = !cb.checked; save(); toast(p.is_hidden ? 'Товар скрыт' : 'Товар показан');
  });
  document.querySelectorAll('[data-delp]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить товар безвозвратно?', () => {
      DB.products = DB.products.filter(p => p.id !== +b.dataset.delp); save(); toast('Товар удалён'); render();
    }));
};

V.product = (id) => {
  const isNew = id === 'new';
  const p = isNew ? null : DB.products.find(x => x.id === +id);
  if (!isNew && !p) return `<div class="empty"><h3>Товар не найден</h3></div>`;
  const v = isNew ? {} : firstVariant(p);
  const val = (o, k, d) => esc(o && o[k] != null ? o[k] : (d == null ? '' : d));
  return backTo('#/products', 'Каталог товаров') + `
    <div class="page-head"><h1 class="title">${isNew ? 'Новый товар' : esc(p.title)}</h1>
      <span class="sp"></span>
      ${!isNew ? `<a href="#/products/${p.id}" class="btn" id="delproduct">Удалить</a>` : ''}
      <button class="btn primary" id="saveproduct">Сохранить</button></div>
    <div class="cols" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start">
      <div>
        <div class="card"><h3>Основное</h3><div class="body">
          <div class="row"><label>Название <span class="req">*</span></label>
            <input type="text" id="f_title" value="${val(p, 'title')}" placeholder="Название товара"></div>
          <div class="row"><label>Краткое описание</label>
            <textarea id="f_short" style="min-height:60px" placeholder="Укажите главные особенности, характеристики">${val(p, 'short_description')}</textarea></div>
          <div class="row"><label>Описание</label>
            <textarea id="f_desc" style="min-height:150px">${val(p, 'description')}</textarea></div>
          <div class="row"><label>Пермалинк</label>
            <div class="prefix"><span class="pre">/product/</span>
              <input type="text" id="f_perm" value="${val(p, 'permalink')}"></div></div>
        </div></div>

        <div class="card"><h3>Цены и склад</h3><div class="body">
          <div class="cols">
            <div><label class="help" style="display:block;margin-bottom:4px">Цена продажи</label>
              <input type="number" step="0.01" id="f_price" value="${val(v, 'price', 0)}" placeholder="0.00"></div>
            <div><label class="help" style="display:block;margin-bottom:4px">Цена до скидки</label>
              <input type="number" step="0.01" id="f_old" value="${val(v, 'old_price')}" placeholder="0.00"></div>
            <div><label class="help" style="display:block;margin-bottom:4px">Себестоимость</label>
              <input type="number" step="0.01" id="f_cost" value="${val(v, 'cost_price', 0)}" placeholder="0.00"></div>
            <div><label class="help" style="display:block;margin-bottom:4px">Остаток</label>
              <input type="number" id="f_qty" value="${val(v, 'quantity', 0)}" placeholder="∞"></div>
            <div><label class="help" style="display:block;margin-bottom:4px">Артикул</label>
              <input type="text" id="f_sku" value="${val(v, 'sku')}"></div>
            <div><label class="help" style="display:block;margin-bottom:4px">Штрихкод</label>
              <input type="text" id="f_barcode" value="${val(v, 'barcode')}"></div>
            <div><label class="help" style="display:block;margin-bottom:4px">Вес, кг</label>
              <input type="number" step="0.01" id="f_weight" value="${val(v, 'weight', 0)}"></div>
          </div>
        </div></div>

        <div class="card"><h3>Поисковая оптимизация</h3><div class="body">
          <div class="row"><label>Тег title</label>
            <input type="text" id="f_htitle" value="${val(p, 'html_title')}"
              placeholder="Если пусто — подставится SEO-шаблон"></div>
          <div class="row"><label>Мета-тег description</label>
            <textarea id="f_mdesc" style="min-height:70px" placeholder="Если пусто — подставится SEO-шаблон">${val(p, 'meta_description')}</textarea></div>
          <div class="row"><label>Мета-тег keywords</label>
            <input type="text" id="f_mkw" value="${val(p, 'meta_keywords')}"></div>
        </div></div>
      </div>

      <div>
        <div class="card"><h3>Публикация</h3><div class="body">
          <label class="check"><input type="checkbox" id="f_show" ${!p || !p.is_hidden ? 'checked' : ''}> Показывать</label>
          <label class="check"><input type="checkbox" id="f_avail" ${!p || p.available ? 'checked' : ''}> Доступен к заказу</label>
        </div></div>
        <div class="card"><h3>Категории витрины</h3><div class="body">
          ${DB.collections.map(c => `<label class="check"><input type="checkbox" data-col="${c.id}"
            ${p && (p.collections_ids || []).includes(c.id) ? 'checked' : ''}> ${esc(c.title)}</label>`).join('')}
        </div></div>
        <div class="card"><h3>Изображения</h3><div class="body">
          <div class="thumb" style="width:100%;height:120px">▦</div>
          <div class="help">Загрузка файлов требует хранилища — в демо-версии не активна.</div>
        </div></div>
      </div>
    </div>`;
};
V.product.bind = (id) => {
  const isNew = id === 'new';
  if (!$('#saveproduct')) return;
  $('#saveproduct').onclick = () => {
    const title = $('#f_title').value.trim();
    if (!title) { toast('Заполните название'); $('#f_title').focus(); return; }
    let p = isNew ? null : DB.products.find(x => x.id === +id);
    if (!p) {
      p = JSON.parse(JSON.stringify(SEED.products[0]));
      p.id = nextId(DB.products); p.variants = [JSON.parse(JSON.stringify(SEED.products[0].variants[0]))];
      p.variants[0].id = p.id + 1; p.variants[0].product_id = p.id;
      p.images = []; DB.products.unshift(p);
    }
    const v = p.variants[0];
    p.title = title;
    p.short_description = $('#f_short').value;
    p.description = $('#f_desc').value;
    p.permalink = $('#f_perm').value.trim() || slugify(title);
    p.html_title = $('#f_htitle').value || null;
    p.meta_description = $('#f_mdesc').value || null;
    p.meta_keywords = $('#f_mkw').value || null;
    p.is_hidden = !$('#f_show').checked;
    p.available = $('#f_avail').checked;
    p.collections_ids = Array.from(document.querySelectorAll('[data-col]:checked')).map(c => +c.dataset.col);
    p.updated_at = new Date().toISOString();
    v.price = String(num($('#f_price').value));
    v.base_price = v.price;
    v.old_price = $('#f_old').value ? String(num($('#f_old').value)) : null;
    v.cost_price = String(num($('#f_cost').value));
    v.quantity = Math.round(num($('#f_qty').value));
    v.quantity_at_warehouse0 = String(v.quantity) + '.0';
    v.sku = $('#f_sku').value;
    v.barcode = $('#f_barcode').value;
    v.weight = String(num($('#f_weight').value));
    save(); toast(isNew ? 'Товар создан' : 'Товар сохранён'); go('#/products/' + p.id);
    if (!isNew) render();
  };
  if ($('#delproduct')) $('#delproduct').onclick = e => {
    e.preventDefault();
    confirmDialog('Удалить товар безвозвратно?', () => {
      DB.products = DB.products.filter(p => p.id !== +id); save(); toast('Товар удалён'); go('#/products');
    });
  };
};

/* ---- prices & stock ---- */
V.prices = () => {
  const tab = state.ptab || 'all';
  return head('Цены и остатки', `<button class="btn" id="bulk">Массовые изменения</button>`) + `
    <div class="tabs">
      ${[['all', 'Все'], ['price', 'Цены'], ['stock', 'Остатки']].map(([k, t]) =>
        `<a href="#" data-pt="${k}" class="${tab === k ? 'active' : ''}">${t}</a>`).join('')}
    </div>
    <div class="notice info">Значения меняются прямо в таблице — правьте поле и нажмите «Сохранить изменения».</div>
    <div class="tablewrap"><table class="grid"><thead><tr>
      <th>Название</th><th class="mono">Штрихкод</th>
      ${tab !== 'stock' ? '<th class="num">Себестоимость</th><th class="num">Цена продажи</th><th class="num">Цена до скидки</th>' : ''}
      ${tab !== 'price' ? '<th class="num">Склад</th>' : ''}
      <th class="num">Наценка</th></tr></thead><tbody>
    ${DB.products.map(p => { const v = firstVariant(p);
      const marg = num(v.price) && num(v.cost_price) ? Math.round((num(v.price) - num(v.cost_price)) / num(v.price) * 100) : 0;
      return `<tr><td>${esc(p.title)}</td><td class="mono">${esc(v.barcode || '')}</td>
      ${tab !== 'stock' ? `
        <td class="num"><input type="number" step="0.01" style="width:110px;text-align:right" data-pc="${p.id}" value="${num(v.cost_price)}"></td>
        <td class="num"><input type="number" step="0.01" style="width:110px;text-align:right" data-pp="${p.id}" value="${num(v.price)}"></td>
        <td class="num"><input type="number" step="0.01" style="width:110px;text-align:right" data-po="${p.id}" value="${v.old_price ? num(v.old_price) : ''}"></td>` : ''}
      ${tab !== 'price' ? `<td class="num"><input type="number" style="width:90px;text-align:right" data-pq="${p.id}" value="${num(v.quantity)}"></td>` : ''}
      <td class="num">${marg}%</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="formfoot"><button class="btn primary" id="savePrices">Сохранить изменения</button>
      <span class="sp"></span><button class="btn" id="pricesCsv">Выгрузить в CSV</button></div>`;
};
V.prices.bind = () => {
  document.querySelectorAll('[data-pt]').forEach(a => a.onclick = e => {
    e.preventDefault(); state.ptab = a.dataset.pt; render();
  });
  $('#savePrices').onclick = () => {
    DB.products.forEach(p => {
      const v = firstVariant(p);
      const c = document.querySelector(`[data-pc="${p.id}"]`); if (c) v.cost_price = String(num(c.value));
      const pr = document.querySelector(`[data-pp="${p.id}"]`); if (pr) { v.price = String(num(pr.value)); v.base_price = v.price; }
      const o = document.querySelector(`[data-po="${p.id}"]`); if (o) v.old_price = o.value ? String(num(o.value)) : null;
      const q = document.querySelector(`[data-pq="${p.id}"]`); if (q) { v.quantity = Math.round(num(q.value)); v.quantity_at_warehouse0 = v.quantity + '.0'; }
    });
    save(); toast('Цены и остатки сохранены'); render();
  };
  $('#bulk').onclick = () => {
    const pct = prompt('Изменить все цены на, %  (например 10 или -5)');
    if (pct === null || pct === '') return;
    const k = 1 + num(pct) / 100;
    DB.products.forEach(p => { const v = firstVariant(p); v.price = String(Math.round(num(v.price) * k * 100) / 100); v.base_price = v.price; });
    save(); toast('Цены пересчитаны на ' + pct + '%'); render();
  };
  $('#pricesCsv').onclick = () => exportCsv('prices.csv',
    ['Название', 'Штрихкод', 'Себестоимость', 'Цена', 'Цена до скидки', 'Остаток'],
    DB.products.map(p => { const v = firstVariant(p);
      return [p.title, v.barcode, v.cost_price, v.price, v.old_price, v.quantity]; }));
};

/* ---- clients ---- */
V.clients = () => head('Клиенты', `<button class="btn primary" id="addclient">Добавить клиента</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr>
    <th>ФИО</th><th>Телефон</th><th>Почта</th><th>Город</th><th>Подписка</th>
    <th class="num">Заказов</th><th class="num">Оборот</th><th></th></tr></thead><tbody>
  ${DB.clients.map(c => {
    const orders = DB.orders.filter(o => o.client_id === c.id);
    const turn = orders.reduce((s, o) => s + num(o.total_price), 0);
    return `<tr><td><a href="#/clients/${c.id}" class="rowlink">${esc(c.full_name)}</a>
      ${c.external_id ? ` <span class="pill grey">МойСклад</span>` : ''}</td>
      <td>${esc(c.phone)}</td><td>${esc(c.email)}</td><td>${esc(c.default_address.city)}</td>
      <td>${c.subscribe ? 'да' : '—'}</td><td class="num">${orders.length}</td>
      <td class="num">${money(turn)}</td>
      <td><button class="btn sm danger" data-delc="${c.id}">Удалить</button></td></tr>`;
  }).join('')}
  </tbody></table>${pager(DB.clients.length)}</div>`;
V.clients.bind = () => {
  $('#addclient').onclick = () => go('#/clients/new');
  document.querySelectorAll('[data-delc]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить клиента?', () => {
      DB.clients = DB.clients.filter(c => c.id !== +b.dataset.delc); save(); toast('Клиент удалён'); render();
    }));
};

V.client = (id) => {
  const isNew = id === 'new';
  const c = isNew ? null : DB.clients.find(x => x.id === +id);
  if (!isNew && !c) return `<div class="empty"><h3>Клиент не найден</h3></div>`;
  const a = (c && c.default_address) || {};
  const val = (o, k) => esc(o && o[k] != null ? o[k] : '');
  const orders = c ? DB.orders.filter(o => o.client_id === c.id) : [];
  return backTo('#/clients', 'Все клиенты') + `
    <div class="page-head"><h1 class="title">${isNew ? 'Новый клиент' : esc(c.full_name)}</h1>
      <span class="sp"></span><button class="btn primary" id="saveclient">${isNew ? 'Создать' : 'Сохранить'}</button></div>
    <div class="cols" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start"><div>
      <div class="card"><h3>Контактные данные</h3><div class="body">
        <div class="row"><label>Имя <span class="req">*</span></label><input type="text" id="c_name" value="${val(c, 'name')}"></div>
        <div class="row"><label>Фамилия</label><input type="text" id="c_surname" value="${val(c, 'surname')}"></div>
        <div class="row"><label>Отчество</label><input type="text" id="c_middle" value="${val(c, 'middlename')}"></div>
        <div class="row"><label>Телефон <span class="req">*</span></label><input type="tel" id="c_phone" value="${val(c, 'phone')}"></div>
        <div class="row"><label>Почта <span class="req">*</span></label><input type="email" id="c_email" value="${val(c, 'email')}"></div>
        <label class="check"><input type="checkbox" id="c_sub" ${c && c.subscribe ? 'checked' : ''}> Подписка на новости</label>
        <label class="check"><input type="checkbox" id="c_pd" ${!c || c.consent_to_personal_data ? 'checked' : ''}> Согласие на обработку персональных данных <span class="req">*</span></label>
        <label class="check"><input type="checkbox" id="c_notify" ${!c || c.messenger_subscription ? 'checked' : ''}> Получать уведомления о заказе</label>
      </div></div>
      <div class="card"><h3>Адрес</h3><div class="body">
        <div class="row"><label>Населенный пункт <span class="req">*</span></label><input type="text" id="c_city" value="${val(a, 'city')}"></div>
        <div class="row"><label>Почтовый индекс</label><input type="text" id="c_zip" value="${val(a, 'zip')}"></div>
        <div class="row"><label>Улица</label><input type="text" id="c_street" value="${val(a, 'street')}"></div>
        <div class="row"><label>Дом</label><input type="text" id="c_house" value="${val(a, 'house')}"></div>
        <div class="row"><label>Квартира</label><input type="text" id="c_apt" value="${val(a, 'apartment')}"></div>
      </div></div>
    </div><div>
      <div class="card"><h3>Учётная система</h3><div class="body">
        <div class="row" style="grid-template-columns:1fr"><label>Внешний идентификатор</label>
          <input type="text" id="c_ext" value="${val(c, 'external_id')}" placeholder="ID в МойСклад"></div>
        <div class="help">Поля external_id и external_service есть в модели InSales — готовая точка стыка с учётной системой.</div>
      </div></div>
      ${!isNew ? `<div class="card"><h3>Заказы клиента</h3><div class="body">
        ${orders.length ? orders.map(o => `<div style="padding:6px 0;border-bottom:1px solid var(--line)">
          <a href="#/orders/${o.id}">№ ${o.number}</a> — ${money(o.total_price)},
          <span class="pill ${PILL[o.custom_status]}">${esc(statusTitle(o.custom_status))}</span></div>`).join('')
          : '<div class="help">Заказов пока нет</div>'}
      </div></div>` : ''}
    </div></div>`;
};
V.client.bind = (id) => {
  const isNew = id === 'new';
  if (!$('#saveclient')) return;
  $('#saveclient').onclick = () => {
    const name = $('#c_name').value.trim();
    if (!name) { toast('Заполните имя'); return; }
    let c = isNew ? null : DB.clients.find(x => x.id === +id);
    if (!c) { c = { id: nextId(DB.clients), client_tags: [], bonus_points: 0, registered: false,
      type: 'Client::Individual', created_at: new Date().toISOString(), default_address: {} };
      DB.clients.unshift(c); }
    c.name = name; c.surname = $('#c_surname').value; c.middlename = $('#c_middle').value;
    c.full_name = [c.surname, c.name, c.middlename].filter(Boolean).join(' ');
    c.phone = $('#c_phone').value; c.email = $('#c_email').value;
    c.subscribe = $('#c_sub').checked; c.consent_to_personal_data = $('#c_pd').checked;
    c.messenger_subscription = $('#c_notify').checked;
    c.external_id = $('#c_ext').value || null;
    c.external_service = c.external_id ? 'moysklad' : null;
    c.default_address = { city: $('#c_city').value, zip: $('#c_zip').value, street: $('#c_street').value,
      house: $('#c_house').value, apartment: $('#c_apt').value };
    save(); toast(isNew ? 'Клиент создан' : 'Клиент сохранён'); go('#/clients');
  };
};

/* ---- content ---- */
V.pages = () => head('Страницы и документы', `<button class="btn primary" id="addpage">Добавить страницу</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Заголовок</th><th class="mono">Адрес</th>
    <th>Тег title</th><th>Показывать</th><th></th></tr></thead><tbody>
  ${DB.pages.map(p => `<tr><td><a href="#/pages/${p.id}" class="rowlink">${esc(p.title)}</a></td>
    <td class="mono">/page/${esc(p.permalink)}</td>
    <td style="color:${p.html_title ? 'inherit' : 'var(--ink-3)'}">${esc(p.html_title || 'из SEO-шаблона')}</td>
    <td>${p.is_hidden ? '—' : 'да'}</td>
    <td><button class="btn sm danger" data-delpg="${p.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>`;
V.pages.bind = () => {
  $('#addpage').onclick = () => go('#/pages/new');
  document.querySelectorAll('[data-delpg]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить страницу?', () => {
      DB.pages = DB.pages.filter(p => p.id !== +b.dataset.delpg); save(); toast('Страница удалена'); render();
    }));
};

V.page = (id) => {
  const isNew = id === 'new';
  const p = isNew ? null : DB.pages.find(x => x.id === +id);
  if (!isNew && !p) return `<div class="empty"><h3>Страница не найдена</h3></div>`;
  const val = k => esc(p && p[k] != null ? p[k] : '');
  return backTo('#/pages', 'Страницы и документы') + `
    <div class="page-head"><h1 class="title">${isNew ? 'Новая страница' : esc(p.title)}</h1>
      <span class="sp"></span><button class="btn primary" id="savepage">Сохранить</button></div>
    <div class="card"><div class="body">
      <div class="row"><label>Заголовок <span class="req">*</span></label><input type="text" id="pg_title" value="${val('title')}"></div>
      <div class="row"><label>Адрес страницы</label>
        <div class="prefix"><span class="pre">${esc(DB.account.main_host)}/page/</span>
          <input type="text" id="pg_perm" value="${val('permalink')}"></div></div>
      <div class="row"><label>Содержимое</label><textarea id="pg_content" style="min-height:220px">${val('content')}</textarea></div>
      <div class="row"><label>Тег title</label><input type="text" id="pg_htitle" value="${val('html_title')}"></div>
      <div class="row"><label>Мета-тег description</label><textarea id="pg_mdesc" style="min-height:70px">${val('meta_description')}</textarea></div>
      <label class="check"><input type="checkbox" id="pg_show" ${!p || !p.is_hidden ? 'checked' : ''}> Показывать страницу на сайте</label>
    </div></div>`;
};
V.page.bind = (id) => {
  const isNew = id === 'new';
  if (!$('#savepage')) return;
  $('#savepage').onclick = () => {
    const t = $('#pg_title').value.trim(); if (!t) { toast('Заполните заголовок'); return; }
    let p = isNew ? null : DB.pages.find(x => x.id === +id);
    if (!p) { p = { id: nextId(DB.pages) }; DB.pages.push(p); }
    p.title = t; p.permalink = $('#pg_perm').value.trim() || slugify(t);
    p.content = $('#pg_content').value; p.html_title = $('#pg_htitle').value || null;
    p.meta_description = $('#pg_mdesc').value || null; p.is_hidden = !$('#pg_show').checked;
    save(); toast('Страница сохранена'); go('#/pages');
  };
};

V.blogs = () => head('Блог и статьи', `<button class="btn primary" id="addart">Добавить статью</button>`) + `
  ${DB.blogs.map(b => `<div class="card"><h3>${esc(b.title)} · /${esc(b.handle)}</h3><div class="body">
    <dl class="kv"><dt>Тег title</dt><dd>${esc(b.html_title || '—')}</dd>
    <dt>Комментарии</dt><dd>${b.commentable === 'moderated' ? 'с модерацией' : b.commentable}</dd>
    <dt>Защита от спама</dt><dd>${b.captcha_enabled ? 'CAPTCHA включена' : 'выключена'}</dd>
    <dt>Ссылки в комментариях</dt><dd>${b.disallow_links_in_comments ? 'запрещены' : 'разрешены'}</dd></dl>
  </div></div>`).join('')}
  <div class="tablewrap"><table class="grid"><thead><tr><th>Статья</th><th class="mono">Адрес</th>
    <th>Тег title</th><th></th></tr></thead><tbody>
  ${DB.articles.map(a => `<tr><td><a href="#/articles/${a.id}" class="rowlink">${esc(a.title)}</a></td>
    <td class="mono">/blogs/blog/${esc(a.permalink)}</td>
    <td style="color:${a.html_title ? 'inherit' : 'var(--ink-3)'}">${esc(a.html_title || 'из SEO-шаблона')}</td>
    <td><button class="btn sm danger" data-dela="${a.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>`;
V.blogs.bind = () => {
  $('#addart').onclick = () => go('#/articles/new');
  document.querySelectorAll('[data-dela]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить статью?', () => {
      DB.articles = DB.articles.filter(a => a.id !== +b.dataset.dela); save(); toast('Статья удалена'); render();
    }));
};

V.article = (id) => {
  const isNew = id === 'new';
  const a = isNew ? null : DB.articles.find(x => x.id === +id);
  if (!isNew && !a) return `<div class="empty"><h3>Статья не найдена</h3></div>`;
  const val = k => esc(a && a[k] != null ? a[k] : '');
  return backTo('#/blogs', 'Блог и статьи') + `
    <div class="page-head"><h1 class="title">${isNew ? 'Новая статья' : esc(a.title)}</h1>
      <span class="sp"></span><button class="btn primary" id="saveart">Сохранить</button></div>
    <div class="card"><div class="body">
      <div class="row"><label>Заголовок <span class="req">*</span></label><input type="text" id="a_title" value="${val('title')}"></div>
      <div class="row"><label>Пермалинк</label><input type="text" id="a_perm" value="${val('permalink')}"></div>
      <div class="row"><label>Текст</label><textarea id="a_content" style="min-height:220px">${val('content')}</textarea></div>
      <div class="row"><label>Тег title</label><input type="text" id="a_htitle" value="${val('html_title')}"></div>
      <div class="row"><label>Мета-тег description</label><textarea id="a_mdesc" style="min-height:70px">${val('meta_description')}</textarea></div>
    </div></div>`;
};
V.article.bind = (id) => {
  const isNew = id === 'new';
  if (!$('#saveart')) return;
  $('#saveart').onclick = () => {
    const t = $('#a_title').value.trim(); if (!t) { toast('Заполните заголовок'); return; }
    let a = isNew ? null : DB.articles.find(x => x.id === +id);
    if (!a) { a = { id: nextId(DB.articles), blog_id: DB.blogs[0].id, is_hidden: false }; DB.articles.push(a); }
    a.title = t; a.permalink = $('#a_perm').value.trim() || slugify(t);
    a.content = $('#a_content').value; a.html_title = $('#a_htitle').value || null;
    a.meta_description = $('#a_mdesc').value || null;
    save(); toast('Статья сохранена'); go('#/blogs');
  };
};

/* ---- commerce settings ---- */
V.delivery = () => head('Способы доставки', `<button class="btn primary" id="adddv">Добавить способ</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th>Тип</th>
    <th class="num">Стоимость</th><th class="num">Бесплатно от</th><th>Срок, дн.</th><th>Календарь</th><th></th>
  </tr></thead><tbody>
  ${DB.delivery_variants.map(d => `<tr><td><b>${esc(d.title)}</b>
    <div class="help">${esc(d.description || '')}</div></td>
    <td class="mono">${esc(d.type.replace('DeliveryVariant::', ''))}</td>
    <td class="num">${num(d.price) ? money(d.price) : 'по тарифу'}</td>
    <td class="num">${d.charge_up_to ? money(d.charge_up_to) : '—'}</td>
    <td>${esc(d.estimated_delivery_period)}</td>
    <td>${d.show_calendar_in_checkout ? 'да' : '—'}</td>
    <td><button class="btn sm danger" data-deldv="${d.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>`;
V.delivery.bind = () => {
  $('#adddv').onclick = () => {
    const t = prompt('Название способа доставки'); if (!t) return;
    DB.delivery_variants.push({ id: nextId(DB.delivery_variants), title: t,
      type: 'DeliveryVariant::Fixed', price: '0.0', description: '',
      position: DB.delivery_variants.length + 1, min_order_sum: '0.0', charge_up_to: null,
      show_zip_code: true, show_calendar_in_checkout: false, delivery_date_required: false,
      forbid_weekends: false, show_time_intervals_in_checkout: false, estimated_delivery_period: '1' });
    save(); toast('Способ доставки добавлен'); render();
  };
  document.querySelectorAll('[data-deldv]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить способ доставки?', () => {
      DB.delivery_variants = DB.delivery_variants.filter(d => d.id !== +b.dataset.deldv);
      save(); toast('Удалено'); render();
    }));
};

V.payments = () => head('Способы оплаты', `<button class="btn primary" id="addpg">Добавить способ</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th>Тип</th>
    <th>Физлица</th><th>Юрлица</th><th class="num">Комиссия</th><th></th></tr></thead><tbody>
  ${DB.payment_gateways.map(p => `<tr><td><b>${esc(p.title)}</b>
    <div class="help">${esc(p.description || '')}</div></td>
    <td class="mono">${esc(p.type.replace('PaymentGateway::', ''))}</td>
    <td>${p.available_for_individual_clients ? 'да' : '—'}</td>
    <td>${p.available_for_juridical_clients ? 'да' : '—'}</td>
    <td class="num">${num(p.margin)}%</td>
    <td><button class="btn sm danger" data-delpg2="${p.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="notice">Онлайн-касса и фискализация по 54-ФЗ в этой копии не реализованы. В InSales это отдельный
  платный блок — при переносе магазина его надо либо воспроизвести сторонним сервисом, либо исключить из объёма услуги.</div>`;
V.payments.bind = () => {
  $('#addpg').onclick = () => {
    const t = prompt('Название способа оплаты'); if (!t) return;
    DB.payment_gateways.push({ id: nextId(DB.payment_gateways), title: t,
      type: 'PaymentGateway::Cash', description: '', position: DB.payment_gateways.length + 1,
      margin: '0.0', available_for_individual_clients: true, available_for_juridical_clients: false });
    save(); toast('Способ оплаты добавлен'); render();
  };
  document.querySelectorAll('[data-delpg2]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить способ оплаты?', () => {
      DB.payment_gateways = DB.payment_gateways.filter(p => p.id !== +b.dataset.delpg2);
      save(); toast('Удалено'); render();
    }));
};

V.discounts = () => head('Скидки', `<button class="btn primary" id="adddisc">Добавить скидку</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th>Тип</th>
    <th class="num">Значение</th><th class="mono">Купон</th><th>Активна</th><th></th></tr></thead><tbody>
  ${DB.discounts.map(d => `<tr><td>${esc(d.title)}</td>
    <td>${d.kind === 'percent' ? 'процент' : d.kind === 'delivery' ? 'доставка' : 'сумма'}</td>
    <td class="num">${d.kind === 'percent' ? num(d.value) + '%' : money(d.value)}</td>
    <td class="mono">${esc(d.code || '—')}</td>
    <td><input type="checkbox" ${d.active ? 'checked' : ''} data-dact="${d.id}"></td>
    <td><button class="btn sm danger" data-deld="${d.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>`;
V.discounts.bind = () => {
  $('#adddisc').onclick = () => {
    const t = prompt('Название скидки'); if (!t) return;
    const v = prompt('Размер скидки в процентах', '5');
    DB.discounts.push({ id: nextId(DB.discounts), title: t, kind: 'percent',
      value: String(num(v)), code: '', active: true });
    save(); toast('Скидка добавлена'); render();
  };
  document.querySelectorAll('[data-dact]').forEach(cb => cb.onchange = () => {
    DB.discounts.find(d => d.id === +cb.dataset.dact).active = cb.checked; save(); toast('Сохранено');
  });
  document.querySelectorAll('[data-deld]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить скидку?', () => {
      DB.discounts = DB.discounts.filter(d => d.id !== +b.dataset.deld); save(); toast('Удалено'); render();
    }));
};

/* ---- site data ---- */
V.branding = () => {
  const b = DB.branding;
  return head('Данные сайта') + `
    <div class="card"><h3>Основное</h3><div class="body">
      <div class="row"><label>Название магазина</label><input type="text" id="b_title" value="${esc(DB.account.title)}"></div>
      <div class="row"><label>Слоган</label><input type="text" id="b_tag" value="${esc(b.tagline)}"></div>
      <div class="row"><label>Краткое описание</label><textarea id="b_short" style="min-height:60px">${esc(b.short_description)}</textarea></div>
      <div class="row"><label>Режим витрины</label><div>
        <label class="check"><input type="radio" name="mode" value="products" ${b.mode === 'products' ? 'checked' : ''}> Товары</label>
        <label class="check"><input type="radio" name="mode" value="services" ${b.mode === 'services' ? 'checked' : ''}> Услуги</label>
        <label class="check"><input type="checkbox" id="b_buy" ${b.buy_enabled ? 'checked' : ''}> Кнопка «Купить»</label>
        <label class="check"><input type="checkbox" id="b_quick" ${b.quick_checkout_product_enabled ? 'checked' : ''}> Заказ в один клик</label>
      </div></div>
    </div></div>
    <div class="card"><h3>Контакты</h3><div class="body">
      <div class="row"><label>Телефон</label><input type="tel" id="b_phone" value="${esc(b.account_contact_phone)}"></div>
      <div class="row"><label>Дополнительный телефон</label><input type="tel" id="b_phone2" value="${esc(b.account_contact_phone2)}"></div>
      <div class="row"><label>Почта</label><input type="email" id="b_email" value="${esc(b.account_email)}"></div>
      <div class="row"><label>Адрес</label><input type="text" id="b_addr" value="${esc(b.address)}"></div>
      <div class="row"><label>Как пройти</label><input type="text" id="b_addrd" value="${esc(b.address_description)}"></div>
    </div></div>
    <div class="card"><h3>Наличие и публикация</h3><div class="body">
      <label class="check"><input type="checkbox" id="b_forbid" ${b.forbid_over_stock ? 'checked' : ''}> Запретить заказывать больше, чем есть в наличии</label>
      <label class="check"><input type="checkbox" id="b_hide" ${b.hide_items_out_of_stock ? 'checked' : ''}> Не показывать товар, если у него нулевой остаток</label>
      <label class="check"><input type="checkbox" id="b_pub" ${!b.published ? 'checked' : ''}> Сайт не опубликован</label>
    </div></div>
    <div class="formfoot"><button class="btn primary" id="savebrand">Сохранить</button></div>`;
};
V.branding.bind = () => {
  $('#savebrand').onclick = () => {
    const b = DB.branding;
    DB.account.title = $('#b_title').value;
    b.tagline = $('#b_tag').value; b.short_description = $('#b_short').value;
    b.mode = document.querySelector('[name=mode]:checked').value;
    b.buy_enabled = $('#b_buy').checked; b.quick_checkout_product_enabled = $('#b_quick').checked;
    b.account_contact_phone = $('#b_phone').value; b.account_contact_phone2 = $('#b_phone2').value;
    b.account_email = $('#b_email').value; b.address = $('#b_addr').value;
    b.address_description = $('#b_addrd').value;
    b.forbid_over_stock = $('#b_forbid').checked; b.hide_items_out_of_stock = $('#b_hide').checked;
    b.published = !$('#b_pub').checked;
    save(); toast('Данные сайта сохранены'); render();
  };
};

V.domains = () => head('Домены', `<button class="btn primary" id="adddom">Добавить домен</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Домен</th><th>Основной</th><th>SSL</th><th></th>
  </tr></thead><tbody>${DB.domains.map(d => `<tr><td class="mono">${esc(d.name)}</td>
    <td>${d.is_main ? 'да' : '—'}</td><td>${d.ssl ? 'выпущен' : '—'}</td>
    <td><button class="btn sm danger" data-deldom="${d.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>`;
V.domains.bind = () => {
  $('#adddom').onclick = () => {
    const n = prompt('Домен, например shop.ru'); if (!n) return;
    DB.domains.push({ id: nextId(DB.domains), name: n, is_main: false, ssl: false });
    save(); toast('Домен добавлен'); render();
  };
  document.querySelectorAll('[data-deldom]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить домен?', () => {
      DB.domains = DB.domains.filter(d => d.id !== +b.dataset.deldom); save(); toast('Удалено'); render();
    }));
};

V.codes = () => head('Счётчики и коды') + `
  <div class="card"><div class="body">
    <div class="row"><label>Яндекс.Метрика</label><input type="text" id="k_ym" value="${esc(DB.codes.yandex_metrika)}" placeholder="Номер счётчика"></div>
    <div class="row"><label>Google Analytics</label><input type="text" id="k_ga" value="${esc(DB.codes.google_analytics)}" placeholder="G-XXXXXXX"></div>
    <div class="row"><label>Код в &lt;head&gt;</label><textarea class="code" id="k_head">${esc(DB.codes.head_code)}</textarea></div>
    <div class="row"><label>Код перед &lt;/body&gt;</label><textarea class="code" id="k_body">${esc(DB.codes.body_code)}</textarea></div>
  </div></div>
  <div class="formfoot"><button class="btn primary" id="savecodes">Сохранить</button></div>`;
V.codes.bind = () => {
  $('#savecodes').onclick = () => {
    DB.codes = { yandex_metrika: $('#k_ym').value, google_analytics: $('#k_ga').value,
      head_code: $('#k_head').value, body_code: $('#k_body').value };
    save(); toast('Счётчики сохранены');
  };
};

/* ---- settings hub ---- */
const SETTINGS_GROUPS = [
  ['Настройки магазина', [['Карточка магазина', '#/account'], ['Домены', '#/domains'],
    ['Налоги', '#/stub/Налоги'], ['Страны', '#/stub/Страны'], ['Языки', '#/stub/Языки'],
    ['Валюты', '#/stub/Валюты'], ['Мультисклад', '#/stub/Мультисклад'],
    ['Пользователи', '#/stub/Пользователи'], ['История запросов', '#/stub/История запросов']]],
  ['Оформление заказа', [['Оплата', '#/payments'], ['Доставка', '#/delivery'],
    ['Оформление заказа', '#/checkout'], ['Пользовательские статусы', '#/statuses'],
    ['Заказ в один клик', '#/stub/Заказ в один клик'], ['Поля форм', '#/fields']]],
  ['Настройки сайта', [['Шаблоны писем', '#/stub/Шаблоны писем'], ['Редиректы', '#/redirects'],
    ['Robots.txt', '#/robots'], ['SEO', '#/seo'], ['Системные сниппеты', '#/stub/Системные сниппеты'],
    ['Виджеты', '#/stub/Виджеты']]],
  ['Настройки товаров', [['Опции', '#/options'], ['Свойства вариантов', '#/stub/Свойства вариантов'],
    ['Дополнительные поля', '#/fields'], ['Типы цен', '#/stub/Типы цен']]],
];
V.settings = () => head('Настройки') + SETTINGS_GROUPS.map(([g, items]) =>
  `<div class="card"><h3>${esc(g)}</h3><div class="body" style="display:flex;flex-wrap:wrap;gap:10px 26px">
    ${items.map(([t, r]) => `<a href="${r}">${esc(t)}</a>`).join('')}</div></div>`).join('');

V.account = () => head('Карточка магазина') + `
  <div class="card"><div class="body">
    <div class="row"><label>Название</label><input type="text" id="ac_title" value="${esc(DB.account.title)}"></div>
    <div class="row"><label>Организация</label><input type="text" id="ac_org" value="${esc(DB.account.organization)}"></div>
    <div class="row"><label>Почта для уведомлений</label><input type="email" id="ac_email" value="${esc(DB.account.notification_email)}"></div>
    <div class="row"><label>Телефон</label><input type="tel" id="ac_phone" value="${esc(DB.account.contact_phone)}"></div>
    <div class="row"><label>Город</label><input type="text" id="ac_city" value="${esc(DB.account.city)}"></div>
    <div class="row"><label>Часовой пояс</label><input type="text" id="ac_tz" value="${esc(DB.account.time_zone)}"></div>
    <div class="row"><label>Номер следующего заказа</label><input type="number" id="ac_next" value="${DB.account.next_order_number}"></div>
    <div class="row"><label>Минимальная сумма заказа</label><input type="number" id="ac_min" value="${num(DB.account.minimum_items_price)}"></div>
  </div></div>
  <div class="formfoot"><button class="btn primary" id="saveacc">Сохранить</button></div>`;
V.account.bind = () => {
  $('#saveacc').onclick = () => {
    const a = DB.account;
    a.title = $('#ac_title').value; a.organization = $('#ac_org').value;
    a.notification_email = $('#ac_email').value; a.contact_phone = $('#ac_phone').value;
    a.city = $('#ac_city').value; a.time_zone = $('#ac_tz').value;
    a.next_order_number = Math.round(num($('#ac_next').value));
    a.minimum_items_price = String(num($('#ac_min').value));
    save(); toast('Карточка магазина сохранена'); render();
  };
};

V.seo = () => {
  const s = DB.seo_templates;
  const f = (id, label, v, hint) => `<div class="row"><label>${label}</label><div>
    <textarea id="${id}" style="min-height:56px">${esc(v)}</textarea>
    ${hint ? `<div class="help">${hint}</div>` : ''}</div></div>`;
  return head('SEO') + `
    <div class="notice info">Поддерживается язык Liquid. Доступны переменные <code>account</code>,
      <code>product</code>, <code>collection</code> — например <code>{{ account.title }}</code>.
      Шаблон применяется к страницам, у которых не заполнены собственные мета-теги.</div>
    <div class="card"><h3>SEO-шаблоны главной страницы</h3><div class="body">
      ${f('s_it', 'Тег title', s.index_title)}
      ${f('s_id', 'Мета-тег description', s.index_description)}</div></div>
    <div class="card"><h3>SEO-шаблоны страниц товаров</h3><div class="body">
      ${f('s_pt', 'Тег title', s.product_title)}
      ${f('s_pd', 'Мета-тег description', s.product_description)}</div></div>
    <div class="card"><h3>SEO-шаблоны страниц категорий</h3><div class="body">
      ${f('s_ct', 'Тег title', s.collection_title)}
      ${f('s_cd', 'Мета-тег description', s.collection_description)}</div></div>
    <div class="card"><h3>Адреса</h3><div class="body">
      <label class="check"><input type="checkbox" id="s_short" ${s.short_urls ? 'checked' : ''}>
        Использовать короткие URL, канонический URL задан в карточке товара</label></div></div>
    <div class="formfoot"><button class="btn primary" id="saveseo">Сохранить</button>
      <span class="sp"></span><button class="btn" id="previewseo">Показать, что получится</button></div>`;
};
V.seo.bind = () => {
  $('#saveseo').onclick = () => {
    const s = DB.seo_templates;
    s.index_title = $('#s_it').value; s.index_description = $('#s_id').value;
    s.product_title = $('#s_pt').value; s.product_description = $('#s_pd').value;
    s.collection_title = $('#s_ct').value; s.collection_description = $('#s_cd').value;
    s.short_urls = $('#s_short').checked;
    save(); toast('SEO-шаблоны сохранены');
  };
  $('#previewseo').onclick = () => {
    const p = DB.products[0] || { title: 'Товар' };
    const ctx = { 'account.title': DB.account.title, 'product.title': p.title,
      'product.sku': firstVariant(p).sku || '', 'collection.title': (DB.collections[1] || {}).title || '' };
    const apply = t => String(t).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => ctx[k] != null ? ctx[k] : m);
    const root = $('#modalroot');
    root.innerHTML = `<div class="modal-bg"><div class="modal"><h3>Что увидит поисковик</h3>
      <div class="body"><dl class="kv">
        <dt>Главная, title</dt><dd>${esc(apply($('#s_it').value))}</dd>
        <dt>Главная, description</dt><dd>${esc(apply($('#s_id').value))}</dd>
        <dt>Товар, title</dt><dd>${esc(apply($('#s_pt').value))}</dd>
        <dt>Товар, description</dt><dd>${esc(apply($('#s_pd').value))}</dd>
        <dt>Категория, title</dt><dd>${esc(apply($('#s_ct').value))}</dd>
      </dl></div><div class="foot"><button class="btn primary" data-no>Закрыть</button></div></div></div>`;
    $('[data-no]', root).onclick = () => (root.innerHTML = '');
  };
};

V.robots = () => head('Robots.txt') + `
  <div class="notice">На неопубликованном магазине InSales держит здесь <code>Disallow: /</code>.
    При переносе эту заглушку легко утащить на боевой сайт и закрыть его от индексации целиком.</div>
  <div class="card"><h3>Содержимое файла robots.txt</h3><div class="body">
    <textarea class="code" id="rb" style="min-height:260px">${esc(DB.robots)}</textarea></div></div>
  <div class="formfoot"><button class="btn primary" id="saverobots">Сохранить</button>
    <span class="sp"></span><button class="btn" id="dlrobots">Скачать файл</button></div>`;
V.robots.bind = () => {
  $('#saverobots').onclick = () => { DB.robots = $('#rb').value; save(); toast('robots.txt сохранён'); };
  $('#dlrobots').onclick = () => download('robots.txt', $('#rb').value, 'text/plain');
};

V.redirects = () => head('Редиректы', `<button class="btn primary" id="addrd">Добавить</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th class="mono">Откуда</th>
    <th class="mono">Куда</th><th>Код</th><th></th></tr></thead><tbody>
  ${DB.redirects.length ? DB.redirects.map(r => `<tr><td class="mono">${esc(r.from)}</td>
    <td class="mono">${esc(r.to)}</td><td>${r.code}</td>
    <td><button class="btn sm danger" data-delrd="${r.id}">Удалить</button></td></tr>`).join('')
    : `<tr><td colspan="4"><div class="empty"><h3>Редиректов нет</h3>
       <p>Нет результатов по заданным критериям.</p></div></td></tr>`}
  </tbody></table></div>
  <div class="formfoot"><button class="btn" id="rdcsv">Выгрузить в CSV</button>
    <span class="help">Список копится годами и при переносе теряется молча — выгружайте его первым.</span></div>`;
V.redirects.bind = () => {
  $('#addrd').onclick = () => {
    const f = prompt('Откуда, например /old-page'); if (!f) return;
    const t = prompt('Куда, например /collection/catalog'); if (!t) return;
    DB.redirects.push({ id: nextId(DB.redirects), from: f, to: t, code: 301 });
    save(); toast('Редирект добавлен'); render();
  };
  $('#rdcsv').onclick = () => exportCsv('redirects.csv', ['Откуда', 'Куда', 'Код'],
    DB.redirects.map(r => [r.from, r.to, r.code]));
  document.querySelectorAll('[data-delrd]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить редирект?', () => {
      DB.redirects = DB.redirects.filter(r => r.id !== +b.dataset.delrd); save(); toast('Удалено'); render();
    }));
};

V.statuses = () => head('Пользовательские статусы') + `
  <div class="notice info">В InSales эти восемь статусов редактирует сам клиент. Поэтому в копии
    список статусов должен быть настраиваемым, а не захардкоженным в коде.</div>
  <div class="tablewrap"><table class="grid"><thead><tr><th>Статус</th><th class="mono">Ключ</th>
    <th>По умолчанию</th><th class="num">Заказов</th></tr></thead><tbody>
  ${STATUSES.map(s => `<tr><td><span class="pill ${PILL[s.key]}">${esc(s.title)}</span></td>
    <td class="mono">${esc(s.key)}</td><td>${s.is_default ? 'да' : '—'}</td>
    <td class="num">${DB.orders.filter(o => o.custom_status === s.key).length}</td></tr>`).join('')}
  </tbody></table></div>`;

V.checkout = () => {
  const c = DB.checkout;
  const cb = (id, k, t) => `<label class="check"><input type="checkbox" id="${id}" ${c[k] ? 'checked' : ''}> ${t}</label>`;
  return head('Оформление заказа') + `
    <div class="card"><h3>Доставка на сайте</h3><div class="body">
      ${cb('ch_del', 'delivery_enabled', 'Включить доставку на сайте')}
      <div class="row" style="grid-template-columns:1fr;margin-top:10px"><label>Режим по умолчанию</label><div>
        <label class="check"><input type="radio" name="chmode" value="pickup" ${c.mode === 'pickup' ? 'checked' : ''}> Самовывоз</label>
        <label class="check"><input type="radio" name="chmode" value="delivery" ${c.mode === 'delivery' ? 'checked' : ''}> Доставка</label></div></div>
      ${cb('ch_geo', 'geo_by_location', 'Определять город по геолокации')}
      ${cb('ch_ip', 'geo_by_ip', 'Определять город по IP-адресу')}
      ${cb('ch_flags', 'tariff_flags', 'Включить статусы «быстро» и «дёшево» для тарифов доставки')}
      ${cb('ch_compact', 'compact_tariffs', 'Использовать компактный вывод тарифов доставки')}
    </div></div>
    <div class="card"><h3>Форма заказа</h3><div class="body">
      <div class="row" style="grid-template-columns:1fr"><label>Вид формы</label><div>
        <label class="check"><input type="radio" name="chlay" value="stepped" ${c.layout === 'stepped' ? 'checked' : ''}> Пошаговый</label>
        <label class="check"><input type="radio" name="chlay" value="single" ${c.layout === 'single' ? 'checked' : ''}> Одностраничный</label></div></div>
      <div class="row" style="grid-template-columns:1fr"><label>Согласие на обработку персональных данных</label>
        <select id="ch_consent">
          <option value="text" ${c.consent === 'text' ? 'selected' : ''}>Стандартный текст</option>
          <option value="checkbox" ${c.consent === 'checkbox' ? 'selected' : ''}>Чекбокс и стандартный текст</option>
          <option value="none" ${c.consent === 'none' ? 'selected' : ''}>Не отображать</option>
        </select></div>
      ${cb('ch_bot', 'antibot', 'Включить защиту от автоматического оформления заказов')}
      ${cb('ch_com', 'allow_comment', 'Разрешить оставлять комментарий к заказу')}
      ${cb('ch_st', 'show_custom_statuses', 'Показывать клиенту пользовательские статусы')}
      ${cb('ch_min', 'min_order_sum_enabled', 'Минимальная сумма заказа')}
      <div class="row"><label>Сумма, ₽</label><input type="number" id="ch_minv" value="${num(c.min_order_sum)}"></div>
    </div></div>
    <div class="formfoot"><button class="btn primary" id="savech">Сохранить</button></div>`;
};
V.checkout.bind = () => {
  $('#savech').onclick = () => {
    const c = DB.checkout;
    c.delivery_enabled = $('#ch_del').checked;
    c.mode = document.querySelector('[name=chmode]:checked').value;
    c.geo_by_location = $('#ch_geo').checked; c.geo_by_ip = $('#ch_ip').checked;
    c.tariff_flags = $('#ch_flags').checked; c.compact_tariffs = $('#ch_compact').checked;
    c.layout = document.querySelector('[name=chlay]:checked').value;
    c.consent = $('#ch_consent').value; c.antibot = $('#ch_bot').checked;
    c.allow_comment = $('#ch_com').checked; c.show_custom_statuses = $('#ch_st').checked;
    c.min_order_sum_enabled = $('#ch_min').checked; c.min_order_sum = String(num($('#ch_minv').value));
    save(); toast('Настройки оформления сохранены');
  };
};

V.fields = () => head('Поля форм') + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th class="mono">Handle</th>
    <th>Назначение</th><th>Тип</th><th>Обязательное</th><th>В чекауте</th></tr></thead><tbody>
  ${DB.fields.map(f => `<tr><td>${esc(f.title)}</td><td class="mono">${esc(f.handle)}</td>
    <td>${esc({ client: 'клиент', address: 'адрес', order: 'заказ' }[f.destiny] || f.destiny)}</td>
    <td class="mono">${esc(f.type)}</td><td>${f.obligatory ? 'да' : '—'}</td>
    <td>${f.show_in_checkout ? 'да' : '—'}</td></tr>`).join('')}
  </tbody></table></div>`;

V.options = () => head('Опции товаров') + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th class="mono">Пермалинк</th>
    <th>В фильтрах</th><th class="num">Позиция</th></tr></thead><tbody>
  ${DB.option_names.map(o => `<tr><td>${esc(o.title)}</td><td class="mono">${esc(o.permalink)}</td>
    <td>${o.navigational ? 'да' : '—'}</td><td class="num">${o.position}</td></tr>`).join('')}
  </tbody></table></div>`;

V.import = () => head('Импорт и экспорт') + `
  <div class="cols">
    <div class="card"><h3>Экспорт</h3><div class="body">
      <p class="help">Выгрузка каталога в CSV — та же структура, что отдаёт <code>/admin/products.json</code>.</p>
      <button class="btn primary" id="expprod">Выгрузить товары</button>
      <button class="btn" id="expall" style="margin-left:8px">Выгрузить всё в JSON</button>
    </div></div>
    <div class="card"><h3>Импорт</h3><div class="body">
      <p class="help">Загрузите JSON, полученный при выгрузке. Текущие данные будут заменены.</p>
      <input type="file" id="impfile" accept="application/json">
    </div></div>
  </div>
  <div class="card"><h3>Что забирается у клиента при переносе</h3><div class="body">
    <p>Проверенные эндпоинты InSales API, отвечающие по сессии администратора:</p>
    <div class="tablewrap"><table class="grid"><thead><tr><th class="mono">Эндпоинт</th><th class="num">Полей</th><th>Что даёт</th></tr></thead><tbody>
      ${[['/admin/products.json', 35, 'товары с вариантами и картинками'],
         ['/admin/products/{id}/variants.json', 26, 'цены, себестоимость, остатки, штрихкоды'],
         ['/admin/collections.json', 19, 'категории витрины с SEO-полями'],
         ['/admin/orders.json', 59, 'заказы, позиции, адреса, источник трафика'],
         ['/admin/clients.json', 29, 'клиенты и адреса'],
         ['/admin/account.json', 32, 'настройки магазина'],
         ['/admin/fields.json', 19, 'поля формы заказа'],
         ['/admin/delivery_variants.json', 24, 'способы доставки'],
         ['/admin/payment_gateways.json', 11, 'способы оплаты'],
         ['/admin/themes/{id}/assets/{asset}.json', null, 'исходники Liquid-шаблонов']]
        .map(([e, n, d]) => `<tr><td class="mono">${esc(e)}</td><td class="num">${n || '—'}</td><td>${esc(d)}</td></tr>`).join('')}
    </tbody></table></div>
  </div></div>`;
V.import.bind = () => {
  $('#expprod').onclick = () => exportCsv('products.csv',
    ['Артикул', 'Название', 'Цена', 'Старая цена', 'Себестоимость', 'Остаток', 'Штрихкод', 'Вес', 'Пермалинк', 'Title', 'Description'],
    DB.products.map(p => { const v = firstVariant(p);
      return [v.sku, p.title, v.price, v.old_price, v.cost_price, v.quantity, v.barcode, v.weight,
        p.permalink, p.html_title, p.meta_description]; }));
  $('#expall').onclick = () => download('shop-export.json', JSON.stringify(DB, null, 2), 'application/json');
  $('#impfile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { DB = JSON.parse(r.result); save(); toast('Данные загружены'); render(); }
      catch (err) { toast('Не удалось прочитать файл'); }
    };
    r.readAsText(f);
  };
};

V.invoices = () => head('Услуги и оплата') + `
  <div class="notice">Пробный период заканчивается через 7 дней. В оригинальной админке здесь выбор тарифа
    и оплата. В копии этот блок не нужен — она и существует ради того, чтобы абонентской платы не было.</div>
  <div class="card"><h3>Что заменяет тариф InSales</h3><div class="body"><dl class="kv">
    <dt>Хостинг</dt><dd>около 500 ₽ в месяц</dd>
    <dt>Домен</dt><dd>уже есть у клиента</dd>
    <dt>Перенос под ключ</dt><dd>48 000 ₽ единоразово</dd>
    <dt>Экономия за год</dt><dd>примерно 150 000 ₽</dd>
  </dl></div></div>`;

V.stub = (name) => head(decodeURIComponent(name || 'Раздел')) + `
  <div class="empty">
    <h3>Раздел не входит в объём переноса</h3>
    <p>Это часть платформы InSales, которую договорились не воспроизводить: аналитика, диалоги,
      маркетплейсы, продвижение. Из 53 пунктов меню к переносу относятся 15.</p>
    <a class="btn" href="report.html">Почему так решили</a>
  </div>`;

/* ---------------- export helpers ---------------- */
function download(name, text, mime) {
  const blob = new Blob(['﻿' + text], { type: (mime || 'text/plain') + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportCsv(name, headers, rows) {
  const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const csv = [headers.map(q).join(';')].concat(rows.map(r => r.map(q).join(';'))).join('\r\n');
  download(name, csv, 'text/csv');
  toast('Файл выгружен');
}

/* ---------------- router ---------------- */
const state = {};
const ROUTES = [
  [/^#\/home$/, 'home'], [/^#\/orders$/, 'orders'], [/^#\/orders\/(.+)$/, 'order'],
  [/^#\/products$/, 'products'], [/^#\/products\/(.+)$/, 'product'],
  [/^#\/prices$/, 'prices'], [/^#\/import$/, 'import'],
  [/^#\/clients$/, 'clients'], [/^#\/clients\/(.+)$/, 'client'],
  [/^#\/discounts$/, 'discounts'],
  [/^#\/pages$/, 'pages'], [/^#\/pages\/(.+)$/, 'page'],
  [/^#\/blogs$/, 'blogs'], [/^#\/articles\/(.+)$/, 'article'],
  [/^#\/delivery$/, 'delivery'], [/^#\/payments$/, 'payments'],
  [/^#\/branding$/, 'branding'], [/^#\/domains$/, 'domains'], [/^#\/codes$/, 'codes'],
  [/^#\/settings$/, 'settings'], [/^#\/account$/, 'account'],
  [/^#\/seo$/, 'seo'], [/^#\/robots$/, 'robots'], [/^#\/redirects$/, 'redirects'],
  [/^#\/statuses$/, 'statuses'], [/^#\/checkout$/, 'checkout'],
  [/^#\/fields$/, 'fields'], [/^#\/options$/, 'options'], [/^#\/invoices$/, 'invoices'],
  [/^#\/stub\/(.*)$/, 'stub'],
];

function render() {
  const hash = location.hash || '#/home';
  // фильтры живут в пределах одного раздела: при переходе сбрасываем,
  // иначе пользователь видит пустой список и не понимает почему
  const base = hash.split('/')[1] || 'home';
  if (state._base !== base) { state._base = base; state.f = {}; state.fopen = false; }
  let name = 'home', arg = null;
  for (const [re, n] of ROUTES) {
    const m = hash.match(re);
    if (m) { name = n; arg = m[1]; break; }
  }
  const view = V[name] || V.home;
  $('#view').innerHTML = view(arg);
  renderNav();
  if (view.bind) { try { view.bind(arg); } catch (e) { console.error(e); } }
  document.title = ($('#view h1') ? $('#view h1').textContent + ' — ' : '') + 'Мой магазин авто';
  window.scrollTo(0, 0);
}

/* ---------------- boot ---------------- */
window.addEventListener('hashchange', () => { render(); $('#side').classList.remove('open'); });
document.addEventListener('DOMContentLoaded', () => {
  $('#promoclose').onclick = () => $('#promo').remove();
  $('#collapse').onclick = () => {
    const on = document.body.classList.toggle('collapsed');
    localStorage.setItem('insales-clone-collapsed', on ? '1' : '');
  };
  if (localStorage.getItem('insales-clone-collapsed')) document.body.classList.add('collapsed');
  $('#burger').onclick = () => $('#side').classList.toggle('open');
  $('#reset').onclick = e => { e.preventDefault(); confirmDialog('Вернуть демонстрационные данные?', reset); };
  $('#globalsearch').onkeydown = e => {
    if (e.key === 'Enter') { state.pq = e.target.value; state.col = 'all'; go('#/products'); render(); }
  };
  if (!location.hash) location.hash = '#/home';
  render();
});

/* Разделы второго уровня: меню сайта, справочники, импорт, шаблоны.
   Состав и названия полей сняты с живой админки InSales. */
'use strict';

/* ---------- Меню сайта ---------- */
V.menus = () => {
  const cur = state.menu ? DB.menus.find(m => m.id === +state.menu) : DB.menus[0];
  const items = cur ? DB.menu_items.filter(i => i.menu_id === cur.id).sort((a, b) => a.position - b.position) : [];
  const unused = DB.pages.filter(p => !DB.menu_items.some(i => i.url === '/page/' + p.permalink));
  return head('Меню сайта', `<button class="btn" id="addmenu">Добавить меню</button>`) + `
    <div class="split">
      <div class="treecol"><div class="tree">
        ${DB.menus.map(m => `<a href="#" data-menu="${m.id}" class="${cur && cur.id === m.id ? 'active' : ''}">
          ${esc(m.name)} <span style="color:var(--ink-3)">${DB.menu_items.filter(i => i.menu_id === m.id).length}</span></a>`).join('')}
        <a href="#" style="color:var(--ink-3);cursor:default">Нет в навигации ${unused.length}</a>
      </div></div>
      <div>
        ${cur ? `
        <div class="card"><h3>${esc(cur.name)}</h3><div class="body">
          <div class="row"><label>Название</label><input type="text" id="mn_name" value="${esc(cur.name)}"></div>
          <div class="row"><label>Название в шаблоне</label>
            <input type="text" id="mn_handle" value="${esc(cur.handle)}">
            </div>
          <div class="formfoot"><button class="btn primary" id="mn_save">Сохранить</button>
            <button class="btn danger" id="mn_del">Удалить</button></div>
        </div></div>
        <div class="card"><h3>Пункты меню</h3><div class="tablewrap" style="border:0">
          <table class="grid"><thead><tr><th style="width:92px;white-space:nowrap">Порядок</th><th>Заголовок</th>
            <th class="mono">Ссылка</th><th></th></tr></thead><tbody>
          ${items.length ? items.map((i, idx) => `<tr>
            <td><button class="btn sm icon" data-up="${i.id}" ${idx === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn sm icon" data-down="${i.id}" ${idx === items.length - 1 ? 'disabled' : ''}>↓</button></td>
            <td><input type="text" data-it="${i.id}" value="${esc(i.title)}" style="max-width:280px"></td>
            <td class="mono"><input type="text" data-iu="${i.id}" value="${esc(i.url)}" style="max-width:280px"></td>
            <td><button class="btn sm danger" data-delit="${i.id}">Удалить</button></td></tr>`).join('')
            : `<tr><td colspan="4"><div class="empty"><h3>Пунктов нет</h3></div></td></tr>`}
          </tbody></table></div>
          <div class="body"><button class="btn" id="additem">Добавить пункт</button>
            <button class="btn primary" id="saveitems" style="margin-left:8px">Сохранить пункты</button></div>
        </div>
        ${unused.length ? `<div class="card"><h3>Нет в навигации</h3><div class="body">
          <p class="help">Страницы, которых нет ни в одном меню:</p>
          ${unused.map(p => `<div style="padding:5px 0;border-bottom:1px solid var(--line)">
            ${esc(p.title)} <span class="mono" style="color:var(--ink-3)">/page/${esc(p.permalink)}</span>
            <button class="btn sm" style="float:right" data-addpage="${p.id}">Добавить в меню</button></div>`).join('')}
        </div></div>` : ''}
        ` : `<div class="empty"><h3>Меню не создано</h3></div>`}
      </div></div>`;
};
V.menus.bind = () => {
  const cur = state.menu ? DB.menus.find(m => m.id === +state.menu) : DB.menus[0];
  document.querySelectorAll('[data-menu]').forEach(a => a.onclick = e => {
    e.preventDefault(); state.menu = a.dataset.menu; render();
  });
  $('#addmenu').onclick = () => {
    const n = prompt('Название меню'); if (!n) return;
    const m = { id: nextId(DB.menus), name: n, handle: slugify(n) || 'menu', used_in_theme: false };
    DB.menus.push(m); save(); state.menu = m.id; toast('Меню создано'); render();
  };
  if (!cur) return;
  $('#mn_save').onclick = () => {
    cur.name = $('#mn_name').value; cur.handle = $('#mn_handle').value;
    save(); toast('Меню сохранено'); render();
  };
  $('#mn_del').onclick = () => confirmDialog('Удалить меню вместе с пунктами?', () => {
    DB.menu_items = DB.menu_items.filter(i => i.menu_id !== cur.id);
    DB.menus = DB.menus.filter(m => m.id !== cur.id);
    state.menu = DB.menus[0] && DB.menus[0].id; save(); toast('Меню удалено'); render();
  });
  $('#additem').onclick = () => {
    const t = prompt('Заголовок пункта'); if (!t) return;
    const u = prompt('Ссылка', '/page/');
    const pos = DB.menu_items.filter(i => i.menu_id === cur.id).length + 1;
    DB.menu_items.push({ id: nextId(DB.menu_items), menu_id: cur.id, title: t, url: u || '/', position: pos });
    save(); toast('Пункт добавлен'); render();
  };
  $('#saveitems').onclick = () => {
    DB.menu_items.forEach(i => {
      const t = document.querySelector(`[data-it="${i.id}"]`); if (t) i.title = t.value;
      const u = document.querySelector(`[data-iu="${i.id}"]`); if (u) i.url = u.value;
    });
    save(); toast('Пункты сохранены'); render();
  };
  const swap = (id, dir) => {
    const list = DB.menu_items.filter(i => i.menu_id === cur.id).sort((a, b) => a.position - b.position);
    const i = list.findIndex(x => x.id === +id); const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const p = list[i].position; list[i].position = list[j].position; list[j].position = p;
    save(); render();
  };
  document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => swap(b.dataset.up, -1));
  document.querySelectorAll('[data-down]').forEach(b => b.onclick = () => swap(b.dataset.down, 1));
  document.querySelectorAll('[data-delit]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить пункт меню?', () => {
      DB.menu_items = DB.menu_items.filter(i => i.id !== +b.dataset.delit); save(); toast('Удалено'); render();
    }));
  document.querySelectorAll('[data-addpage]').forEach(b => b.onclick = () => {
    const p = DB.pages.find(x => x.id === +b.dataset.addpage);
    DB.menu_items.push({ id: nextId(DB.menu_items), menu_id: cur.id, title: p.title,
      url: '/page/' + p.permalink, position: DB.menu_items.filter(i => i.menu_id === cur.id).length + 1 });
    save(); toast('Добавлено в меню'); render();
  });
};

/* ---------- Импорт ---------- */
const YML_FLAGS = [
  ['names', 'Не обновлять названия товаров'], ['descr', 'Не обновлять описания товаров'],
  ['prices', 'Не обновлять цены товаров'], ['oldprices', 'Не обновлять старые цены товаров'],
  ['sku', 'Не обновлять артикул'], ['cats', 'Не обновлять категории товаров'],
  ['barcode', 'Не обновлять штрихкод'], ['dims', 'Не обновлять габариты товаров'],
  ['weight', 'Не обновлять вес'], ['images', 'Не обновлять картинки'],
  ['props', 'Не обновлять параметры'],
  ['zero', 'Обнулить остатки товарам, отсутствующим в файле импорта'],
  ['hide', 'Скрыть товары, отсутствующие в файле импорта'],
];
V.import = () => {
  const tab = state.imp || 'export';
  return head('Импорт и экспорт') + `
    <div class="tabs">
      ${[['export', 'Экспорт'], ['csv', 'Импорт из XLSX, XLS, CSV'], ['yml', 'Импорт из YML'], ['api', 'Что берём по API']]
        .map(([k, t]) => `<a href="#" data-imp="${k}" class="${tab === k ? 'active' : ''}">${t}</a>`).join('')}
    </div>
    ${tab === 'export' ? `
      <div class="card"><h3>Выгрузка каталога</h3><div class="body">
        <p class="help">Та же структура полей, что отдаёт <code>/admin/products.json</code>.</p>
        <button class="btn primary" id="expprod">Выгрузить товары в CSV</button>
        <button class="btn" id="expall" style="margin-left:8px">Выгрузить всё в JSON</button>
      </div></div>
      <div class="card"><h3>Загрузка ранее выгруженного</h3><div class="body">
        <p class="help">Текущие данные будут заменены содержимым файла.</p>
        <input type="file" id="impfile" accept="application/json"></div></div>` : ''}
    ${tab === 'csv' ? `
      <div class="card"><h3>Способ идентификации товара</h3><div class="body">
        ${[['first', 'Делаю импорт в первый раз', 'Рекомендуется при первоначальной загрузке. Импорт возможен только в категорию без товаров. Минимум настроек.'],
           ['title', 'Идентифицировать по наименованию', 'Используется при обновлении каталога. Товар ищется по наименованию категории и товара.'],
           ['sku', 'Идентифицировать по артикулу', 'Товар ищется по артикулу варианта. Самый надёжный способ обновления.'],
           ['id', 'Идентифицировать по ID', 'Товар ищется по внутреннему идентификатору InSales.']]
          .map(([k, t, d]) => `<label class="check" style="align-items:flex-start;margin-bottom:14px">
            <input type="radio" name="impstrat" value="${k}" ${k === 'sku' ? 'checked' : ''} style="margin-top:3px">
            <span><b>${t}</b><div class="help">${d}</div></span></label>`).join('')}
        <div class="row"><label>Файл</label><input type="file" accept=".csv,.xls,.xlsx"></div>
        <div class="help">Размер файла не должен превышать 80 Мб.</div>
      </div></div>
      <div class="formfoot"><button class="btn primary" id="runimp">Начать импорт</button></div>` : ''}
    ${tab === 'yml' ? `
      <div class="card"><h3>Импорт из YML</h3><div class="body">
        <div class="row"><label>Файл</label><div><input type="file" accept=".yml,.xml">
          <div class="help">Размер файла не должен превышать 80 Мб.</div></div></div>
        <div class="row"><label>URL, откуда будет браться файл</label>
          <div><input type="text" placeholder="https://example.ru/price.yml">
          <div class="help">Вместо загрузки файла можно указать ссылку на него.</div></div></div>
      </div></div>
      <div class="card"><h3>Что не трогать при обновлении</h3><div class="body">
        ${YML_FLAGS.map(([k, t]) => `<label class="check"><input type="checkbox" data-yml="${k}"> ${t}</label>`).join('')}
      </div></div>
      <div class="formfoot"><button class="btn primary" id="runimp2">Начать импорт</button></div>` : ''}
    ${tab === 'api' ? `
      <div class="card"><h3>Проверенные эндпоинты InSales API</h3><div class="body">
      <p class="help">Отвечают по сессии администратора. Полей — из реальных ответов живого магазина.</p>
      <div class="tablewrap"><table class="grid"><thead><tr><th class="mono">Эндпоинт</th>
        <th class="num">Полей</th><th>Что даёт</th></tr></thead><tbody>
      ${[['/admin/products.json', 35, 'товары с вариантами и картинками'],
         ['/admin/products/{id}/variants.json', 26, 'цены, себестоимость, остатки, штрихкоды'],
         ['/admin/collections.json', 19, 'категории витрины с SEO-полями'],
         ['/admin/categories.json', 6, 'категории товарного учёта'],
         ['/admin/orders.json', 59, 'заказы, позиции, адреса, источник трафика'],
         ['/admin/clients.json', 29, 'клиенты и адреса'],
         ['/admin/account.json', 32, 'настройки магазина'],
         ['/admin/menus.json', 4, 'меню сайта'],
         ['/admin/pages.json', null, 'страницы'],
         ['/admin/blogs.json', 12, 'блог и статьи'],
         ['/admin/fields.json', 19, 'поля формы заказа'],
         ['/admin/option_names.json', 6, 'опции товаров'],
         ['/admin/properties.json', 7, 'свойства товаров'],
         ['/admin/delivery_variants.json', 24, 'способы доставки'],
         ['/admin/payment_gateways.json', 11, 'способы оплаты'],
         ['/admin/themes/{id}/assets.json', null, 'список файлов темы'],
         ['/admin/themes/{id}/assets/{asset}.json', null, 'исходник Liquid-шаблона']]
        .map(([e, n, d]) => `<tr><td class="mono">${esc(e)}</td><td class="num">${n || '—'}</td>
          <td>${esc(d)}</td></tr>`).join('')}
      </tbody></table></div></div></div>` : ''}`;
};
V.import.bind = () => {
  document.querySelectorAll('[data-imp]').forEach(a => a.onclick = e => {
    e.preventDefault(); state.imp = a.dataset.imp; render();
  });
  if ($('#expprod')) $('#expprod').onclick = () => exportCsv('products.csv',
    ['Артикул', 'Название', 'Цена', 'Старая цена', 'Себестоимость', 'Остаток', 'Штрихкод', 'Вес', 'Пермалинк', 'Title', 'Description'],
    DB.products.map(p => { const v = firstVariant(p);
      return [v.sku, p.title, v.price, v.old_price, v.cost_price, v.quantity, v.barcode, v.weight,
        p.permalink, p.html_title, p.meta_description]; }));
  if ($('#expall')) $('#expall').onclick = () => download('shop-export.json', JSON.stringify(DB, null, 2), 'application/json');
  if ($('#impfile')) $('#impfile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { DB = JSON.parse(r.result); save(); toast('Данные загружены'); render(); }
      catch (err) { toast('Не удалось прочитать файл'); } };
    r.readAsText(f);
  };
  ['#runimp', '#runimp2'].forEach(s => { if ($(s)) $(s).onclick = () =>
    toast('Разбор файла требует серверной части — в демо-версии не активен'); });
};

/* ---------- простые справочники ---------- */
function simpleTable(title, cols, rows, opts) {
  opts = opts || {};
  return head(title, opts.action || '') +
    (opts.note ? `<div class="notice${opts.info ? ' info' : ''}">${opts.note}</div>` : '') +
    `<div class="tablewrap"><table class="grid"><thead><tr>${cols.map(c =>
      `<th${c.num ? ' class="num"' : ''}>${esc(c.t)}</th>`).join('')}</tr></thead><tbody>
    ${rows.length ? rows.map(r => `<tr>${r.map((c, i) =>
      `<td${cols[i] && cols[i].num ? ' class="num"' : ''}${cols[i] && cols[i].mono ? ' class="mono"' : ''}>${c}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${cols.length}"><div class="empty"><h3>${esc(opts.empty || 'Нет данных для отображения')}</h3></div></td></tr>`}
    </tbody></table></div>`;
}
const yn = v => v ? 'Да' : 'Нет';

V.warehouses = () => simpleTable('Мультисклад',
  [{ t: 'Название' }, { t: 'Регион' }, { t: '' }],
  DB.warehouses.map(w => [esc(w.title), esc(w.region), `<button class="btn sm danger" data-delw="${w.id}">Удалить</button>`]),
  { action: `<button class="btn primary" id="addwh">Добавить склад</button>`,
    note: 'Создавайте склады для более удобного учёта. Максимальное число складов: 12. ' +
          'При удалении всех складов, кроме последнего, остатки с них исчезают. ' +
          'Нельзя удалить склад, к которому привязаны заказы.' });
V.warehouses.bind = () => {
  $('#addwh').onclick = () => {
    if (DB.warehouses.length >= 12) return toast('Достигнут максимум: 12 складов');
    const t = prompt('Название склада'); if (!t) return;
    DB.warehouses.push({ id: nextId(DB.warehouses), title: t, region: 'Любой', position: DB.warehouses.length + 1 });
    save(); toast('Склад добавлен'); render();
  };
  document.querySelectorAll('[data-delw]').forEach(b => b.onclick = () => {
    if (DB.warehouses.length === 1) return toast('Нельзя удалить последний склад');
    confirmDialog('Удалить склад? Остатки с него исчезнут.', () => {
      DB.warehouses = DB.warehouses.filter(w => w.id !== +b.dataset.delw); save(); toast('Удалено'); render();
    });
  });
};

V.price_kinds = () => simpleTable('Типы цен',
  [{ t: 'Название' }, { t: 'Название в шаблоне', mono: true }, { t: 'Правила' }, { t: 'Показывать в списках' }],
  DB.price_kinds.map(p => [esc(p.title), esc(p.handle), esc(p.rules), yn(p.show_in_lists)]),
  { action: `<button class="btn primary" id="addpk">Добавить</button>` });
V.price_kinds.bind = () => {
  $('#addpk').onclick = () => {
    const t = prompt('Название типа цены'); if (!t) return;
    DB.price_kinds.push({ id: nextId(DB.price_kinds), title: t, handle: slugify(t),
      rules: 'ручная', show_in_lists: true });
    save(); toast('Тип цены добавлен'); render();
  };
};

V.product_fields = () => {
  const block = (key, label, note) => {
    const rows = DB.product_fields[key] || [];
    return `<div class="card"><h3>${esc(label)}</h3>
      ${note ? `<div class="body" style="padding-bottom:0"><div class="help">${esc(note)}</div></div>` : ''}
      <div class="tablewrap" style="border:0"><table class="grid"><thead><tr>
        <th>Название</th><th class="mono">Пермалинк</th><th>Тип</th><th>Приложение</th>
        <th>Индексировать для поиска</th><th>Скрытое</th><th></th></tr></thead><tbody>
      ${rows.length ? rows.map(f => `<tr><td>${esc(f.title)}</td><td class="mono">${esc(f.permalink)}</td>
        <td>${esc(f.type)}</td><td>${esc(f.app || '—')}</td><td>${yn(f.indexed)}</td><td>${yn(f.hidden)}</td>
        <td><button class="btn sm danger" data-delpf="${key}:${f.id}">Удалить</button></td></tr>`).join('')
        : `<tr><td colspan="7" style="color:var(--ink-3);padding:18px 12px">Нет данных для отображения</td></tr>`}
      </tbody></table></div>
      <div class="body"><button class="btn" data-addpf="${key}">Добавить</button></div></div>`;
  };
  return head('Дополнительные поля') +
    block('product', 'Товары') +
    block('variant', 'Варианты', 'Доступно только через API, в карточке товара не отображается') +
    block('collection', 'Категории');
};
V.product_fields.bind = () => {
  document.querySelectorAll('[data-addpf]').forEach(b => b.onclick = () => {
    const k = b.dataset.addpf;
    const t = prompt('Название поля'); if (!t) return;
    DB.product_fields[k].push({ id: nextId(DB.product_fields[k]), title: t, permalink: slugify(t),
      type: 'Текст', app: null, indexed: false, hidden: false });
    save(); toast('Поле добавлено'); render();
  });
  document.querySelectorAll('[data-delpf]').forEach(b => b.onclick = () => {
    const [k, id] = b.dataset.delpf.split(':');
    DB.product_fields[k] = DB.product_fields[k].filter(f => f.id !== +id);
    save(); toast('Удалено'); render();
  });
};

V.properties = () => simpleTable('Свойства вариантов',
  [{ t: 'Название' }, { t: 'Пермалинк', mono: true }, { t: 'В фильтрах' }, { t: 'Скрытое' }, { t: 'Позиция', num: true }],
  DB.properties_list.map(p => [esc(p.title), esc(p.permalink), yn(p.is_navigational), yn(p.is_hidden), p.position]),
  { action: `<button class="btn primary" id="addprop">Добавить</button>` });
V.properties.bind = () => {
  $('#addprop').onclick = () => {
    const t = prompt('Название свойства'); if (!t) return;
    DB.properties_list.push({ id: nextId(DB.properties_list), title: t, permalink: slugify(t),
      position: DB.properties_list.length + 1, is_hidden: false, is_navigational: false, backoffice: false });
    save(); toast('Свойство добавлено'); render();
  };
};

V.templates = () => head('Шаблоны писем') + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th>Тип</th><th></th></tr></thead><tbody>
  ${DB.email_templates.map(t => `<tr><td>${esc(t.title)}</td>
    <td>${t.system ? 'системный' : 'пользовательский'}</td>
    <td><button class="btn sm" data-edt="${t.id}">Редактировать</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="formfoot"><button class="btn" id="addtpl">Добавить пользовательский шаблон</button></div>
  <div class="card" style="margin-top:18px"><h3>Логотип для писем</h3><div class="body">
    <div class="thumb" style="width:180px;height:60px">▦</div>
    <div class="help">Логотип доступен в шаблоне как Liquid-переменная
      <code>{{ account.logo.original_url }}</code>. Рекомендуемый размер 300×100.</div>
  </div></div>`;
V.templates.bind = () => {
  $('#addtpl').onclick = () => {
    const t = prompt('Название шаблона'); if (!t) return;
    DB.email_templates.push({ id: nextId(DB.email_templates), title: t, system: false });
    save(); toast('Шаблон добавлен'); render();
  };
  document.querySelectorAll('[data-edt]').forEach(b => b.onclick = () =>
    toast('Редактор Liquid-шаблонов писем требует серверной части'));
};

V.client_groups = () => head('Группы клиентов', `<button class="btn primary" id="addcg">Добавить группу</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название группы</th>
    <th>По умолчанию</th><th class="num">Скидка</th><th>Описание скидки</th>
    <th>Не для уценённых</th><th>Не для комплектов</th><th class="num">Клиентов</th><th></th>
  </tr></thead><tbody>
  ${DB.client_groups.map(g => `<tr><td><b>${esc(g.title)}</b></td>
    <td>${yn(g.is_default)}</td><td class="num">${num(g.discount)}%</td>
    <td>${esc(g.description || '—')}</td><td>${yn(g.skip_sale)}</td><td>${yn(g.skip_bundles)}</td>
    <td class="num">${DB.clients.filter(c => c.client_group_id === g.id).length}</td>
    <td><button class="btn sm danger" data-delcg="${g.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="notice info">Скидка доступна только зарегистрированным клиентам и не применяется,
    если заказ создаётся с регистрацией нового пользователя.</div>`;
V.client_groups.bind = () => {
  $('#addcg').onclick = () => {
    const t = prompt('Название группы. Примеры: Оптовики, Розница'); if (!t) return;
    const d = prompt('Величина скидки, %', '0');
    DB.client_groups.push({ id: nextId(DB.client_groups), title: t, is_default: false,
      discount: String(num(d)), description: '', skip_sale: false, skip_bundles: false });
    save(); toast('Группа создана'); render();
  };
  document.querySelectorAll('[data-delcg]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить группу клиентов?', () => {
      DB.client_groups = DB.client_groups.filter(g => g.id !== +b.dataset.delcg);
      save(); toast('Удалено'); render();
    }));
};

V.currencies = () => head('Валюты') + `
  <div class="card"><h3>Настройка валют на сайте</h3><div class="tablewrap" style="border:0">
    <table class="grid"><thead><tr><th>Валюта на сайте</th><th>По умолчанию</th><th>Символ валюты</th>
      <th>Не отображать копейки</th><th>Разделять разряды цены</th><th>Округлять скидки</th></tr></thead><tbody>
    ${DB.currencies_site.map(c => `<tr><td>${esc(c.title)}</td><td>${yn(c.is_default)}</td>
      <td>${esc(c.symbol)}</td><td>${yn(c.hide_kopecks)}</td><td>${yn(c.group_digits)}</td>
      <td>${yn(c.round_discounts)}</td></tr>`).join('')}
    </tbody></table></div><div class="body"><button class="btn" id="addcs">Добавить</button></div></div>
  <div class="card"><h3>Настройка валют на складе</h3><div class="tablewrap" style="border:0">
    <table class="grid"><thead><tr><th>Валюта склада</th><th>По умолчанию</th><th>Использовать курс ЦБ</th>
      <th class="num">Курс обмена</th><th class="num">Наценка к курсу, %</th></tr></thead><tbody>
    ${DB.currencies_stock.map(c => `<tr><td>${esc(c.title)}</td><td>${yn(c.is_default)}</td>
      <td>${yn(c.use_cbr)}</td><td class="num">${esc(c.rate)}</td><td class="num">${esc(c.markup)}</td></tr>`).join('')}
    </tbody></table></div><div class="body"><button class="btn" id="addcst">Добавить</button></div></div>`;
V.currencies.bind = () => {
  ['#addcs', '#addcst'].forEach(s => $(s).onclick = () => toast('Мультивалютность в демо-версии не активна'));
};

V.taxes = () => {
  const t = DB.taxes;
  return head('Налоги') + `
    <div class="card"><h3>Настройка НДС</h3><div class="body">
      <div class="row"><label>Ставка НДС по умолчанию</label>
        <select id="tx_vat">${['Без НДС', '0%', '10%', '20%', '10/110', '20/120'].map(v =>
          `<option ${v === t.default_vat ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <label class="check"><input type="checkbox" id="tx_subj" ${t.set_payment_subject ? 'checked' : ''}>
        Задавать предмет расчёта</label>
      <div class="help">Нужно, если продаёте акцизные товары или услуги. Используется для печати чеков.
        Если не установлено, все позиции пробиваются как неакцизный товар.</div>
      <label class="check" style="margin-top:12px"><input type="checkbox" id="tx_del" ${t.no_vat_for_delivery ? 'checked' : ''}>
        Не учитывать НДС для доставки</label>
    </div></div>
    <div class="notice">Печать чеков и фискализация по 54-ФЗ в копии не реализованы —
      это отдельный блок, который надо обсуждать до оценки сроков переноса.</div>
    <div class="formfoot"><button class="btn primary" id="savetx">Сохранить</button></div>`;
};
V.taxes.bind = () => {
  $('#savetx').onclick = () => {
    DB.taxes = { default_vat: $('#tx_vat').value, set_payment_subject: $('#tx_subj').checked,
      no_vat_for_delivery: $('#tx_del').checked };
    save(); toast('Налоги сохранены');
  };
};

V.client_types = () => {
  const fieldTable = (title, rows, key) => `<div class="card"><h3>${esc(title)}</h3>
    <div class="tablewrap" style="border:0"><table class="grid"><thead><tr>
      <th>Название в бэк-офисе</th><th>Тип</th><th>Используется</th><th>Обязательное</th><th>Включено</th>
    </tr></thead><tbody>
    ${rows.map(f => `<tr><td>${esc(f.title)}</td><td>${esc(f.type)}</td><td>${esc(f.used)}</td>
      <td><input type="checkbox" ${f.obligatory ? 'checked' : ''} data-ob="${key}:${f.id}"></td>
      <td><input type="checkbox" ${f.enabled ? 'checked' : ''} data-en="${key}:${f.id}"></td></tr>`).join('')}
    </tbody></table></div></div>`;
  return head('Типы клиентов') + `
    <div class="tablewrap"><table class="grid"><thead><tr><th>Тип</th><th>Включить</th></tr></thead><tbody>
    ${DB.client_types.map(t => `<tr><td>${esc(t.title)}</td>
      <td><input type="checkbox" ${t.enabled ? 'checked' : ''} data-ct="${t.id}"> ${t.enabled ? 'Да' : 'Нет'}</td>
      </tr>`).join('')}
    </tbody></table></div>
    ${fieldTable('Настройка полей контактных данных', DB.contact_fields, 'contact_fields')}
    ${fieldTable('Настройка полей клиента (Физическое лицо)', DB.individual_fields, 'individual_fields')}`;
};
V.client_types.bind = () => {
  document.querySelectorAll('[data-ct]').forEach(cb => cb.onchange = () => {
    DB.client_types.find(t => t.id === +cb.dataset.ct).enabled = cb.checked; save(); render();
  });
  const flip = (attr, prop) => document.querySelectorAll(`[data-${attr}]`).forEach(cb => cb.onchange = () => {
    const [k, id] = cb.dataset[attr].split(':');
    DB[k].find(f => f.id === +id)[prop] = cb.checked; save(); toast('Сохранено');
  });
  flip('ob', 'obligatory'); flip('en', 'enabled');
};

V.users = () => simpleTable('Пользователи',
  [{ t: 'Имя' }, { t: 'Почта' }, { t: 'Роль' }, { t: 'Активен' }],
  DB.users.map(u => [esc(u.name), esc(u.email), esc(u.role), yn(u.active)]),
  { action: `<button class="btn primary" id="adduser">Пригласить</button>` });
V.users.bind = () => {
  $('#adduser').onclick = () => {
    const e = prompt('Почта нового пользователя'); if (!e) return;
    DB.users.push({ id: nextId(DB.users), name: e.split('@')[0], email: e, role: 'Менеджер', active: false });
    save(); toast('Приглашение создано'); render();
  };
};

V.order_views = () => simpleTable('Виды заказов',
  [{ t: 'Вид' }, { t: 'Условия' }, { t: '' }],
  DB.order_views.map(v => [esc(v.title), esc(v.rules || '—'),
    `<button class="btn sm danger" data-delov="${v.id}">Удалить</button>`]),
  { action: `<button class="btn primary" id="addov">Добавить вид</button>
             <button class="btn" id="defov">Настроить вид по умолчанию</button>`,
    empty: 'Пока нет ни одного вида' });
V.order_views.bind = () => {
  $('#addov').onclick = () => {
    const t = prompt('Название вида'); if (!t) return;
    DB.order_views.push({ id: nextId(DB.order_views), title: t, rules: 'все заказы' });
    save(); toast('Вид создан'); render();
  };
  $('#defov').onclick = () => toast('Настройка колонок вида по умолчанию');
  document.querySelectorAll('[data-delov]').forEach(b => b.onclick = () => {
    DB.order_views = DB.order_views.filter(v => v.id !== +b.dataset.delov); save(); toast('Удалено'); render();
  });
};

V.reviews = () => {
  const tab = state.rvt || 'new';
  return head('Отзывы о товарах') + `
    <div class="tabs">${[['new', 'Новые'], ['published', 'Опубликованные'], ['rejected', 'Отклонённые'], ['all', 'Все']]
      .map(([k, t]) => `<a href="#" data-rvt="${k}" class="${tab === k ? 'active' : ''}">${t}</a>`).join('')}</div>
    ${simpleTable('', [{ t: 'Товар' }, { t: 'Автор' }, { t: 'Оценка', num: true }, { t: 'Текст' }, { t: 'Дата' }],
      DB.reviews.map(r => [esc(r.product), esc(r.author), r.rating, esc(r.text), esc(r.date)]),
      { empty: 'Отзывов пока нет' }).replace(/^<div class="page-head">[\s\S]*?<\/div>/, '')}`;
};
V.reviews.bind = () => {
  document.querySelectorAll('[data-rvt]').forEach(a => a.onclick = e => {
    e.preventDefault(); state.rvt = a.dataset.rvt; render();
  });
};

V.files = () => head('Файлы', `<button class="btn primary" id="addfile">Загрузить файл</button>`) + `
  ${DB.files.length ? simpleTable('', [{ t: 'Имя' }, { t: 'Размер', num: true }, { t: 'Ссылка', mono: true }],
    DB.files.map(f => [esc(f.name), f.size, esc(f.url)])).replace(/^<div class="page-head">[\s\S]*?<\/div>/, '')
    : `<div class="empty"><h3>Файлов нет</h3><p>Хранилище файлов требует серверной части.
       В боевой версии сюда попадают картинки товаров и документы.</p></div>`}`;
V.files.bind = () => { $('#addfile').onclick = () => toast('Загрузка файлов требует хранилища'); };

V.system_snippets = () => simpleTable('Системные сниппеты',
  [{ t: 'Сниппет', mono: true }, { t: 'Что делает' }],
  DB.system_snippets.map(s => [esc(s.title), esc(s.note)]),
  { note: 'Это инклюды платформы, которые подставляются в шаблоны темы. В исходниках темы их нет — ' +
          'при переносе магазина логику этих сниппетов придётся воспроизводить самостоятельно.' });

V.block_templates = () => simpleTable('Шаблоны блоков',
  [{ t: 'Название' }, { t: 'Где используется' }],
  DB.block_templates.map(b => [esc(b.title), esc(b.usage)]),
  { action: `<button class="btn primary" id="addbt">Добавить</button>`, empty: 'Шаблонов блоков нет' });
V.block_templates.bind = () => {
  $('#addbt').onclick = () => toast('Редактор блоков требует серверной части');
};

V.accessories = () => simpleTable('Аксессуары и сопутствующие товары',
  [{ t: 'Товар' }, { t: 'Аксессуары' }],
  DB.accessories.map(a => [esc(a.product), esc(a.items)]),
  { action: `<button class="btn primary" id="addacc">Добавить связку</button>`, empty: 'Связок нет' });
V.accessories.bind = () => {
  $('#addacc').onclick = () => toast('Связки товаров: выберите товар и сопутствующие позиции');
};

/* ---------- регистрация маршрутов и пунктов меню ---------- */
ROUTES.push(
  [/^#\/menus$/, 'menus'], [/^#\/warehouses$/, 'warehouses'], [/^#\/price_kinds$/, 'price_kinds'],
  [/^#\/product_fields$/, 'product_fields'], [/^#\/properties$/, 'properties'],
  [/^#\/templates$/, 'templates'], [/^#\/client_groups$/, 'client_groups'],
  [/^#\/currencies$/, 'currencies'], [/^#\/taxes$/, 'taxes'], [/^#\/client_types$/, 'client_types'],
  [/^#\/users$/, 'users'], [/^#\/order_views$/, 'order_views'], [/^#\/reviews$/, 'reviews'],
  [/^#\/files$/, 'files'], [/^#\/system_snippets$/, 'system_snippets'],
  [/^#\/block_templates$/, 'block_templates'], [/^#\/accessories$/, 'accessories']
);

(function extendNav() {
  const byTitle = t => NAV.find(n => n.t === t);
  const orders = byTitle('Заказы');
  orders.sub = [['Все заказы', '#/orders'], ['Виды заказов', '#/order_views'],
    ['Отгрузки', '#/stub/Отгрузки'], ['Задачи', '#/stub/Задачи']];
  const goods = byTitle('Товары');
  goods.sub = [['Каталог товаров', '#/products'], ['Импорт/Экспорт', '#/import'],
    ['Цены и остатки', '#/prices'], ['Свойства вариантов', '#/properties'],
    ['Дополнительные поля', '#/product_fields'], ['Аксессуары', '#/accessories'],
    ['Товарные выгрузки', '#/stub/Товарные выгрузки'], ['Отзывы', '#/reviews']];
  const clients = byTitle('Клиенты');
  clients.sub = [['Все клиенты', '#/clients'], ['Группы клиентов', '#/client_groups'],
    ['Типы клиентов', '#/client_types'], ['Скидки', '#/discounts']];
  const site = byTitle('Сайт');
  site.sub = [['Дизайн', '#/stub/Дизайн'], ['Данные сайта', '#/branding'],
    ['Страницы и документы', '#/pages'], ['Меню сайта', '#/menus'], ['Блог и статьи', '#/blogs'],
    ['Файлы', '#/files'], ['Домены', '#/domains'], ['Способы доставки', '#/delivery'],
    ['Способы оплаты', '#/payments'], ['Счётчики и коды', '#/codes']];
})();

SETTINGS_GROUPS.length = 0;
SETTINGS_GROUPS.push(
  ['Настройки магазина', [['Карточка магазина', '#/account'], ['Домены', '#/domains'],
    ['Налоги', '#/taxes'], ['Валюты', '#/currencies'], ['Мультисклад', '#/warehouses'],
    ['Пользователи', '#/users'], ['Страны', '#/stub/Страны'], ['Языки', '#/stub/Языки'],
    ['История запросов', '#/stub/История запросов']]],
  ['Оформление заказа', [['Оплата', '#/payments'], ['Доставка', '#/delivery'],
    ['Оформление заказа', '#/checkout'], ['Пользовательские статусы', '#/statuses'],
    ['Виды заказов', '#/order_views'], ['Типы клиентов', '#/client_types'],
    ['Поля форм', '#/fields'], ['Заказ в один клик', '#/stub/Заказ в один клик']]],
  ['Настройки сайта', [['Меню сайта', '#/menus'], ['Шаблоны писем', '#/templates'],
    ['Редиректы', '#/redirects'], ['Robots.txt', '#/robots'], ['SEO', '#/seo'],
    ['Системные сниппеты', '#/system_snippets'], ['Шаблоны блоков', '#/block_templates'],
    ['Виджеты', '#/stub/Виджеты']]],
  ['Настройки товаров', [['Опции', '#/options'], ['Свойства вариантов', '#/properties'],
    ['Дополнительные поля', '#/product_fields'], ['Типы цен', '#/price_kinds'],
    ['Аксессуары', '#/accessories'], ['Группы категорий', '#/stub/Группы категорий']]]
);

/* ================= Фильтры =================
   Составы панелей сняты с реальных экранов InSales. */
function fRange(key, label) {
  const f = state.f || {};
  return `<div class="fg"><b>${esc(label)}</b><div class="range">
    <input type="number" placeholder="От" data-flt="${key}_from" value="${esc(f[key + '_from'] || '')}">
    <span style="color:var(--ink-3)">–</span>
    <input type="number" placeholder="До" data-flt="${key}_to" value="${esc(f[key + '_to'] || '')}">
  </div></div>`;
}
function fRadio(key, label, opts) {
  const f = state.f || {};
  return `<div class="fg"><b>${esc(label)}</b><div class="radios">
    ${opts.map(([v, t]) => `<label><input type="radio" name="f_${key}" data-flt="${key}" value="${v}"
      ${(f[key] || '') === v ? 'checked' : ''}> ${esc(t)}</label>`).join('')}
    <label><input type="radio" name="f_${key}" data-flt="${key}" value=""
      ${!f[key] ? 'checked' : ''}> любой</label>
  </div></div>`;
}
function filterPanel(inner) {
  return `<div class="filters"><div class="fgrid">${inner}</div>
    <div class="ffoot"><button class="btn primary" id="fapply">Применить</button>
      <button class="btn" id="freset">Сбросить</button>
      <span class="sp" style="flex:1"></span>
      <span class="help" style="margin:0">Фильтры применяются к списку сразу</span></div></div>`;
}
function bindFilters() {
  if (!$('#fapply')) return;
  const read = () => {
    const f = {};
    document.querySelectorAll('[data-flt]').forEach(el => {
      if (!('value' in el)) return;              // ссылки-вкладки сюда не попадают
      if (el.type === 'radio' && !el.checked) return;
      if (el.type === 'checkbox') { if (el.checked) f[el.dataset.flt] = '1'; return; }
      if (el.value !== '') f[el.dataset.flt] = el.value;
    });
    return f;
  };
  $('#fapply').onclick = () => { state.f = read(); render(); };
  $('#freset').onclick = () => { state.f = {}; render(); };
}
const inRange = (v, from, to) => {
  const n = num(v);
  if (from !== undefined && from !== '' && n < num(from)) return false;
  if (to !== undefined && to !== '' && n > num(to)) return false;
  return true;
};

/* ---- Цены и остатки: набор фильтров как в оригинале ---- */
V.prices = () => {
  const tab = state.ptab || 'all';
  const f = state.f || {};
  let list = DB.products.slice();
  list = list.filter(p => {
    const v = firstVariant(p);
    if (!inRange(v.cost_price, f.cost_from, f.cost_to)) return false;
    if (!inRange(v.price, f.price_from, f.price_to)) return false;
    if (!inRange(v.old_price || 0, f.old_from, f.old_to)) return false;
    if (!inRange(v.quantity, f.qty_from, f.qty_to)) return false;
    if (f.barcode === 'yes' && !v.barcode) return false;
    if (f.barcode === 'no' && v.barcode) return false;
    if (f.photo === 'yes' && !(p.images || []).length) return false;
    if (f.photo === 'no' && (p.images || []).length) return false;
    if (f.kind === 'bundle' && !p.bundle) return false;
    if (f.kind === 'product' && p.bundle) return false;
    if (state.pq2 && !(p.title.toLowerCase().includes(state.pq2.toLowerCase()))) return false;
    return true;
  });
  return head('Цены и остатки', `<button class="btn" id="bulk">Массовые изменения</button>
      <button class="btn" id="ftoggle">Фильтры${Object.keys(f).length ? ' · ' + Object.keys(f).length : ''}</button>`) + `
    <div class="tabs">
      ${[['all', 'Все'], ['price', 'Цены'], ['stock', 'Остатки']].map(([k, t]) =>
        `<a href="#" data-pt="${k}" class="${tab === k ? 'active' : ''}">${t}</a>`).join('')}
    </div>
    <div class="toolbar">
      <input class="field-search" id="pq2" placeholder="Поиск" value="${esc(state.pq2 || '')}">
      <span class="sp"></span><button class="btn" id="pricesCsv">Выгрузить в CSV</button>
    </div>
    ${state.fopen ? filterPanel(
      fRadio('kind', 'Тип позиции', [['product', 'Товары'], ['bundle', 'Комплекты']]) +
      fRadio('photo', 'Фото', [['yes', 'С фото'], ['no', 'Без фото']]) +
      fRadio('barcode', 'Штрихкод', [['yes', 'Есть'], ['no', 'Нет']]) +
      fRange('cost', 'Себестоимость') + fRange('price', 'Цена продажи') +
      fRange('old', 'Цена до скидки') + fRange('qty', 'Остаток на складе')
    ) : ''}
    <div class="tablewrap"><table class="grid"><thead><tr>
      <th>Название</th><th class="mono">Штрихкод</th>
      ${tab !== 'stock' ? '<th class="num">Себестоимость</th><th class="num">Цена продажи</th><th class="num">Цена до скидки</th>' : ''}
      ${tab !== 'price' ? '<th class="num">Склад</th>' : ''}
      <th class="num">Наценка</th></tr></thead><tbody>
    ${list.length ? list.map(p => { const v = firstVariant(p);
      const marg = num(v.price) && num(v.cost_price) ? Math.round((num(v.price) - num(v.cost_price)) / num(v.price) * 100) : 0;
      return `<tr><td>${esc(p.title)}</td><td class="mono">${esc(v.barcode || '')}</td>
      ${tab !== 'stock' ? `
        <td class="num"><input type="number" step="0.01" style="width:110px;text-align:right" data-pc="${p.id}" value="${num(v.cost_price)}"></td>
        <td class="num"><input type="number" step="0.01" style="width:110px;text-align:right" data-pp="${p.id}" value="${num(v.price)}"></td>
        <td class="num"><input type="number" step="0.01" style="width:110px;text-align:right" data-po="${p.id}" value="${v.old_price ? num(v.old_price) : ''}"></td>` : ''}
      ${tab !== 'price' ? `<td class="num"><input type="number" style="width:90px;text-align:right" data-pq="${p.id}" value="${num(v.quantity)}"></td>` : ''}
      <td class="num">${marg}%</td></tr>`; }).join('')
      : `<tr><td colspan="7"><div class="empty"><h3>Ничего не найдено</h3>
         <p>Ни одна позиция не подходит под выбранные фильтры.</p></div></td></tr>`}
    </tbody></table></div>
    <div class="formfoot"><button class="btn primary" id="savePrices">Сохранить изменения</button>
      <span class="sp"></span><span class="help" style="margin:0">Показано: ${list.length} из ${DB.products.length}</span></div>`;
};
V.prices.bind = () => {
  document.querySelectorAll('[data-pt]').forEach(a => a.onclick = e => {
    e.preventDefault(); state.ptab = a.dataset.pt; render();
  });
  $('#ftoggle').onclick = () => { state.fopen = !state.fopen; render(); };
  const q = $('#pq2');
  q.onkeydown = e => { if (e.key === 'Enter') { state.pq2 = q.value; render(); } };
  bindFilters();
  $('#savePrices').onclick = () => {
    DB.products.forEach(p => {
      const v = firstVariant(p);
      const c = document.querySelector(`[data-pc="${p.id}"]`); if (c) v.cost_price = String(num(c.value));
      const pr = document.querySelector(`[data-pp="${p.id}"]`); if (pr) { v.price = String(num(pr.value)); v.base_price = v.price; }
      const o = document.querySelector(`[data-po="${p.id}"]`); if (o) v.old_price = o.value ? String(num(o.value)) : null;
      const qq = document.querySelector(`[data-pq="${p.id}"]`); if (qq) { v.quantity = Math.round(num(qq.value)); v.quantity_at_warehouse0 = v.quantity + '.0'; }
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

/* ---- Фильтр заказов ---- */
const _orders = V.orders, _ordersBind = V.orders.bind;
V.orders = () => {
  const f = state.f || {};
  let html = _orders();
  const panel = state.fopen ? filterPanel(
    `<div class="fg"><b>Статус заказа</b><select data-flt="status">
      <option value="">любой</option>
      ${STATUSES.map(s => `<option value="${s.key}" ${f.status === s.key ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}
    </select></div>` +
    fRadio('paid', 'Оплата', [['yes', 'Оплачен'], ['no', 'Не оплачен']]) +
    `<div class="fg"><b>Способ доставки</b><select data-flt="dv">
      <option value="">любой</option>
      ${DB.delivery_variants.map(d => `<option value="${d.id}" ${String(f.dv) === String(d.id) ? 'selected' : ''}>${esc(d.title)}</option>`).join('')}
    </select></div>` +
    fRange('sum', 'Сумма заказа')
  ) : '';
  html = html.replace('<div class="tablewrap">', panel + '<div class="tablewrap">');
  html = html.replace('<button class="btn" id="ofind">',
    `<button class="btn" id="ftoggle">Фильтры${Object.keys(f).length ? ' · ' + Object.keys(f).length : ''}</button><button class="btn" id="ofind">`);
  // применить фильтры к строкам
  if (Object.keys(f).length) {
    const keep = DB.orders.filter(o =>
      (!f.status || o.custom_status === f.status) &&
      (!f.paid || (f.paid === 'yes') === (o.financial_status === 'paid')) &&
      (!f.dv || String(o.delivery_variant_id) === String(f.dv)) &&
      inRange(o.total_price, f.sum_from, f.sum_to)
    ).map(o => o.id);
    DB.orders.forEach(o => {
      if (!keep.includes(o.id)) {
        const re = new RegExp(`<tr class="[^"]*">\\s*<td><input type="checkbox"></td>\\s*<td><a href="#/orders/${o.id}"[\\s\\S]*?</tr>`);
        html = html.replace(re, '');
      }
    });
  }
  return html;
};
V.orders.bind = () => {
  _ordersBind();
  if ($('#ftoggle')) $('#ftoggle').onclick = () => { state.fopen = !state.fopen; render(); };
  bindFilters();
};

/* ---- Фильтр каталога ---- */
const _products = V.products, _productsBind = V.products.bind;
V.products = () => {
  const f = state.f || {};
  let html = _products();
  const panel = state.fopen ? filterPanel(
    fRadio('vis', 'Видимость', [['on', 'Показывается'], ['off', 'Скрыт']]) +
    fRadio('stock', 'Наличие', [['yes', 'Есть на складе'], ['no', 'Нет в наличии']]) +
    fRange('price', 'Цена продажи') + fRange('qty', 'Остаток')
  ) : '';
  html = html.replace('<div class="toolbar">', panel ? panel + '<div class="toolbar">' : '<div class="toolbar">');
  html = html.replace('<button class="btn" id="pfind">',
    `<button class="btn" id="ftoggle">Фильтры${Object.keys(f).length ? ' · ' + Object.keys(f).length : ''}</button><button class="btn" id="pfind">`);
  if (Object.keys(f).length) {
    DB.products.forEach(p => {
      const v = firstVariant(p);
      let ok = true;
      if (f.vis === 'on' && p.is_hidden) ok = false;
      if (f.vis === 'off' && !p.is_hidden) ok = false;
      if (f.stock === 'yes' && num(v.quantity) <= 0) ok = false;
      if (f.stock === 'no' && num(v.quantity) > 0) ok = false;
      if (!inRange(v.price, f.price_from, f.price_to)) ok = false;
      if (!inRange(v.quantity, f.qty_from, f.qty_to)) ok = false;
      if (!ok) {
        const re = new RegExp(`<tr>\\s*<td><input type="checkbox" data-sel="${p.id}">[\\s\\S]*?</tr>`);
        html = html.replace(re, '');
      }
    });
  }
  return html;
};
V.products.bind = () => {
  _productsBind();
  if ($('#ftoggle')) $('#ftoggle').onclick = () => { state.fopen = !state.fopen; render(); };
  bindFilters();
};

/* ================= Категории витрины с SEO-полями ================= */
V.collections = () => {
  const tree = DB.collections.filter(c => !c.parent_id);
  const kids = pid => DB.collections.filter(c => c.parent_id === pid);
  const row = (c, lvl) => `<tr>
    <td style="padding-left:${8 + lvl * 22}px"><a href="#/collections/${c.id}" class="rowlink">${esc(c.title)}</a></td>
    <td class="mono">${esc(c.url || '/collection/' + c.permalink)}</td>
    <td style="color:${c.html_title ? 'inherit' : 'var(--ink-3)'}">${esc(c.html_title || 'из SEO-шаблона')}</td>
    <td>${c.is_hidden ? '—' : 'да'}</td>
    <td class="num">${DB.products.filter(p => (p.collections_ids || []).includes(c.id)).length}</td>
    <td><button class="btn sm danger" data-delcol="${c.id}">Удалить</button></td></tr>`;
  const rows = tree.map(c => row(c, 0) + kids(c.id).map(k => row(k, 1)).join('')).join('');
  return head('Категории витрины', `<button class="btn primary" id="addcol2">Добавить категорию</button>`) + `
    <div class="notice info">У каждой категории свои тег title, мета-описание и адрес.
      При переносе магазина это переносится вместе с товарами — иначе просядут позиции по категорийным запросам.</div>
    <div class="tablewrap"><table class="grid"><thead><tr>
      <th>Название</th><th class="mono">Адрес</th><th>Тег title</th><th>Показывать</th>
      <th class="num">Товаров</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
};
V.collections.bind = () => {
  $('#addcol2').onclick = () => {
    const t = prompt('Название категории'); if (!t) return;
    DB.collections.push({ id: nextId(DB.collections), parent_id: DB.collections[0] ? DB.collections[0].id : null,
      title: t, permalink: slugify(t), url: '/collection/' + slugify(t), is_hidden: false,
      position: DB.collections.length + 1, sort_type: 7,
      html_title: null, meta_description: null, meta_keywords: null, description: null });
    save(); toast('Категория создана'); render();
  };
  document.querySelectorAll('[data-delcol]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить категорию? Товары останутся в каталоге.', () => {
      const id = +b.dataset.delcol;
      DB.collections = DB.collections.filter(c => c.id !== id && c.parent_id !== id);
      DB.products.forEach(p => { p.collections_ids = (p.collections_ids || []).filter(x => x !== id); });
      save(); toast('Категория удалена'); render();
    }));
};

V.collection = (id) => {
  const c = DB.collections.find(x => x.id === +id);
  if (!c) return `<div class="empty"><h3>Категория не найдена</h3></div>`;
  const val = k => esc(c[k] != null ? c[k] : '');
  const others = DB.collections.filter(x => x.id !== c.id);
  return backTo('#/collections', 'Категории витрины') + `
    <div class="page-head"><h1 class="title">${esc(c.title)}</h1><span class="sp"></span>
      <button class="btn primary" id="savecol">Сохранить</button></div>
    <div class="card"><h3>Основное</h3><div class="body">
      <div class="row"><label>Название <span class="req">*</span></label><input type="text" id="co_title" value="${val('title')}"></div>
      <div class="row"><label>Родительская категория</label><select id="co_parent">
        <option value="">— верхний уровень —</option>
        ${others.map(o => `<option value="${o.id}" ${c.parent_id === o.id ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}
      </select></div>
      <div class="row"><label>Адрес</label>
        <div class="prefix"><span class="pre">${esc(DB.account.main_host)}/collection/</span>
          <input type="text" id="co_perm" value="${val('permalink')}"></div></div>
      <div class="row"><label>Описание</label><textarea id="co_desc">${val('description')}</textarea></div>
      <div class="row"><label>Сортировка товаров</label><select id="co_sort">
        ${[[1,'по имени'],[2,'по цене, сначала дешёвые'],[3,'по цене, сначала дорогие'],[7,'вручную']]
          .map(([v,t])=>`<option value="${v}" ${c.sort_type==v?'selected':''}>${t}</option>`).join('')}
      </select></div>
      <label class="check"><input type="checkbox" id="co_show" ${!c.is_hidden ? 'checked' : ''}> Показывать категорию на сайте</label>
    </div></div>
    <div class="card"><h3>Поисковая оптимизация</h3><div class="body">
      <div class="row"><label>Тег title</label><input type="text" id="co_htitle" value="${val('html_title')}"
        placeholder="Если пусто — подставится SEO-шаблон категорий"></div>
      <div class="row"><label>Мета-тег description</label><textarea id="co_mdesc" style="min-height:70px"
        placeholder="Если пусто — подставится SEO-шаблон категорий">${val('meta_description')}</textarea></div>
      <div class="row"><label>Мета-тег keywords</label><input type="text" id="co_mkw" value="${val('meta_keywords')}"></div>
    </div></div>
    <div class="card"><h3>Товары в категории</h3><div class="body">
      ${DB.products.filter(p => (p.collections_ids || []).includes(c.id)).map(p =>
        `<div style="padding:5px 0;border-bottom:1px solid var(--line)"><a href="#/products/${p.id}">${esc(p.title)}</a></div>`).join('')
        || '<div class="help">В категории пока нет товаров</div>'}
    </div></div>`;
};
V.collection.bind = (id) => {
  if (!$('#savecol')) return;
  $('#savecol').onclick = () => {
    const c = DB.collections.find(x => x.id === +id);
    const t = $('#co_title').value.trim(); if (!t) return toast('Заполните название');
    c.title = t;
    c.parent_id = $('#co_parent').value ? +$('#co_parent').value : null;
    c.permalink = $('#co_perm').value.trim() || slugify(t);
    c.url = '/collection/' + c.permalink;
    c.description = $('#co_desc').value || null;
    c.sort_type = +$('#co_sort').value;
    c.is_hidden = !$('#co_show').checked;
    c.html_title = $('#co_htitle').value || null;
    c.meta_description = $('#co_mdesc').value || null;
    c.meta_keywords = $('#co_mkw').value || null;
    save(); toast('Категория сохранена'); go('#/collections');
  };
};

/* ================= Пользовательские статусы: правка ================= */
V.statuses = () => head('Пользовательские статусы', `<button class="btn primary" id="addst">Добавить статус</button>`) + `
  <div class="notice info">В InSales эти статусы редактирует сам клиент. Поэтому список настраиваемый,
    а не захардкоженный: переименование сразу отражается в заказах и фильтрах.</div>
  <div class="tablewrap"><table class="grid"><thead><tr><th style="width:60px">Порядок</th>
    <th>Статус</th><th class="mono">Ключ</th><th>По умолчанию</th>
    <th class="num">Заказов</th><th></th></tr></thead><tbody>
  ${STATUSES.map((s, i) => `<tr>
    <td><button class="btn sm icon" data-stup="${s.key}" ${i === 0 ? 'disabled' : ''}>↑</button></td>
    <td><span class="pill ${PILL[s.key] || 'grey'}">${esc(s.title)}</span>
      <input type="text" data-sttitle="${s.key}" value="${esc(s.title)}" style="max-width:220px;margin-left:8px;display:inline-block;width:auto"></td>
    <td class="mono">${esc(s.key)}</td>
    <td><input type="radio" name="stdef" data-stdef="${s.key}" ${s.is_default ? 'checked' : ''}></td>
    <td class="num">${DB.orders.filter(o => o.custom_status === s.key).length}</td>
    <td><button class="btn sm danger" data-stdel="${s.key}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="formfoot"><button class="btn primary" id="savest">Сохранить</button></div>`;
V.statuses.bind = () => {
  $('#addst').onclick = () => {
    const t = prompt('Название статуса'); if (!t) return;
    const key = slugify(t) || 'status' + STATUSES.length;
    STATUSES.push({ key, title: t, is_default: false });
    PILL[key] = 'grey'; DB._statuses = STATUSES; save(); toast('Статус добавлен'); render();
  };
  $('#savest').onclick = () => {
    STATUSES.forEach(s => {
      const t = document.querySelector(`[data-sttitle="${s.key}"]`); if (t && t.value.trim()) s.title = t.value.trim();
      const d = document.querySelector(`[data-stdef="${s.key}"]`); if (d) s.is_default = d.checked;
    });
    DB._statuses = STATUSES; save(); toast('Статусы сохранены'); render();
  };
  document.querySelectorAll('[data-stdel]').forEach(b => b.onclick = () => {
    const key = b.dataset.stdel;
    const used = DB.orders.filter(o => o.custom_status === key).length;
    if (used) return toast(`Нельзя удалить: статус стоит у ${used} заказ(ов)`);
    confirmDialog('Удалить статус?', () => {
      const i = STATUSES.findIndex(s => s.key === key);
      if (i >= 0) STATUSES.splice(i, 1);
      DB._statuses = STATUSES; save(); toast('Статус удалён'); render();
    });
  });
  document.querySelectorAll('[data-stup]').forEach(b => b.onclick = () => {
    const i = STATUSES.findIndex(s => s.key === b.dataset.stup);
    if (i > 0) { const t = STATUSES[i - 1]; STATUSES[i - 1] = STATUSES[i]; STATUSES[i] = t; }
    DB._statuses = STATUSES; save(); render();
  });
};

/* ================= Поля форм: правка ================= */
V.fields = () => head('Поля форм', `<button class="btn primary" id="addfld">Добавить поле</button>`) + `
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th class="mono">Handle</th>
    <th>Назначение</th><th>Тип</th><th>Обязательное</th><th>В чекауте</th><th></th></tr></thead><tbody>
  ${DB.fields.map(f => `<tr>
    <td><input type="text" data-fldt="${f.id}" value="${esc(f.title)}" style="max-width:240px"></td>
    <td class="mono">${esc(f.handle)}</td>
    <td><select data-flddest="${f.id}" style="max-width:140px">
      ${[['client','клиент'],['address','адрес'],['order','заказ']].map(([v,t])=>
        `<option value="${v}" ${f.destiny===v?'selected':''}>${t}</option>`).join('')}</select></td>
    <td><select data-fldtype="${f.id}" style="max-width:130px">
      ${['string','text','phone','email','checkbox','select'].map(t=>
        `<option ${f.type===t?'selected':''}>${t}</option>`).join('')}</select></td>
    <td><input type="checkbox" data-fldob="${f.id}" ${f.obligatory?'checked':''}></td>
    <td><input type="checkbox" data-fldch="${f.id}" ${f.show_in_checkout?'checked':''}></td>
    <td><button class="btn sm danger" data-flddel="${f.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="formfoot"><button class="btn primary" id="savefld">Сохранить</button>
    <span class="help" style="margin:0">Эти поля видит покупатель при оформлении заказа</span></div>`;
V.fields.bind = () => {
  $('#addfld').onclick = () => {
    const t = prompt('Название поля'); if (!t) return;
    DB.fields.push({ id: nextId(DB.fields), title: t, handle: slugify(t) || 'field',
      destiny: 'order', type: 'string', obligatory: false, show_in_checkout: true });
    save(); toast('Поле добавлено'); render();
  };
  $('#savefld').onclick = () => {
    DB.fields.forEach(f => {
      const t = document.querySelector(`[data-fldt="${f.id}"]`); if (t) f.title = t.value;
      const d = document.querySelector(`[data-flddest="${f.id}"]`); if (d) f.destiny = d.value;
      const ty = document.querySelector(`[data-fldtype="${f.id}"]`); if (ty) f.type = ty.value;
      const o = document.querySelector(`[data-fldob="${f.id}"]`); if (o) f.obligatory = o.checked;
      const c = document.querySelector(`[data-fldch="${f.id}"]`); if (c) f.show_in_checkout = c.checked;
    });
    save(); toast('Поля сохранены'); render();
  };
  document.querySelectorAll('[data-flddel]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить поле формы?', () => {
      DB.fields = DB.fields.filter(f => f.id !== +b.dataset.flddel); save(); toast('Удалено'); render();
    }));
};

/* ================= Опции товаров: правка ================= */
V.options = () => head('Опции товаров', `<button class="btn primary" id="addopt">Добавить опцию</button>`) + `
  <div class="notice info">Опции формируют варианты товара — размер, цвет и подобное.
    Отмеченные «в фильтрах» участвуют в фильтрации на витрине.</div>
  <div class="tablewrap"><table class="grid"><thead><tr><th>Название</th><th class="mono">Пермалинк</th>
    <th>В фильтрах</th><th class="num">Позиция</th><th></th></tr></thead><tbody>
  ${DB.option_names.map(o => `<tr>
    <td><input type="text" data-optt="${o.id}" value="${esc(o.title)}" style="max-width:220px"></td>
    <td class="mono">${esc(o.permalink)}</td>
    <td><input type="checkbox" data-optn="${o.id}" ${o.navigational ? 'checked' : ''}></td>
    <td class="num">${o.position}</td>
    <td><button class="btn sm danger" data-optdel="${o.id}">Удалить</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="formfoot"><button class="btn primary" id="saveopt">Сохранить</button></div>`;
V.options.bind = () => {
  $('#addopt').onclick = () => {
    const t = prompt('Название опции. Примеры: Размер, Цвет'); if (!t) return;
    DB.option_names.push({ id: nextId(DB.option_names), title: t, permalink: slugify(t) || 'opt',
      position: DB.option_names.length + 1, navigational: true });
    save(); toast('Опция добавлена'); render();
  };
  $('#saveopt').onclick = () => {
    DB.option_names.forEach(o => {
      const t = document.querySelector(`[data-optt="${o.id}"]`); if (t) o.title = t.value;
      const n = document.querySelector(`[data-optn="${o.id}"]`); if (n) o.navigational = n.checked;
    });
    save(); toast('Опции сохранены'); render();
  };
  document.querySelectorAll('[data-optdel]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить опцию?', () => {
      DB.option_names = DB.option_names.filter(o => o.id !== +b.dataset.optdel);
      save(); toast('Удалено'); render();
    }));
};

/* ================= Системные сниппеты: просмотр и правка ================= */
V.system_snippets = () => head('Системные сниппеты', `<button class="btn primary" id="addsn">Добавить сниппет</button>`) + `
  <div class="notice">Это инклюды платформы, которые подставляются в шаблоны темы. В исходниках темы
    их нет — при переносе магазина логику этих сниппетов придётся воспроизводить самостоятельно.</div>
  ${DB.system_snippets.map(s => `<div class="card"><h3>${esc(s.title)}</h3><div class="body">
    <div class="help" style="margin:0 0 10px">${esc(s.note)}</div>
    <textarea class="code" data-snc="${s.id}" style="min-height:110px">${esc(s.content || '{% comment %} содержимое сниппета {% endcomment %}')}</textarea>
    <div style="margin-top:10px"><button class="btn sm danger" data-sndel="${s.id}">Удалить</button></div>
  </div></div>`).join('')}
  <div class="formfoot"><button class="btn primary" id="savesn">Сохранить все</button></div>`;
V.system_snippets.bind = () => {
  $('#addsn').onclick = () => {
    const t = prompt('Имя сниппета'); if (!t) return;
    DB.system_snippets.push({ id: nextId(DB.system_snippets), title: t, note: 'пользовательский', content: '' });
    save(); toast('Сниппет добавлен'); render();
  };
  $('#savesn').onclick = () => {
    DB.system_snippets.forEach(s => {
      const c = document.querySelector(`[data-snc="${s.id}"]`); if (c) s.content = c.value;
    });
    save(); toast('Сниппеты сохранены');
  };
  document.querySelectorAll('[data-sndel]').forEach(b => b.onclick = () =>
    confirmDialog('Удалить сниппет?', () => {
      DB.system_snippets = DB.system_snippets.filter(s => s.id !== +b.dataset.sndel);
      save(); toast('Удалено'); render();
    }));
};

ROUTES.push([/^#\/collections$/, 'collections'], [/^#\/collections\/(.+)$/, 'collection']);
(function addCollectionsToNav() {
  const goods = NAV.find(n => n.t === 'Товары');
  goods.sub.splice(1, 0, ['Категории витрины', '#/collections']);
  SETTINGS_GROUPS[3][1].splice(0, 0, ['Категории витрины', '#/collections']);
})();

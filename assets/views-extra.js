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

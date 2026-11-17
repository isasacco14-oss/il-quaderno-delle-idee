
/* Il Quaderno delle Idee - Spesa per supermercato v1
   Non modifica ricette e calendario salvati. */
(function () {
  'use strict';

  const STORE_KEY = 'quadernoIdeeSupermercati_v1';
  const DEFAULT_STORES = [
    'Da scegliere', 'Esselunga', 'Lidl', 'Aldi',
    'Carrefour', 'Conad', 'Eurospin', 'Altro negozio'
  ];

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (_) {
      return {};
    }
  }

  let settings = read();
  if (!settings.products || typeof settings.products !== 'object')
    settings.products = {};
  if (!Array.isArray(settings.stores)) settings.stores = [];
  if (typeof settings.grouped !== 'boolean') settings.grouped = false;

  const stores = () => [...new Set([...DEFAULT_STORES, ...settings.stores])];
  const normalize = s => String(s || '').trim()
    .toLocaleLowerCase('it-IT').replace(/\s+/g, ' ');

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(settings));
    } catch (_) {
      const status = document.getElementById('status');
      if (status) status.textContent =
        'Impossibile salvare le preferenze dei supermercati';
    }
  }

  function make(tag, cls, label) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (label !== undefined) e.textContent = label;
    return e;
  }

  const style = make('style');
  style.textContent = `
    .qs-controls {
      margin: 14px 0;
      padding: 12px;
      border: 1px solid #bda17d;
      border-radius: 8px;
      background: rgba(255,248,229,.55);
    }
    .qs-controls h3 { margin: 0 0 7px; }
    .qs-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
    }
    .qs-actions button,
    .qs-actions input,
    .qs-shop-select {
      font: inherit;
      color: inherit;
      border: 1px solid #ad9070;
      border-radius: 6px;
      background: #fff9e9;
      padding: 5px 8px;
      max-width: 100%;
    }
    .qs-actions input {
      min-width: 0;
      flex: 1 1 140px;
    }
    .qs-shop-select {
      margin-left: auto;
      max-width: 45%;
      font-size: .9em;
    }
    .qs-shop-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .qs-shop-row > span {
      flex: 1 1 90px;
      overflow-wrap: anywhere;
    }
    .qs-group {
      margin: 14px 0 20px;
      padding: 8px 10px;
      border: 1px solid #c6ac8a;
      border-radius: 8px;
      background: rgba(255,249,236,.3);
    }
    .qs-group h3 {
      margin: 4px 0 10px;
      font-size: 1.35em;
    }
    .qs-note { font-size: .85em; opacity: .8; }
  `;
  document.head.appendChild(style);

  function init() {
    const list = document.getElementById('shopping');
    const status = document.getElementById('status');

    if (!list || typeof window.renderShopping !== 'function') return;

    const controls = make('div', 'qs-controls');
    const title = make('h3', '', '🛒 La spesa per supermercato');
    const note = make(
      'p', 'qs-note',
      'Scegli dove acquistare ogni prodotto. Le preferenze rimangono salvate su questo dispositivo; i negozi non indicano disponibilità verificata.'
    );

    const actions = make('div', 'qs-actions');
    const toggle = make('button', '', 'Organizza per supermercato');
    toggle.type = 'button';

    const addInput = make('input');
    addInput.type = 'text';
    addInput.placeholder = 'Nome di un altro negozio';
    addInput.setAttribute('aria-label', 'Nome del nuovo negozio');

    const addButton = make('button', '', 'Aggiungi negozio');
    addButton.type = 'button';

    actions.append(toggle, addInput, addButton);
    controls.append(title, note, actions);
    list.parentNode.insertBefore(controls, list);

    function updateToggle() {
      toggle.textContent = settings.grouped
        ? 'Mostra lista unica'
        : 'Organizza per supermercato';
    }

    function currentItems() {
      return typeof window.shoppingItems === 'function'
        ? window.shoppingItems()
        : [];
    }

    function chosen(item) {
      return settings.products[item.key] || 'Da scegliere';
    }

    function renderExtra() {
      updateToggle();
      const items = currentItems();
      const rows = [...list.querySelectorAll(':scope > .shop')];

      rows.forEach((row, index) => {
        const item = items[index];
        if (!item) return;

        row.classList.add('qs-shop-row');
        const select = make('select', 'qs-shop-select');
        select.setAttribute('aria-label', 'Supermercato per ' + item.name);

        for (const store of stores()) {
          select.add(new Option(store, store));
        }

        select.value = chosen(item);

        if (!stores().includes(select.value)) {
          select.add(new Option(chosen(item), chosen(item)));
          select.value = chosen(item);
        }

        select.addEventListener('change', () => {
          settings.products[item.key] = select.value;
          persist();
          if (settings.grouped) window.renderShopping();
        });

        row.append(select);
      });

      if (!settings.grouped || !items.length) return;

      const buckets = new Map();

      rows.forEach((row, i) => {
        const item = items[i];
        if (!item) return;

        const store = chosen(item);
        if (!buckets.has(store)) buckets.set(store, []);
        buckets.get(store).push(row);
      });

      const order = [...buckets.keys()].sort((a, b) =>
        a === 'Da scegliere' ? 1 :
        b === 'Da scegliere' ? -1 :
        a.localeCompare(b, 'it')
      );

      for (const store of order) {
        const group = make('div', 'qs-group');
        group.append(make('h3', '', store));

        for (const row of buckets.get(store)) {
          group.append(row);
        }

        list.append(group);
      }
    }

    const baseRender = window.renderShopping;

    window.renderShopping = function (...args) {
      const result = baseRender.apply(this, args);
      renderExtra();
      return result;
    };

    toggle.addEventListener('click', () => {
      settings.grouped = !settings.grouped;
      persist();
      window.renderShopping();
    });

    function addStore() {
      const name = addInput.value.trim().slice(0, 60);
      if (!name) return;

      if (!stores().some(s => normalize(s) === normalize(name))) {
        settings.stores.push(name);
      }

      addInput.value = '';
      persist();
      window.renderShopping();

      if (status) {
        status.textContent = '✓ Negozio disponibile nelle scelte';
      }
    }

    addButton.addEventListener('click', addStore);

    addInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addStore();
      }
    });

    const copy = document.getElementById('copy');

    if (copy) copy.onclick = async () => {
      const items = currentItems();
      const checked = typeof window.state === 'function'
        ? window.state().checked
        : [];

      const header = 'Lista della spesa · ' +
        (document.getElementById('weekTitle')?.textContent || '');

      let lines = [header];

      if (settings.grouped) {
        const groups = new Map();

        for (const item of items) {
          const store = chosen(item);
          if (!groups.has(store)) groups.set(store, []);
          groups.get(store).push(item);
        }

        for (const [store, group] of groups) {
          lines.push('', store);

          for (const item of group) {
            lines.push(
              (checked.includes(item.key) ? '☑ ' : '☐ ') +
              item.name
            );
          }
        }
      } else {
        lines.push(...items.map(item =>
          (checked.includes(item.key) ? '☑ ' : '☐ ') +
          item.name +
          (chosen(item) === 'Da scegliere'
            ? ''
            : ' · ' + chosen(item))
        ));
      }

      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        if (status) status.textContent = '✓ Lista copiata';
      } catch (_) {
        if (status) {
          status.textContent =
            'La copia non è disponibile: seleziona gli elementi dalla pagina';
        }
      }
    };

    window.renderShopping();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

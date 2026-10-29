import * as store from '../store.js';

const h = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

export function render(el) {
  const cfg = { latencyMs: 80, metronome: false, ...store.get('settings', {}) };
  const save = () => store.set('settings', cfg);

  const page = h('div', 'page');
  const top = h('header', 'topbar');
  const back = h('a', 'btn', '‹ Zurück');
  back.href = '#/';
  top.append(back, h('h1', null, 'Einstellungen'));

  const lat = h('div', 'card');
  const head = h('label', 'row');
  head.htmlFor = 'lat';
  const val = h('strong', null, `${cfg.latencyMs} ms`);
  head.append(h('span', null, 'Latenz-Ausgleich'), val);
  const range = h('input', 'range');
  Object.assign(range, { type: 'range', id: 'lat', min: 0, max: 300, step: 10, value: cfg.latencyMs });
  range.addEventListener('input', () => {
    cfg.latencyMs = Number(range.value);
    val.textContent = `${cfg.latencyMs} ms`;
    save();
  });
  lat.append(head, range, h('p', 'muted small', 'Wenn Treffer zu spät zählen, erhöhe den Wert'));

  const met = h('label', 'card row');
  const sw = h('input', 'switch');
  Object.assign(sw, { type: 'checkbox', checked: !!cfg.metronome });
  sw.addEventListener('change', () => { cfg.metronome = sw.checked; save(); });
  met.append(h('span', null, 'Metronom'), sw);

  const reset = h('button', 'btn btn-danger', 'Fortschritt zurücksetzen');
  reset.type = 'button';
  reset.addEventListener('click', () => {
    if (!confirm('Fortschritt wirklich zurücksetzen?')) return;
    store.set('progress', { lessons: {}, songs: {} });
  });

  page.append(top, lat, met, reset, h('p', 'muted small center', 'Riffwerk · Version 1.0'));
  el.append(page);
}

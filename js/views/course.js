export function render(el, params = {}) {
  const title = params.n ? `Lektion ${params.n}` : 'Kurs';
  el.innerHTML = `
    <header class="topbar"><a class="btn" href="#/">‹ Zurück</a><h1>${title}</h1></header>
    <p class="card">Kommt bald</p>
  `;
}

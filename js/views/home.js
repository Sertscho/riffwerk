export function render(el) {
  el.innerHTML = `
    <header class="topbar"><h1>Riffwerk</h1></header>
    <nav class="tile-list">
      <a class="tile" href="#/stimmen">Stimmen</a>
      <a class="tile" href="#/kurs">Kurs</a>
      <a class="tile" href="#/lieder">Lieder</a>
      <a class="tile" href="#/import">Guitar Pro laden</a>
      <a class="tile" href="#/einstellungen">Einstellungen</a>
    </nav>
  `;
}

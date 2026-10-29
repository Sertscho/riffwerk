// Eigene Rocker-Figur (SVG) für Intro und Startseite. Koordinaten ca. 0–135 × 0–140.
export const ROCKER = `
<g class="rk-head"><path d="M47 34 L44 22 L52 28 L55 16 L60 27 L66 15 L68 28 L76 21 L73 34Z" fill="#111" stroke="#fff" stroke-width="1.5"/><circle cx="60" cy="40" r="12" fill="#f3eee8" stroke="#111" stroke-width="2"/><rect x="51" y="36" width="18" height="5" rx="2" fill="#111"/></g>
<rect x="48" y="53" width="24" height="44" rx="8" fill="#2b2527" stroke="#fff" stroke-width="1.5"/>
<path d="M54 96 L42 134 M66 96 L82 134" stroke="#fff" stroke-width="11" stroke-linecap="round"/>
<path d="M54 96 L42 134 M66 96 L82 134" stroke="#2b2527" stroke-width="8" stroke-linecap="round"/>
<path d="M52 62 L88 70" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
<path d="M52 62 L88 70" stroke="#2b2527" stroke-width="6" stroke-linecap="round"/>
<g transform="rotate(-24 66 88)"><path d="M48 80 C48 70 62 70 64 78 C66 70 82 70 82 82 C82 96 66 100 64 92 C60 100 48 96 48 80Z" fill="#e10600" stroke="#fff" stroke-width="2"/><rect x="80" y="83" width="44" height="5" fill="#111" stroke="#fff" stroke-width="1"/><rect x="122" y="80" width="10" height="11" rx="2" fill="#fff"/><circle cx="62" cy="85" r="3" fill="#111"/></g>
<g class="rk-arm"><path d="M68 62 L74 90" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M68 62 L74 90" stroke="#2b2527" stroke-width="6" stroke-linecap="round"/><circle cx="74" cy="91" r="5" fill="#f3eee8" stroke="#111" stroke-width="2"/></g>`;

// Blitze, die vom Rocker ausgehen (gleiches Koordinatensystem wie ROCKER)
const bolt = (x, y, rot, s, color, delay) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><polygon class="rk-bolt" style="animation-delay:${delay}s" points="0,0 -8,22 0,22 -10,46 14,14 5,14 12,0" fill="${color}" stroke="#fff" stroke-width="1.5"/></g>`;
export const BOLTS = [
  bolt(30, 6, -35, 1.4, '#fff', 0),
  bolt(96, 0, 30, 1.3, '#e10600', 0.35),
  bolt(150, 50, 70, 1.5, '#fff', 0.6),
  bolt(16, 72, -80, 1.2, '#e10600', 0.85),
  bolt(122, 110, 120, 1.2, '#fff', 0.2),
  bolt(-10, 30, -60, 1.1, '#fff', 0.5),
  bolt(165, 10, 50, 1.1, '#e10600', 0.95),
].join('');

// localStorage-Zugriff. Alle Fehler (privater Modus, gesperrter Speicher) werden abgefangen.
const PREFIX = 'riffwerk:';

export function get(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Speichern nicht möglich: ignorieren
  }
}

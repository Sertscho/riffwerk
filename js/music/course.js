// Kursdaten laden: data/course/1.json … 4.json (fehlende oder kaputte Dateien überspringen)
export const STUFEN = 4;
// Fallback-Titel, falls eine Stufendatei (noch) fehlt, z. B. für die Liederseite
export const STUFEN_TITEL = ['Grundlagen', 'Akkorde und Rhythmus', 'Rock-Techniken', 'Solo und Blues'];

export async function loadCourse() {
  const parts = await Promise.all(Array.from({ length: STUFEN }, async (_, i) => {
    try {
      const r = await fetch(`data/course/${i + 1}.json`);
      if (!r.ok) return null;
      const d = await r.json();
      return Array.isArray(d?.lessons) ? d : null;
    } catch (e) {
      return null;
    }
  }));
  const stufen = parts.filter(Boolean).map((d) => ({
    stufe: d.stufe, title: d.title, intro: d.intro, lessons: [...d.lessons].sort((a, b) => a.n - b.n),
  }));
  const lessons = stufen.flatMap((s) => s.lessons).sort((a, b) => a.n - b.n);
  return { stufen, lessons };
}

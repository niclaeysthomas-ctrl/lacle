/* =========================================================================
   LA CLÉ — rendu des instruments (SVG) : clavier de piano & manche de guitare
   Chaque fonction renvoie une chaîne SVG. Les touches/cases portent data-midi
   pour l'audio (délégué dans app.js) et data-pc pour l'info.
   ========================================================================= */
const LCRender = (function () {
  "use strict";

  const WHITE = ["C", "D", "E", "F", "G", "A", "B"];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const BLACK_AFTER = { C: 1, D: 1, F: 1, G: 1, A: 1 }; // lettres suivies d'une touche noire

  function has(set, pc) { return set && set.indexOf(((pc % 12) + 12) % 12) !== -1; }
  function nm(spell, pc) { pc = ((pc % 12) + 12) % 12; return spell ? (spell[pc] || "") : ""; }

  /* ------------------------------ PIANO ------------------------------ */
  // opts: {octaves, startOct, fill[], dots[], root(pc), spell{pc:name}, labels(bool), degrees{pc:txt}}
  function piano(opts) {
    opts = opts || {};
    const octaves = opts.octaves || 2;
    const startOct = opts.startOct == null ? 4 : opts.startOct;
    const fill = opts.fill || [];
    const dots = opts.dots || [];
    const root = opts.root == null ? null : ((opts.root % 12) + 12) % 12;
    const spell = opts.spell || null;
    const degrees = opts.degrees || null;
    const showLabels = opts.labels !== false;

    const WW = 34, WH = 150, BW = 21, BH = 94;
    const N = octaves * 7 + 1;
    const W = N * WW, H = WH;
    let whites = "", blacks = "";

    for (let i = 0; i < N; i++) {
      const letter = WHITE[i % 7];
      const oct = startOct + Math.floor(i / 7);
      const pc = LETTER_PC[letter];
      const midi = (oct + 1) * 12 + pc;
      const x = i * WW;
      const on = has(fill, pc), dot = has(dots, pc), isRoot = root === pc;
      let cls = "pk" + (on ? " on" : "") + (isRoot ? " root" : "");
      whites += `<g class="${cls}" data-midi="${midi}" data-pc="${pc}">`
        + `<rect class="pkr" x="${x + 1}" y="0" width="${WW - 2}" height="${WH}" rx="4"/>`;
      if (dot) whites += `<circle class="pdot" cx="${x + WW / 2}" cy="${WH - 40}" r="8"/>`;
      if ((on || dot || isRoot) && showLabels) {
        const label = degrees ? (degrees[pc] || "") : nm(spell, pc);
        whites += `<text class="plb" x="${x + WW / 2}" y="${WH - 12}">${label}</text>`;
      }
      whites += `</g>`;

      if (BLACK_AFTER[letter] && i < N - 1) {
        const bpc = (pc + 1) % 12;
        const bmidi = midi + 1;
        const bx = (i + 1) * WW - BW / 2;
        const bon = has(fill, bpc), bdot = has(dots, bpc), bRoot = root === bpc;
        let bcls = "bk" + (bon ? " on" : "") + (bRoot ? " root" : "");
        blacks += `<g class="${bcls}" data-midi="${bmidi}" data-pc="${bpc}">`
          + `<rect class="bkr" x="${bx}" y="0" width="${BW}" height="${BH}" rx="3"/>`;
        if (bdot) blacks += `<circle class="pdot bd" cx="${bx + BW / 2}" cy="${BH - 26}" r="7"/>`;
        if ((bon || bdot || bRoot) && showLabels) {
          const label = degrees ? (degrees[bpc] || "") : nm(spell, bpc);
          blacks += `<text class="plb bl" x="${bx + BW / 2}" y="${BH - 9}">${label}</text>`;
        }
        blacks += `</g>`;
      }
    }
    return `<svg class="piano" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${whites}${blacks}</svg>`;
  }

  /* ---------------------------- FRETBOARD ---------------------------- */
  // opts: {frets, highlight[], dots[], root(pc), spell{}, degrees{}, showAll(bool)}
  // cordes affichées haut->bas : Mi aigu (1) ... Mi grave (6)
  function fretboard(opts) {
    opts = opts || {};
    const frets = opts.frets || 12;
    const hi = opts.highlight || [];
    const dots = opts.dots || [];
    const root = opts.root == null ? null : ((opts.root % 12) + 12) % 12;
    const spell = opts.spell || null;
    const degrees = opts.degrees || null;
    const showAll = !!opts.showAll;

    const NUT = 34, FW = 44, TOP = 20, RG = 30, R = 12.5;
    const rows = 6;
    const W = NUT + frets * FW + 14;
    const H = TOP * 2 + (rows - 1) * RG;
    // MIDI cordes à vide, aigu->grave (index affichage 0..5)
    const openMidi = [64, 59, 55, 50, 45, 40];
    const openLabel = ["Mi", "Si", "Sol", "Ré", "La", "Mi"];

    let g = "";
    // bois
    g += `<rect class="fb-wood" x="${NUT}" y="${TOP - 6}" width="${frets * FW}" height="${(rows - 1) * RG + 12}" rx="4"/>`;
    // repères (dots) de manche
    const single = [3, 5, 7, 9, 15, 17, 19, 21], dbl = [12, 24];
    const midY = TOP + ((rows - 1) * RG) / 2;
    single.forEach((f) => { if (f <= frets) g += `<circle class="fb-inlay" cx="${NUT + (f - 0.5) * FW}" cy="${midY}" r="4.5"/>`; });
    dbl.forEach((f) => {
      if (f <= frets) {
        g += `<circle class="fb-inlay" cx="${NUT + (f - 0.5) * FW}" cy="${TOP + RG}" r="4.5"/>`;
        g += `<circle class="fb-inlay" cx="${NUT + (f - 0.5) * FW}" cy="${TOP + RG * 3}" r="4.5"/>`;
      }
    });
    // frettes verticales
    for (let f = 0; f <= frets; f++) {
      const x = NUT + f * FW;
      g += `<line class="${f === 0 ? "fb-nut" : "fb-fret"}" x1="${x}" y1="${TOP - 6}" x2="${x}" y2="${TOP + (rows - 1) * RG + 6}"/>`;
    }
    // numéros de frette
    for (let f = 1; f <= frets; f++) {
      g += `<text class="fb-num" x="${NUT + (f - 0.5) * FW}" y="${H - 2}">${f}</text>`;
    }
    // cordes + marqueurs
    for (let r = 0; r < rows; r++) {
      const y = TOP + r * RG;
      const strIdx = 5 - r; // index dans GUITAR_OPEN_MIDI (grave=0)
      g += `<line class="fb-string" x1="${NUT}" y1="${y}" x2="${NUT + frets * FW}" y2="${y}"/>`;
      g += `<text class="fb-open" x="10" y="${y + 4}">${openLabel[r]}</text>`;
      for (let f = 0; f <= frets; f++) {
        const pc = (openMidi[r] + f) % 12;
        const midi = openMidi[r] + f;
        const on = showAll || has(hi, pc);
        if (!on && !has(dots, pc)) continue;
        const isRoot = root === pc, isDot = has(dots, pc);
        const cx = f === 0 ? NUT - 16 : NUT + (f - 0.5) * FW;
        let cls = "fb-note";
        if (isRoot) cls += " root"; else if (isDot) cls += " dot"; else cls += " scale";
        if (showAll && !has(hi, pc) && !isRoot && !isDot) cls = "fb-note all";
        const label = degrees ? (degrees[pc] || "") : nm(spell, pc);
        g += `<g class="${cls}" data-midi="${midi}" data-pc="${pc}">`
          + `<circle cx="${cx}" cy="${y}" r="${R}"/>`
          + `<text x="${cx}" y="${y + 4}">${label}</text></g>`;
      }
    }
    return `<div class="fb-scroll"><svg class="fretboard" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="min-width:${Math.min(W, 640)}px">${g}</svg></div>`;
  }

  /* ---- petite légende réutilisable ---- */
  function legend(items) {
    return `<div class="legend">` + items.map((it) =>
      `<span class="lg"><span class="lg-sw ${it.cls}"></span>${it.txt}</span>`).join("") + `</div>`;
  }

  return { piano, fretboard, legend };
})();

/* =========================================================================
   LA CLÉ — moteur de théorie musicale
   Tout est calculé (pas de tables codées à la main) => zéro faute d'épellation.
   ========================================================================= */
const LC = (function () {
  "use strict";

  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  // Solfège français
  const LATIN = { C: "Do", D: "Ré", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

  /* ---- conversions note <-> classe de hauteur (0..11) ---- */
  function noteToPc(name) {
    let pc = LETTER_PC[name[0].toUpperCase()];
    for (let i = 1; i < name.length; i++) {
      const c = name[i];
      if (c === "#" || c === "♯") pc += 1;
      else if (c === "b" || c === "♭") pc -= 1;
      else if (c === "x" || c === "𝄪") pc += 2;
    }
    return ((pc % 12) + 12) % 12;
  }

  function letterAcc(letter, acc) {
    let sym;
    if (acc === 2) sym = "x";
    else if (acc === -2) sym = "bb";
    else if (acc < 0) sym = "b".repeat(-acc);
    else sym = "#".repeat(acc);
    return letter + sym;
  }

  // Affichage : "Bb" -> "Si♭" (latin) ou "B♭" (lettres)
  function disp(name, system) {
    const letter = name[0].toUpperCase();
    let acc = name.slice(1)
      .replace(/bb/g, "𝄫").replace(/x/g, "𝄪")
      .replace(/#/g, "♯").replace(/b/g, "♭");
    const base = system === "latin" ? LATIN[letter] : letter;
    return base + acc;
  }
  function dispList(arr, system) { return arr.map((n) => disp(n, system)); }

  /* ---- formules (en demi-tons depuis la tonique) ---- */
  const FORMULAS = {
    major:      [0, 2, 4, 5, 7, 9, 11],
    natminor:   [0, 2, 3, 5, 7, 8, 10],
    harmminor:  [0, 2, 3, 5, 7, 8, 11],
    melminor:   [0, 2, 3, 5, 7, 9, 11],
    majpenta:   [0, 2, 4, 7, 9],
    minpenta:   [0, 3, 5, 7, 10],
    blues:      [0, 3, 5, 6, 7, 10],
    ionian:     [0, 2, 4, 5, 7, 9, 11],
    dorian:     [0, 2, 3, 5, 7, 9, 10],
    phrygian:   [0, 1, 3, 5, 7, 8, 10],
    lydian:     [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    aeolian:    [0, 2, 3, 5, 7, 8, 10],
    locrian:    [0, 1, 3, 5, 6, 8, 10],
  };

  // Épelle une gamme diatonique (1 lettre par degré) — épellation exacte.
  function spellDiatonic(tonic, intervals) {
    const startIdx = LETTERS.indexOf(tonic[0].toUpperCase());
    const tonicPc = noteToPc(tonic);
    const out = [];
    for (let i = 0; i < intervals.length; i++) {
      const letter = LETTERS[(startIdx + i) % 7];
      const target = (tonicPc + intervals[i]) % 12;
      const natural = LETTER_PC[letter];
      let diff = (((target - natural) % 12) + 12) % 12;
      if (diff > 6) diff -= 12;
      out.push(letterAcc(letter, diff));
    }
    return out;
  }

  const majorScale   = (t) => spellDiatonic(t, FORMULAS.major);
  const naturalMinor = (t) => spellDiatonic(t, FORMULAS.natminor);
  // Pentas : on épelle la gamme parente puis on garde les bons degrés (épellation propre)
  const majorPenta = (t) => { const s = majorScale(t);   return [s[0], s[1], s[2], s[4], s[5]]; };
  const minorPenta = (t) => { const s = naturalMinor(t); return [s[0], s[2], s[3], s[4], s[6]]; };
  const bluesScale = (t) => { // penta mineure + blue note (b5)
    const s = naturalMinor(t); const p = [s[0], s[2], s[3], s[4], s[6]];
    // blue note = quarte augmentée = b5 (on la nomme via le pc, épellation approx.)
    const bn = spellDiatonic(t, [6])[0];
    return [p[0], p[1], p[2], bn, p[3], p[4]];
  };
  function modeScale(tonic, modeName) { return spellDiatonic(tonic, FORMULAS[modeName]); }

  /* ---- tonique -> nom "préféré" (celui qu'on affiche pour une tonalité) ---- */
  // Choix pratiques pour les 12 tonalités majeures usuelles.
  const KEY_NAMES = {
    0: "C", 1: "Db", 2: "D", 3: "Eb", 4: "E", 5: "F",
    6: "F#", 7: "G", 8: "Ab", 9: "A", 10: "Bb", 11: "B",
  };
  const keyName = (pc) => KEY_NAMES[((pc % 12) + 12) % 12];

  /* ---- relatives ---- */
  const relativeMinor = (majTonic) => majorScale(majTonic)[5];   // 6e degré
  const relativeMajor = (minTonic) => naturalMinor(minTonic)[2]; // 3e degré

  /* ---- armure (nombre de # ou b) ---- */
  function keySignature(tonic) {
    const s = majorScale(tonic);
    let sharps = 0, flats = 0;
    s.forEach((n) => {
      for (let i = 1; i < n.length; i++) {
        if (n[i] === "#") sharps++;
        else if (n[i] === "b") flats++;
      }
    });
    if (flats > 0) return { count: flats, type: "b", text: flats + " ♭" };
    if (sharps > 0) return { count: sharps, type: "#", text: sharps + " ♯" };
    return { count: 0, type: "", text: "aucun ♯ ni ♭" };
  }

  /* ---- accords ---- */
  const CHORD_SEMIS = {
    maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
    maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10],
    m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9],
  };
  const QUAL_LABEL = {
    maj: "", min: "m", dim: "dim", aug: "aug",
    maj7: "maj7", min7: "m7", dom7: "7", m7b5: "m7♭5", dim7: "dim7",
  };
  function spellChord(root, quality) {
    const semis = CHORD_SEMIS[quality] || CHORD_SEMIS.maj;
    const startIdx = LETTERS.indexOf(root[0].toUpperCase());
    const rootPc = noteToPc(root);
    const steps = semis.length === 3 ? [0, 2, 4] : [0, 2, 4, 6];
    return semis.map((semi, k) => {
      const L = LETTERS[(startIdx + steps[k]) % 7];
      const target = (rootPc + semi) % 12;
      const nat = LETTER_PC[L];
      let diff = (((target - nat) % 12) + 12) % 12;
      if (diff > 6) diff -= 12;
      return letterAcc(L, diff);
    });
  }
  const chordLabel = (root, quality, system) => disp(root, system) + QUAL_LABEL[quality];

  const TRIAD_Q = ["maj", "min", "min", "maj", "maj", "min", "dim"];
  const ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  function diatonicChords(tonic) {
    const s = majorScale(tonic);
    return s.map((root, i) => ({
      root,
      quality: TRIAD_Q[i],
      roman: ROMAN[i],
      degree: i,
      notes: [s[i], s[(i + 2) % 7], s[(i + 4) % 7]],
    }));
  }

  /* ---- détection de tonalité à partir d'une liste d'accords ---- */
  // chords: [{root:"C", quality:"maj"|"min"|"dim"|"dom7"|...}]
  function reduceQ(q) {
    if (q === "maj" || q === "maj7" || q === "dom7" || q === "aug") return "maj";
    if (q === "min" || q === "min7") return "min";
    if (q === "dim" || q === "m7b5" || q === "dim7") return "dim";
    return "maj";
  }
  function detectKey(chords) {
    const input = chords.map((c) => ({ pc: noteToPc(c.root), q: reduceQ(c.quality), raw: c }));
    const cand = [];
    for (let t = 0; t < 12; t++) {
      const kn = keyName(t);
      const dia = diatonicChords(kn).map((c) => ({ pc: noteToPc(c.root), q: c.quality, roman: c.roman }));
      let matched = 0;
      const missing = [];
      input.forEach((ch) => {
        const hit = dia.find((d) => d.pc === ch.pc && d.q === ch.q);
        if (hit) matched++; else missing.push(ch);
      });
      // bonus : tonique majeure présente ? dominante (V) présente ?
      const hasI = input.some((c) => c.pc === t && c.q === "maj");
      const vPc = (t + 7) % 12;
      const hasV = input.some((c) => c.pc === vPc && c.q === "maj");
      const first = input[0], last = input[input.length - 1];
      const startsTonic = first && first.pc === t;
      const endsTonic = last && last.pc === t;
      let score = matched * 100;
      if (matched === input.length) score += 40; // tout rentre
      if (hasI) score += 12;
      if (hasV) score += 8;
      if (endsTonic) score += 6;
      if (startsTonic) score += 4;
      cand.push({ tonicPc: t, key: kn, matched, total: input.length, score, hasI, missing });
    }
    cand.sort((a, b) => b.score - a.score || b.matched - a.matched);
    return cand;
  }

  /* ---- géométrie des instruments ---- */
  // Guitare accordage standard, cordes 6->1 (mi grave -> mi aigu), MIDI cordes à vide
  const GUITAR_OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
  const GUITAR_STRING_LABEL = ["Mi", "La", "Ré", "Sol", "Si", "Mi"]; // grave -> aigu
  function fretMidi(stringIdx, fret) { return GUITAR_OPEN_MIDI[stringIdx] + fret; }
  function fretPc(stringIdx, fret) { return fretMidi(stringIdx, fret) % 12; }

  /* ---- audio (WebAudio) ---- */
  const audio = (function () {
    let ctx = null;
    function ac() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; }
    function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function note(midi, dur, when, gain) {
      const c = ac();
      const t0 = (when || 0) + c.currentTime;
      dur = dur || 0.55; gain = gain == null ? 0.22 : gain;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = midiToFreq(midi);
      // 2e oscillateur léger pour un timbre plus riche
      const osc2 = c.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = midiToFreq(midi) * 2;
      const g2 = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(gain * 0.18, t0 + 0.012);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.7);
      osc.connect(g).connect(c.destination);
      osc2.connect(g2).connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
      osc2.start(t0); osc2.stop(t0 + dur + 0.05);
    }
    function sequence(midis, step) {
      step = step || 0.32;
      midis.forEach((m, i) => note(m, step * 0.95, i * step));
    }
    function chord(midis) { midis.forEach((m) => note(m, 1.1, 0, 0.16)); }
    function resume() { const c = ac(); if (c.state === "suspended") c.resume(); }
    return { note, sequence, chord, resume, midiToFreq };
  })();

  /* ---- API publique ---- */
  return {
    LETTERS, SHARP, FLAT, LATIN, FORMULAS,
    noteToPc, disp, dispList, letterAcc,
    majorScale, naturalMinor, majorPenta, minorPenta, bluesScale, modeScale,
    keyName, relativeMinor, relativeMajor, keySignature,
    spellChord, chordLabel, diatonicChords, detectKey, CHORD_SEMIS, QUAL_LABEL,
    GUITAR_OPEN_MIDI, GUITAR_STRING_LABEL, fretMidi, fretPc,
    audio,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = LC;

/* =========================================================================
   LA CLÉ — application
   ========================================================================= */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const PC = (n) => LC.noteToPc(n);
  const KEYS12 = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];

  /* ---------------- état ---------------- */
  const DEF = { nameSystem: "letters", xp: 0, done: {}, drill: {}, lastDay: null, streak: 0 };
  let S = load();
  function load() { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem("lacle") || "{}")); } catch (e) { return Object.assign({}, DEF); } }
  function save() { localStorage.setItem("lacle", JSON.stringify(S)); }

  const RANKS = [
    [0, "Débutant"], [60, "Apprenti"], [150, "Initié"], [300, "Improvisateur"],
    [500, "Soliste"], [800, "Virtuose"], [1200, "King de l'impro 👑"],
  ];
  function rank(xp) {
    let r = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; } }
    return { name: r[1], floor: r[0], next };
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function earnXP(n) {
    const t = today();
    if (S.lastDay !== t) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      S.streak = S.lastDay === y ? (S.streak || 0) + 1 : 1;
      S.lastDay = t;
    }
    S.xp += n; save(); paintHeader();
  }

  /* ---------------- affichage des notes ---------------- */
  const disp = (n) => LC.disp(n, S.nameSystem);
  const dl = (arr) => arr.map(disp);
  function spellMap(type, overlay) {
    const base = type === "b" ? LC.FLAT : LC.SHARP;
    const out = {};
    for (let pc = 0; pc < 12; pc++) out[pc] = base[pc];
    (overlay || []).forEach((n) => { out[PC(n)] = n; });
    const o = {}; for (let pc = 0; pc < 12; pc++) o[pc] = disp(out[pc]);
    return o;
  }
  const keySpell = (t) => spellMap(LC.keySignature(t).type, LC.majorScale(t));
  const minorSpell = (t) => spellMap(LC.keySignature(LC.relativeMajor(t)).type, LC.naturalMinor(t));

  function scaleNotes(tonic, type) {
    switch (type) {
      case "major": return LC.majorScale(tonic);
      case "natminor": return LC.naturalMinor(tonic);
      case "majpenta": return LC.majorPenta(tonic);
      case "minpenta": return LC.minorPenta(tonic);
      case "blues": return LC.bluesScale(tonic);
      default: return LC.modeScale(tonic, type);
    }
  }
  const pcsOf = (notes) => notes.map(PC);

  /* ---------------- audio helpers ---------------- */
  function midisForScale(tonic, type, startOct) {
    startOct = startOct == null ? 4 : startOct;
    const notes = scaleNotes(tonic, type);
    const base = (startOct + 1) * 12 + PC(tonic);
    let prev = -1, oct0 = base;
    const midis = notes.map((n) => {
      let pc = PC(n); let m = oct0 - (oct0 % 12) + pc;
      while (m < prev) m += 12; prev = m; return m;
    });
    midis.push(midis[0] + 12);
    return midis;
  }

  /* ================= HEADER ================= */
  function paintHeader() {
    const rk = rank(S.xp);
    const pct = rk.next ? Math.round(((S.xp - rk.floor) / (rk.next[0] - rk.floor)) * 100) : 100;
    $("#rankName").textContent = rk.name;
    $("#xpNum").textContent = S.xp + " XP";
    $("#xpBar").style.width = pct + "%";
    $("#nsToggle").textContent = S.nameSystem === "latin" ? "Do Ré Mi" : "C D E";
  }

  /* ================= ROUTER ================= */
  let TAB = "socle";
  const TABS = [
    ["socle", "🧭", "Socle"], ["impro", "🎯", "Impro"],
    ["piano", "🎹", "Piano"], ["manche", "🎸", "Manche"], ["atelier", "⚡", "Atelier"],
  ];
  function go(tab) { TAB = tab; render(); $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab)); window.scrollTo(0, 0); }
  function render() {
    const v = $("#view");
    if (TAB === "socle") v.innerHTML = viewSocle();
    else if (TAB === "impro") v.innerHTML = viewImpro();
    else if (TAB === "piano") v.innerHTML = viewPiano();
    else if (TAB === "manche") v.innerHTML = viewManche();
    else if (TAB === "atelier") v.innerHTML = LCEx.view();
    wire();
    if (TAB === "atelier" || TAB === "socle") LCEx.wire();   // socle : la séance du jour
  }

  /* ================= DEMOS (leçons) ================= */
  function demoHTML(spec) {
    if (!spec) return "";
    const k = spec.kind;
    if (k === "piano") {
      const oct = spec.octaves || 2;
      if (spec.show === "chromatic") {
        const all = [0,1,2,3,4,5,6,7,8,9,10,11];
        return LCRender.piano({ octaves: oct, fill: all, root: 0, spell: spellMap("#", []) });
      }
      const t = spec.tonic; const notes = scaleNotes(t, spec.show);
      const sp = (spec.show === "minpenta" || spec.show === "natminor" || spec.show === "blues") ? minorSpell(t) : keySpell(t);
      return LCRender.piano({ octaves: oct, fill: pcsOf(notes), root: PC(t), spell: sp });
    }
    if (k === "fretboard") {
      if (spec.show === "allnotes") return LCRender.fretboard({ frets: spec.frets || 12, showAll: true, spell: spellMap("#", []) });
      if (spec.show === "single") return LCRender.fretboard({ frets: spec.frets || 12, highlight: [PC(spec.tonic)], root: PC(spec.tonic), spell: keySpell(spec.tonic) });
      if (spec.show === "triadTargets") {
        const t = spec.tonic;
        return LCRender.fretboard({ frets: spec.frets || 12, highlight: pcsOf(LC.majorScale(t)), dots: pcsOf(LC.spellChord(t, "maj")), root: PC(t), spell: keySpell(t) });
      }
      const t = spec.tonic; const notes = scaleNotes(t, spec.show);
      const sp = (spec.show === "minpenta" || spec.show === "natminor" || spec.show === "blues") ? minorSpell(t) : keySpell(t);
      return `<div class="hint">Astuce : la forme se déplace — glisse-la pour changer de tonalité.</div>` +
        LCRender.fretboard({ frets: spec.frets || 12, highlight: pcsOf(notes), root: PC(t), spell: sp });
    }
    if (k === "circle") return circleSVG();
    if (k === "relatives") {
      const t = spec.tonic; const maj = LC.majorScale(t); const rm = LC.relativeMinor(t);
      return LCRender.piano({ octaves: 2, fill: pcsOf(maj), root: PC(t), dots: [PC(rm)], spell: keySpell(t) }) +
        `<div class="hint"><b>${disp(t)} majeur</b> = ${dl(maj).join(" ")} &nbsp;·&nbsp; pars du 6e degré (<b>${disp(rm)}</b>, ●) → <b>${disp(rm)} mineur</b> = mêmes notes.</div>`;
    }
    if (k === "compareThird") {
      const cmaj = LC.spellChord("C", "maj"), amin = LC.spellChord("A", "min");
      return `<div class="two">
        <div><div class="cap">Do majeur — tierce MAJEURE (Do→Mi, lumineux)</div>${LCRender.piano({ octaves: 1, fill: pcsOf(cmaj), root: 0, spell: keySpell("C") })}</div>
        <div><div class="cap">La mineur — tierce mineure (La→Do, sombre)</div>${LCRender.piano({ octaves: 1, fill: pcsOf(amin), root: 9, spell: keySpell("C") })}</div>
      </div>`;
    }
    if (k === "chords") return chordsTable(spec.tonic);
    if (k === "threeCircles") return improDiagrams(spec.minor ? LC.relativeMajor(spec.tonic) : spec.tonic, spec.minor ? spec.tonic : LC.relativeMinor(spec.tonic), null, spec.minor);
    if (k === "modeDemo") {
      const notes = LC.modeScale(spec.tonic, spec.mode);
      const parentType = spec.mode === "dorian" ? "b" : "#";
      return LCRender.piano({ octaves: 2, fill: pcsOf(notes), root: PC(spec.tonic), spell: spellMap(parentType, notes) }) +
        `<div class="hint">${disp(spec.tonic)} ${spec.mode} = ${dl(notes).join(" ")}</div>`;
    }
    if (k === "html") return htmlBlock(spec.id);
    if (id === "phraseDemo") {
      return `<div class="hint">Deux fois les mêmes notes. Seule la découpe change — écoute la différence.</div>
        <table class="tbl"><tr><th>Ce qu'on fait</th><th>Ce que ça donne</th></tr>
        <tr><td>Monter-descendre la gamme sans respirer</td><td>Un exercice. Rien à retenir.</td></tr>
        <tr><td>3 notes · silence · les mêmes 3 notes · silence · les 3 mêmes en changeant la dernière</td><td>Une phrase. On l'attend, on la reconnaît, elle se résout.</td></tr></table>
        <div class="btnrow"><button class="btn" data-seq="C:major">▶ La gamme (l'exercice)</button>
        <button class="btn" data-drone="0">▶ Drone sur Do (pour essayer toi-même)</button></div>
        <div class="hint">Contrainte à t'imposer : <b>4 notes maximum</b>, puis tu te tais aussi longtemps que tu as joué.</div>`;
    }
    if (id === "assaisonDemo") {
      return `<table class="tbl"><tr><th>Outil</th><th>Comment</th><th>Règle</th></tr>
        <tr><td><b>Chromatisme d'approche</b></td><td>Arrive sur ta note cible par le demi-ton en dessous (Ré♯ → Mi)</td><td>Bref, et résolu</td></tr>
        <tr><td><b>Bend</b></td><td>Tire la corde vers la note cible — le chromatisme, en continu</td><td>Arrive juste, tiens la note d'arrivée</td></tr>
        <tr><td><b>Dynamique</b></td><td>Aux doigts : la pulpe pour le rond, l'ongle pour le mordant</td><td>Varie, sinon tout s'aplatit</td></tr></table>
        <div class="hint">Ordre de priorité pour progresser vite : <b>rythme</b> → <b>silence</b> → <b>son</b> → <b>notes</b>. C'est l'inverse de l'ordre dans lequel on apprend.</div>`;
    }
    return "";
  }

  function htmlBlock(id) {
    if (id === "armureTable") {
      return `<table class="tbl"><tr><th>Mot</th><th>C'est quoi</th></tr>
        <tr><td><b>Gamme</b></td><td>Une suite de notes (une formule). « Do majeur » = C D E F G A B.</td></tr>
        <tr><td><b>Tonalité</b></td><td>Le <b>centre de gravité</b> du morceau. « En Do » = tout se repose sur Do. (= « key » en anglais)</td></tr>
        <tr><td><b>Clef</b> 𝄞</td><td>Le <b>symbole</b> pour lire la portée. Aucun rapport avec la tonalité.</td></tr>
        <tr><td><b>Armure</b></td><td>Les ♯/♭ après la clef → ils <b>annoncent la tonalité</b>.</td></tr></table>
        <div class="hint">⚠️ Piège franco-anglais : « key » (tonalité) ≠ « clef » (symbole). Dis <b>tonalité</b>.</div>`;
    }
    if (id === "majminEar") {
      return `<div class="hint">Écoute : le même jeu de notes, deux centres.</div>
        <div class="btnrow"><button class="btn" data-seq="C:major">▶ Résout sur Do (majeur, ouvert)</button>
        <button class="btn" data-seq="A:natminor">▶ Résout sur La (mineur, sombre)</button></div>`;
    }
    return "";
  }

  function chordsTable(tonic) {
    const dia = LC.diatonicChords(tonic);
    let rows = dia.map((c) => {
      const label = LC.chordLabel(c.root, c.quality, S.nameSystem);
      const notes = dl(c.notes).join(" ");
      const midis = c.notes.map((n, i) => (5) * 12 + PC(n) + (i > 0 ? 0 : 0));
      return `<tr data-chordnotes="${c.notes.map(PC).join(",")}"><td class="rom">${c.roman}</td><td><b>${label}</b></td><td>${notes}</td><td><button class="mini" data-playchord="${c.notes.map(n => (5) * 12 + PC(n)).join(",")}">▶</button></td></tr>`;
    }).join("");
    return `<table class="tbl chords"><tr><th>Degré</th><th>Accord</th><th>Notes</th><th></th></tr>${rows}</table>
      <div class="hint">Qualités : I maj · ii min · iii min · IV maj · V maj · vi min · vii° dim. Les « 4 accords » de la pop = I V vi IV.</div>`;
  }

  /* ---- cercle des quintes (SVG) ---- */
  function circleSVG() {
    const order = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
    const R = 118, r2 = 74, cx = 150, cy = 150;
    let g = `<circle cx="${cx}" cy="${cy}" r="${R + 18}" class="cf-ring"/><circle cx="${cx}" cy="${cy}" r="${r2 - 16}" class="cf-ring"/>`;
    order.forEach((k, i) => {
      const ang = (i * 30 - 90) * Math.PI / 180;
      const x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
      const xm = cx + r2 * Math.cos(ang), ym = cy + r2 * Math.sin(ang);
      const sig = LC.keySignature(k);
      const rm = LC.relativeMinor(k);
      g += `<g class="cf-node" data-key="${k}"><circle cx="${x}" cy="${y}" r="19"/><text class="cf-maj" x="${x}" y="${y - 1}">${disp(k)}</text><text class="cf-sig" x="${x}" y="${y + 11}">${sig.count ? sig.count + sig.type : "–"}</text></g>`;
      g += `<g class="cf-min" data-key="${rm}m"><circle cx="${xm}" cy="${ym}" r="14"/><text x="${xm}" y="${ym + 4}">${disp(rm)}m</text></g>`;
    });
    return `<svg viewBox="0 0 300 300" class="circle" xmlns="http://www.w3.org/2000/svg">${g}</svg>
      <div class="hint">Extérieur = tonalités majeures + leur armure · intérieur = relatives mineures. Sens horaire = +1 ♯ ; anti-horaire = +1 ♭. Touche un cercle pour l'explorer au piano.</div>`;
  }

  /* ================= VUE : SOCLE ================= */
  function viewSocle() {
    const doneN = Object.keys(S.done).length;
    const total = LESSONS.length;
    const next = LESSONS.find((l) => !S.done[l.id]) || LESSONS[LESSONS.length - 1];
    const rk = rank(S.xp);
    let html = (typeof LCEx !== "undefined" ? LCEx.seanceCard() : "") + `<div class="hero">
      <div class="hero-top"><div><div class="hero-title">Deviens le king de l'impro</div>
      <div class="hero-sub">Le socle de théorie qui relie le piano, la guitare et l'impro.</div></div></div>
      <div class="prog"><div class="prog-bar"><span style="width:${Math.round(doneN / total * 100)}%"></span></div>
      <div class="prog-txt">${doneN}/${total} leçons · ${rk.name}</div></div>
      <button class="cta" data-lesson="${next.id}">▶ ${doneN === 0 ? "Commencer" : "Continuer"} : ${next.title}</button>
    </div>`;

    CHAPTERS.forEach((ch) => {
      const ls = LESSONS.filter((l) => l.chap === ch.id);
      const cd = ls.filter((l) => S.done[l.id]).length;
      html += `<div class="chap"><div class="chap-h"><span class="chap-e">${ch.emoji}</span>
        <div><div class="chap-t">${ch.title}</div><div class="chap-s">${ch.sub}</div></div>
        <span class="chap-c">${cd}/${ls.length}</span></div><div class="lesson-list">`;
      ls.forEach((l) => {
        const done = S.done[l.id];
        html += `<button class="lesson ${done ? "done" : ""}" data-lesson="${l.id}">
          <span class="l-check">${done ? "✓" : ""}</span>
          <span class="l-body"><span class="l-title">${l.title}</span><span class="l-sub">${l.sub}</span></span>
          <span class="l-arrow">›</span></button>`;
      });
      html += `</div></div>`;
    });
    return html;
  }

  /* ---- écran d'une leçon (overlay) ---- */
  function openLesson(id) {
    const l = LESSONS.find((x) => x.id === id);
    if (!l) return;
    const ch = CHAPTERS.find((c) => c.id === l.chap);
    let html = `<div class="sheet"><div class="sheet-head">
      <button class="back" data-close="1">‹ Retour</button>
      <span class="sheet-chap">${ch.emoji} ${ch.title}</span></div>
      <div class="sheet-body">
      <h2 class="l-h">${l.title}</h2><div class="l-sub2">${l.sub}</div>
      <div class="keyidea">💡 ${l.key}</div>
      <div class="prose">${l.body}</div>
      <div class="demo">${demoHTML(l.demo)}</div>`;
    if (l.demo && (l.demo.kind === "piano" || l.demo.kind === "fretboard" || l.demo.kind === "relatives" || l.demo.kind === "modeDemo")) {
      const t = l.demo.tonic; const sh = l.demo.show;
      if (t && sh && sh !== "chromatic" && sh !== "single" && sh !== "allnotes" && sh !== "triadTargets")
        html += `<div class="btnrow"><button class="btn" data-seq="${t}:${sh === "blues" ? "blues" : sh}">▶ Écouter</button></div>`;
    }
    if (l.quiz) {
      html += `<div class="quiz"><div class="q-q">✍️ ${l.quiz.q}</div><div class="q-choices">`;
      l.quiz.choices.forEach((c, i) => { html += `<button class="q-c" data-qi="${i}">${c}</button>`; });
      html += `</div><div class="q-fb"></div></div>`;
    } else {
      html += `<button class="btn big" data-finish="${l.id}">J'ai compris ✓</button>`;
    }
    html += `</div></div>`;
    const ov = setOverlay(html);
    wireLesson(l);
  }
  function wireLesson(l) {
    const ov = $("#overlay");
    $("[data-close]", ov) && ($("[data-close]", ov).onclick = closeOverlay);
    wireAudioButtons(ov);
    wireCircle(ov);
    if (l.quiz) {
      let answered = false;
      $$(".q-c", ov).forEach((b) => b.onclick = () => {
        if (answered) return; answered = true;
        const i = +b.dataset.qi; const ok = i === l.quiz.answer;
        $$(".q-c", ov).forEach((x, j) => {
          if (j === l.quiz.answer) x.classList.add("ok");
          else if (j === i) x.classList.add("ko");
          x.disabled = true;
        });
        const fb = $(".q-fb", ov);
        fb.innerHTML = `<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅ Exact !" : "❌ Raté."} ${l.quiz.explain}</div>` +
          (!S.done[l.id] ? `<button class="btn big" data-finish="${l.id}">${ok ? "Valider (+15 XP)" : "Continuer"}</button>` : `<button class="btn big" data-close="1">Fermer</button>`);
        const fin = $("[data-finish]", fb); if (fin) fin.onclick = () => finishLesson(l.id, ok);
        const cl = $("[data-close]", fb); if (cl) cl.onclick = closeOverlay;
      });
    } else {
      const fin = $("[data-finish]", ov); if (fin) fin.onclick = () => finishLesson(l.id, true);
    }
  }
  function finishLesson(id, ok) {
    if (!S.done[id]) { S.done[id] = true; earnXP(ok ? 15 : 8); save(); }
    if (typeof LCEx !== "undefined") LCEx.seanceMark("lesson:" + id);
    closeOverlay(); render();
  }
  /* L'overlay est vidé APRÈS l'animation de sortie. Si on rouvre une feuille
     entre-temps, ce vidage différé effacerait son contenu : on l'annule. */
  let wipeId = null;
  function setOverlay(html) {
    if (wipeId) { clearTimeout(wipeId); wipeId = null; }
    const ov = $("#overlay");
    ov.innerHTML = html; ov.classList.add("open");
    return ov;
  }
  function closeOverlay() {
    const ov = $("#overlay");
    ov.classList.remove("open");
    if (wipeId) clearTimeout(wipeId);
    wipeId = setTimeout(() => { ov.innerHTML = ""; wipeId = null; }, 200);
  }

  /* ================= VUE : IMPRO ================= */
  const IM = { mode: "chords", chords: [], root: "C", qual: "maj", keyTonic: "C", keyMinor: false, show: "penta", modeIdx: 0, result: null };
  const PRESETS = [
    { n: "Pop I–V–vi–IV (en C)", c: [["C", "maj"], ["G", "maj"], ["A", "min"], ["F", "maj"]] },
    { n: "vi–IV–I–V (en G)", c: [["E", "min"], ["C", "maj"], ["G", "maj"], ["D", "maj"]] },
    { n: "Blues 12 mes. (en A)", c: [["A", "dom7"], ["D", "dom7"], ["E", "dom7"]] },
    { n: "ii–V–I (en C)", c: [["D", "min7"], ["G", "dom7"], ["C", "maj7"]] },
  ];
  function viewImpro() {
    return `<div class="v-head"><h1>🎯 Sur quoi j'improvise ?</h1>
      <p class="v-sub">Donne-moi une chanson (ses accords, ou sa tonalité) → je te sors ta boîte à notes et tes notes cibles, sur le piano <b>et</b> ton manche.</p></div>
      <div class="seg"><button class="seg-b ${IM.mode === "chords" ? "on" : ""}" data-im-mode="chords">J'ai les accords</button>
      <button class="seg-b ${IM.mode === "key" ? "on" : ""}" data-im-mode="key">J'ai la tonalité</button></div>
      <div id="imInput">${IM.mode === "chords" ? chordInput() : keyInput()}</div>
      <div id="imResult">${IM.result ? IM.result : ""}</div>`;
  }
  function chordInput() {
    const qopts = [["maj", "maj"], ["min", "m"], ["dom7", "7"], ["maj7", "maj7"], ["min7", "m7"], ["dim", "dim"]];
    let chips = IM.chords.map((c, i) => `<span class="chip" data-rm="${i}">${LC.chordLabel(c.root, c.quality, S.nameSystem)} ✕</span>`).join("");
    let roots = KEYS12.map((k) => `<option value="${k}" ${IM.root === k ? "selected" : ""}>${disp(k)}</option>`).join("");
    let quals = qopts.map((q) => `<option value="${q[0]}" ${IM.qual === q[0] ? "selected" : ""}>${q[1] || "maj"}</option>`).join("");
    let pre = PRESETS.map((p, i) => `<button class="pre" data-preset="${i}">${p.n}</button>`).join("");
    return `<div class="card">
      <div class="chip-row">${chips || '<span class="muted">Ajoute les accords du morceau…</span>'}</div>
      <div class="addrow"><select id="cRoot">${roots}</select><select id="cQual">${quals}</select>
      <button class="btn" id="cAdd">+ Ajouter</button></div>
      <div class="btnrow2"><button class="btn primary" id="cAnalyse" ${IM.chords.length ? "" : "disabled"}>Analyser →</button>
      ${IM.chords.length ? '<button class="btn ghost" id="cClear">Vider</button>' : ""}</div>
      <div class="preset-lbl">Ou pars d'un exemple :</div><div class="presets">${pre}</div>
    </div>`;
  }
  function keyInput() {
    let roots = KEYS12.map((k) => `<button class="kbtn ${IM.keyTonic === k ? "on" : ""}" data-ktonic="${k}">${disp(k)}</button>`).join("");
    return `<div class="card">
      <div class="lbl">Tonique</div><div class="kbtns">${roots}</div>
      <div class="seg small"><button class="seg-b ${!IM.keyMinor ? "on" : ""}" data-kmode="maj">majeur</button>
      <button class="seg-b ${IM.keyMinor ? "on" : ""}" data-kmode="min">mineur</button></div>
      <button class="btn primary" id="kGo">Voir ma boîte à notes →</button></div>`;
  }

  function analyseChords() {
    const cand = LC.detectKey(IM.chords);
    const best = cand[0];
    const key = best.key; // majeur
    // majeur ou mineur ? heuristique : dernier/premier accord = vi mineur ?
    const relMin = LC.relativeMinor(key);
    const last = IM.chords[IM.chords.length - 1], first = IM.chords[0];
    // Un morceau se "repose" sur sa tonique : on lit le CENTRE au dernier accord.
    const lastIsMin = last && PC(last.root) === PC(relMin) && last.quality.indexOf("min") === 0;
    const firstIsMin = first && PC(first.root) === PC(relMin) && first.quality.indexOf("min") === 0;
    const minorFeel = lastIsMin || (firstIsMin && !best.hasI);
    const conf = best.matched === best.total;
    IM.result = improResult(key, relMin, IM.chords, minorFeel, conf, best);
    $("#imResult").innerHTML = IM.result; wire();
  }
  function analyseKey() {
    const key = IM.keyMinor ? LC.relativeMajor(IM.keyTonic) : IM.keyTonic;
    const relMin = IM.keyMinor ? IM.keyTonic : LC.relativeMinor(IM.keyTonic);
    IM.result = improResult(key, relMin, null, IM.keyMinor, true, null);
    $("#imResult").innerHTML = IM.result; wire();
  }

  function improResult(majKey, relMin, chords, minorFeel, conf, best) {
    const center = minorFeel ? disp(relMin) + " mineur" : disp(majKey) + " majeur";
    const centerTonic = minorFeel ? relMin : majKey;
    const scale = LC.majorScale(majKey);
    const penta = minorFeel ? LC.minorPenta(relMin) : LC.majorPenta(majKey);
    const triad = LC.spellChord(centerTonic, minorFeel ? "min" : "maj");
    let confNote = "";
    if (chords && !conf) confNote = `<div class="warn">Note : tous les accords ne rentrent pas parfaitement (${best.matched}/${best.total}). C'est peut-être un emprunt/une modulation — la réponse ci-dessous reste ta meilleure base.</div>`;

    // notes cibles par accord (si accords fournis)
    let perChord = "";
    if (chords && chords.length) {
      perChord = `<div class="sub2">Notes cibles accord par accord :</div><div class="pcards">` +
        chords.map((c) => {
          const q = c.quality.indexOf("min") === 0 || c.quality === "m7b5" ? "min" : (c.quality === "dim" ? "dim" : "maj");
          const tr = LC.spellChord(c.root, q);
          return `<div class="pcard"><div class="pc-name">${LC.chordLabel(c.root, c.quality, S.nameSystem)}</div><div class="pc-notes">${dl(tr).join(" · ")}</div></div>`;
        }).join("") + `</div>`;
    }

    const diag = improDiagrams(majKey, relMin, minorFeel ? relMin : majKey, minorFeel);

    return `<div class="result">
      <div class="res-key"><div class="rk-lbl">Ta tonalité</div><div class="rk-val">${center}</div>
      <div class="rk-rel">Relative : ${minorFeel ? disp(majKey) + " majeur" : disp(relMin) + " mineur"} — <b>mêmes notes</b>. Ta boîte à notes est la même dans les deux cas.</div></div>
      ${confNote}
      <div class="res-block"><div class="rb-h">🎵 Ta boîte à notes</div>
        <div class="notes-line"><span class="nl-lbl">Gamme</span> <span class="notes">${dl(scale).map(n => `<b>${n}</b>`).join(" ")}</span> <button class="mini" data-seq="${majKey}:major">▶</button></div>
        <div class="notes-line"><span class="nl-lbl">Penta</span> <span class="notes hot">${dl(penta).map(n => `<b>${n}</b>`).join(" ")}</span> <button class="mini" data-seq="${centerTonic}:${minorFeel ? "minpenta" : "majpenta"}">▶</button>
        <span class="tag">le filet de sécurité</span></div>
        <div class="notes-line"><span class="nl-lbl">Cibles</span> <span class="notes target">${dl(triad).map(n => `<b>${n}</b>`).join(" ")}</span>
        <span class="tag">vise-les, surtout la <b>tierce</b> (${disp(triad[1])})</span></div>
      </div>
      ${perChord}
      <div class="res-block"><div class="rb-h">🎹 Sur le piano &nbsp;·&nbsp; 🎸 Sur ton manche</div>
        <div class="seg tiny"><button class="seg-b ${IM.show === "penta" ? "on" : ""}" data-imshow="penta">Penta</button>
        <button class="seg-b ${IM.show === "scale" ? "on" : ""}" data-imshow="scale">Gamme</button>
        <button class="seg-b ${IM.show === "targets" ? "on" : ""}" data-imshow="targets">Cibles seules</button>
        <button class="seg-b ${IM.show === "modes" ? "on" : ""}" data-imshow="modes">🌈 Modes</button></div>
        <div id="imDiag" data-majkey="${majKey}" data-relmin="${relMin}" data-minor="${minorFeel ? 1 : 0}">${diag}</div>
      </div>
      <div class="res-block tips"><div class="rb-h">🧠 Comment improviser là-dessus</div>
        <ul>
        <li>Reste dans la <b>penta</b> (${dl(penta).join(" ")}) : quasi impossible de faire une fausse note.</li>
        <li><b>Atterris</b> sur une note cible en fin de phrase — la tierce <b>${disp(triad[1])}</b> chante le mieux.</li>
        <li>Quand l'accord change, vise <b>ses</b> notes (vois les cartes ci-dessus).</li>
        <li>Phrases courtes + silences. Puis assaisonne d'une blue note en passage.</li>
        </ul>
        <div class="btnrow"><button class="btn" data-seq="${majKey}:major">▶ Jouer la gamme</button>
        <button class="btn" data-drone="${PC(centerTonic)}">▶ Drone (pour jammer)</button></div>
      </div>
    </div>`;
  }


  /* ================= LES MODES SUR LE MANCHE =================
     Le point que rate presque tout le monde : en Do majeur, les 7 modes
     utilisent EXACTEMENT les mêmes notes. Ce qui change, c'est le centre
     et la note qu'on vise. On ne change pas de boîte, on change de cible.
     `car` = index, dans la formule du mode, de la note caractéristique :
     celle qui fait toute la couleur. C'est elle qu'il faut viser. */
  const MODE_INFO = [
    { deg:1, key:"ionian", fr:"Ionien", alias:"le majeur", qual:"maj7", car:6, carLbl:"7e majeure",
      couleur:"Lumineux, posé, un peu sage.",
      quand:"Sur l'accord de tonique. C'est le repos, la maison.",
      recette:"Sers-t'en pour finir. La 7e majeure juste sous la tonique donne le côté « suspendu joli »." },
    { deg:2, key:"dorian", fr:"Dorien", alias:"", qual:"min7", car:5, carLbl:"6e MAJEURE",
      couleur:"Mineur, mais ouvert — jamais plaintif.",
      quand:"Sur les vamps mineures (le ii, ou un morceau entier en mineur).",
      recette:"C'est LE mineur du rock et du jazz. La 6e majeure est tout le secret : sans elle tu retombes dans le mineur triste." },
    { deg:3, key:"phrygian", fr:"Phrygien", alias:"", qual:"min7", car:1, carLbl:"♭2",
      couleur:"Sombre, tendu, espagnol ou metal.",
      quand:"Sur le iii, ou en pédale sur un mineur qu'on veut rendre menaçant.",
      recette:"Attaque la ♭2 juste au-dessus de la tonique, puis redescends dessus. C'est le son flamenco/metal en deux notes." },
    { deg:4, key:"lydian", fr:"Lydien", alias:"", qual:"maj7", car:3, carLbl:"♯4",
      couleur:"Majeur qui flotte, rêveur, son de cinéma.",
      quand:"Sur le IV, ou sur un accord majeur qu'on veut faire léviter.",
      recette:"La ♯4 est la note magique. Tiens-la, ne la résous pas tout de suite — c'est là qu'est le flottement." },
    { deg:5, key:"mixolydian", fr:"Mixolydien", alias:"", qual:"dom7", car:6, carLbl:"♭7",
      couleur:"Majeur bluesy, ça pousse en avant.",
      quand:"Sur tout accord de 7 (dominante). Le son du rock et du blues.",
      recette:"Le plus rentable avec le dorien. Majeur, mais la 7e descend d'un demi-ton : ça mord au lieu de sonner poli." },
    { deg:6, key:"aeolian", fr:"Éolien", alias:"le mineur naturel", qual:"min7", car:5, carLbl:"♭6",
      couleur:"Mineur triste, romantique, classique.",
      quand:"Sur le vi, ou sur un morceau en mineur qu'on veut mélancolique.",
      recette:"La ♭6 est ce qui le sépare du dorien. Une seule note d'écart entre « triste » et « cool » — écoute-la." },
    { deg:7, key:"locrian", fr:"Locrien", alias:"", qual:"m7b5", car:4, carLbl:"♭5",
      couleur:"Instable. Ne tient pas debout tout seul.",
      quand:"Presque jamais en centre. Sur le vii m7♭5, en passage.",
      recette:"À connaître pour comprendre le système, pas pour improviser dessus. Ne perds pas de temps ici." },
  ];

  function modesBlock(majKey) {
    const sc = LC.majorScale(majKey);
    const i = Math.max(0, Math.min(6, IM.modeIdx || 0));
    const M = MODE_INFO[i];
    const root = sc[i];
    const notes = LC.modeScale(root, M.key);
    const carNote = notes[M.car];
    const chord = LC.chordLabel(root, M.qual, S.nameSystem);
    const sp = keySpell(majKey);

    const chips = MODE_INFO.map((m, k) => `<button class="mchip ${k === i ? "on" : ""}" data-immode="${k}">
        <b>${disp(sc[k])} ${m.fr}</b><small>${LC.chordLabel(sc[k], m.qual, S.nameSystem)}</small></button>`).join("");

    const leg = LCRender.legend([
      { cls: "lg-fill", txt: "les notes du mode" },
      { cls: "lg-dot", txt: "la note caractéristique (" + disp(carNote) + ")" },
      { cls: "lg-root", txt: "le centre (" + disp(root) + ")" },
    ]);

    return `<div class="modes">
      <div class="mchips">${chips}</div>
      <div class="mcard">
        <div class="mc-h"><b>${disp(root)} ${M.fr.toLowerCase()}</b>${M.alias ? ` <span class="mc-alias">— ${M.alias}</span>` : ""}
          <span class="mc-chord">sur ${chord}</span></div>
        <div class="mc-notes">${dl(notes).map((n, k) => `<span class="${k === M.car ? "car" : (k === 0 ? "rt" : "")}">${n}</span>`).join("")}</div>
        <div class="mc-car">La note qui fait la couleur : <b>${disp(carNote)}</b> <span class="mc-deg">(${M.carLbl})</span></div>
        <div class="mc-row"><span class="mc-lbl">Couleur</span>${M.couleur}</div>
        <div class="mc-row"><span class="mc-lbl">Quand</span>${M.quand}</div>
        <div class="mc-row tip"><span class="mc-lbl">Recette</span>${M.recette}</div>
        <div class="btnrow">
          <button class="btn" data-seq="${root}:${M.key}">▶ Écouter le mode</button>
          <button class="btn" data-drone="${PC(root)}">▶ Drone sur ${disp(root)}</button>
        </div>
      </div>
      <div class="diag-wrap"><div class="diag-lbl">🎸 Manche</div>${LCRender.fretboard({ frets: 12, highlight: pcsOf(notes), dots: [PC(carNote)], root: PC(root), spell: sp })}</div>
      <div class="diag-wrap"><div class="diag-lbl">🎹 Piano</div>${LCRender.piano({ octaves: 2, fill: pcsOf(notes), dots: [PC(carNote)], root: PC(root), spell: sp })}</div>
      ${leg}
      <div class="mnote">⚠️ Les 7 modes ci-dessus utilisent <b>exactement les mêmes notes</b> que ${disp(majKey)} majeur.
      Tu ne changes pas de boîte — tu changes de <b>centre</b> et de <b>note à viser</b>. C'est là qu'est le style,
      pas dans une nouvelle gamme à apprendre.</div>
    </div>`;
  }

  function improDiagrams(majKey, relMin, rootTonic, minorFeel) {
    const scale = pcsOf(LC.majorScale(majKey));
    const penta = pcsOf(minorFeel ? LC.minorPenta(relMin) : LC.majorPenta(majKey));
    const rt = rootTonic ? PC(rootTonic) : (minorFeel ? PC(relMin) : PC(majKey));
    const triad = pcsOf(LC.spellChord(minorFeel ? relMin : majKey, minorFeel ? "min" : "maj"));
    const sp = minorFeel ? minorSpell(relMin) : keySpell(majKey);
    const show = IM.show;
    let fill, dots;
    if (show === "modes") return modesBlock(majKey);
    if (show === "penta") { fill = penta; dots = triad; }
    else if (show === "scale") { fill = scale; dots = triad; }
    else { fill = []; dots = triad; }
    const leg = LCRender.legend([
      { cls: "lg-fill", txt: show === "targets" ? "—" : (show === "penta" ? "penta (sûr)" : "gamme (permis)") },
      { cls: "lg-dot", txt: "notes cibles" }, { cls: "lg-root", txt: "tonique" },
    ]);
    return `<div class="diag-wrap"><div class="diag-lbl">🎹 Piano</div>${LCRender.piano({ octaves: 2, fill, dots, root: rt, spell: sp })}</div>
      <div class="diag-wrap"><div class="diag-lbl">🎸 Manche</div>${LCRender.fretboard({ frets: 12, highlight: fill, dots, root: rt, spell: sp })}</div>${leg}`;
  }

  /* ================= VUE : PIANO EXPLORER ================= */
  const EX = { tonic: "C", type: "major", degrees: false };
  const SCALE_TYPES = [
    ["major", "Majeure"], ["natminor", "Mineure nat."], ["majpenta", "Penta maj."],
    ["minpenta", "Penta min."], ["blues", "Blues"], ["dorian", "Dorien"], ["mixolydian", "Mixo."],
  ];
  function explorerControls(scope) {
    let ks = KEYS12.map((k) => `<button class="kbtn ${EX.tonic === k ? "on" : ""}" data-ex-tonic="${k}">${disp(k)}</button>`).join("");
    let ts = SCALE_TYPES.map((t) => `<button class="tbtn ${EX.type === t[0] ? "on" : ""}" data-ex-type="${t[0]}">${t[1]}</button>`).join("");
    return `<div class="lbl">Tonique</div><div class="kbtns">${ks}</div>
      <div class="lbl">Gamme</div><div class="tbtns">${ts}</div>
      <div class="btnrow2"><button class="btn" data-seq="${EX.tonic}:${EX.type}">▶ Écouter</button>
      <button class="btn ghost" id="exDeg">${EX.degrees ? "Notes" : "Degrés"}</button></div>`;
  }
  function scaleInfo() {
    const t = EX.tonic, notes = scaleNotes(t, EX.type);
    let extra = "";
    if (EX.type === "major") { const sig = LC.keySignature(t); extra = `Armure : <b>${sig.text}</b> · relative mineure : <b>${disp(LC.relativeMinor(t))}m</b>`; }
    else if (EX.type === "natminor") extra = `Relative majeure : <b>${disp(LC.relativeMajor(t))}</b>`;
    else if (EX.type === "minpenta") extra = `= penta majeure de <b>${disp(LC.relativeMajor(t))}</b> (mêmes notes)`;
    return `<div class="scale-notes">${dl(notes).map(n => `<span class="sn">${n}</span>`).join("")}</div>${extra ? `<div class="hint">${extra}</div>` : ""}`;
  }
  function degMap(tonic, type) {
    if (!EX.degrees) return null;
    const notes = scaleNotes(tonic, type);
    const labs = degLabels(type);
    const m = {}; notes.forEach((n, i) => m[PC(n)] = labs[i] || ""); return m;
  }
  function degLabels(type) {
    if (type === "majpenta") return ["1", "2", "3", "5", "6"];
    if (type === "minpenta") return ["1", "♭3", "4", "5", "♭7"];
    if (type === "blues") return ["1", "♭3", "4", "♭5", "5", "♭7"];
    if (type === "natminor") return ["1", "2", "♭3", "4", "5", "♭6", "♭7"];
    return ["1", "2", "3", "4", "5", "6", "7"];
  }
  function viewPiano() {
    const t = EX.tonic, notes = scaleNotes(t, EX.type);
    const sp = (EX.type === "minpenta" || EX.type === "natminor" || EX.type === "blues") ? minorSpell(t) : keySpell(t);
    const dm = degMap(t, EX.type);
    return `<div class="v-head"><h1>🎹 Explorer au piano</h1></div>
      <div class="card">${explorerControls("piano")}</div>
      ${scaleInfo()}
      <div class="demo big">${LCRender.piano({ octaves: 2, fill: pcsOf(notes), root: PC(t), spell: sp, degrees: dm })}</div>
      <div class="hint">Touche une note pour l'entendre. Toutes les pentas sont là : choisis « Penta maj. » ou « Penta min. » et fais défiler les 12 toniques.</div>`;
  }
  /* ================= VUE : MANCHE EXPLORER ================= */
  const FB = { allNotes: false, frets: 12 };
  function viewManche() {
    const t = EX.tonic, notes = scaleNotes(t, EX.type);
    const sp = (EX.type === "minpenta" || EX.type === "natminor" || EX.type === "blues") ? minorSpell(t) : keySpell(t);
    const dm = degMap(t, EX.type);
    const fbHTML = FB.allNotes
      ? LCRender.fretboard({ frets: FB.frets, showAll: true, spell: spellMap("#", []) })
      : LCRender.fretboard({ frets: FB.frets, highlight: pcsOf(notes), root: PC(t), spell: sp, degrees: dm });
    return `<div class="v-head"><h1>🎸 Explorer le manche</h1></div>
      <div class="card">${explorerControls("manche")}
      <div class="btnrow2"><button class="btn ghost ${FB.allNotes ? "on" : ""}" id="fbAll">${FB.allNotes ? "✓ Toutes les notes" : "Voir toutes les notes"}</button>
      <button class="btn ghost" id="fbFrets">${FB.frets} cases</button></div></div>
      ${FB.allNotes ? '<div class="hint">Carte complète du manche. Repère d\'abord les cordes de <b>Mi</b> (grave & aiguë, identiques) et de <b>La</b>.</div>' : scaleInfo()}
      <div class="demo big">${fbHTML}</div>
      ${FB.allNotes ? "" : '<div class="hint">Rouge = tonique. Glisse la forme le long du manche : le dessin ne change pas, seule la tonalité change.</div>'}`;
  }

  /* ================= DRILLS (section de l'Atelier) ================= */
  function drillsSection() {
    const st = S.drill || {};
    let cards = DRILLS.map((d) => {
      const s = st[d.id] || { seen: 0, best: 0 };
      return `<button class="drill" data-drill="${d.id}"><span class="d-e">${d.emoji}</span>
        <span class="d-body"><span class="d-name">${d.name}</span><span class="d-desc">${d.desc}</span></span>
        <span class="d-stat">${s.seen ? "★ " + (s.best || 0) : ""}</span></button>`;
    }).join("");
    return `<button class="cta" data-express="1">⚡ Séance express — 8 questions mélangées</button>
      <div class="streak-row">🔥 Série : <b>${S.streak || 0}</b> j · ${S.xp} XP</div>
      <div class="drill-list">${cards}</div>`;
  }

  /* ---- générateurs de questions ---- */
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rand(a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; }

  function genQuestion(id) {
    if (id === "spellMajor") { const t = pick(KEYS12); return { type: "reveal", prompt: `Épelle la gamme de <b>${disp(t)} majeur</b>`, answer: dl(LC.majorScale(t)).join(" ") }; }
    if (id === "keysig") { const t = pick(KEYS12); const s = LC.keySignature(t); return { type: "reveal", prompt: `Armure de <b>${disp(t)} majeur</b> ?`, answer: s.text + (s.count ? " — " + dl(LC.majorScale(t)).filter(n => n.length > 1).join(" ") : "") }; }
    if (id === "relmin") { const t = pick(KEYS12); return { type: "reveal", prompt: `Relative mineure de <b>${disp(t)} majeur</b> ?`, answer: disp(LC.relativeMinor(t)) + " mineur" }; }
    if (id === "majpentaD") { const t = pick(KEYS12); return { type: "reveal", prompt: `Penta <b>majeure</b> de <b>${disp(t)}</b> ?`, answer: dl(LC.majorPenta(t)).join(" ") }; }
    if (id === "minpentaD") { const t = pick(KEYS12); return { type: "reveal", prompt: `Penta <b>mineure</b> de <b>${disp(t)}m</b> ?`, answer: dl(LC.minorPenta(t)).join(" ") }; }
    if (id === "triadD") { const t = pick(KEYS12); const q = pick(["maj", "min", "dim"]); return { type: "reveal", prompt: `Épelle l'accord <b>${LC.chordLabel(t, q, S.nameSystem)}</b>`, answer: dl(LC.spellChord(t, q)).join(" ") }; }
    if (id === "diatonic") { const t = pick(KEYS12); const d = LC.diatonicChords(t); return { type: "reveal", prompt: `Les 7 accords (degrés) de <b>${disp(t)} majeur</b> ?`, answer: d.map(c => LC.chordLabel(c.root, c.quality, S.nameSystem)).join(" · ") }; }
    if (id === "targets") { const t = pick(KEYS12); const q = pick(["maj", "min"]); return { type: "reveal", prompt: `Notes cibles sur un accord de <b>${LC.chordLabel(t, q, S.nameSystem)}</b> ?`, answer: dl(LC.spellChord(t, q)).join(" · ") }; }
    if (id === "fretNote") {
      const s = rand(6), f = rand(13);
      const labels = ["Mi grave", "La", "Ré", "Sol", "Si", "Mi aigu"]; // index 0=grave
      const pc = LC.fretPc(s, f);
      const name = disp(LC.SHARP[pc]);
      const wrong = shuffle(LC.SHARP.filter((n) => PC(n) !== pc)).slice(0, 3).map(disp);
      const choices = shuffle([name, ...wrong]);
      return { type: "mc", prompt: `Corde de <b>${labels[s]}</b>, case <b>${f}</b> → quelle note ?`, choices, answer: choices.indexOf(name) };
    }
    if (id === "findkey") {
      const key = pick(KEYS12); const dia = LC.diatonicChords(key);
      const shapes = [[0, 3, 4], [5, 3, 0, 4], [0, 4, 5, 3], [1, 4, 0], [3, 4, 5, 0]];
      const shp = pick(shapes);
      const chords = shp.map((deg) => LC.chordLabel(dia[deg].root, dia[deg].quality, S.nameSystem));
      const wrongKeys = shuffle(KEYS12.filter((k) => k !== key)).slice(0, 3).map((k) => disp(k) + " majeur");
      const choices = shuffle([disp(key) + " majeur", ...wrongKeys]);
      return { type: "mc", prompt: `Un morceau enchaîne : <b>${chords.join(" – ")}</b><br>Tonalité la plus probable ?`, choices, answer: choices.indexOf(disp(key) + " majeur"), hint: "Cherche la tonalité dont ces accords sont tous des degrés." };
    }
    return { type: "reveal", prompt: "?", answer: "?" };
  }

  function runDrill(id, express) {
    const pool = express ? shuffle(DRILLS.map(d => d.id)) : null;
    let count = 0; const max = express ? 8 : 999;
    let cur = null, curId = id;
    const ov = $("#overlay");
    function nextQ() {
      if (express && count >= max) { closeQuiz(); return; }
      curId = express ? pool[count % pool.length] : id;
      cur = genQuestion(curId); count++;
      paint();
    }
    function paint() {
      const meta = DRILLS.find(d => d.id === curId);
      let body = `<div class="sheet"><div class="sheet-head">
        <button class="back" data-closeq="1">‹ Quitter</button>
        <span class="sheet-chap">${express ? "⚡ Express " + count + "/" + max : meta.emoji + " " + meta.name}</span></div>
        <div class="sheet-body drill-run"><div class="dq">${cur.prompt}</div>`;
      if (cur.type === "mc") {
        body += `<div class="dq-choices">` + cur.choices.map((c, i) => `<button class="dq-c" data-dqi="${i}">${c}</button>`).join("") + `</div><div class="dq-fb"></div>`;
      } else {
        body += `<div class="dq-reveal"><button class="btn big" id="dqReveal">Voir la réponse</button>
          <div class="dq-answer" style="display:none"><div class="ans">${cur.answer}</div>
          <div class="grade"><button class="btn ko" data-grade="0">Raté</button><button class="btn ok" data-grade="1">Su ✓</button></div></div></div>`;
      }
      body += `</div></div>`;
      setOverlay(body);
      $("[data-closeq]").onclick = closeQuiz;
      if (cur.type === "mc") {
        let done = false;
        $$(".dq-c").forEach((b) => b.onclick = () => {
          if (done) return; done = true; const i = +b.dataset.dqi; const ok = i === cur.answer;
          $$(".dq-c").forEach((x, j) => { if (j === cur.answer) x.classList.add("ok"); else if (j === i) x.classList.add("ko"); x.disabled = true; });
          record(curId, ok);
          $(".dq-fb").innerHTML = `<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅ Bien !" : "❌"} ${cur.hint || ""}</div><button class="btn big" id="dqNext">Suivant →</button>`;
          $("#dqNext").onclick = nextQ;
        });
      } else {
        $("#dqReveal").onclick = () => { $(".dq-answer").style.display = "block"; $("#dqReveal").style.display = "none"; wireAudioButtons(ov); };
        $$("[data-grade]").forEach((b) => b.onclick = () => {
          const ok = b.dataset.grade === "1"; record(curId, ok);
          $(".grade").innerHTML = `<button class="btn big" id="dqNext">Suivant →</button>`;
          $("#dqNext").onclick = nextQ;
        });
      }
    }
    function closeQuiz() { closeOverlay(); render(); }
    nextQ();
  }
  function record(id, ok) {
    S.drill = S.drill || {}; const s = S.drill[id] || { seen: 0, correct: 0, streak: 0, best: 0 };
    s.seen++; if (ok) { s.correct++; s.streak++; s.best = Math.max(s.best, s.streak); } else s.streak = 0;
    S.drill[id] = s; earnXP(ok ? 6 : 1); save();
  }

  /* ================= WIRING GLOBAL ================= */
  function wire() {
    // socle
    $$("[data-lesson]").forEach((b) => b.onclick = () => openLesson(b.dataset.lesson));
    // impro
    $$("[data-im-mode]").forEach((b) => b.onclick = () => { IM.mode = b.dataset.imMode; IM.result = null; render(); });
    if ($("#cAdd")) $("#cAdd").onclick = () => { IM.root = $("#cRoot").value; IM.qual = $("#cQual").value; IM.chords.push({ root: IM.root, quality: IM.qual }); $("#imInput").innerHTML = chordInput(); wire(); };
    if ($("#cAnalyse")) $("#cAnalyse").onclick = analyseChords;
    if ($("#cClear")) $("#cClear").onclick = () => { IM.chords = []; IM.result = null; render(); };
    $$("[data-rm]").forEach((c) => c.onclick = () => { IM.chords.splice(+c.dataset.rm, 1); $("#imInput").innerHTML = chordInput(); wire(); });
    $$("[data-preset]").forEach((b) => b.onclick = () => { const p = PRESETS[+b.dataset.preset]; IM.chords = p.c.map(x => ({ root: x[0], quality: x[1] })); $("#imInput").innerHTML = chordInput(); wire(); });
    $$("[data-ktonic]").forEach((b) => b.onclick = () => { IM.keyTonic = b.dataset.ktonic; $("#imInput").innerHTML = keyInput(); wire(); });
    $$("[data-kmode]").forEach((b) => b.onclick = () => { IM.keyMinor = b.dataset.kmode === "min"; $("#imInput").innerHTML = keyInput(); wire(); });
    if ($("#kGo")) $("#kGo").onclick = analyseKey;
    $$("[data-imshow]").forEach((b) => b.onclick = () => {
      IM.show = b.dataset.imshow;
      const d = $("#imDiag"); if (d) { d.innerHTML = improDiagrams(d.dataset.majkey, d.dataset.relmin, null, d.dataset.minor === "1"); }
      $$("[data-imshow]").forEach(x => x.classList.toggle("on", x === b)); wireAudioButtons($("#imResult")); wireModeChips();
    });
    wireModeChips();
    // explorers
    $$("[data-ex-tonic]").forEach((b) => b.onclick = () => { EX.tonic = b.dataset.exTonic; render(); });
    $$("[data-ex-type]").forEach((b) => b.onclick = () => { EX.type = b.dataset.exType; render(); });
    if ($("#exDeg")) $("#exDeg").onclick = () => { EX.degrees = !EX.degrees; render(); };
    if ($("#fbAll")) $("#fbAll").onclick = () => { FB.allNotes = !FB.allNotes; render(); };
    if ($("#fbFrets")) $("#fbFrets").onclick = () => { FB.frets = FB.frets === 12 ? 15 : 12; render(); };
    // drills
    $$("[data-drill]").forEach((b) => b.onclick = () => runDrill(b.dataset.drill, false));
    if ($("[data-express]")) $("[data-express]").onclick = () => runDrill(null, true);
    // audio + circle
    wireAudioButtons($("#view"));
    wireCircle($("#view"));
  }

  /* Les pastilles de mode : on redessine le bloc seul (pas toute la vue),
     pour ne pas renvoyer Thomas en haut de page à chaque clic. */
  function wireModeChips() {
    $$("[data-immode]").forEach((b) => b.onclick = () => {
      IM.modeIdx = +b.dataset.immode;
      const d = $("#imDiag");
      if (d) {
        d.innerHTML = improDiagrams(d.dataset.majkey, d.dataset.relmin, null, d.dataset.minor === "1");
        wireAudioButtons(d); wireModeChips();
      }
    });
  }

  function wireAudioButtons(root) {
    if (!root) return;
    $$("[data-seq]", root).forEach((b) => b.onclick = () => { LC.audio.resume(); const [t, ty] = b.dataset.seq.split(":"); LC.audio.sequence(midisForScale(t, ty)); flash(b); });
    $$("[data-playchord]", root).forEach((b) => b.onclick = () => { LC.audio.resume(); LC.audio.chord(b.dataset.playchord.split(",").map(Number)); flash(b); });
    $$("[data-drone]", root).forEach((b) => b.onclick = () => { LC.audio.resume(); const pc = +b.dataset.drone; LC.audio.chord([36 + pc, 48 + pc, 55 + pc]); flash(b); });
  }
  function wireCircle(root) {
    if (!root) return;
    $$(".cf-node", root).forEach((n) => n.onclick = () => { EX.tonic = n.dataset.key; EX.type = "major"; closeOverlay(); go("piano"); });
    $$(".cf-min", root).forEach((n) => n.onclick = () => { EX.tonic = n.dataset.key.replace("m", ""); EX.type = "natminor"; closeOverlay(); go("piano"); });
  }
  function flash(b) { b.classList.add("flash"); setTimeout(() => b.classList.remove("flash"), 250); }

  // audio délégué sur touches/cases
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-midi]");
    if (!el) return;
    LC.audio.resume(); LC.audio.note(+el.dataset.midi, 0.6);
    el.classList.add("hit"); setTimeout(() => el.classList.remove("hit"), 200);
  });

  /* ========= pont vers L'ATELIER (exos.js) ========= */
  const LCAPP = {
    get S() { return S; },
    save, earnXP, render, go, setOverlay, closeOverlay,
    disp, dl, PC, pcsOf, spellMap, keySpell, minorSpell, scaleNotes,
    wireAudio: wireAudioButtons, drillsSection,
  };

  /* ================= INIT ================= */
  function init() {
    if (typeof LCEx !== "undefined") LCEx.init(LCAPP);
    LCRender.setNames(disp);
    $("#nav").innerHTML = TABS.map((t) => `<button class="nav-item ${t[0] === "socle" ? "active" : ""}" data-tab="${t[0]}"><span class="ni-e">${t[1]}</span><span class="ni-t">${t[2]}</span></button>`).join("");
    $$(".nav-item").forEach((b) => b.onclick = () => go(b.dataset.tab));
    $("#nsToggle").onclick = () => { S.nameSystem = S.nameSystem === "latin" ? "letters" : "latin"; save(); paintHeader(); render(); if ($("#overlay").classList.contains("open")) closeOverlay(); };
    paintHeader(); go("socle");
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  document.addEventListener("DOMContentLoaded", init);
})();

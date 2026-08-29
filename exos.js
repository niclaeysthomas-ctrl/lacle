/* =========================================================================
   LA CLÉ — L'ATELIER
   Exercices d'automatisme : trouver les gammes majeures (formule), les savoir
   par cœur (épellation), les pentas associées, et les notes sur le manche.
   Tout est généré depuis le moteur (theory.js) : questions infinies, zéro faute.
   ========================================================================= */
const LCEx = (function () {
  "use strict";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rand(a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; }
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
  const PCS = (n) => LC.noteToPc(n);
  const ord = (n) => (n === 1 ? "1re" : n + "e");

  let A = null;                       // helpers exposés par app.js
  function init(app) { A = app; }

  const CIRCLE      = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
  const STEPS       = ["T", "T", "½", "T", "T", "T", "½"];   // 1→2 … 7→8
  const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
  const FLAT_ORDER  = ["B", "E", "A", "D", "G", "C", "F"];
  const STR_PC      = ["E", "A", "D", "G", "B", "E"];        // index LC : 0 = Mi grave
  const SIG_POOL    = ["aucune", "1 ♯", "2 ♯", "3 ♯", "4 ♯", "5 ♯", "6 ♯", "1 ♭", "2 ♭", "3 ♭", "4 ♭", "5 ♭"];

  const strName  = (i) => A.disp(STR_PC[i]) + (i === 0 ? " (grave)" : i === 5 ? " (aiguë)" : "");
  const noteName = (pc) => A.disp(LC.SHARP[((pc % 12) + 12) % 12]);
  function sigShort(t) { const s = LC.keySignature(t); return s.count ? s.count + " " + (s.type === "#" ? "♯" : "♭") : "aucune"; }

  /* ============================ ÉTAT / RECORDS ============================ */
  function st() {
    const S = A.S;
    if (!S.ate) S.ate = {};
    if (!S.ate.done) S.ate.done = {};
    if (!S.ate.best) S.ate.best = {};
    if (!S.ate.rev) S.ate.rev = {};
    return S.ate;
  }
  const isDone = (k) => !!st().done[k];
  function setDone(k) { st().done[k] = true; A.save(); }
  function unsetDone(k) { delete st().done[k]; A.save(); }

  /* ---- révision espacée : savoir une gamme un jour ne prouve rien ---- */
  const IVL = [2, 5, 12, 30];                       // jours
  const jour = () => Math.floor(Date.now() / 864e5);
  function planifier(k, ok) {
    const r = st().rev;
    const step = ok ? Math.min((r[k] ? r[k].step : 0) + 1, IVL.length) : 1;
    r[k] = { step: step, due: jour() + IVL[step - 1] };
    A.save();
  }
  function estDu(k) { const r = st().rev[k]; return !!r && jour() >= r.due; }
  const getBest = (k) => st().best[k] || null;
  function setBest(k, v) {                       // score haut d'abord, puis temps bas
    const b = getBest(k);
    const better = !b || v.score > b.score || (v.score === b.score && v.time < b.time);
    if (better) { st().best[k] = v; A.save(); }
    return better;
  }

  /* ================================ CHRONO ================================ */
  let tid = null, t0 = 0;
  function startT() {
    t0 = Date.now();
    if (tid) clearInterval(tid);
    tid = setInterval(() => {
      const e = $("#exTime");
      if (e) e.textContent = fmtT(Date.now() - t0);
      else { clearInterval(tid); tid = null; }
    }, 200);
  }
  function stopT() { if (tid) { clearInterval(tid); tid = null; } return Date.now() - t0; }
  function fmtT(ms) {
    const s = ms / 1000;
    return s < 60 ? s.toFixed(1) + " s" : Math.floor(s / 60) + " min " + String(Math.round(s % 60)).padStart(2, "0");
  }

  /* ============================ FEUILLE (overlay) ========================= */
  function openSheet(chap) {
    A.setOverlay(`<div class="sheet"><div class="sheet-head">
      <button class="back" id="exQuit">‹ Quitter</button>
      <span class="ex-chap">${chap}</span><span class="ex-time" id="exTime"></span></div>
      <div class="sheet-body" id="exBody"></div></div>`);
    $("#exQuit").onclick = closeSheet;
  }
  function closeSheet() { stopT(); A.closeOverlay(); A.render(); }
  /* `keep` = on répond à l'intérieur d'une même question (on marque une case,
     on affiche un retour) : il ne faut alors PAS renvoyer l'écran en haut ni
     ramener le manche au sillet — sinon on perd la case qu'on vient de toucher. */
  function paint(html, keep) {
    const b = $("#exBody");
    if (!b) return;
    const old = b.querySelector(".fb-scroll");
    const left = old ? old.scrollLeft : 0;
    const top = keep ? b.scrollTop : 0;
    b.innerHTML = html;
    const neuf = b.querySelector(".fb-scroll");
    if (neuf && left) neuf.scrollLeft = left;
    b.scrollTop = top;
    A.wireAudio(b);
  }
  function on(sel, fn) { $$(sel, $("#exBody")).forEach((el) => { el.onclick = () => fn(el); }); }
  function btn(id, fn) { const b = $("#" + id); if (b) b.onclick = fn; }

  /* ============================== VUE ATELIER ============================= */
  const keyLvl   = (t) => (isDone("g:" + t + ":formula") ? 1 : 0) + (isDone("g:" + t + ":spell") ? 1 : 0);
  const pentaOK  = (t) => isDone("p:" + t);

  function view() {
    return `<div class="v-head"><h1>⚡ L'Atelier</h1>
      <p class="v-sub">Ici on ne cherche pas à comprendre : on <b>automatise</b>. Quatre chantiers, dans l'ordre — et on ne coche rien en trichant.</p></div>
      ${cardGammes()}${cardPentas()}${cardManche()}${cardTonalite()}
      <div class="ate-sep">Drills libres · questions infinies</div>
      ${A.drillsSection()}`;
  }

  function recTxt(k, unit) {
    const b = getBest(k);
    if (!b) return "";
    if (unit === "errs") return `${-b.score} err. · ${fmtT(b.time)}`;
    return `${b.score}${unit || ""} · ${fmtT(b.time)}`;
  }
  function row(ex, emoji, title, sub, rec) {
    return `<button class="ate-row" data-ex="${ex}"><span class="ar-e">${emoji}</span>
      <span class="ar-b"><span class="ar-t">${title}</span><span class="ar-s">${sub}</span></span>
      <span class="ar-r">${rec || ""}</span></button>`;
  }

  function cardGammes() {
    const done = CIRCLE.filter((t) => keyLvl(t) === 2).length;
    const next = CIRCLE.find((t) => keyLvl(t) < 2) || CIRCLE[0];
    const dus = CIRCLE.filter((t) => keyLvl(t) === 2 && estDu("g:" + t));
    const chips = CIRCLE.map((t) =>
      `<button class="kchip l${keyLvl(t)}${dus.indexOf(t) >= 0 ? " due" : ""}" data-gkey="${t}">${A.disp(t)}</button>`).join("");
    return `<div class="ate-card">
      <div class="ate-h"><span class="ate-e">🎼</span><div><div class="ate-t">Les 12 gammes majeures</div>
        <div class="ate-s">Les <b>trouver</b> avec la formule, puis les <b>savoir</b> sans réfléchir.</div></div>
        <span class="ate-c">${done}/12</span></div>
      <div class="kchips">${chips}</div>
      <div class="ate-leg"><span class="lgd l0"></span> jamais faite &nbsp; <span class="lgd l1"></span> construite &nbsp; <span class="lgd l2"></span> sue par cœur &nbsp; <span class="lgd due"></span> à réviser</div>
      ${dus.length ? `<button class="cta rev" data-gkey="${dus[0]}">🔁 À réviser aujourd'hui : ${dus.map(A.disp).join(" · ")}</button>` : ""}
      <button class="cta sm" data-gkey="${next}">▶ ${done ? "Continuer" : "Commencer"} : ${A.disp(next)} majeur</button>
      <div class="ate-rows">
        ${row("eclair-gammes", "⚡", "Éclair — gammes", "20 questions contre le chrono", recTxt("ecl:gammes", "/20"))}
      </div></div>`;
  }

  function cardPentas() {
    const done = CIRCLE.filter(pentaOK).length;
    const next = CIRCLE.find((t) => !pentaOK(t)) || CIRCLE[0];
    const gDone = CIRCLE.filter((t) => keyLvl(t) === 2).length;
    const dus = CIRCLE.filter((t) => pentaOK(t) && estDu("p:" + t));
    const chips = CIRCLE.map((t) =>
      `<button class="kchip ${pentaOK(t) ? "l2" : "l0"}${dus.indexOf(t) >= 0 ? " due" : ""}" data-pkey="${t}">${A.disp(t)}</button>`).join("");
    const lock = gDone < 3 ? `<div class="ate-lock">⚠️ Rien ne t'empêche de commencer ici — mais la penta se <b>déduit</b> de la gamme. Fais d'abord <b>3 gammes majeures</b>, sinon tu apprends 12 listes de notes par cœur au lieu d'une règle.</div>` : "";
    return `<div class="ate-card ${gDone < 3 ? "locked" : ""}">
      <div class="ate-h"><span class="ate-e">⭐</span><div><div class="ate-t">Les pentas associées</div>
        <div class="ate-s">La gamme <b>moins ses deux notes qui frottent</b> + sa jumelle mineure.</div></div>
        <span class="ate-c">${done}/12</span></div>
      ${lock}
      <div class="kchips">${chips}</div>
      ${dus.length ? `<button class="cta rev" data-pkey="${dus[0]}">🔁 À réviser aujourd'hui : ${dus.map(A.disp).join(" · ")}</button>` : ""}
      <button class="cta sm" data-pkey="${next}">▶ ${done ? "Continuer" : "Commencer"} : penta de ${A.disp(next)}</button>
      <div class="ate-sub">🎸 Sur le manche — le rôle de chaque note</div>
      <div class="ate-rows">
        ${PENTA_LV.map((l, k) => row("penta" + (k + 1), isDone("pf:" + (k + 1)) ? "✅" : "①②③④"[k],
          "Niveau " + (k + 1) + " · " + l[0], l[1], recTxt("penta:" + (k + 1), "/8"))).join("")}
        ${row("eclair-pentas", "⚡", "Éclair — pentas", "20 questions contre le chrono", recTxt("ecl:pentas", "/20"))}
      </div></div>`;
  }

  function cardManche() {
    const steps = ["f:reperes", "f:touche1", "f:touche2", "f:toutes", "f:octaves"];
    const done = steps.filter(isDone).length;
    return `<div class="ate-card">
      <div class="ate-h"><span class="ate-e">🎸</span><div><div class="ate-t">Les notes sur le manche</div>
        <div class="ate-s">Le réflexe : la case s'allume <b>avant</b> que tu comptes.</div></div>
        <span class="ate-c">${done}/5</span></div>
      <div class="ate-rows">
        ${row("reperes", isDone("f:reperes") ? "✅" : "🧭", "Les repères", "Les 5 règles qui remplacent le comptage", "")}
        ${row("touche1", isDone("f:touche1") ? "✅" : "①", "Touche la note · 3 cordes graves", `${A.disp("E")} · ${A.disp("A")} · ${A.disp("D")}, cases 0 à 12`, recTxt("touche:1", "/10"))}
        ${row("touche2", isDone("f:touche2") ? "✅" : "②", "Touche la note · les 6 cordes", "Tout le manche, corde imposée", recTxt("touche:2", "/10"))}
        ${row("toutes", isDone("f:toutes") ? "✅" : "🗺️", "Toutes les X", `Trouve chaque ${A.disp("C")} du manche, sans en rater un`, recTxt("toutes", "errs"))}
        ${row("octaves", isDone("f:octaves") ? "✅" : "🔭", "Les octaves", "Se déplacer par formes, pas par lettres", recTxt("octaves", "/10"))}
        ${row("eclair-manche", "⚡", "Éclair — manche", "20 questions contre le chrono", recTxt("ecl:manche", "/20"))}
      </div></div>`;
  }

  function cardTonalite() {
    const done = [1, 2, 3, 4].filter((k) => isDone("kf:" + k)).length;
    return `<div class="ate-card">
      <div class="ate-h"><span class="ate-e">🧭</span><div><div class="ate-t">Deviner la tonalité</div>
        <div class="ate-s">Devant une chanson : <b>nommer le centre</b>, et sortir la bonne boîte à notes.</div></div>
        <span class="ate-c">${done}/4</span></div>
      <div class="ate-rows">
        ${KEY_LV.map((l, k) => row("key" + (k + 1), isDone("kf:" + (k + 1)) ? "✅" : "①②③④"[k],
          "Niveau " + (k + 1) + " · " + l[0], l[1], recTxt("key:" + (k + 1), "/8"))).join("")}
      </div></div>`;
  }

  // Scopé à #view : l'overlay reste dans le DOM 200 ms après une fermeture,
  // on ne veut pas recâbler ses boutons au passage.
  function wire() {
    const v = $("#view");
    if (!v) return;
    $$("[data-gkey]", v).forEach((b) => { b.onclick = () => startKey(b.dataset.gkey); });
    $$("[data-pkey]", v).forEach((b) => { b.onclick = () => startPenta(b.dataset.pkey); });
    $$("[data-ex]", v).forEach((b) => { b.onclick = () => startEx(b.dataset.ex); });
  }
  function startEx(id) {
    if (id === "eclair-gammes") return runEclair("gammes", "⚡ Éclair · gammes", qGammes);
    if (id === "eclair-pentas") return runEclair("pentas", "⚡ Éclair · pentas", qPentas);
    if (id === "eclair-manche") return runEclair("manche", "⚡ Éclair · manche", qManche);
    if (id.indexOf("penta") === 0) return exPenta(+id.slice(5));
    if (id.indexOf("key") === 0)   return exKey(+id.slice(3));
    if (id === "reperes")  return exReperes();
    if (id === "touche1")  return exTouche(1);
    if (id === "touche2")  return exTouche(2);
    if (id === "toutes")   return exToutes();
    if (id === "octaves")  return exOctaves();
  }

  /* =========================================================================
     CHANTIER 1 — LES GAMMES MAJEURES
     ========================================================================= */
  function startKey(t) {
    if (!isDone("g:" + t + ":formula")) exFormula(t);
    else exSpell(t, "major");
  }

  /* ---- enharmonie : même son, autre lettre (le piège à distracteurs) ---- */
  function enharm(n) {
    const pc = PCS(n);
    const alt = LC.SHARP[pc] === n ? LC.FLAT[pc] : LC.SHARP[pc];
    if (alt !== n && alt[0] !== n[0]) return alt;
    const map = { "E#": "F", F: "E#", "B#": "C", C: "B#", Cb: "B", B: "Cb", Fb: "E", E: "Fb" };
    return map[n] || null;
  }
  // Distracteurs utiles : d'abord l'enharmonie (même son, mauvaise lettre),
  // puis les demi-tons voisins — c'est là que se joue la vraie discrimination.
  function noteChoices(correct, pool) {
    const pc = PCS(correct);
    let c = [correct];
    const e = enharm(correct);
    if (e) c.push(e);
    c.push(LC.SHARP[(pc + 1) % 12], LC.SHARP[(pc + 11) % 12], correct[0]);
    shuffle((pool || []).filter((n) => n !== correct)).forEach((n) => c.push(n));
    c.push(LC.SHARP[(pc + 2) % 12], LC.SHARP[(pc + 10) % 12]);   // filet : toujours 4 choix
    return uniq(c).slice(0, 4);
  }

  /* -------- Exo 1.1 : LA FORMULE (trouver la gamme note par note) -------- */
  function exFormula(tonic) {
    const scale = LC.majorScale(tonic);
    const targets = scale.slice(1).concat([tonic]);   // degrés 2…7 puis l'octave
    let i = 0, errs = 0, locked = false;
    openSheet("🎼 La formule · " + A.disp(tonic));
    draw("");

    function ribbon() {
      let h = `<div class="ribbon">`;
      for (let d = 0; d < 7; d++) {
        h += `<span class="rb-deg ${d <= i ? "on" : ""}">${d + 1}</span>`;
        h += `<span class="rb-step ${d === i ? "cur" : ""}">${STEPS[d]}</span>`;
      }
      h += `<span class="rb-deg ${i >= 7 ? "on" : ""}">8</span></div>`;
      return h;
    }
    function chips() {
      let h = `<div class="bchips">`;
      for (let d = 0; d < 8; d++) {
        const known = d === 0 ? tonic : (d - 1 < i ? targets[d - 1] : null);
        h += `<span class="bchip ${known ? "on" : ""} ${d === i + 1 ? "cur" : ""}">${known ? A.disp(known) : "?"}</span>`;
      }
      return h + `</div>`;
    }
    function draw(fb) {
      const prev = i === 0 ? tonic : targets[i - 1];
      const step = STEPS[i];
      const correct = targets[i];
      const ch = shuffle(noteChoices(correct, scale));
      paint(`<div class="ex-intro">Formule d'une gamme majeure — <b>toujours la même</b> :</div>
        ${ribbon()}
        <div class="ex-hint2">T = un ton (2 cases / 2 touches) · ½ = un demi-ton (1 case / 1 touche)</div>
        ${chips()}
        <div class="dq sm">Depuis <b>${A.disp(prev)}</b>, on monte d'un <b>${step === "T" ? "ton" : "demi-ton"}</b>.</div>
        <div class="dq-choices">${ch.map((c) => `<button class="dq-c" data-n="${c}">${A.disp(c)}</button>`).join("")}</div>
        <div class="dq-fb">${fb}</div>`);
      locked = false;
      on("[data-n]", (el) => answer(el.dataset.n, correct));
    }
    function answer(given, correct) {
      if (locked) return; locked = true;
      const ok = given === correct;
      $$(".dq-c", $("#exBody")).forEach((x) => {
        if (x.dataset.n === correct) x.classList.add("ok");
        else if (x.dataset.n === given) x.classList.add("ko");
        x.disabled = true;
      });
      if (ok) {
        i++;
        if (i >= 7) return setTimeout(finish, 320);
        setTimeout(() => draw(""), 300);
      } else {
        errs++;
        const why = PCS(given) === PCS(correct)
          ? `Même <b>son</b>, mauvaise <b>lettre</b>. Une gamme majeure utilise les <b>7 lettres dans l'ordre</b>, une seule fois chacune : après ${A.disp(targets[i - 1] || tonic)} vient forcément un <b>${A.disp(correct[0])}</b> (nature, ♯ ou ♭). Jamais deux fois la même lettre.`
          : `Compte en demi-tons : ${A.disp(i === 0 ? tonic : targets[i - 1])} + ${STEPS[i] === "T" ? "2 demi-tons" : "1 demi-ton"} = <b>${A.disp(correct)}</b>.`;
        $(".dq-fb").innerHTML = `<div class="fb-ko">❌ ${why}</div><button class="btn big" id="nx">Continuer →</button>`;
        btn("nx", () => { i++; if (i >= 7) finish(); else draw(""); });
      }
    }
    function finish() {
      const first = !isDone("g:" + tonic + ":formula");
      setDone("g:" + tonic + ":formula");
      if (first) A.earnXP(errs === 0 ? 20 : 12);
      paint(`<div class="ex-win">
        <div class="win-big">${errs === 0 ? "Sans faute ⚡" : "Gamme construite ✓"}</div>
        <div class="win-sub">${A.disp(tonic)} majeur${errs ? ` · ${errs} erreur${errs > 1 ? "s" : ""}` : ""}</div>
        <div class="scale-notes center">${A.dl(scale).map((n) => `<span class="sn">${n}</span>`).join("")}</div>
        <div class="btnrow center"><button class="btn" data-seq="${tonic}:major">▶ Écouter</button></div>
        <div class="hint">${sigExplain(tonic)}</div>
        ${LCRender.piano({ octaves: 2, fill: A.pcsOf(scale), root: PCS(tonic), spell: A.keySpell(tonic) })}
        <div class="hint">Tu viens de la <b>trouver</b>. Maintenant il faut la <b>savoir</b> : même gamme, sans formule et sans filet.</div>
        <button class="btn big primary" id="toSpell">Épeler de tête →</button>
        <button class="btn big ghost" id="quit">Plus tard</button></div>`);
      btn("toSpell", () => exSpell(tonic, "major"));
      btn("quit", closeSheet);
    }
  }

  function sigExplain(tonic) {
    const sig = LC.keySignature(tonic);
    if (!sig.count) return `<b>${A.disp(tonic)} majeur</b> : aucune altération. La seule gamme entièrement sur les touches blanches.`;
    const alt = A.dl(LC.majorScale(tonic).filter((n) => n.length > 1)).join(" ");
    const order = (sig.type === "#" ? SHARP_ORDER : FLAT_ORDER).map((l) => A.disp(l)).join(" ");
    const trick = sig.type === "#"
      ? `<b>Raccourci</b> : le <b>dernier ♯</b> est la sensible → un demi-ton au-dessus, tu as la tonique.`
      : `<b>Raccourci</b> : l'<b>avant-dernier ♭</b> donne le nom de la tonalité (sauf Fa, qui n'en a qu'un).`;
    return `<b>${A.disp(tonic)} majeur = ${sig.count} ${sig.type === "#" ? "♯" : "♭"}</b> : ${alt}.<br>
      Ordre des ${sig.type === "#" ? "♯" : "♭"} : <b>${order}</b> — on prend les <b>${sig.count}</b> premiers.<br>${trick}`;
  }

  /* -------- Exo 1.2 : ÉPELER DE TÊTE (la lettre est forcée, l'altération non) ---- */
  function exSpell(tonic, kind, onDone) {
    const notes = kind === "major" ? LC.majorScale(tonic)
      : kind === "majpenta" ? LC.majorPenta(tonic) : LC.minorPenta(tonic);
    const title = kind === "major" ? A.disp(tonic) + " majeur"
      : kind === "majpenta" ? "penta majeure de " + A.disp(tonic) : "penta mineure de " + A.disp(tonic) + "m";
    const intro = kind === "major"
      ? `Une gamme prend les <b>lettres dans l'ordre</b>. La lettre est donnée — à toi l'<b>altération</b>.`
      : kind === "majpenta"
        ? `Penta majeure = degrés <b>1 · 2 · 3 · 5 · 6</b>. La lettre est donnée — à toi l'altération.`
        : `Penta mineure = degrés <b>1 · ♭3 · 4 · 5 · ♭7</b>. La lettre est donnée — à toi l'altération.`;
    const doneKey = kind === "major" ? "g:" + tonic + ":spell" : null;
    let i = 1, errs = 0, locked = false;
    openSheet("✍️ Épelle · " + title);
    startT();
    draw("");

    function accOf(n) { let a = 0; for (let k = 1; k < n.length; k++) { if (n[k] === "#") a++; else if (n[k] === "b") a--; } return a; }
    function slots() {
      return `<div class="bchips">` + notes.map((n, d) =>
        `<span class="bchip ${d < i ? "on" : ""} ${d === i ? "cur" : ""}">${d < i ? A.disp(n) : (d === i ? A.disp(n[0]) + "<span class='q'>?</span>" : "·")}</span>`
      ).join("") + `</div>`;
    }
    function draw(fb) {
      if (i >= notes.length) return finish();
      const L = notes[i][0];
      const opts = [-1, 0, 1].map((a) => ({ a, n: LC.letterAcc(L, a) }));
      paint(`<div class="ex-intro">${intro}</div>
        ${slots()}
        <div class="dq sm">${kind === "major" ? "Degré" : "Note"} <b>${i + 1}</b> : c'est un <b>${A.disp(L)}</b>. Nature, dièse ou bémol ?</div>
        <div class="acc-row">${opts.map((o) =>
          `<button class="acc-b" data-a="${o.a}"><span class="acc-s">${o.a === 0 ? "♮" : o.a > 0 ? "♯" : "♭"}</span><span class="acc-n">${A.disp(o.n)}</span></button>`).join("")}</div>
        <div class="dq-fb">${fb}</div>`);
      locked = false;
      on("[data-a]", (el) => answer(+el.dataset.a));
    }
    function answer(a) {
      if (locked) return; locked = true;
      const correct = accOf(notes[i]);
      $$("[data-a]", $("#exBody")).forEach((x) => {
        if (+x.dataset.a === correct) x.classList.add("ok");
        else if (+x.dataset.a === a) x.classList.add("ko");
        x.disabled = true;
      });
      if (a === correct) { i++; setTimeout(() => draw(""), 260); }
      else {
        errs++;
        $(".dq-fb").innerHTML = `<div class="fb-ko">❌ C'est <b>${A.disp(notes[i])}</b>.</div><button class="btn big" id="nx">Continuer →</button>`;
        btn("nx", () => { i++; draw(""); });
      }
    }
    function finish() {
      const ms = stopT();
      const clean = errs === 0;
      if (onDone) return onDone(errs, ms);      // maillon d'une chaîne (pentas)
      let retrograde = false;
      if (doneKey) {
        const dejaSu = isDone(doneKey);
        if (clean) { setDone(doneKey); A.earnXP(dejaSu ? 12 : 30); planifier("g:" + tonic, true); }
        else if (dejaSu) {
          // révision ratée : une gamme qu'on n'épelle plus n'est pas sue. On la redescend.
          unsetDone(doneKey); planifier("g:" + tonic, false); retrograde = true;
        }
        setBest("spell:" + tonic, { score: clean ? 1 : 0, time: ms });
      } else A.earnXP(clean ? 15 : 6);
      paint(`<div class="ex-win">
        <div class="win-big">${clean ? "0 faute · " + fmtT(ms) : errs + " faute" + (errs > 1 ? "s" : "")}</div>
        <div class="win-sub">${title}</div>
        <div class="scale-notes center">${A.dl(notes).map((n) => `<span class="sn">${n}</span>`).join("")}</div>
        <div class="btnrow center"><button class="btn" data-seq="${tonic}:${kind === "major" ? "major" : kind}">▶ Écouter</button></div>
        ${kind === "major" ? `<div class="hint">${sigExplain(tonic)}</div>` : ""}
        ${clean
          ? `<div class="fb-ok">✅ ${kind === "major" ? `<b>${A.disp(tonic)} majeur</b> est marquée sue par cœur.` : "Propre."} Elle te sera <b>reproposée dans ${IVL[Math.min((st().rev["g:" + tonic] || { step: 1 }).step, IVL.length) - 1]} jours</b> : c'est la deuxième fois qui grave, pas la première.</div>`
          : retrograde
            ? `<div class="fb-ko">Révision ratée. <b>${A.disp(tonic)} majeur</b> repasse en « construite » : une gamme qu'on n'épelle plus sans faute n'est pas une gamme sue. Refais-la maintenant, tu la récupères en 30 secondes.</div>`
            : `<div class="fb-ko">Pas encore. Il faut <b>0 faute</b> pour valider la gamme — refais-la maintenant, tant que c'est frais.</div>`}
        <button class="btn big ${clean ? "ghost" : "primary"}" id="again">↻ Refaire</button>
        ${clean && kind === "major" ? `<button class="btn big primary" id="nextKey">Gamme suivante →</button>` : ""}
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => exSpell(tonic, kind));
      btn("quit", closeSheet);
      btn("nextKey", () => { const n = CIRCLE.find((t) => keyLvl(t) < 2); if (n) startKey(n); else closeSheet(); });
    }
  }

  /* =========================================================================
     CHANTIER 2 — LES PENTAS
     ========================================================================= */
  // Penta déjà acquise → on révise (épellation seule) ; sinon parcours complet.
  function startPenta(t) { return pentaOK(t) ? revPenta(t) : exRetire(t); }

  function revPenta(t) {
    exSpell(t, "majpenta", (errs, ms) => {
      const clean = errs === 0;
      planifier("p:" + t, clean);
      if (!clean) unsetDone("p:" + t);
      A.earnXP(clean ? 12 : 3);
      const rm = LC.relativeMinor(t);
      paint(`<div class="ex-win">
        <div class="win-big">${clean ? "0 faute · " + fmtT(ms) : errs + " faute" + (errs > 1 ? "s" : "")}</div>
        <div class="win-sub">Révision · penta de ${A.disp(t)}</div>
        <div class="scale-notes center">${A.dl(LC.majorPenta(t)).map((n) => `<span class="sn">${n}</span>`).join("")}</div>
        <div class="btnrow center"><button class="btn" data-seq="${t}:majpenta">▶ Majeure</button>
          <button class="btn" data-seq="${rm}:minpenta">▶ ${A.disp(rm)} mineure</button></div>
        ${clean
          ? `<div class="fb-ok">✅ Toujours là. Prochaine révision dans <b>${IVL[Math.min(st().rev["p:" + t].step, IVL.length) - 1]} jours</b>.</div>`
          : `<div class="fb-ko">Elle n'est plus acquise : la penta de ${A.disp(t)} repasse à refaire en entier. Ça arrive — c'est exactement pour ça qu'on révise.</div>`}
        <button class="btn big primary" id="again">↻ Refaire</button>
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => startPenta(t));
      btn("quit", closeSheet);
    });
  }

  /* -------- Exo 2.1 : retirer les degrés 4 et 7 -------- */
  function exRetire(tonic) {
    const s = LC.majorScale(tonic);
    const target = [3, 6];
    let sel = [], locked = false;
    openSheet("⭐ Retire les deux · " + A.disp(tonic));
    draw("");

    function draw(fb, keep) {
      paint(`<div class="ex-intro">La penta majeure, c'est la gamme majeure <b>moins deux notes</b>. Toujours les mêmes degrés.</div>
        <div class="dq sm">Dans <b>${A.disp(tonic)} majeur</b>, touche les <b>2 notes</b> qui ne sont <b>pas</b> dans la penta majeure.</div>
        <div class="degchips">${s.map((n, d) => {
          const pris = sel.indexOf(d) >= 0, cible = target.indexOf(d) >= 0;
          let cls = pris ? "sel" : "";
          // après validation : on montre la bonne réponse ET ce qu'il a choisi à tort
          if (locked) cls = cible ? "bad" : (pris ? "wrongpick" : "keep");
          return `<button class="dchip ${cls}" data-d="${d}"><span class="dc-n">${d + 1}</span>${A.disp(n)}</button>`;
        }).join("")}</div>
        <div class="dq-fb">${fb}</div>`, keep);
      if (!locked) on("[data-d]", tap);
      btn("nx", () => exSpell(tonic, "majpenta", () => exJumelle(tonic)));
    }
    function tap(el) {
      const d = +el.dataset.d;
      const k = sel.indexOf(d);
      if (k >= 0) sel.splice(k, 1); else if (sel.length < 2) sel.push(d);
      if (sel.length === 2) return validate();
      draw("");
    }
    function validate() {
      locked = true;
      const ok = sel.slice().sort().join() === target.join();
      if (ok) A.earnXP(10);
      const why = `Les demi-tons d'une gamme majeure tombent entre <b>3–4</b> et <b>7–8</b>. Les degrés <b>4</b> (${A.disp(s[3])}) et <b>7</b> (${A.disp(s[6])}) sont donc les deux notes qui <b>frottent</b> contre l'accord. On les enlève → il reste 5 notes qui passent sur à peu près tout. C'est pour ça que la penta pardonne.`;
      draw(`<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅ Exact." : "❌ C'était les degrés <b>4</b> et <b>7</b>."} ${why}</div>
        <div class="scale-notes center">${A.dl(LC.majorPenta(tonic)).map((n) => `<span class="sn">${n}</span>`).join("")}</div>
        <div class="btnrow center"><button class="btn" data-seq="${tonic}:majpenta">▶ Écouter la penta</button></div>
        <button class="btn big primary" id="nx">Épeler la penta →</button>`);
    }
  }

  /* -------- Exo 2.2 puis 2.3 : épeler la penta (via exSpell), puis la jumelle ---- */
  function exJumelle(tonic) {
    const rm = LC.relativeMinor(tonic);
    const mp = LC.majorPenta(tonic), np = LC.minorPenta(rm);
    let locked = false;
    openSheet("⭐ La jumelle · " + A.disp(tonic));
    draw("");
    function draw(fb) {
      const wrongs = shuffle(CIRCLE.filter((k) => k !== tonic)).slice(0, 3).map((k) => LC.relativeMinor(k));
      const ch = shuffle(uniq([rm].concat(wrongs)));
      paint(`<div class="ex-intro">Penta majeure de <b>${A.disp(tonic)}</b> = ${A.dl(mp).join(" ")}</div>
        <div class="dq sm">Ces <b>mêmes 5 notes</b>, jouées en partant d'une autre, donnent une penta <b>mineure</b>. Laquelle ?</div>
        <div class="dq-choices">${ch.map((c) => `<button class="dq-c" data-n="${c}">${A.disp(c)} mineur</button>`).join("")}</div>
        <div class="dq-fb">${fb}</div>`);
      if (!locked) on("[data-n]", (el) => answer(el.dataset.n));
      btn("nx", finish);
    }
    function answer(given) {
      if (locked) return; locked = true;
      const ok = given === rm;
      $$(".dq-c", $("#exBody")).forEach((x) => {
        if (x.dataset.n === rm) x.classList.add("ok"); else if (x.dataset.n === given) x.classList.add("ko");
        x.disabled = true;
      });
      $(".dq-fb").innerHTML = `<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} La relative mineure est le <b>6e degré</b> : ${A.dl(LC.majorScale(tonic)).join(" ")} → <b>${A.disp(rm)}</b>.<br>
        Une seule forme sur le manche, <b>deux noms</b> : tu la lances sur ${A.disp(tonic)} elle sonne majeur, sur ${A.disp(rm)} elle sonne mineur. Rien d'autre ne change.</div>
        <button class="btn big primary" id="nx">Voir le récap →</button>`;
      btn("nx", finish);
    }
    function finish() {
      const first = !isDone("p:" + tonic);
      setDone("p:" + tonic);
      planifier("p:" + tonic, true);
      if (first) A.earnXP(25);
      paint(`<div class="ex-win"><div class="win-big">Penta de ${A.disp(tonic)} ✓</div>
        <div class="win-sub">Deux noms, cinq notes, un seul dessin.</div>
        <div class="pen-two">
          <div><div class="cap">Penta MAJEURE de ${A.disp(tonic)}</div>
            <div class="scale-notes center">${A.dl(mp).map((n) => `<span class="sn">${n}</span>`).join("")}</div>
            <div class="btnrow center"><button class="btn" data-seq="${tonic}:majpenta">▶</button></div></div>
          <div><div class="cap">Penta MINEURE de ${A.disp(rm)}</div>
            <div class="scale-notes center">${A.dl(np).map((n) => `<span class="sn">${n}</span>`).join("")}</div>
            <div class="btnrow center"><button class="btn" data-seq="${rm}:minpenta">▶</button></div></div>
        </div>
        <div class="hint">Mêmes cases sur le manche — regarde : la seule chose qui bouge, c'est la note sur laquelle tu te reposes (en rouge).</div>
        ${LCRender.fretboard({ frets: 12, highlight: A.pcsOf(mp), root: PCS(tonic), spell: A.keySpell(tonic) })}
        <button class="btn big primary" id="nextP">Penta suivante →</button>
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("nextP", () => { const n = CIRCLE.find((t) => !pentaOK(t)); if (n) startPenta(n); else closeSheet(); });
      btn("quit", closeSheet);
    }
  }

  /* =========================================================================
     CHANTIER 3 — LE MANCHE
     ========================================================================= */

  /* -------- 3.1 Les repères -------- */
  function exReperes() {
    const Q = [
      { p: `Les 6 cordes à vide, de la <b>grave</b> à l'<b>aiguë</b> ?`, c: `${A.disp("E")} ${A.disp("A")} ${A.disp("D")} ${A.disp("G")} ${A.disp("B")} ${A.disp("E")}`,
        w: [`${A.disp("E")} ${A.disp("A")} ${A.disp("D")} ${A.disp("G")} ${A.disp("C")} ${A.disp("E")}`, `${A.disp("E")} ${A.disp("A")} ${A.disp("D")} ${A.disp("B")} ${A.disp("G")} ${A.disp("E")}`, `${A.disp("E")} ${A.disp("D")} ${A.disp("A")} ${A.disp("G")} ${A.disp("B")} ${A.disp("E")}`],
        why: `Les deux cordes de <b>${A.disp("E")}</b> aux extrémités sont identiques : tout ce que tu apprends sur la grave marche à l'identique sur l'aiguë.` },
      { p: `Case <b>12</b> de n'importe quelle corde ?`, c: `La corde à vide, une octave plus haut`,
        w: [`Une quinte au-dessus de la corde à vide`, `La corde du dessus à vide`, `Ça dépend de la corde`],
        why: `La 12e case coupe la corde en deux : c'est <b>l'octave</b>. Après la case 12, tout se répète — le manche ne fait que 12 cases à apprendre.` },
      { p: `La corde de <b>${A.disp("A")}</b> à vide, on la retrouve sur quelle case de la corde de <b>${A.disp("E")}</b> grave ?`, c: `case 5`,
        w: [`case 4`, `case 6`, `case 7`],
        why: `<b>Case 5 = la corde suivante à vide</b>. Ça marche pour toutes les paires… sauf une.` },
      { p: `L'exception : la corde de <b>${A.disp("B")}</b> à vide se trouve sur quelle case de la corde de <b>${A.disp("G")}</b> ?`, c: `case 4`,
        w: [`case 5`, `case 3`, `case 6`],
        why: `${A.disp("G")}→${A.disp("B")}, c'est <b>4 cases</b> : l'accordage de la guitare fait un « décalage » à cet endroit. C'est la seule exception — et c'est elle qui fait rater les gens.` },
      { p: `Une note case <b>3</b> de la corde de <b>${A.disp("E")}</b> grave. La même à l'octave ?`, c: `case 5 de la corde de ${A.disp("D")}`,
        w: [`case 3 de la corde de ${A.disp("D")}`, `case 5 de la corde de ${A.disp("A")}`, `case 7 de la corde de ${A.disp("D")}`],
        why: `<b>2 cordes plus aiguës, +2 cases</b> : c'est LA forme d'octave. (+3 cases dès que la corde de ${A.disp("B")} est concernée.)` },
    ];
    let n = 0, score = 0;
    openSheet("🧭 Les repères");
    intro();
    function intro() {
      paint(`<div class="ex-intro big">Cinq règles remplacent tout le comptage.</div>
        <ol class="rules">
          <li><b>Les cordes à vide</b> : ${A.disp("E")} ${A.disp("A")} ${A.disp("D")} ${A.disp("G")} ${A.disp("B")} ${A.disp("E")} (grave → aiguë). Les deux ${A.disp("E")} sont jumelles.</li>
          <li><b>Case 12 = octave</b> de la corde à vide. Il n'y a que 12 cases à connaître, ensuite ça boucle.</li>
          <li><b>Case 5 = la corde suivante à vide</b> — sauf ${A.disp("G")}→${A.disp("B")} où c'est la <b>case 4</b>.</li>
          <li><b>Octave = 2 cordes plus aiguës, +2 cases</b> (+3 quand la corde de ${A.disp("B")} est dans le coup).</li>
          <li><b>Pas de case entre ${A.disp("E")}–${A.disp("F")} ni ${A.disp("B")}–${A.disp("C")}</b> : ces paires sont collées. Toutes les autres lettres ont une case entre elles.</li>
        </ol>
        <div class="hint">Les points blancs du manche (3 · 5 · 7 · 9 · 12) ne sont pas décoratifs : ce sont tes points d'ancrage. Apprends d'abord les notes <b>sur ces cases-là</b>, cordes de ${A.disp("E")} et de ${A.disp("A")}.</div>
        ${LCRender.fretboard({ frets: 12, showAll: true, spell: A.spellMap("#", []) })}
        <button class="btn big primary" id="go">J'ai lu — teste-moi →</button>`);
      btn("go", next);
    }
    function next() {
      if (n >= Q.length) return finish();
      const q = Q[n]; n++;
      const ch = shuffle(uniq([q.c].concat(q.w)));
      paint(`<div class="ecl-top">${n}/${Q.length} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>
        <div class="dq sm">${q.p}</div>
        <div class="dq-choices">${ch.map((c, k) => `<button class="dq-c" data-i="${k}" data-v="${c.replace(/"/g, "&quot;")}">${c}</button>`).join("")}</div>
        <div class="dq-fb"></div>`);
      let locked = false;
      on(".dq-c", (el) => {
        if (locked) return; locked = true;
        const ok = el.dataset.v === q.c;
        $$(".dq-c", $("#exBody")).forEach((x) => { if (x.dataset.v === q.c) x.classList.add("ok"); else if (x === el) x.classList.add("ko"); x.disabled = true; });
        if (ok) score++;
        $(".dq-fb").innerHTML = `<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} ${q.why}</div><button class="btn big" id="nx">Suivant →</button>`;
        btn("nx", next);
      });
    }
    function finish() {
      if (score >= 4) { const first = !isDone("f:reperes"); setDone("f:reperes"); if (first) A.earnXP(25); }
      paint(`<div class="ex-win"><div class="win-big">${score}/${Q.length}</div>
        <div class="win-sub">${score >= 4 ? "Les repères sont posés." : "Relis les 5 règles et refais-le."}</div>
        <button class="btn big primary" id="go">${score >= 4 ? "Passer à « Touche la note » →" : "↻ Refaire"}</button>
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("go", () => (score >= 4 ? exTouche(1) : exReperes()));
      btn("quit", closeSheet);
    }
  }

  function markLabels(marks) {
    const l = {};
    Object.keys(marks).forEach((k) => { const p = k.split(":"); l[k] = noteName(LC.fretPc(+p[0], +p[1])); });
    return l;
  }

  /* -------- 3.2 Touche la note (manche vierge, corde imposée) -------- */
  function exTouche(level) {
    const strs = level === 1 ? [0, 1, 2] : [0, 1, 2, 3, 4, 5];
    const TOTAL = 10;
    let n = 0, score = 0, q = null, locked = false, marks = {};
    openSheet(level === 1 ? "🎸 Touche la note · cordes graves" : "🎸 Touche la note · 6 cordes");
    startT(); next();

    function next() {
      if (n >= TOTAL) return finish();
      const s = pick(strs), pc = rand(12);
      const pos = [];
      for (let f = 0; f <= 12; f++) if (LC.fretPc(s, f) === pc) pos.push(f);
      q = { s: s, pc: pc, pos: pos }; n++; marks = {}; locked = false;
      draw("");
    }
    function draw(fb, keep) {
      paint(`<div class="ecl-top">${n}/${TOTAL} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>
        <div class="dq sm">Touche un <b>${noteName(q.pc)}</b> sur la corde de <b>${strName(q.s)}</b>
          <span class="dq-hint">cases 0 à 12 · la case 0 = corde à vide, à gauche du sillet</span></div>
        ${LCRender.fretQuiz({ frets: 12, onlyString: q.s, marks: marks, labels: markLabels(marks) })}
        <div class="dq-fb">${fb}</div>`, keep);
      if (!locked) on("[data-fret]", tap);
      btn("nx", next);
    }
    function tap(el) {
      if (locked) return;
      const s = +el.dataset.str, f = +el.dataset.fret;
      if (s !== q.s) return;
      locked = true;
      const ok = q.pos.indexOf(f) >= 0;
      marks[s + ":" + f] = ok ? "ok" : "ko";
      if (!ok) q.pos.forEach((p) => { if (!marks[s + ":" + p]) marks[s + ":" + p] = "lit"; });
      if (ok) score++;
      draw(`<div class="${ok ? "fb-ok" : "fb-ko"}">${ok
        ? "✅"
        : `❌ Sur la corde de ${strName(q.s)}, le ${noteName(q.pc)} est <b>case ${q.pos.join(" et case ")}</b>. Corde à vide = ${A.disp(STR_PC[q.s])} : compte les demi-tons depuis là.`}</div>
        <button class="btn big" id="nx">Suivant →</button>`, true);
    }
    function finish() {
      const ms = stopT();
      const rec = setBest("touche:" + level, { score: score, time: ms });
      A.earnXP(score * 3);
      if (score >= 8) { const first = !isDone("f:touche" + level); setDone("f:touche" + level); if (first) A.earnXP(15); }
      paint(`<div class="ex-win"><div class="win-big">${score}/${TOTAL}</div>
        <div class="win-sub">en ${fmtT(ms)}${rec ? ` · <b>nouveau record</b> 🏆` : ""}</div>
        ${score >= 8
          ? `<div class="fb-ok">✅ Niveau validé.${level === 1 ? " Passe aux 6 cordes." : " Le manche commence à être à toi."}</div>`
          : `<div class="hint">Il faut <b>8/10</b> pour valider. Astuce : ne compte pas depuis la case 0 à chaque fois — pars du repère le plus proche (case 5, 7 ou 12).</div>`}
        <button class="btn big primary" id="again">↻ Relancer</button>
        ${score >= 8 && level === 1 ? `<button class="btn big primary" id="up">Niveau 2 · les 6 cordes →</button>` : ""}
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => exTouche(level));
      btn("up", () => exTouche(2));
      btn("quit", closeSheet);
    }
  }

  /* -------- 3.3 Toutes les X (la carte complète d'une note) -------- */
  function exToutes() {
    const ROUNDS = 5;
    let r = 0, errsTot = 0, pc = 0, all = [], found = {}, marks = {};
    openSheet("🗺️ Toutes les X");
    startT(); nextRound();

    function nextRound() {
      if (r >= ROUNDS) return finish();
      pc = rand(12); all = []; found = {}; marks = {}; r++;
      for (let s = 0; s < 6; s++) for (let f = 0; f <= 12; f++) if (LC.fretPc(s, f) === pc) all.push(s + ":" + f);
      draw("");
    }
    function draw(fb, keep) {
      paint(`<div class="ecl-top">Note ${r}/${ROUNDS} · trouvées <b>${Object.keys(found).length}</b>/${all.length} · ${errsTot} erreur${errsTot > 1 ? "s" : ""}</div>
        <div class="dq sm">Touche <b>tous les ${noteName(pc)}</b> du manche
          <span class="dq-hint">6 cordes, cases 0 à 12 — il y en a ${all.length}</span></div>
        ${LCRender.fretQuiz({ frets: 12, marks: marks, labels: markLabels(marks) })}
        <div class="dq-fb">${fb}</div>`, keep);
      on("[data-fret]", tap);
      btn("nx", nextRound);
    }
    function tap(el) {
      const key = el.dataset.str + ":" + el.dataset.fret;
      if (found[key] || marks[key] === "ko") return;
      if (all.indexOf(key) >= 0) {
        found[key] = 1; marks[key] = "ok";
        if (Object.keys(found).length === all.length) {
          return draw(`<div class="fb-ok">✅ Les ${all.length} ${noteName(pc)} du manche.</div>
            <button class="btn big primary" id="nx">${r >= ROUNDS ? "Terminer →" : "Note suivante →"}</button>`, true);
        }
        draw("", true);
      } else {
        errsTot++; marks[key] = "ko";
        draw(`<div class="fb-ko">❌ Ça, c'est un <b>${noteName(LC.fretPc(+el.dataset.str, +el.dataset.fret))}</b>. Continue.</div>`, true);
      }
    }
    function finish() {
      const ms = stopT();
      const rec = setBest("toutes", { score: -errsTot, time: ms });
      A.earnXP(Math.max(5, 40 - errsTot * 3));
      if (errsTot <= 3) { const first = !isDone("f:toutes"); setDone("f:toutes"); if (first) A.earnXP(20); }
      paint(`<div class="ex-win"><div class="win-big">${errsTot} erreur${errsTot > 1 ? "s" : ""}</div>
        <div class="win-sub">${ROUNDS} notes cartographiées en ${fmtT(ms)}${rec ? ` · <b>record</b> 🏆` : ""}</div>
        <div class="hint">Une note apparaît <b>6 fois</b> entre la case 0 et la 12 — une par corde. Sauf si c'est la note d'une corde à vide : elle revient alors aussi case 12 (${A.disp("A")} → 7 positions, ${A.disp("E")} → 8, puisqu'il y a deux cordes de ${A.disp("E")}). Quand tu les vois toutes d'un coup sans chercher, tu ne joues plus « en position » : tu joues sur tout le manche.</div>
        <button class="btn big primary" id="again">↻ Relancer</button>
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", exToutes);
      btn("quit", closeSheet);
    }
  }

  /* -------- 3.4 Les octaves (se déplacer par formes) -------- */
  function exOctaves() {
    const TOTAL = 10;
    let n = 0, score = 0, q = null, locked = false, marks = {}, labels = {};
    openSheet("🔭 Les octaves");
    startT(); next();

    function next() {
      if (n >= TOTAL) return finish();
      const s = rand(4);
      const add = s < 2 ? 2 : 3;
      const f = rand(13 - add);
      q = { s: s, f: f, ts: s + 2, tf: f + add, add: add, pc: LC.fretPc(s, f) };
      n++; locked = false;
      marks = {}; marks[s + ":" + f] = "lit";
      labels = {}; labels[s + ":" + f] = noteName(q.pc);
      draw("");
    }
    function draw(fb, keep) {
      paint(`<div class="ecl-top">${n}/${TOTAL} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>
        <div class="dq sm">Voici un <b>${noteName(q.pc)}</b> (corde de ${strName(q.s)}, case ${q.f}).<br>
          Touche le <b>même ${noteName(q.pc)} une octave plus haut</b>.
          <span class="dq-hint">2 cordes plus aiguës = 2 lignes plus haut sur le schéma</span></div>
        ${LCRender.fretQuiz({ frets: 12, marks: marks, labels: labels })}
        <div class="dq-fb">${fb}</div>`, keep);
      if (!locked) on("[data-fret]", tap);
      btn("nx", next);
    }
    function tap(el) {
      if (locked) return;
      const s = +el.dataset.str, f = +el.dataset.fret;
      if (s === q.s && f === q.f) return;
      locked = true;
      const ok = s === q.ts && f === q.tf;
      marks[s + ":" + f] = ok ? "ok" : "ko";
      labels[s + ":" + f] = noteName(LC.fretPc(s, f));
      if (!ok) { marks[q.ts + ":" + q.tf] = "lit"; labels[q.ts + ":" + q.tf] = noteName(q.pc); }
      if (ok) score++;
      draw(`<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} <b>2 cordes plus aiguës, +${q.add} cases</b> ${q.add === 3 ? "(+3 : la corde de " + A.disp("B") + " décale tout)" : "(+2 : la règle normale)"}. Corde de ${strName(q.ts)}, case ${q.tf}.</div>
        <button class="btn big" id="nx">Suivant →</button>`, true);
    }
    function finish() {
      const ms = stopT();
      const rec = setBest("octaves", { score: score, time: ms });
      A.earnXP(score * 3);
      if (score >= 8) { const first = !isDone("f:octaves"); setDone("f:octaves"); if (first) A.earnXP(15); }
      paint(`<div class="ex-win"><div class="win-big">${score}/${TOTAL}</div>
        <div class="win-sub">en ${fmtT(ms)}${rec ? ` · <b>record</b> 🏆` : ""}</div>
        <div class="hint">Deux formes, c'est tout :<br>• cordes <b>${A.disp("E")}→${A.disp("D")}</b> et <b>${A.disp("A")}→${A.disp("G")}</b> : +2 cordes, <b>+2 cases</b><br>• cordes <b>${A.disp("D")}→${A.disp("B")}</b> et <b>${A.disp("G")}→${A.disp("E")}</b> aiguë : +2 cordes, <b>+3 cases</b><br>C'est comme ça qu'on transporte une penta d'un bout à l'autre du manche <b>sans réfléchir aux noms</b>.</div>
        <button class="btn big primary" id="again">↻ Relancer</button>
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", exOctaves);
      btn("quit", closeSheet);
    }
  }

  /* =========================================================================
     CHANTIER 4 — MAÎTRISE DE LA PENTA SUR LE MANCHE
     La forme, tu l'as. Ce qui manque : savoir CE QUE FAIT chaque note.
     ========================================================================= */
  const ROLE_MIN = [
    { deg: "1", nom: "la tonique", court: "1",
      dit: `Le <b>repos absolu</b>. C'est la maison : finis ta phrase dessus quand tu veux vraiment conclure.`,
      quand: `Elle marche sur tout le morceau, mais elle sonne le plus « posée » sur l'accord <b>i</b>. Trop l'utiliser rend le solo plat : garde-la pour les fins.` },
    { deg: "♭3", nom: "la tierce mineure", court: "♭3",
      dit: `<b>C'est elle qui dit « mineur »</b>. Enlève-la, tu ne sais plus si tu es en majeur ou en mineur.`,
      quand: `Cible n°1 sur l'accord <b>i</b> (mineur). Sur un accord <b>majeur</b> (blues en I7) elle devient la <b>blue note</b> : magnifique en passage, tendue si tu la tiens.` },
    { deg: "4", nom: "la quarte", court: "4",
      dit: `Une <b>tension douce</b> qui appelle : elle veut descendre sur la ♭3 ou monter sur la 5.`,
      quand: `Ne la tiens pas au-dessus de l'accord <b>i</b>, elle frotte un peu. Mais sur l'accord <b>iv</b>, elle devient la fondamentale : là, c'est un point de repos.` },
    { deg: "5", nom: "la quinte", court: "5",
      dit: `<b>La stabilité pure.</b> Elle ne dit ni majeur ni mineur — c'est la note la plus neutre de la penta.`,
      quand: `C'est ta <b>note de passage entre les accords</b> : elle appartient à l'accord i <i>et</i> se pose sans faute quand l'harmonie bouge. Une note longue tenue pendant un changement d'accord ? Prends la quinte.` },
    { deg: "♭7", nom: "la septième mineure", court: "♭7",
      dit: `<b>Le moteur.</b> Elle donne l'impression que ça avance, que ça n'est pas fini.`,
      quand: `Superbe sur <b>i7</b> et sur le <b>V7</b> d'un blues. Elle crée l'envie de retomber sur la tonique — sers-t'en juste avant de conclure.` },
  ];
  const ROLE_MAJ = [
    { deg: "1", nom: "la tonique", court: "1",
      dit: `Le <b>point de repos</b>. Tout le morceau tire vers elle.`,
      quand: `Finis dessus. Mais commencer une phrase dessus, c'est banal : entre plutôt par la 3 ou la 6.` },
    { deg: "2", nom: "la seconde", court: "2",
      dit: `Aérienne, suspendue — c'est la <b>9e</b> de l'accord. Elle flotte au-dessus sans jamais frotter.`,
      quand: `Magnifique tenue au-dessus de l'accord <b>I</b>. Elle ne conclut rien : c'est une note d'ouverture, pas de fin.` },
    { deg: "3", nom: "la tierce majeure", court: "3",
      dit: `<b>La note qui fait « joyeux ».</b> C'est elle, et elle seule, qui rend la tonalité majeure.`,
      quand: `<b>Cible n°1</b> sur l'accord <b>I</b>. Atterrir sur la tierce plutôt que sur la tonique, c'est la différence entre un solo d'élève et un solo qui chante.` },
    { deg: "5", nom: "la quinte", court: "5",
      dit: `<b>La stabilité qui ne prend pas parti.</b> Ni majeure ni mineure : indestructible.`,
      quand: `La <b>note-pivot entre les accords</b> : la quinte de I est la fondamentale de V. Quand l'harmonie change et que tu ne sais pas où aller, pose-toi dessus — ça passe toujours.` },
    { deg: "6", nom: "la sixte", court: "6",
      dit: `Douce, un peu country — c'est la <b>13e</b>. C'est aussi la <b>tonique de la relative mineure</b>.`,
      quand: `Chante très bien sur <b>I</b> et sur <b>vi</b>. Insiste dessus et l'oreille commence à basculer vers le mineur : c'est ton interrupteur de couleur.` },
  ];
  const HORS = {
    maj3: { nom: "la tierce MAJEURE (hors penta)",
      dit: `Elle n'est <b>pas</b> dans la penta mineure — et c'est justement pour ça qu'elle est bonne.`,
      quand: `Sur un accord <b>majeur ou 7</b> (blues), glisser de la ♭3 vers la 3 est <b>le</b> cliché blues. En passage, jamais tenue.` },
    b5: { nom: "la blue note (♭5)",
      dit: `La note « sale » entre la 4 et la 5. Ajoutée à la penta mineure, elle fait la <b>gamme blues</b>.`,
      quand: `Uniquement <b>de passage</b> : 4 → ♭5 → 5. Si tu la tiens, ça sonne faux. C'est un frottement, pas une destination.` },
  };

  function pentaLevels(lv) {
    if (lv === 1) return [{ type: "min", idx: [0] }];
    if (lv === 2) return [{ type: "min", idx: [0, 1] }, { type: "maj", idx: [0, 2] }];
    if (lv === 3) return [{ type: "min", idx: [0, 1, 3] }, { type: "maj", idx: [0, 2, 3] }];
    return [{ type: "min", idx: [0, 1, 2, 3, 4], hors: true }, { type: "maj", idx: [0, 1, 2, 3, 4] }];
  }
  const PENTA_LV = [
    ["La tonique", "Le point de repos, penta mineure"],
    ["Tonique & tierce", "La note qui décide majeur ou mineur"],
    ["+ la quinte", "La note-pivot entre les accords"],
    ["Tous les rôles", "Les 5 degrés + la blue note et la tierce majeure"],
  ];

  function exPenta(lv) {
    const TOTAL = 8;
    let n = 0, score = 0, q = null, locked = false, marks = {}, labels = {};
    // Sac de questions : chaque rôle du niveau passe avant qu'un seul se répète.
    let sac = [];
    function tirer() {
      if (!sac.length) {
        pentaLevels(lv).forEach((c) => c.idx.forEach((k) => sac.push({ conf: c, k: k })));
        sac = shuffle(sac);
      }
      return sac.pop();
    }
    openSheet("🎯 Rôles de la penta · niveau " + lv);
    startT(); next();

    function next() {
      if (n >= TOTAL) return finish();
      const tir = tirer(), conf = tir.conf;
      const tonic = conf.type === "min" ? LC.relativeMinor(pick(CIRCLE)) : pick(CIRCLE);
      const notes = conf.type === "min" ? LC.minorPenta(tonic) : LC.majorPenta(tonic);
      const pcs = notes.map(PCS);
      // 1 fois sur 4 au niveau 4 : une note HORS penta (la vraie nuance)
      const horsRoll = conf.hors && rand(4) === 0;
      let target, role;
      if (horsRoll) {
        const which = rand(2) === 0 ? "maj3" : "b5";
        target = (PCS(tonic) + (which === "maj3" ? 4 : 6)) % 12;
        role = HORS[which];
      } else {
        role = (conf.type === "min" ? ROLE_MIN : ROLE_MAJ)[tir.k];
        target = pcs[tir.k];
      }
      q = { tonic: tonic, type: conf.type, notes: notes, pcs: pcs, target: target, role: role, hors: horsRoll };
      n++; locked = false;
      marks = {}; labels = {};
      for (let s = 0; s < 6; s++) for (let f = 0; f <= 12; f++) {
        if (pcs.indexOf(LC.fretPc(s, f)) >= 0) marks[s + ":" + f] = "pen";
      }
      draw("");
    }
    function draw(fb, keep) {
      const nomPenta = q.type === "min" ? `penta <b>mineure</b> de ${A.disp(q.tonic)}` : `penta <b>majeure</b> de ${A.disp(q.tonic)}`;
      paint(`<div class="ecl-top">${n}/${TOTAL} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>
        <div class="dq sm">Tu es en <b>${A.disp(q.tonic)} ${q.type === "min" ? "mineur" : "majeur"}</b>. Voici ta ${nomPenta}.<br>
          Touche <b>${q.role.nom}</b>${q.hors ? "" : ` <span class="deg-badge">${q.role.deg}</span>`}
          <span class="dq-hint">${q.hors ? "elle n'est pas allumée : c'est une note qu'on AJOUTE" : "n'importe laquelle des positions compte"}</span></div>
        ${LCRender.fretQuiz({ frets: 12, marks: marks, labels: labels })}
        <div class="dq-fb">${fb}</div>`, keep);
      if (!locked) on("[data-fret]", tap);
      btn("nx", next);
    }
    function tap(el) {
      if (locked) return;
      const s = +el.dataset.str, f = +el.dataset.fret;
      const pc = LC.fretPc(s, f);
      locked = true;
      const ok = pc === q.target;
      marks[s + ":" + f] = ok ? "ok" : "ko";
      labels[s + ":" + f] = noteName(pc);
      // révèle toutes les bonnes positions
      for (let ss = 0; ss < 6; ss++) for (let ff = 0; ff <= 12; ff++) {
        const k = ss + ":" + ff;
        if (LC.fretPc(ss, ff) === q.target && marks[k] !== "ok" && marks[k] !== "ko") {
          marks[k] = "lit"; labels[k] = noteName(q.target);
        }
      }
      if (ok) score++;
      draw(`<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} <b>${q.role.nom}</b> de ${A.disp(q.tonic)} = <b>${noteName(q.target)}</b> (en or sur le manche).</div>
        <div class="role-card"><div class="rc-h">Ce qu'elle dit</div><div class="rc-b">${q.role.dit}</div>
        <div class="rc-h">Quand la jouer</div><div class="rc-b">${q.role.quand}</div></div>
        <button class="btn big" id="nx">Suivant →</button>`, true);
    }
    function finish() {
      const ms = stopT();
      const rec = setBest("penta:" + lv, { score: score, time: ms });
      A.earnXP(score * 4);
      if (score >= 6) { const first = !isDone("pf:" + lv); setDone("pf:" + lv); if (first) A.earnXP(20); }
      paint(`<div class="ex-win"><div class="win-big">${score}/${TOTAL}</div>
        <div class="win-sub">niveau ${lv} · ${fmtT(ms)}${rec ? ` · <b>record</b> 🏆` : ""}</div>
        ${score >= 6
          ? `<div class="fb-ok">✅ Niveau validé. Tu ne joues plus « la forme » : tu joues des <b>fonctions</b>.</div>`
          : `<div class="hint">Il faut <b>6/8</b>. Repère d'abord la tonique la plus grave, puis compte les degrés <b>dans la forme</b> — pas en lettres.</div>`}
        <button class="btn big primary" id="again">↻ Relancer</button>
        ${score >= 6 && lv < 4 ? `<button class="btn big primary" id="up">Niveau ${lv + 1} · ${PENTA_LV[lv][0]} →</button>` : ""}
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => exPenta(lv));
      btn("up", () => exPenta(lv + 1));
      btn("quit", closeSheet);
    }
  }

  /* =========================================================================
     CHANTIER 5 — DEVINER LA TONALITÉ (par niveaux)
     ========================================================================= */
  const EASY_KEYS = ["C", "G", "D", "F", "Bb", "A"];
  const MAJ_SHAPES = [[0, 4, 5, 3], [0, 3, 4, 0], [5, 3, 0, 4], [0, 5, 3, 4], [0, 4, 0, 3]];
  // Au niveau 2 (majeur vs relative mineure) le seul indice est le point de
  // repos : ces suites-là doivent donc VRAIMENT retomber sur leur tonique.
  const MAJ_ANCHOR = [[0, 4, 5, 3, 0], [0, 3, 4, 0], [0, 5, 3, 4, 0], [0, 4, 0, 3, 0]];
  const MIN_SHAPES = [[5, 1, 4, 5], [5, 3, 4, 5], [5, 0, 3, 4, 5], [5, 4, 3, 5]];
  const KEY_LV = [
    ["Tonalités simples", "3–4 accords, majeur, peu d'altérations"],
    ["Majeur ou mineur ?", "Le piège de la relative : mêmes notes, autre centre"],
    ["Les 12 tonalités", "Accords à 7, tout le cercle des quintes"],
    ["À partir des notes", "Une mélodie, pas d'accords"],
  ];

  function seventh(q) { return q === "maj" ? "maj7" : q === "min" ? "min7" : "dim"; }

  function genKeyQ(lv) {
    if (lv === 4) {
      const t = pick(CIRCLE), s = LC.majorScale(t);
      return {
        prompt: `Une mélodie n'utilise que ces notes :<br><b>${A.dl(shuffle(s)).join(" · ")}</b><br>Dans quelle tonalité majeure est-elle ?`,
        correct: A.disp(t) + " majeur",
        wrongs: shuffle(CIRCLE.filter((k) => k !== t)).slice(0, 3).map((k) => A.disp(k) + " majeur"),
        why: `Range-les par ordre : ${A.dl(s).join(" ")}. Les altérations (${sigShort(t)}) donnent l'armure, et l'armure donne la tonalité. ${sigExplain(t)}`,
        prog: null,
      };
    }
    const pool = lv === 1 ? EASY_KEYS : CIRCLE;
    const key = pick(pool);
    const dia = LC.diatonicChords(key);
    const minorFeel = lv === 2 && rand(2) === 0;
    const shape = minorFeel ? pick(MIN_SHAPES) : pick(lv === 2 ? MAJ_ANCHOR : MAJ_SHAPES);
    const use7 = lv === 3;
    const chords = shape.map((d) => {
      const c = dia[d];
      let qual = c.quality;
      if (use7) qual = d === 4 ? "dom7" : seventh(c.quality);
      return { root: c.root, quality: qual, roman: c.roman };
    });
    const rm = LC.relativeMinor(key);
    const correct = minorFeel ? A.disp(rm) + " mineur" : A.disp(key) + " majeur";
    let wrongs;
    if (lv === 2) {
      // le distracteur clé : la relative (mêmes notes exactement)
      wrongs = [minorFeel ? A.disp(key) + " majeur" : A.disp(rm) + " mineur"];
      shuffle(pool.filter((k) => k !== key)).slice(0, 2).forEach((k) => wrongs.push(A.disp(k) + " majeur"));
    } else {
      wrongs = shuffle(pool.filter((k) => k !== key)).slice(0, 3).map((k) => A.disp(k) + " majeur");
    }
    const txt = chords.map((c) => LC.chordLabel(c.root, c.quality, A.S.nameSystem)).join(" – ");
    const last = chords[chords.length - 1];
    const lastTxt = LC.chordLabel(last.root, last.quality, A.S.nameSystem);
    const endsTonic = shape[shape.length - 1] === (minorFeel ? 5 : 0);
    const repos = endsTonic
      ? `la suite <b>retombe sur ${lastTxt}</b> : c'est là qu'elle respire.`
      : `elle <b>part de ${LC.chordLabel(chords[0].root, chords[0].quality, A.S.nameSystem)}</b> et laisse ${lastTxt} en suspens — un morceau qui finit sur le V, c'est justement qu'il veut revenir à la tonique.`;
    const why = minorFeel
      ? `Piège : ces accords sont dans <b>${A.disp(key)} majeur</b> ET dans <b>${A.disp(rm)} mineur</b> — ce sont exactement les mêmes notes, tu ne peux pas les départager par l'armure. Ce qui tranche, c'est le <b>point de repos</b> : ${repos} Le centre est donc <b>${A.disp(rm)}</b>.`
      : `Degrés : ${chords.map((c) => c.roman).join(" – ")} en <b>${A.disp(key)} majeur</b>. Deux repères : le <b>V majeur</b> (${LC.chordLabel(dia[4].root, "maj", A.S.nameSystem)}) n'existe qu'une fois par tonalité, et ${repos}`;
    return {
      prompt: `Un morceau enchaîne :<br><b class="prog-txt2">${txt}</b><br>Quelle est sa tonalité ?`,
      correct: correct, wrongs: wrongs, why: why,
      prog: chords.map((c) => LC.spellChord(c.root, c.quality.indexOf("min") === 0 ? "min" : c.quality === "dim" ? "dim" : "maj").map((x) => 48 + PCS(x)).join(",")).join("|"),
    };
  }

  function exKey(lv) {
    const TOTAL = 8;
    let n = 0, score = 0;
    openSheet("🧭 Devine la tonalité · niveau " + lv);
    startT(); next();
    function next() {
      if (n >= TOTAL) return finish();
      const q = genKeyQ(lv); n++;
      const ch = shuffle(uniq([q.correct].concat(q.wrongs)).slice(0, 4));
      paint(`<div class="ecl-top">${n}/${TOTAL} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>
        <div class="dq sm">${q.prompt}</div>
        ${q.prog ? `<div class="btnrow center"><button class="btn" data-prog="${q.prog}">▶ Écouter la suite</button></div>` : ""}
        <div class="dq-choices">${ch.map((c) => `<button class="dq-c" data-v="${c}">${c}</button>`).join("")}</div>
        <div class="dq-fb"></div>`);
      wireProg();
      let locked = false;
      on(".dq-c", (el) => {
        if (locked) return; locked = true;
        const ok = el.dataset.v === q.correct;
        $$(".dq-c", $("#exBody")).forEach((x) => {
          if (x.dataset.v === q.correct) x.classList.add("ok"); else if (x === el) x.classList.add("ko");
          x.disabled = true;
        });
        if (ok) score++;
        $(".dq-fb").innerHTML = `<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} ${q.why}</div><button class="btn big" id="nx">Suivant →</button>`;
        btn("nx", next);
      });
    }
    function finish() {
      const ms = stopT();
      const rec = setBest("key:" + lv, { score: score, time: ms });
      A.earnXP(score * 4);
      if (score >= 6) { const first = !isDone("kf:" + lv); setDone("kf:" + lv); if (first) A.earnXP(20); }
      paint(`<div class="ex-win"><div class="win-big">${score}/${TOTAL}</div>
        <div class="win-sub">niveau ${lv} · ${fmtT(ms)}${rec ? ` · <b>record</b> 🏆` : ""}</div>
        ${score >= 6
          ? `<div class="fb-ok">✅ Niveau validé. C'est exactement ce que tu feras devant une chanson : lire les accords, nommer le centre, sortir la penta.</div>`
          : `<div class="hint">Il faut <b>6/8</b>. Méthode : repère le <b>V majeur</b> (il n'y en a qu'un par tonalité), puis vérifie sur quel accord la suite se <b>repose</b>.</div>`}
        <button class="btn big primary" id="again">↻ Relancer</button>
        ${score >= 6 && lv < 4 ? `<button class="btn big primary" id="up">Niveau ${lv + 1} · ${KEY_LV[lv][0]} →</button>` : ""}
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => exKey(lv));
      btn("up", () => exKey(lv + 1));
      btn("quit", closeSheet);
    }
  }

  // lecture d'une suite d'accords : "midi,midi,midi|midi,midi,midi|…"
  function wireProg() {
    $$("[data-prog]", $("#exBody")).forEach((b) => {
      b.onclick = () => {
        LC.audio.resume();
        b.dataset.prog.split("|").forEach((ch, i) => {
          const midis = ch.split(",").map(Number);
          setTimeout(() => LC.audio.chord(midis), i * 950);
        });
        b.classList.add("flash"); setTimeout(() => b.classList.remove("flash"), 250);
      };
    });
  }

  /* =========================================================================
     ÉCLAIR — le chrono (le vrai test d'automatisme)
     ========================================================================= */
  function mc(prompt, correct, wrongs, why) {
    const all = shuffle(uniq([correct].concat(wrongs)).slice(0, 4));
    return { prompt: prompt, choices: all, answer: all.indexOf(correct), why: why };
  }

  function qGammes() {
    const t = pick(CIRCLE), s = LC.majorScale(t);
    switch (rand(5)) {
      case 0: {
        const d = 1 + rand(6), c = s[d];
        return mc(`En <b>${A.disp(t)} majeur</b>, la <b>${ord(d + 1)}</b> note ?`,
          A.disp(c), noteChoices(c, s).slice(1).map(A.disp),
          `${A.disp(t)} majeur = ${A.dl(s).join(" ")}`);
      }
      case 1:
        return mc(`Combien d'altérations à <b>${A.disp(t)} majeur</b> ?`, sigShort(t),
          shuffle(SIG_POOL.filter((x) => x !== sigShort(t))).slice(0, 3), sigExplain(t));
      case 2:
        return mc(`Quelle tonalité majeure a <b>${sigShort(t)}</b> ?`, A.disp(t) + " majeur",
          shuffle(CIRCLE.filter((k) => k !== t)).slice(0, 3).map((k) => A.disp(k) + " majeur"), sigExplain(t));
      case 3: {
        const inKey = rand(2) === 0;
        const n = inKey ? pick(s.slice(1)) : pick(LC.SHARP.filter((x) => A.pcsOf(s).indexOf(PCS(x)) < 0));
        return mc(`<b>${A.disp(n)}</b> est-il dans <b>${A.disp(t)} majeur</b> ?`, inKey ? "Oui" : "Non", [inKey ? "Non" : "Oui"],
          `${A.disp(t)} majeur = ${A.dl(s).join(" ")}`);
      }
      default: {
        const rm = LC.relativeMinor(t);
        return mc(`Relative mineure de <b>${A.disp(t)} majeur</b> ?`, A.disp(rm) + " mineur",
          shuffle(CIRCLE.filter((k) => k !== t)).slice(0, 3).map((k) => A.disp(LC.relativeMinor(k)) + " mineur"),
          `6e degré de ${A.disp(t)} : ${A.dl(s).join(" ")} → <b>${A.disp(rm)}</b>. Mêmes notes, même armure.`);
      }
    }
  }

  function qPentas() {
    const t = pick(CIRCLE), s = LC.majorScale(t), mp = LC.majorPenta(t);
    const rm = LC.relativeMinor(t), np = LC.minorPenta(rm);
    switch (rand(5)) {
      case 0: {
        const bad = pick([s[3], s[6]]);
        return mc(`Laquelle n'est <b>pas</b> dans la penta majeure de <b>${A.disp(t)}</b> ?`,
          A.disp(bad), shuffle(mp).slice(0, 3).map(A.disp),
          `On retire les degrés <b>4</b> et <b>7</b> : ${A.disp(s[3])} et ${A.disp(s[6])}. Reste ${A.dl(mp).join(" ")}.`);
      }
      case 1: {
        const d = rand(5);
        return mc(`Penta <b>majeure</b> de <b>${A.disp(t)}</b> : la <b>${ord(d + 1)}</b> note ?`,
          A.disp(mp[d]), noteChoices(mp[d], s).slice(1).map(A.disp), `= ${A.dl(mp).join(" ")}`);
      }
      case 2: {
        const d = rand(5);
        return mc(`Penta <b>mineure</b> de <b>${A.disp(rm)}m</b> : la <b>${ord(d + 1)}</b> note ?`,
          A.disp(np[d]), noteChoices(np[d], LC.naturalMinor(rm)).slice(1).map(A.disp), `= ${A.dl(np).join(" ")}`);
      }
      case 3:
        return mc(`La penta majeure de <b>${A.disp(t)}</b> a exactement les mêmes 5 notes que la penta mineure de… ?`,
          A.disp(rm) + " mineur", shuffle(CIRCLE.filter((k) => k !== t)).slice(0, 3).map((k) => A.disp(LC.relativeMinor(k)) + " mineur"),
          `Même boîte, autre point d'appui : on part du <b>6e degré</b>.`);
      default:
        return mc(`Quels degrés enlève-t-on à la gamme majeure pour obtenir la penta majeure ?`, "4 et 7",
          ["3 et 6", "2 et 5", "4 et 6"], `Ce sont les deux notes qui touchent un demi-ton (3–4 et 7–8) : celles qui frottent.`);
    }
  }

  function qManche() {
    switch (rand(3)) {
      case 0: {
        const s = rand(6), f = rand(13), pc = LC.fretPc(s, f);
        return mc(`Corde de <b>${strName(s)}</b>, case <b>${f}</b> ?`, noteName(pc),
          shuffle(LC.SHARP.filter((x) => PCS(x) !== pc)).slice(0, 3).map(A.disp),
          `Corde à vide = ${A.disp(STR_PC[s])}, case 12 = ${A.disp(STR_PC[s])} à l'octave.`);
      }
      case 1: {
        const s = rand(6), pc = rand(12), good = [];
        for (let f = 0; f <= 12; f++) if (LC.fretPc(s, f) === pc) good.push(f);
        const f = pick(good);
        const wrongs = shuffle([0,1,2,3,4,5,6,7,8,9,10,11,12].filter((x) => good.indexOf(x) < 0)).slice(0, 3).map((x) => "case " + x);
        return mc(`Où est un <b>${noteName(pc)}</b> sur la corde de <b>${strName(s)}</b> ?`, "case " + f, wrongs,
          `Corde à vide = ${A.disp(STR_PC[s])}. ${good.length > 1 ? "Il y en a deux : cases " + good.join(" et ") + "." : ""}`);
      }
      default: {
        const s = rand(4), add = s < 2 ? 2 : 3, f = 1 + rand(9);
        return mc(`Une note case <b>${f}</b> corde de <b>${strName(s)}</b>. La même à l'octave est corde de <b>${strName(s + 2)}</b>, case… ?`,
          "case " + (f + add), shuffle([f, f + 1, f + 2, f + 3, f + 4].filter((x) => x !== f + add)).slice(0, 3).map((x) => "case " + x),
          `Octave = 2 cordes plus aiguës, <b>+2 cases</b> — <b>+3</b> dès que la corde de ${A.disp("B")} est concernée.`);
      }
    }
  }

  function runEclair(id, chap, gen, total) {
    total = total || 20;
    let n = 0, score = 0;
    openSheet(chap);
    startT(); next();
    function next() {
      if (n >= total) return finish();
      const q = gen(); n++;
      paint(`<div class="ecl-top">${n}/${total} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>
        <div class="dq">${q.prompt}</div>
        <div class="dq-choices">${q.choices.map((c, i) => `<button class="dq-c" data-i="${i}">${c}</button>`).join("")}</div>
        <div class="dq-fb"></div>`);
      let locked = false;
      on(".dq-c", (el) => {
        if (locked) return; locked = true;
        const i = +el.dataset.i, ok = i === q.answer;
        $$(".dq-c", $("#exBody")).forEach((x, j) => {
          if (j === q.answer) x.classList.add("ok"); else if (j === i) x.classList.add("ko");
          x.disabled = true;
        });
        if (ok) { score++; setTimeout(next, 240); }
        else {
          $(".dq-fb").innerHTML = `<div class="fb-ko">❌ ${q.why || ""}</div><button class="btn big" id="nx">Suivant →</button>`;
          btn("nx", next);
        }
      });
    }
    function finish() {
      const ms = stopT();
      const rec = setBest("ecl:" + id, { score: score, time: ms });
      A.earnXP(score * 3);
      const par = total * 3000;
      paint(`<div class="ex-win"><div class="win-big">${score}/${total}</div>
        <div class="win-sub">en ${fmtT(ms)}${rec ? ` · <b>nouveau record</b> 🏆` : ""}</div>
        ${score === total && ms < par
          ? `<div class="fb-ok">✅ Sans faute et sous les ${fmtT(par)}. Là c'est de l'automatisme : tu n'as pas calculé, tu as <b>su</b>.</div>`
          : `<div class="hint">Objectif : <b>${total}/${total}</b> en moins de <b>${fmtT(par)}</b>. Tant que tu calcules, tu n'y es pas — relance.</div>`}
        <button class="btn big primary" id="again">↻ Relancer</button>
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => runEclair(id, chap, gen, total));
      btn("quit", closeSheet);
    }
  }

  return { init: init, view: view, wire: wire };
})();

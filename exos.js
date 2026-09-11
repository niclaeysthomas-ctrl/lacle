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
  /* Épellation : par défaut on affiche des ♯, mais dès qu'un exo travaille dans
     une tonalité on pose sa grille (useSpell) — sinon on annoncerait « la tierce
     mineure de Si♭ = Do♯ », ce qui est faux (c'est Ré♭). */
  let SPELL = null;
  function useSpell(tonic, minor) { SPELL = minor ? A.minorSpell(tonic) : A.keySpell(tonic); }
  const noteName = (pc) => { pc = ((pc % 12) + 12) % 12; return SPELL ? SPELL[pc] : A.disp(LC.SHARP[pc]); };
  function sigShort(t) { const s = LC.keySignature(t); return s.count ? s.count + " " + (s.type === "#" ? "♯" : "♭") : "aucune"; }

  // Légendes du manche-quiz : chaque couleur à l'écran doit dire ce qu'elle est.
  const LEG_PENTA  = { pen: "ta penta", ok: "juste", ko: "ton choix (faux)", lit: "la bonne note, partout" };
  const LEG_CHASSE = { pen: "ta penta — tes cibles sont dedans", ok: "trouvée", ko: "erreur" };

  // Ligne de la séance du jour en cours (null = exo lancé depuis l'Atelier).
  let SLOT = null;

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
    SPELL = null;
    A.setOverlay(`<div class="sheet"><div class="sheet-head">
      <button class="back" id="exQuit">‹ Quitter</button>
      <span class="ex-chap">${chap}</span><span class="ex-time" id="exTime"></span></div>
      <div class="sheet-body" id="exBody"></div></div>`);
    $("#exQuit").onclick = closeSheet;
  }
  function closeSheet() { stopT(); SLOT = null; A.closeOverlay(); A.render(); }
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
    // Tous les écrans de fin passent par .ex-win : c'est là que la séance coche.
    if (SLOT && html.indexOf('class="ex-win"') !== -1) seanceMark(SLOT);
  }
  function on(sel, fn) { $$(sel, $("#exBody")).forEach((el) => { el.onclick = () => fn(el); }); }
  function btn(id, fn) { const b = $("#" + id); if (b) b.onclick = fn; }

  /* ============================== VUE ATELIER ============================= */
  const keyLvl   = (t) => (isDone("g:" + t + ":formula") ? 1 : 0) + (isDone("g:" + t + ":spell") ? 1 : 0);
  const pentaOK  = (t) => isDone("p:" + t);

  function view() {
    return `<div class="v-head"><h1>⚡ L'Atelier</h1>
      <p class="v-sub">Ici on ne cherche pas à comprendre : on <b>automatise</b>. Cinq chantiers, dans l'ordre — et on ne coche rien en trichant.</p></div>
      ${cardGammes()}${cardPentas()}${cardManche()}${cardTonalite()}${cardViser()}
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
    $$("[data-gkey]", v).forEach((b) => { b.onclick = () => { SLOT = null; startKey(b.dataset.gkey); }; });
    $$("[data-pkey]", v).forEach((b) => { b.onclick = () => { SLOT = null; startPenta(b.dataset.pkey); }; });
    $$("[data-ex]", v).forEach((b) => { b.onclick = () => { SLOT = null; startEx(b.dataset.ex); }; });
    $$("[data-seance]", v).forEach((b) => { b.onclick = () => lancerSeance(b.dataset.seance); });
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
    if (id.indexOf("chasse") === 0) return exChasse(+id.slice(6));
    if (id.indexOf("bouge") === 0)  return exBouge(+id.slice(5));
    if (id === "viser")    return exViser();
    if (id === "blue")     return exBlue();
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
      quand: `Elle marche sur tout le morceau, mais elle sonne le plus « posée » sur l'accord <b>i</b>. Trop l'utiliser rend le solo plat : garde-la pour les fins.`,
      bouge: `Sur le <b>iv</b> elle devient la <b>5</b> (toujours stable, tu peux rester dessus). Sur le <b>♭VII</b>, la <b>9</b>. Elle passe partout — et c'est bien le problème : une note qui passe partout ne raconte rien.` },
    { deg: "♭3", nom: "la tierce mineure", court: "♭3",
      dit: `<b>C'est elle qui dit « mineur »</b>. Enlève-la, tu ne sais plus si tu es en majeur ou en mineur.`,
      quand: `Cible n°1 sur l'accord <b>i</b> (mineur). Sur un accord <b>majeur</b> (blues en I7) elle devient la <b>blue note</b> : magnifique en passage, tendue si tu la tiens.`,
      bouge: `Sur le <b>iv</b> (mineur lui aussi), cette même note devient la <b>♭7</b> de l'accord : encore une cible, sans bouger le doigt. Deux accords différents, une seule note qui vise juste — c'est ça, jouer une penta sur une suite.` },
    { deg: "4", nom: "la quarte", court: "4",
      dit: `Une <b>tension douce</b> qui appelle : elle veut descendre sur la ♭3 ou monter sur la 5.`,
      quand: `Sur un accord <b>mineur</b>, tu peux la tenir sans problème : c'est la <b>11</b>, et un accord m11 sonne très bien. C'est sur un accord <b>majeur ou 7</b> qu'elle frotte — elle tombe à un demi-ton de la tierce majeure : de passage uniquement.`,
      bouge: `Sur le <b>iv</b>, c'est la <b>fondamentale</b> : point de repos complet. Sur le <b>V7</b> d'un blues mineur, c'est la <b>♭7</b> de l'accord — <i>c'est elle</i>, et pas la ♭7 de la tonalité, qui fait avancer vers le retour.` },
    { deg: "5", nom: "la quinte", court: "5",
      dit: `<b>La stabilité pure.</b> Elle ne dit ni majeur ni mineur — c'est la note la plus neutre de la penta.`,
      quand: `C'est ta <b>note de passage entre les accords</b> : elle appartient à l'accord i <i>et</i> se pose sans faute quand l'harmonie bouge. Une note longue tenue pendant un changement d'accord ? Prends la quinte.`,
      bouge: `Sur le <b>iv</b> elle devient la <b>9</b> (jolie, tenue possible), sur le <b>v</b> la <b>fondamentale</b>. C'est la note qui ne te trahit jamais — et donc celle qui ne dit jamais rien : ne construis pas un solo dessus.` },
    { deg: "♭7", nom: "la septième mineure", court: "♭7",
      dit: `<b>Le moteur.</b> Elle donne l'impression que ça avance, que ça n'est pas fini.`,
      quand: `C'est la 7e de ton accord <b>i7</b> : cible sur le i, au même titre que la ♭3. Sur un blues joué en <b>I7</b> (accord majeur), c'est elle qui fait le son « blues ».`,
      bouge: `⚠️ Sur le <b>V7</b>, ce n'est <b>pas</b> elle qui tire : elle y devient la <b>♭3</b> de l'accord, une blue note tendue. La note qui tire vraiment sur le V7, c'est la <b>4</b> de la tonalité. Beaucoup de solos sonnent « à côté » exactement là.` },
  ];
  const ROLE_MAJ = [
    { deg: "1", nom: "la tonique", court: "1",
      dit: `Le <b>point de repos</b>. Tout le morceau tire vers elle.`,
      quand: `Finis dessus. Mais commencer une phrase dessus, c'est banal : entre plutôt par la 3 ou la 6.`,
      bouge: `Sur le <b>IV</b> elle devient la <b>5</b>, sur le <b>vi</b> la <b>♭3</b> — là, elle dit « mineur ». Sur le <b>V</b>, la <b>4</b> : la seule case où elle frotte, ne la tiens pas.` },
    { deg: "2", nom: "la seconde", court: "2",
      dit: `Aérienne, suspendue — c'est la <b>9e</b> de l'accord. Elle flotte au-dessus sans jamais frotter.`,
      quand: `Magnifique tenue au-dessus de l'accord <b>I</b>. Elle ne conclut rien : c'est une note d'ouverture, pas de fin.`,
      bouge: `Sur le <b>V</b> elle devient la <b>5</b> (stable), sur le <b>ii</b> la <b>fondamentale</b>, sur le <b>vi</b> la <b>11</b>. Une note « qui flotte » sur un accord peut être un point d'arrivée sur le suivant.` },
    { deg: "3", nom: "la tierce majeure", court: "3",
      dit: `<b>La note qui fait « joyeux ».</b> C'est elle, et elle seule, qui rend la tonalité majeure.`,
      quand: `<b>Cible n°1</b> sur l'accord <b>I</b>. Atterrir sur la tierce plutôt que sur la tonique, c'est la différence entre un solo d'élève et un solo qui chante.`,
      bouge: `Sur le <b>vi</b> elle devient la <b>5</b>, sur le <b>IV</b> la <b>7 majeure</b> — superbe sur un IVmaj7, mais si le morceau joue un <b>IV7</b> (blues), elle heurte sa ♭7 : de passage seulement.` },
    { deg: "5", nom: "la quinte", court: "5",
      dit: `<b>La stabilité qui ne prend pas parti.</b> Ni majeure ni mineure : indestructible.`,
      quand: `La <b>note-pivot entre les accords</b> : la quinte de I est la fondamentale de V. Quand l'harmonie change et que tu ne sais pas où aller, pose-toi dessus — ça passe toujours.`,
      bouge: `Sur le <b>V</b> c'est la <b>fondamentale</b>, sur le <b>vi</b> la <b>♭7</b>, sur le <b>ii</b> la <b>11</b>. Elle survit à tout — ce qui veut dire qu'elle ne <i>vise</i> jamais rien.` },
    { deg: "6", nom: "la sixte", court: "6",
      dit: `Douce, un peu country — c'est la <b>13e</b>. C'est aussi la <b>tonique de la relative mineure</b>.`,
      quand: `Chante très bien sur <b>I</b> et sur <b>vi</b>. Insiste dessus et l'oreille commence à basculer vers le mineur : c'est ton interrupteur de couleur.`,
      bouge: `Sur le <b>IV</b> elle devient la <b>3</b> — cible n°1 de cet accord. Sur le <b>vi</b>, la <b>fondamentale</b>. Sur le <b>V</b>, la <b>9</b>. C'est la note la plus « mobile » de la penta majeure.` },
  ];
  const HORS = {
    maj3: { nom: "la tierce MAJEURE (hors penta)",
      dit: `Elle n'est <b>pas</b> dans la penta mineure — et c'est justement pour ça qu'elle est bonne.`,
      quand: `Sur un accord <b>majeur ou 7</b> (blues), glisser de la ♭3 vers la 3 est <b>le</b> cliché blues. En passage, jamais tenue.`,
      bouge: `Elle dépend entièrement de l'accord : sur un accord <b>mineur</b>, elle n'est pas « bluesy », elle est <b>fausse</b> (elle cogne la ♭3 de l'accord). Écoute l'accord avant de la sortir.` },
    b5: { nom: "la blue note (♭5)",
      dit: `La note « sale » entre la 4 et la 5. Ajoutée à la penta mineure, elle fait la <b>gamme blues</b>.`,
      quand: `Uniquement <b>de passage</b> : 4 → ♭5 → 5. Si tu la tiens, ça sonne faux. C'est un frottement, pas une destination.`,
      bouge: `Elle, au moins, ne change pas de statut : sur <b>tous</b> les accords du blues, elle reste un frottement volontaire. Jamais une cible, jamais une fin de phrase, jamais sur un temps fort.` },
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
      useSpell(tonic, conf.type === "min");
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
        ${LCRender.fretQuiz({ frets: 12, marks: marks, labels: labels, legend: LEG_PENTA })}
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
        <div class="rc-h">Quand la jouer</div><div class="rc-b">${q.role.quand}</div>
        ${q.role.bouge ? `<div class="rc-h">Quand l'accord change</div><div class="rc-b">${q.role.bouge}</div>` : ""}</div>
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


  /* =========================================================================
     CHANTIER 6 — VISER L'ACCORD
     La penta ne bouge pas ; l'accord, si. Une même note change de rôle à
     chaque changement d'accord — c'est ça qui décide si un solo « tombe
     juste ». Ici : la chasse aux fonctions contre le chrono, ce que devient
     chaque note quand l'accord change, ce qu'on vise sur m7 / 7 / maj7 (et
     QUAND on le vise), et ce qu'on fait vraiment des blue notes.
     ========================================================================= */

  const QUAL = {
    min7: { lbl: "m7",   fam: "min",  nom: "mineur 7" },
    dom7: { lbl: "7",    fam: "dom",  nom: "dominante 7" },
    maj7: { lbl: "maj7", fam: "maj",  nom: "majeur 7" },
    m7b5: { lbl: "m7♭5", fam: "hdim", nom: "demi-diminué" },
  };

  /* Rôle de CHAQUE demi-ton au-dessus de la fondamentale de l'accord.
     [degré affiché, catégorie, ce qu'il faut en faire]
     cible  = elle nomme l'accord, c'est là qu'on atterrit
     sure   = jamais fausse, mais elle ne raconte rien
     coul   = couleur : tenue possible si tu l'assumes
     passage= frottement volontaire, jamais tenue
     evite  = fausse sur cet accord (ou elle le transforme) */
  const SUR = {
    min: {
      0:  ["1",   "sure",    "la fondamentale : sûre, mais elle ne dit rien de plus que l'accord"],
      1:  ["♭9",  "evite",   "à un demi-ton de la fondamentale : ça cogne"],
      2:  ["9",   "coul",    "couleur douce, tenue possible"],
      3:  ["♭3",  "cible",   "c'est elle qui dit « mineur » — cible n°1"],
      4:  ["3",   "evite",   "tierce majeure sur un accord mineur : c'est faux, pas bluesy"],
      5:  ["11",  "sure",    "sur un accord mineur la 11 sonne (m11) : tu peux la tenir"],
      6:  ["♭5",  "passage", "blue note : 11 → ♭5 → 5, jamais tenue"],
      7:  ["5",   "sure",    "neutre, increvable — et donc muette"],
      8:  ["♭13", "coul",    "couleur sombre (mineur naturel)"],
      9:  ["13",  "coul",    "couleur claire (dorien) : superbe sur un ii"],
      10: ["♭7",  "cible",   "c'est elle qui fait le m7 — cible n°2"],
      11: ["7",   "evite",   "7 majeure sur un m7 : ça sonne faux"],
    },
    dom: {
      0:  ["1",   "sure",    "sûre mais plate : l'accord la joue déjà"],
      1:  ["♭9",  "coul",    "altérée : très tendue, à assumer (jazz)"],
      2:  ["9",   "coul",    "couleur claire, tenue possible"],
      3:  ["♭3",  "passage", "LA blue note du blues : glisse ou bend vers la 3, ne la tiens pas"],
      4:  ["3",   "cible",   "elle dit « majeur » — cible n°1"],
      5:  ["11",  "evite",   "à un demi-ton de la 3 : de passage, jamais tenue"],
      6:  ["♭5",  "passage", "blue note (♯11 en jazz) : de passage"],
      7:  ["5",   "sure",    "neutre"],
      8:  ["♭13", "coul",    "altérée : tendue, volontaire"],
      9:  ["13",  "coul",    "claire, très « blues majeur »"],
      10: ["♭7",  "cible",   "c'est elle qui fait le 7 et qui tire vers l'accord suivant — cible n°2"],
      11: ["7",   "evite",   "elle annule la ♭7 : l'accord n'est plus une dominante"],
    },
    maj: {
      0:  ["1",   "sure",    "sûre, plate"],
      1:  ["♭9",  "evite",   "cogne la fondamentale"],
      2:  ["9",   "coul",    "douce, tenue possible"],
      3:  ["♭3",  "passage", "blue note si le morceau est bluesy — sinon ça salit"],
      4:  ["3",   "cible",   "cible n°1 : c'est elle qui fait « majeur »"],
      5:  ["11",  "evite",   "LA note à éviter du majeur : elle écrase la tierce"],
      6:  ["♯11", "coul",    "couleur lydienne : belle, si tu l'assumes"],
      7:  ["5",   "sure",    "neutre"],
      8:  ["♭13", "evite",   "étrangère au majeur"],
      9:  ["13",  "coul",    "douce et lumineuse : très jolie tenue"],
      10: ["♭7",  "evite",   "elle transforme l'accord en dominante (c'est le son blues, pas le son maj7)"],
      11: ["7",   "cible",   "cible n°2 : c'est elle qui fait le maj7"],
    },
    hdim: {
      0:  ["1",   "sure",    "sûre"],
      1:  ["♭9",  "evite",   "ça cogne"],
      2:  ["9",   "coul",    "dure mais jouable (locrien ♮2) — seulement si c'est voulu"],
      3:  ["♭3",  "cible",   "l'accord est mineur : cible"],
      4:  ["3",   "evite",   "faux"],
      5:  ["11",  "sure",    "stable ici"],
      6:  ["♭5",  "cible",   "c'est ELLE qui fait le ♭5 : la note qui nomme l'accord"],
      7:  ["5",   "evite",   "quinte juste sur un accord à quinte diminuée : ça cogne"],
      8:  ["♭13", "coul",    "couleur normale ici"],
      9:  ["13",  "evite",   "elle contredit l'accord"],
      10: ["♭7",  "sure",    "note de l'accord : sûre"],
      11: ["7",   "evite",   "faux"],
    },
  };
  const KIND_LBL = { cible: "★ cible", sure: "sûre", coul: "couleur", passage: "passage", evite: "à ne pas tenir" };
  const DEG_KEY  = ["la tonique", "la ♭2", "la 2", "la ♭3", "la 3", "la 4", "la ♭5", "la 5", "la ♭6", "la 6", "la ♭7", "la 7"];

  const semiUp   = (a, b) => (((b - a) % 12) + 12) % 12;
  const roleOn   = (root, q, pc) => { const e = SUR[QUAL[q].fam][semiUp(root, pc)]; return { semi: semiUp(root, pc), deg: e[0], kind: e[1], txt: e[2] }; };
  const ciblesDe = (q) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((s) => SUR[QUAL[q].fam][s][1] === "cible");
  const chordName = (root, q) => noteName(root) + QUAL[q].lbl;
  const chordMidis = (root, q, base) => LC.CHORD_SEMIS[q].map((s) => (base == null ? 48 : base) + root + s);

  /* La carte des rôles : les 5 notes de la penta, vues depuis l'accord courant. */
  function mapTable(pentaPcs, root, q) {
    return `<div class="mapt">` + pentaPcs.map((pc) => {
      const r = roleOn(root, q, pc);
      return `<div class="mapr ${r.kind}"><div class="map-h">
        <span class="map-n">${noteName(pc)}</span><span class="map-a">→</span><span class="map-d">${r.deg}</span>
        <span class="map-k ${r.kind}">${KIND_LBL[r.kind]}</span></div>
        <div class="map-x">${r.txt}</div></div>`;
    }).join("") + `</div>`;
  }

  /* ---- audio : accords + ligne mélodique, pour ENTENDRE la différence ----
     bars: [{ ch:[midi...], mel:[[midi, temps]...], beats }]  */
  function playBars(bars, step) {
    LC.audio.resume();
    step = step || 0.44;
    let t = 0;
    bars.forEach((b) => {
      const beats = b.beats || 4;
      b.ch.forEach((m) => LC.audio.note(m, beats * step * 0.94, t, 0.075));
      let mt = t;
      (b.mel || []).forEach((e) => {
        const be = e[1] == null ? 1 : e[1];
        if (e[0]) LC.audio.note(e[0], be * step * 0.9, mt, 0.2);
        mt += be * step;
      });
      t += beats * step;
    });
  }
  const DEMOS = {
    // i – iv – v – i en La mineur, penta mineure de La (La Do Ré Mi Sol)
    vise: [
      { ch: chordMidis(9, "min7", 45), mel: [[72], [74], [76], [74]] },
      { ch: chordMidis(2, "min7", 45), mel: [[72], [74], [72], [69]] },
      { ch: chordMidis(4, "min7", 45), mel: [[79], [76], [79], [81]] },
      { ch: chordMidis(9, "min7", 45), mel: [[72, 2], [69, 2]] },
    ],
    flou: [
      { ch: chordMidis(9, "min7", 45), mel: [[74], [76], [74], [76]] },
      { ch: chordMidis(2, "min7", 45), mel: [[76], [79], [76], [74]] },
      { ch: chordMidis(4, "min7", 45), mel: [[81], [79], [81], [76]] },
      { ch: chordMidis(9, "min7", 45), mel: [[74, 2], [76, 2]] },
    ],
    // la 4 tenue sur un accord 7 (ça frotte) vs la 3 tenue (ça chante)
    quarte: [{ ch: chordMidis(7, "dom7", 43), mel: [[72, 4]] }],
    tierce: [{ ch: chordMidis(7, "dom7", 43), mel: [[71, 4]] }],
    // la ♭3 sur un accord mineur (chez elle) vs sur un accord 7 (blue note)
    b3min: [{ ch: chordMidis(9, "min7", 45), mel: [[72, 4]] }],
    b3dom: [{ ch: chordMidis(9, "dom7", 45), mel: [[72, 3], [73, 1]] }],
  };
  function wireDemo() { on("[data-demo]", (el) => { playBars(DEMOS[el.dataset.demo]); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 250); }); }

  /* =========================================================================
     6.1 — LA CHASSE : trouver toutes les toniques, puis les tierces, puis les
     quintes, contre le chrono. C'est le test qui dit si tu vois des FONCTIONS
     sur le manche ou seulement une forme.
     ========================================================================= */
  const CHASSE_LV = [
    ["Penta allumée", "Toniques, tierces, quintes — la forme t'aide encore"],
    ["Manche nu", "Les mêmes trois, sans la forme : plus rien pour se cacher"],
    ["4 fonctions · 4 tonalités", "+ la ♭7 (ou la 6), et la tonalité change à chaque chasse"],
  ];
  const SEQ_CH = ["tonique", "tierce", "quinte", "sept"];

  function exChasse(lv) {
    const NB = lv >= 3 ? 4 : 3;
    let key = "", minor = false, pentaPcs = [], hunt = 0, splits = [], errs = 0;
    let all = [], found = {}, marks = {}, labels = {}, curPc = 0, tHunt = 0, locked = false;

    openSheet("⏱ La chasse · niveau " + lv);
    intro();

    function setKey() {
      const base = pick(CIRCLE);
      minor = rand(2) === 0;
      key = minor ? LC.relativeMinor(base) : base;
      useSpell(key, minor);
      pentaPcs = (minor ? LC.minorPenta(key) : LC.majorPenta(key)).map(PCS);
    }
    function semiOf(nom) {
      if (nom === "tonique") return 0;
      if (nom === "tierce") return minor ? 3 : 4;
      if (nom === "quinte") return 7;
      return minor ? 10 : 9;
    }
    function nomOf(nom) {
      if (nom === "tonique") return "les toniques";
      if (nom === "tierce") return minor ? "les tierces (♭3)" : "les tierces (3)";
      if (nom === "quinte") return "les quintes";
      return minor ? "les ♭7" : "les sixtes";
    }
    function degOf(nom) { return nom === "tonique" ? "1" : nom === "tierce" ? (minor ? "♭3" : "3") : nom === "quinte" ? "5" : (minor ? "♭7" : "6"); }

    function intro() {
      setKey();
      paint(`<div class="ex-intro big">Tu vas chercher <b>toutes les positions</b> d'une fonction sur le manche, cases 0 à 12, le plus vite possible.</div>
        <div class="hint">Tonalité : <b>${A.disp(key)} ${minor ? "mineur" : "majeur"}</b>${lv >= 3 ? " — et elle change à chaque chasse" : ""}.<br>
          ${lv === 1 ? "La penta reste allumée : tu n'as qu'à reconnaître les rôles." : "Manche nu. Aucune forme, aucun repère : que des fonctions."}</div>
        <div class="chase-plan">${SEQ_CH.slice(0, NB).map((n, i) => `<span class="cp"><b>${i + 1}</b> ${nomOf(n)}</span>`).join("")}</div>
        <div class="hint">Le chrono tourne <b>par chasse</b>. Une erreur ne bloque rien, mais elle se voit sur la fiche à la fin — c'est le but.</div>
        <button class="btn big primary" id="go">Go ⏱</button>`);
      btn("go", () => { startT(); startHunt(); });
    }

    function startHunt() {
      if (lv >= 3 && hunt > 0) setKey();
      const nom = SEQ_CH[hunt];
      curPc = (PCS(key) + semiOf(nom)) % 12;
      all = []; found = {}; marks = {}; labels = {}; locked = false;
      for (let s = 0; s < 6; s++) for (let f = 0; f <= 12; f++) {
        const pc = LC.fretPc(s, f);
        if (pc === curPc) all.push(s + ":" + f);
        // Niveau 1 : TOUTE la penta s'allume, cibles comprises. Les exclure
        // (ancien code) laissait des trous pile là où était la réponse.
        if (lv === 1 && pentaPcs.indexOf(pc) >= 0) marks[s + ":" + f] = "pen";
      }
      tHunt = Date.now();
      draw("");
    }
    function draw(fb, keep) {
      const nom = SEQ_CH[hunt];
      paint(`<div class="ecl-top">Chasse ${hunt + 1}/${NB} · <b>${Object.keys(found).length}</b>/${all.length} · ${errs} erreur${errs > 1 ? "s" : ""}</div>
        ${splits.length ? `<div class="splits">${splits.map((s) => `<span class="sp">${s.nom} · ${fmtT(s.ms)}</span>`).join("")}</div>` : ""}
        <div class="dq sm">En <b>${A.disp(key)} ${minor ? "mineur" : "majeur"}</b> — touche <b>${nomOf(nom)}</b> <span class="deg-badge">${degOf(nom)}</span>
          <span class="dq-hint">il y en a ${all.length} entre la case 0 et la 12</span></div>
        ${LCRender.fretQuiz({ frets: 12, marks: marks, labels: labels, legend: LEG_CHASSE })}
        <div class="dq-fb">${fb}</div>`, keep);
      if (!locked) on("[data-fret]", tap);
    }
    function tap(el) {
      if (locked) return;
      const s = +el.dataset.str, f = +el.dataset.fret, k = s + ":" + f;
      if (found[k] || marks[k] === "ko") return;
      const pc = LC.fretPc(s, f);
      if (pc === curPc) {
        found[k] = 1; marks[k] = "ok"; labels[k] = noteName(pc);
        if (Object.keys(found).length === all.length) return endHunt();
        draw("", true);
      } else {
        errs++; marks[k] = "ko"; labels[k] = noteName(pc);
        draw(`<div class="fb-ko">❌ <b>${noteName(pc)}</b>, c'est <b>${DEG_KEY[semiUp(PCS(key), pc)]}</b> de ${A.disp(key)}. Continue.</div>`, true);
      }
    }
    function endHunt() {
      locked = true;
      const ms = Date.now() - tHunt;
      draw(`<div class="fb-ok">✅ Les ${all.length} positions en <b>${fmtT(ms)}</b>.</div>`, true);
      splits.push({ nom: nomOf(SEQ_CH[hunt]), ms: ms });
      setTimeout(() => {
        if (!$("#exBody")) return;
        hunt++;
        if (hunt >= NB) finish(); else startHunt();
      }, 1000);
    }
    function finish() {
      stopT();
      const total = splits.reduce((a, b) => a + b.ms, 0);
      const rec = setBest("chasse:" + lv, { score: -errs, time: total });
      A.earnXP(Math.max(6, 40 - errs * 4));
      const par = NB * 22000;
      if (errs <= 2 && total < par) { const first = !isDone("ch:" + lv); setDone("ch:" + lv); if (first) A.earnXP(20); }
      const pire = splits.slice().sort((a, b) => b.ms - a.ms)[0];
      paint(`<div class="ex-win"><div class="win-big">${fmtT(total)}</div>
        <div class="win-sub">${errs} erreur${errs > 1 ? "s" : ""}${rec ? ` · <b>record</b> 🏆` : ""}</div>
        <div class="splits center">${splits.map((s) => `<span class="sp">${s.nom} · ${fmtT(s.ms)}</span>`).join("")}</div>
        ${errs <= 2 && total < par
          ? `<div class="fb-ok">✅ Sous les ${fmtT(par)} et propre. Tu ne cherches plus les notes : tu vois les fonctions.</div>`
          : `<div class="hint">Objectif : <b>moins de ${fmtT(par)}</b> et <b>2 erreurs maximum</b>. Ton point faible ici : <b>${pire.nom}</b> (${fmtT(pire.ms)}).</div>`}
        <div class="role-card"><div class="rc-h">Les 4 formes qui remplacent le comptage</div><div class="rc-b">
          Depuis n'importe quelle tonique, sur la <b>corde juste au-dessus</b> :<br>
          • la <b>4</b> → <b>même case</b><br>
          • la <b>5</b> → <b>+2 cases</b> (c'est la forme du power chord)<br>
          • la <b>3</b> → <b>−1 case</b> &nbsp;·&nbsp; la <b>♭3</b> → <b>−2 cases</b><br>
          Et <b>deux</b> cordes au-dessus, <b>même case</b> : la <b>♭7</b>.<br>
          <i>Seule exception : dès que tu traverses la corde de ${A.disp("B")}, ajoute une case.</i></div></div>
        <button class="btn big primary" id="again">↻ Relancer</button>
        ${lv < 3 ? `<button class="btn big primary" id="up">Niveau ${lv + 1} · ${CHASSE_LV[lv][0]} →</button>` : ""}
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => exChasse(lv));
      btn("up", () => exChasse(lv + 1));
      btn("quit", closeSheet);
    }
  }

  /* =========================================================================
     6.2 — L'ACCORD BOUGE : même sac de notes, l'accord change, tout change.
     ========================================================================= */
  const CTX = [
    { id: "min", minor: true, titre: "i – iv – v, tout en mineur",
      chords: [[0, "min7", "i"], [5, "min7", "iv"], [7, "min7", "v"]] },
    { id: "minplus", minor: true, titre: "mineur avec ♭VI, ♭VII et le ii",
      chords: [[0, "min7", "i"], [10, "dom7", "♭VII"], [8, "maj7", "♭VI"], [2, "m7b5", "ii"]] },
    { id: "blues", minor: true, titre: "blues",
      chords: [[0, "dom7", "I7"], [5, "dom7", "IV7"], [7, "dom7", "V7"]] },
    { id: "iiVI", minor: false, titre: "ii – V – I majeur",
      chords: [[2, "min7", "ii"], [7, "dom7", "V"], [0, "maj7", "Imaj7"]] },
  ];
  const BOUGE_LV = [
    ["Tous les accords sont mineurs", "i – iv – v : « et si je passe sur un autre mineur ? »"],
    ["Blues, ii – V – I, ♭VI et ♭VII", "Accords 7 et maj7 : là où une note de la penta devient fausse"],
  ];

  function exBouge(lv) {
    const TOTAL = 8;
    let n = 0, score = 0, q = null, locked = false, marks = {}, labels = {};
    openSheet("🔄 L'accord bouge · niveau " + lv);
    startT(); next();

    function gen() {
      const ctx = lv === 1 ? CTX[0] : pick(CTX.slice(1));
      const tonic = ctx.minor ? LC.relativeMinor(pick(CIRCLE)) : pick(CIRCLE);
      useSpell(tonic, ctx.minor);
      const tpc = PCS(tonic);
      const notes = ctx.minor ? LC.minorPenta(tonic) : LC.majorPenta(tonic);
      const pcs = notes.map(PCS);
      // on privilégie les accords AUTRES que le i : c'est là qu'on apprend
      const sac = ctx.chords.concat(ctx.chords.filter((c) => c[0] !== 0));
      const ch = pick(sac);
      const root = (tpc + ch[0]) % 12, qual = ch[1];
      const info = { ctx: ctx, tonic: tonic, tpc: tpc, pcs: pcs, root: root, qual: qual, roman: ch[2] };
      // types possibles, selon ce que la penta contient vraiment sur cet accord
      const cibles = ciblesDe(qual).map((s) => (root + s) % 12).filter((pc) => pcs.indexOf(pc) >= 0);
      const chauds = pcs.filter((pc) => { const k = roleOn(root, qual, pc).kind; return k === "evite" || k === "passage"; });
      const types = [];
      if (cibles.length) types.push("cible");
      if (chauds.length === 1) types.push("chaude");
      types.push("role");
      const type = pick(types.concat(types[0] === "cible" ? ["cible"] : []));
      if (type === "cible") { info.type = "cible"; info.target = pick(cibles); }
      else if (type === "chaude") { info.type = "chaude"; info.target = chauds[0]; }
      else {
        info.type = "role";
        info.note = pick(pcs);
        const bon = roleOn(root, qual, info.note).deg;
        const faux = uniq(pcs.filter((pc) => pc !== info.note).map((pc) => roleOn(root, qual, pc).deg)).slice(0, 3);
        info.choices = shuffle(uniq([bon].concat(faux, ["♭9", "13"])).slice(0, 4));
        info.correct = bon;
      }
      return info;
    }
    function next() {
      if (n >= TOTAL) return finish();
      q = gen(); n++; locked = false;
      marks = {}; labels = {};
      for (let s = 0; s < 6; s++) for (let f = 0; f <= 12; f++) {
        if (q.pcs.indexOf(LC.fretPc(s, f)) >= 0) marks[s + ":" + f] = "pen";
      }
      draw("");
    }
    function entete() {
      const pentaTxt = q.ctx.minor ? `penta <b>mineure</b> de ${A.disp(q.tonic)}` : `penta <b>majeure</b> de ${A.disp(q.tonic)}`;
      return `<div class="ecl-top">${n}/${TOTAL} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>
        <div class="bouge-band">Tu gardes la ${pentaTxt} sur tout le morceau (${q.ctx.titre}).
          <b>L'accord passe à ${chordName(q.root, q.qual)}</b> <span class="rom">${q.roman}</span></div>
        <div class="btnrow center"><button class="btn" data-playchord="${chordMidis(q.root, q.qual, 48).join(",")}">▶ Écouter l'accord</button></div>`;
    }
    function consigne() {
      if (q.type === "cible") return `Touche la note de ta penta qui est sa <b>${roleOn(q.root, q.qual, q.target).deg}</b> — une <b>note cible</b> de cet accord.<span class="dq-hint">une seule note de la penta convient · n'importe quelle position</span>`;
      if (q.type === "chaude") return `Une seule note de ta penta <b>ne doit pas être tenue</b> sur cet accord. Touche-la.<span class="dq-hint">celle qui frotte, ou qui n'est bonne qu'en passage</span>`;
      return `Ta penta contient <b>${noteName(q.note)}</b>. Sur <b>${chordName(q.root, q.qual)}</b>, cette note est&nbsp;:`;
    }
    function draw(fb, keep) {
      const body = q.type === "role"
        ? `<div class="dq-choices">${q.choices.map((c) => `<button class="dq-c" data-v="${c}">${c}</button>`).join("")}</div>`
        : LCRender.fretQuiz({ frets: 12, marks: marks, labels: labels, legend: LEG_PENTA });
      paint(`${entete()}<div class="dq sm">${consigne()}</div>${body}<div class="dq-fb">${fb}</div>`, keep);
      if (!locked) {
        if (q.type === "role") on(".dq-c", (el) => answerRole(el));
        else on("[data-fret]", tap);
      }
      btn("nx", next);
    }
    function retour(ok, pc, joue) {
      const r = roleOn(q.root, q.qual, pc);
      const rj = joue == null || joue === pc ? null : roleOn(q.root, q.qual, joue);
      const surTonique = roleOn(q.tpc, q.ctx.minor ? "min7" : "maj7", pc);
      const compare = q.root === q.tpc ? "" :
        `<div class="rc-h">La même note, un accord avant</div><div class="rc-b">Sur l'accord de départ (${chordName(q.tpc, q.ctx.minor ? "min7" : "maj7")}), <b>${noteName(pc)}</b> était <b>${surTonique.deg}</b>. Sur <b>${chordName(q.root, q.qual)}</b>, elle est <b>${r.deg}</b>. Tu n'as pas bougé le doigt : c'est l'accord qui a changé son rôle.</div>`;
      return `<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} <b>${noteName(pc)}</b> = <b>${r.deg}</b> de ${chordName(q.root, q.qual)} — ${r.txt}.${rj ? ` <i>Toi, tu as joué ${noteName(joue)} : sa ${rj.deg}.</i>` : ""}</div>
        <div class="role-card">${compare}<div class="rc-h">Ta penta sur cet accord</div><div class="rc-b">Les cinq notes, et ce qu'elles deviennent :</div>
        ${mapTable(q.pcs, q.root, q.qual)}</div>
        <button class="btn big" id="nx">Suivant →</button>`;
    }
    function tap(el) {
      if (locked) return;
      const s = +el.dataset.str, f = +el.dataset.fret, pc = LC.fretPc(s, f);
      locked = true;
      const ok = pc === q.target;
      marks[s + ":" + f] = ok ? "ok" : "ko"; labels[s + ":" + f] = noteName(pc);
      for (let ss = 0; ss < 6; ss++) for (let ff = 0; ff <= 12; ff++) {
        const k = ss + ":" + ff;
        if (LC.fretPc(ss, ff) === q.target && marks[k] !== "ok" && marks[k] !== "ko") { marks[k] = "lit"; labels[k] = noteName(q.target); }
      }
      if (ok) score++;
      draw(retour(ok, ok ? pc : q.target, pc), true);
    }
    function answerRole(el) {
      if (locked) return; locked = true;
      const ok = el.dataset.v === q.correct;
      $$(".dq-c", $("#exBody")).forEach((x) => {
        if (x.dataset.v === q.correct) x.classList.add("ok"); else if (x === el) x.classList.add("ko");
        x.disabled = true;
      });
      if (ok) score++;
      $(".dq-fb").innerHTML = retour(ok, q.note);
      btn("nx", next);
    }
    function finish() {
      const ms = stopT();
      const rec = setBest("bouge:" + lv, { score: score, time: ms });
      A.earnXP(score * 4);
      if (score >= 6) { const first = !isDone("bg:" + lv); setDone("bg:" + lv); if (first) A.earnXP(20); }
      paint(`<div class="ex-win"><div class="win-big">${score}/${TOTAL}</div>
        <div class="win-sub">niveau ${lv} · ${fmtT(ms)}${rec ? ` · <b>record</b> 🏆` : ""}</div>
        ${score >= 6
          ? `<div class="fb-ok">✅ Tu ne joues plus « la penta de la chanson » : tu joues <b>l'accord du moment</b> avec les notes que tu as sous les doigts.</div>`
          : `<div class="hint">La règle : repère la <b>fondamentale de l'accord courant</b> sur le manche, puis compte <b>♭3 / 3</b> et <b>♭7 / 7</b> à partir d'elle. C'est tout ce que fait un soliste.</div>`}
        <button class="btn big primary" id="again">↻ Relancer</button>
        ${score >= 6 && lv < 2 ? `<button class="btn big primary" id="up">Niveau 2 · ${BOUGE_LV[1][0]} →</button>` : ""}
        <button class="btn big ghost" id="quit">Terminer</button></div>`);
      btn("again", () => exBouge(lv));
      btn("up", () => exBouge(2));
      btn("quit", closeSheet);
    }
  }

  /* =========================================================================
     6.3 — QUOI VISER (m7 / 7 / maj7) ET QUAND
     ========================================================================= */
  function ligneQual(q) {
    const t = SUR[QUAL[q].fam];
    const cat = (kind) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((s) => t[s][1] === kind).map((s) => t[s][0]);
    return `<div class="qcard"><div class="qc-h">${QUAL[q].lbl || "triade"} <span class="qc-n">${QUAL[q].nom}</span></div>
      <div class="qc-l"><span class="qc-k cible">★ vise</span><span class="qc-v">${cat("cible").join(" · ")}</span></div>
      <div class="qc-l"><span class="qc-k sure">sûres</span><span class="qc-v">${cat("sure").join(" · ")}</span></div>
      <div class="qc-l"><span class="qc-k coul">couleurs</span><span class="qc-v">${cat("coul").join(" · ")}</span></div>
      <div class="qc-l"><span class="qc-k evite">ne tiens pas</span><span class="qc-v">${cat("evite").concat(cat("passage").map((d) => d + " (passage)")).join(" · ")}</span></div></div>`;
  }

  function exViser() {
    openSheet("🎯 Quoi viser — et quand");
    SPELL = null;
    paint(`<div class="ex-intro big">Un accord, c'est <b>quatre notes</b>. Deux ne servent qu'à le poser : la <b>1</b> et la <b>5</b> (elles ne disent ni majeur, ni mineur, ni tension). Deux le <b>nomment</b> : la <b>3</b> et la <b>7</b>.</div>
      <div class="hint">D'où la seule règle qui compte : <b>viser, c'est jouer la 3 ou la 7 de l'accord qui passe.</b> Tout le reste — les gammes, les positions, les licks — n'est là que pour t'y amener.</div>

      <div class="ate-sub">Ce que tu vises, accord par accord</div>
      ${["min7", "dom7", "maj7", "m7b5"].map(ligneQual).join("")}

      <div class="ate-sub">Les deux pièges qui s'entendent tout de suite</div>
      <div class="role-card"><div class="rc-h">La 4 sur un accord 7</div>
        <div class="rc-b">Elle tombe à un demi-ton de la tierce majeure : tenue, elle sonne comme une fausse note. En passage, personne ne la remarque.
        <div class="btnrow"><button class="btn" data-demo="quarte">▶ la 4 tenue sur ${A.disp("G")}7</button><button class="btn" data-demo="tierce">▶ la 3 tenue</button></div></div>
        <div class="rc-h">La ♭3 : bleue seulement sur un accord majeur</div>
        <div class="rc-b">Sur un accord <b>mineur</b>, la ♭3 est la tierce de l'accord : elle est chez elle, tiens-la tant que tu veux. Sur un accord <b>7</b>, c'est une blue note : elle frotte contre la tierce majeure, et c'est exactement ce qu'on lui demande — à condition de la faire glisser.
        <div class="btnrow"><button class="btn" data-demo="b3min">▶ ♭3 tenue sur ${A.disp("A")}m7</button><button class="btn" data-demo="b3dom">▶ ♭3 → 3 sur ${A.disp("A")}7</button></div></div></div>

      <div class="ate-sub">Et QUAND ?</div>
      <ol class="rules">
        <li><b>Sur le changement, pas après.</b> La note cible doit tomber <b>avec</b> l'accord (temps 1). Si tu l'attrapes au bout de deux temps, l'oreille a déjà entendu que tu cherchais.</li>
        <li><b>Anticipe d'une croche.</b> Les solistes posent la note cible juste <i>avant</i> le changement d'accord : ça sonne comme si l'harmonie te suivait, pas l'inverse.</li>
        <li><b>Approche par demi-ton.</b> Une case en dessous de la cible, puis la cible sur le temps. C'est le truc le plus rentable de l'impro : ça marche sur n'importe quel accord, même une note hors gamme.</li>
        <li><b>Puis tais-toi.</b> Une note cible tenue vaut dix notes rapides. C'est le contraire de ce qu'on fait quand on a peur du silence.</li>
      </ol>
      <div class="role-card"><div class="rc-h">La preuve à l'oreille</div>
        <div class="rc-b">Même suite (${A.disp("A")}m7 – ${A.disp("D")}m7 – ${A.disp("E")}m7 – ${A.disp("A")}m7), même penta de ${A.disp("A")} mineure, mêmes cinq notes. La seule différence : <b>sur quelle note tombe le temps 1</b>.
        <div class="btnrow"><button class="btn" data-demo="flou">▶ sans viser</button><button class="btn" data-demo="vise">▶ en visant</button></div>
        <div class="qc-x">Dans la 2ᵉ version, la note du temps 1 est la ♭3 ou la ♭7 de l'accord courant. Écoute le 2ᵉ accord : <b>c'est la même note que sur le premier</b> (${noteName(0)}), sauf qu'elle est passée de ♭3 à ♭7. Tu ne bouges pas, et pourtant tu vises.</div></div></div>

      <button class="btn big primary" id="train">M'entraîner là-dessus →</button>
      <button class="btn big ghost" id="quit">Terminer</button>`);
    wireDemo();
    btn("train", () => exBouge(2));
    btn("quit", closeSheet);
    if (!isDone("vs:fiche")) { setDone("vs:fiche"); A.earnXP(10); }
  }

  /* =========================================================================
     6.4 — LES BLUE NOTES : les trois, et ce qui les tue
     ========================================================================= */
  function exBlue() {
    openSheet("💧 Les blue notes");
    fiche();

    function fiche() {
      const t = "A";
      useSpell(t, true);
      const penta = LC.minorPenta(t).map(PCS), b5 = (PCS(t) + 6) % 12;
      const marks = {}, labels = {};
      for (let s = 0; s < 6; s++) for (let f = 0; f <= 12; f++) {
        const pc = LC.fretPc(s, f);
        if (pc === b5) { marks[s + ":" + f] = "lit"; labels[s + ":" + f] = "♭5"; }
        else if (penta.indexOf(pc) >= 0) marks[s + ":" + f] = "pen";
      }
      paint(`<div class="ex-intro big">Il n'y a pas <i>une</i> blue note, il y en a <b>trois</b> : la <b>♭3</b>, la <b>♭5</b> et la <b>♭7</b>. Et elles ne sont bleues que pour une raison : l'accord dessous est <b>majeur</b>, et toi tu joues mineur par-dessus. Le blues, c'est ce frottement-là — pas une gamme magique.</div>
        <div class="role-card"><div class="rc-h">♭3 — la tierce bleue</div>
          <div class="rc-b">Sur un accord <b>7 ou majeur</b> : elle cogne la tierce majeure de l'accord. C'est le son. On la <b>fait glisser</b> vers la 3 (bend d'un demi-ton, ou slide) — on ne la laisse pas là.<br><i>Sur un accord mineur, elle n'est pas bleue : c'est la tierce de l'accord. Tiens-la autant que tu veux.</i></div>
          <div class="rc-h">♭5 — la note « sale »</div>
          <div class="rc-b">Entre la <b>4</b> et la <b>5</b>. Ajoutée à la penta mineure, elle fait la <b>gamme blues</b>. Uniquement de passage, dans les deux sens : <b>4 → ♭5 → 5</b> en montant, <b>5 → ♭5 → 4</b> en descendant.</div>
          <div class="rc-h">♭7 — celle qu'on n'entend plus</div>
          <div class="rc-b">C'est elle qui explique pourquoi un blues joue des accords <b>7 partout</b> (I7, IV7, V7) alors qu'aucune tonalité majeure ne contient ça. Sur le I7, elle est à la fois dans l'accord et « bleue ».</div></div>

        <div class="ate-sub">Où elle se trouve · penta mineure de ${A.disp("A")}</div>
        ${LCRender.fretQuiz({ frets: 12, marks: marks, labels: labels, legend: { pen: "penta mineure", lit: "la blue note ♭5" } })}
        <div class="hint">La ♭5 (en or) se glisse toujours <b>juste avant la 5</b>. Dans une boîte de penta, tu la reconnais à ça : c'est la seule case qui vient <b>coller</b> deux notes voisines sur la même corde.</div>

        <div class="ate-sub">Ce qui tue une blue note</div>
        <ol class="rules">
          <li>La <b>tenir</b>. Elle devient une fausse note en une seconde.</li>
          <li>La poser sur un <b>temps fort</b>, ou pire, <b>finir</b> la phrase dessus.</li>
          <li>La <b>répéter</b>. Une blue note qui revient trois fois n'est plus un frottement, c'est une erreur.</li>
          <li>La jouer <b>sans savoir sur quel accord tu es</b> : la ♭3 sur un accord mineur n'est pas « bluesy », elle est banale ; la 3 majeure sur ce même accord est <b>fausse</b>.</li>
        </ol>
        <button class="btn big primary" id="go">À l'exercice →</button>
        <button class="btn big ghost" id="quit">Terminer</button>`);
      btn("go", drill);
      btn("quit", closeSheet);
    }

    /* --- drill : 6 questions, moitié manche / moitié « tu peux la tenir ? » --- */
    function drill() {
      const TOTAL = 6;
      let n = 0, score = 0, q = null, locked = false, marks = {}, labels = {};
      startT(); next();

      function genTap() {
        const tonic = LC.relativeMinor(pick(CIRCLE));
        useSpell(tonic, true);
        const pcs = LC.minorPenta(tonic).map(PCS);
        return { kind: "tap", tonic: tonic, pcs: pcs, target: (PCS(tonic) + 6) % 12 };
      }
      function genHold() {
        const qual = pick(["min7", "dom7", "maj7"]);
        const rootName = qual === "min7" ? LC.relativeMinor(pick(CIRCLE)) : pick(CIRCLE);
        const root = PCS(rootName);
        useSpell(rootName, qual === "min7");
        const t = SUR[QUAL[qual].fam];
        const semi = pick([3, 3, 6, 6, 10, 10, 5, 9, 2].filter((s) => t[s][1] !== "sure"));
        const e = t[semi];
        const rep = e[1] === "passage" ? "Non — de passage seulement" : e[1] === "evite" ? "Non — elle sonne fausse ici" : "Oui — tu peux la tenir";
        return { kind: "hold", root: root, qual: qual, deg: e[0], txt: e[2],
          correct: rep, choices: shuffle(["Oui — tu peux la tenir", "Non — de passage seulement", "Non — elle sonne fausse ici"]) };
      }
      function next() {
        if (n >= TOTAL) return finish();
        q = n % 2 === 0 ? genTap() : genHold(); n++; locked = false;
        marks = {}; labels = {};
        if (q.kind === "tap") {
          for (let s = 0; s < 6; s++) for (let f = 0; f <= 12; f++) {
            if (q.pcs.indexOf(LC.fretPc(s, f)) >= 0) marks[s + ":" + f] = "pen";
          }
        }
        draw("");
      }
      function draw(fb, keep) {
        const head = `<div class="ecl-top">${n}/${TOTAL} · <b>${score}</b> bonne${score > 1 ? "s" : ""}</div>`;
        if (q.kind === "tap") {
          paint(`${head}<div class="dq sm">Penta mineure de <b>${A.disp(q.tonic)}</b>. Touche la <b>blue note</b> <span class="deg-badge">♭5</span>
            <span class="dq-hint">elle n'est pas allumée : c'est la note qu'on AJOUTE, juste avant la 5</span></div>
            ${LCRender.fretQuiz({ frets: 12, marks: marks, labels: labels, legend: { pen: "penta mineure", ok: "juste", ko: "ton choix (faux)", lit: "la ♭5, partout" } })}<div class="dq-fb">${fb}</div>`, keep);
          if (!locked) on("[data-fret]", tap);
        } else {
          paint(`${head}<div class="dq sm">L'accord est <b>${chordName(q.root, q.qual)}</b>. Tu tombes sur sa <b>${q.deg}</b>.<br>Tu peux la <b>tenir</b> ?</div>
            <div class="btnrow center"><button class="btn" data-playchord="${chordMidis(q.root, q.qual, 48).join(",")}">▶ Écouter l'accord</button></div>
            <div class="dq-choices">${q.choices.map((c) => `<button class="dq-c" data-v="${c}">${c}</button>`).join("")}</div>
            <div class="dq-fb">${fb}</div>`, keep);
          if (!locked) on(".dq-c", hold);
        }
        btn("nx", next);
      }
      function tap(el) {
        if (locked) return;
        const s = +el.dataset.str, f = +el.dataset.fret, pc = LC.fretPc(s, f);
        locked = true;
        const ok = pc === q.target;
        marks[s + ":" + f] = ok ? "ok" : "ko"; labels[s + ":" + f] = noteName(pc);
        for (let ss = 0; ss < 6; ss++) for (let ff = 0; ff <= 12; ff++) {
          const k = ss + ":" + ff;
          if (LC.fretPc(ss, ff) === q.target && marks[k] !== "ok" && marks[k] !== "ko") { marks[k] = "lit"; labels[k] = "♭5"; }
        }
        if (ok) score++;
        draw(`<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} La ♭5 de ${A.disp(q.tonic)} = <b>${noteName(q.target)}</b> (en or). Elle est <b>une case sous la quinte</b>, et une case au-dessus de la quarte : c'est la seule note de la gamme blues qui n'est pas dans la penta.</div>
          <button class="btn big" id="nx">Suivant →</button>`, true);
      }
      function hold(el) {
        if (locked) return; locked = true;
        const ok = el.dataset.v === q.correct;
        $$(".dq-c", $("#exBody")).forEach((x) => {
          if (x.dataset.v === q.correct) x.classList.add("ok"); else if (x === el) x.classList.add("ko");
          x.disabled = true;
        });
        if (ok) score++;
        $(".dq-fb").innerHTML = `<div class="${ok ? "fb-ok" : "fb-ko"}">${ok ? "✅" : "❌"} <b>${q.correct}</b> — la ${q.deg} sur un accord ${QUAL[q.qual].nom} : ${q.txt}.</div>
          <button class="btn big" id="nx">Suivant →</button>`;
        btn("nx", next);
      }
      function finish() {
        const ms = stopT();
        const rec = setBest("blue", { score: score, time: ms });
        A.earnXP(score * 4);
        if (score >= 5) { const first = !isDone("bl:drill"); setDone("bl:drill"); if (first) A.earnXP(20); }
        paint(`<div class="ex-win"><div class="win-big">${score}/${TOTAL}</div>
          <div class="win-sub">${fmtT(ms)}${rec ? ` · <b>record</b> 🏆` : ""}</div>
          <div class="hint">Retiens la seule chose qui compte : <b>une blue note n'est bleue que par rapport à l'accord</b>. Change l'accord, et la même note devient soit une cible, soit une faute.</div>
          <button class="btn big primary" id="again">↻ Relancer</button>
          <button class="btn big ghost" id="quit">Terminer</button></div>`);
        btn("again", drill);
        btn("quit", closeSheet);
      }
    }
  }

  /* ---------------------------- carte du chantier ---------------------------- */
  function cardViser() {
    const flags = ["ch:1", "ch:2", "ch:3", "bg:1", "bg:2", "vs:fiche", "bl:drill"];
    const done = flags.filter(isDone).length;
    return `<div class="ate-card">
      <div class="ate-h"><span class="ate-e">🎯</span><div><div class="ate-t">Viser l'accord</div>
        <div class="ate-s">La penta ne bouge pas, l'accord si. <b>Ce que devient chaque note</b> quand ça change.</div></div>
        <span class="ate-c">${done}/7</span></div>
      <div class="ate-sub">⏱ Vitesse — voir des fonctions, pas une forme</div>
      <div class="ate-rows">
        ${CHASSE_LV.map((l, k) => row("chasse" + (k + 1), isDone("ch:" + (k + 1)) ? "✅" : "①②③"[k],
          "La chasse · niveau " + (k + 1) + " · " + l[0], l[1], recTxt("chasse:" + (k + 1), "errs"))).join("")}
      </div>
      <div class="ate-sub">🔄 Quand l'accord change</div>
      <div class="ate-rows">
        ${BOUGE_LV.map((l, k) => row("bouge" + (k + 1), isDone("bg:" + (k + 1)) ? "✅" : "①②"[k],
          "L'accord bouge · " + l[0], l[1], recTxt("bouge:" + (k + 1), "/8"))).join("")}
      </div>
      <div class="ate-sub">📖 Les deux fiches</div>
      <div class="ate-rows">
        ${row("viser", isDone("vs:fiche") ? "✅" : "🎯", "Quoi viser sur m7, 7, maj7 — et quand", "Les cibles de chaque accord, et le timing", "")}
        ${row("blue", isDone("bl:drill") ? "✅" : "💧", "Les blue notes", "Les trois, où elles sont, ce qui les tue", recTxt("blue", "/6"))}
      </div></div>`;
  }

  /* =========================================================================
     SÉANCE DU JOUR — cinq lignes, figées pour la journée.
     Réviser → voir les fonctions sur le manche → viser → jouer → comprendre.
     Une ligne ne se coche que si l'exo lancé DEPUIS la séance atteint son
     écran de fin (SLOT) : ouvrir puis quitter ne compte pas, et un exo fait
     dans l'Atelier ne coche pas une ligne à la place d'une autre.
     ========================================================================= */
  const SE_N = 5;
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtJour = (d) => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  const numJour = (s) => { const p = s.split("-").map(Number); return Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5); };

  // Une règle par jour (rotation sur 7 jours). Priorités du phrasé :
  // rythme → silence → cible → notes.
  const JAM_RULES = [
    { t: "atterris sur la tierce", c: (x) => `Chaque phrase <b>se termine sur la tierce</b> (${x.n3}). Pas sur la tonique aujourd'hui : la tierce chante, la tonique ferme la porte.` },
    { t: "4 notes, puis silence", c: () => `Jamais plus de <b>4 notes</b> d'affilée, puis tu te tais <b>aussi longtemps que tu as joué</b>. Le silence fait partie de la phrase : c'est lui qui la rend audible.` },
    { t: "une seule corde", c: (x) => `Tout sur <b>une seule corde</b> (celle de ${x.sol}, puis celle de ${x.si}). Tu vois la penta à l'horizontale, là où la boîte t'enfermait.` },
    { t: "le rythme d'abord", c: (x) => `Trois notes, pas une de plus : <b>${x.n1}</b>, <b>${x.n3}</b>, <b>${x.n5}</b>. Cinq minutes à ne changer <b>que le rythme</b> : longues, courtes, en avance, en retard.` },
    { t: "question / réponse", c: (x) => `Toujours par paires : une phrase qui <b>monte</b> et reste en suspens (sur la ${x.d7}, ${x.n7}), puis une qui <b>descend</b> et se pose sur la tonique (${x.n1}).` },
    { t: "approche par le demi-ton", c: (x) => `Arrive sur tes cibles (${x.n3}, ${x.n5}) par la <b>case juste en dessous</b> — hors penta — puis <b>tiens</b> la cible. La fausse note devient une tension qui se résout.` },
    { t: "trois couleurs", c: (x) => `1 min 30 à ne viser que la <b>quinte</b> (${x.n5}), 1 min 30 que la <b>tierce</b> (${x.n3}), 2 min que la <b>${x.d7}</b> (${x.n7}). Écoute ce que chacune fait sur le drone.` },
  ];

  function seance() {
    const S = A.S, d = fmtJour(new Date());
    if (!S.seance || S.seance.date !== d) {
      const hist = (S.seance && S.seance.hist) || {};
      const cles = Object.keys(hist).sort();
      while (cles.length > 120) delete hist[cles.shift()];
      S.seance = { date: d, plan: planDuJour(numJour(d)), done: {}, hist: hist, bonus: false };
      A.save();
    }
    return S.seance;
  }

  function planDuJour(dn) {
    const plan = [];
    // 1 · Réviser — ce qui est dû passe avant tout le reste
    const gDue = CIRCLE.filter((t) => keyLvl(t) === 2 && estDu("g:" + t));
    const pDue = CIRCLE.filter((t) => pentaOK(t) && estDu("p:" + t));
    const gNext = CIRCLE.find((t) => keyLvl(t) < 2);
    const pNext = CIRCLE.find((t) => !pentaOK(t));
    const gSues = CIRCLE.filter((t) => keyLvl(t) === 2).length;
    if (gDue.length) plan.push({ id: "gkey:" + gDue[0], r: "due" });
    else if (pDue.length) plan.push({ id: "pkey:" + pDue[0], r: "due" });
    else if (pNext && gSues >= 3 && (!gNext || dn % 2)) plan.push({ id: "pkey:" + pNext });
    else if (gNext) plan.push({ id: "gkey:" + gNext });
    else plan.push({ id: ["eclair-gammes", "eclair-pentas", "eclair-manche"][dn % 3] });
    // 2 · Manche — la chasse, au premier niveau non validé
    plan.push({ id: "chasse" + ([1, 2, 3].find((k) => !isDone("ch:" + k)) || 3) });
    // 3 · Viser — rôles de la penta → l'accord bouge → blue notes
    const VISER = [["penta1", "pf:1"], ["penta2", "pf:2"], ["penta3", "pf:3"], ["penta4", "pf:4"],
      ["bouge1", "bg:1"], ["bouge2", "bg:2"], ["blue", "bl:drill"]];
    const v = VISER.find((x) => !isDone(x[1]));
    plan.push({ id: v ? v[0] : ["bouge2", "penta4", "blue"][dn % 3] });
    // 4 · Jouer — tonalité et règle du jour (5 pas sur le cercle chaque jour)
    const t = CIRCLE[(dn * 5) % 12], m = (dn + Math.floor(dn / 12)) % 2 === 1;
    plan.push({ id: "jam", t: m ? LC.relativeMinor(t) : t, m: m, rule: dn % JAM_RULES.length });
    // 5 · Comprendre — la prochaine leçon, sinon la tonalité
    const L = typeof LESSONS !== "undefined" ? LESSONS.find((l) => !A.S.done[l.id]) : null;
    if (L) plan.push({ id: "lesson:" + L.id });
    else plan.push({ id: "key" + ([1, 2, 3, 4].find((k) => !isDone("kf:" + k)) || [3, 4][dn % 2]) });
    return plan;
  }

  // Titres calculés à l'affichage (pas figés) : ils suivent Do-Ré-Mi ↔ C-D-E.
  function infoLigne(p) {
    const id = p.id, k = +id.replace(/\D/g, "");
    if (id.indexOf("gkey:") === 0) {
      const t = id.slice(5);
      return { e: "🔁", cat: "Réviser", min: 3,
        titre: A.disp(t) + " majeur · " + (p.r === "due" ? "révision" : isDone("g:" + t + ":formula") ? "par cœur" : "la construire"),
        why: p.r === "due" ? "Due aujourd'hui. Une faute, et elle redescend à « construite »." : "Le chantier des 12 gammes : une de plus, jusqu'au réflexe." };
    }
    if (id.indexOf("pkey:") === 0) {
      return { e: "🔁", cat: "Réviser", min: 3, titre: "Penta de " + A.disp(id.slice(5)) + (p.r === "due" ? " · révision" : ""),
        why: p.r === "due" ? "Due aujourd'hui : ce qu'on ne révise pas s'efface." : "La gamme moins ses deux notes qui frottent, puis sa jumelle mineure." };
    }
    if (id.indexOf("eclair-") === 0) {
      return { e: "⚡", cat: "Réviser", min: 2, titre: "Éclair · " + id.slice(7), why: "Tout est acquis : on garde l'automatisme au chrono." };
    }
    if (id.indexOf("chasse") === 0) {
      return { e: "⏱", cat: "Manche", min: 4, titre: "La chasse · niveau " + k + " · " + CHASSE_LV[k - 1][0],
        why: isDone("ch:" + k) ? "Niveau validé : bats ton record (" + recTxt("chasse:" + k, "errs") + ")." : "Toniques, tierces, quintes sans compter : le réflexe qui libère l'impro." };
    }
    if (id.indexOf("penta") === 0) {
      return { e: "🎯", cat: "Viser", min: 5, titre: "Rôles de la penta · niveau " + k + " · " + PENTA_LV[k - 1][0], why: "Savoir ce que fait chaque note, pas seulement où elle est." };
    }
    if (id.indexOf("bouge") === 0) {
      return { e: "🔄", cat: "Viser", min: 5, titre: "L'accord bouge · " + BOUGE_LV[k - 1][0], why: "Même penta, l'accord change : ce que devient chaque note." };
    }
    if (id === "blue") return { e: "💧", cat: "Viser", min: 5, titre: "Les blue notes", why: "Les trois, où elles sont, et ce qui les tue." };
    if (id === "jam") {
      return { e: "🎤", cat: "Jouer", min: 5, titre: "Drone en " + A.disp(p.t) + (p.m ? " mineur" : " majeur") + " · " + JAM_RULES[p.rule].t,
        why: "Guitare en main, chrono de 5 min. La théorie ne compte que quand elle passe dans les doigts." };
    }
    if (id.indexOf("lesson:") === 0) {
      const L = LESSONS.find((l) => l.id === id.slice(7)) || { title: "Leçon", sub: "" };
      return { e: "📖", cat: "Comprendre", min: 5, titre: L.title, why: L.sub };
    }
    if (id.indexOf("key") === 0) {
      return { e: "🧭", cat: "Comprendre", min: 5, titre: "Deviner la tonalité · niveau " + k + " · " + KEY_LV[k - 1][0], why: KEY_LV[k - 1][1] };
    }
    return { e: "•", cat: "", min: 0, titre: id, why: "" };
  }

  function semaine(se) {
    const jours = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      jours.push({ c: se.hist[fmtJour(d)] || 0, l: "DLMMJVS"[d.getDay()], today: i === 0 });
    }
    // série de séances COMPLÈTES ; tant qu'aujourd'hui n'est pas fini, elle tient jusqu'à hier
    let serie = 0;
    const d = new Date();
    if ((se.hist[fmtJour(d)] || 0) < SE_N) d.setDate(d.getDate() - 1);
    while ((se.hist[fmtJour(d)] || 0) >= SE_N) { serie++; d.setDate(d.getDate() - 1); }
    return { jours: jours, serie: serie };
  }

  function seanceCard() {
    const se = seance();
    const fait = se.plan.filter((p) => se.done[p.id]).length;
    const cur = se.plan.find((p) => !se.done[p.id]);
    let min = 0;
    const rows = se.plan.map((p, i) => {
      const I = infoLigne(p), ok = !!se.done[p.id];
      min += I.min;
      const attr = p.id.indexOf("lesson:") === 0 ? `data-lesson="${p.id.slice(7)}"` : `data-seance="${p.id}"`;
      return `<button class="se-row${ok ? " ok" : ""}${p === cur ? " cur" : ""}" ${attr}>
        <span class="se-n">${ok ? "✓" : i + 1}</span>
        <span class="se-b"><span class="se-cat">${I.e} ${I.cat} · ${I.min} min</span>
          <span class="se-t">${I.titre}</span><span class="se-w">${I.why}</span></span>
        <span class="l-arrow">›</span></button>`;
    }).join("");
    const wk = semaine(se);
    return `<div class="se-card">
      <div class="se-h"><div><div class="se-title">📅 Séance du jour</div>
        <div class="se-sub">≈ ${min} min, dans l'ordre. Une ligne se coche quand l'exo lancé d'ici arrive au bout — pas avant.</div></div>
        <div class="se-count">${fait}/${se.plan.length}</div></div>
      <div class="prog-bar"><span style="width:${Math.round(fait / se.plan.length * 100)}%"></span></div>
      ${fait === se.plan.length ? `<div class="fb-ok">✅ Séance bouclée, +30 XP. Celle de demain sera différente — celle-ci ne bouge plus.</div>` : ""}
      <div class="se-rows">${rows}</div>
      <div class="se-week">${wk.jours.map((j) => `<span class="se-d${j.today ? " today" : ""}"><span class="se-dot${j.c >= SE_N ? " full" : j.c ? " part" : ""}"></span>${j.l}</span>`).join("")}
        <span class="se-streak">🔥 <b>${wk.serie}</b> j de séance complète</span></div>
    </div>`;
  }

  function seanceMark(id) {
    const se = seance();
    if (se.done[id] || !se.plan.some((p) => p.id === id)) return;
    se.done[id] = true;
    const n = se.plan.filter((p) => se.done[p.id]).length;
    se.hist[se.date] = n;
    const complete = n === se.plan.length && !se.bonus;
    if (complete) se.bonus = true;
    A.save();
    if (complete) A.earnXP(30);
  }

  function lancerSeance(id) {
    SLOT = id;
    if (id.indexOf("gkey:") === 0) return startKey(id.slice(5));
    if (id.indexOf("pkey:") === 0) return startPenta(id.slice(5));
    if (id === "jam") return exJam();
    startEx(id);
  }

  /* ---- 4 · JOUER : 5 minutes sur un drone, une règle, un chrono ---- */
  function exJam() {
    const p = seance().plan.find((x) => x.id === "jam");
    if (!p) return;
    const R = JAM_RULES[p.rule % JAM_RULES.length], tonic = p.t, minor = p.m;
    openSheet("🎤 Jouer · 5 min");
    useSpell(tonic, minor);
    const tpc = PCS(tonic);
    const pcs = (minor ? LC.minorPenta(tonic) : LC.majorPenta(tonic)).map(PCS);
    const nm = (s) => noteName(tpc + s);
    const x = { n1: nm(0), n3: nm(minor ? 3 : 4), n5: nm(7), n7: nm(minor ? 10 : 9), d3: minor ? "♭3" : "3", d7: minor ? "♭7" : "6",
      sol: A.disp("G"), si: A.disp("B") };
    const DUREE = 5 * 60 * 1000;
    let reste = DUREE, fin = 0, iv = null;
    const mmss = (ms) => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + pad2(s % 60); };

    paint(`<div class="ex-intro big">Tonalité du jour : <b>${A.disp(tonic)} ${minor ? "mineur" : "majeur"}</b>. Guitare en main, drone lancé, cinq minutes.</div>
      <div class="role-card"><div class="rc-h">La règle du jour · ${R.t}</div><div class="rc-b">${R.c(x)}</div></div>
      <div class="jam-t" id="jamT">${mmss(reste)}</div>
      <div class="btnrow center"><button class="btn primary" id="jamGo">▶ Drone + chrono</button>
        <button class="btn" id="jamPause" hidden>⏸ Pause</button></div>
      <div id="jamFb">${seance().done.jam ? `<div class="fb-ok">✅ Déjà fait aujourd'hui. Rejoue autant que tu veux.</div>` : ""}</div>
      <div class="ate-sub">Ta penta · ${x.n1} ${minor ? "mineur" : "majeur"}</div>
      ${LCRender.fretboard({ frets: 12, highlight: pcs, dots: [(tpc + (minor ? 3 : 4)) % 12, (tpc + 7) % 12], root: tpc, spell: SPELL })}
      ${LCRender.legend([{ cls: "lg-fill", txt: "penta" }, { cls: "lg-dot", txt: "cibles : " + x.d3 + " et 5" }, { cls: "lg-root", txt: "tonique" }])}
      <div class="hint">La ligne ne se coche qu'à <b>0:00</b>. Pause permise. Laisser tourner le chrono sans jouer ne trompe que toi.</div>`);

    function stop() { if (iv) { clearInterval(iv); iv = null; } LC.audio.droneStop(); }
    function tick() {
      if (!$("#jamT")) { stop(); return; }         // feuille fermée autrement
      reste = Math.max(0, fin - Date.now());
      $("#jamT").textContent = mmss(reste);
      if (reste <= 0) termine();
    }
    function go() {
      LC.audio.resume(); LC.audio.drone([36 + tpc, 48 + tpc, 55 + tpc]);
      fin = Date.now() + reste;
      iv = setInterval(tick, 250);
      $("#jamGo").hidden = true; $("#jamPause").hidden = false;
    }
    function pause() {
      stop(); reste = Math.max(0, fin - Date.now());
      $("#jamGo").textContent = "▶ Reprendre"; $("#jamGo").hidden = false; $("#jamPause").hidden = true;
    }
    function termine() {
      stop(); reste = DUREE;
      $("#jamT").textContent = mmss(reste);
      $("#jamGo").textContent = "↻ Encore 5 min"; $("#jamGo").hidden = false; $("#jamPause").hidden = true;
      const first = !seance().done.jam;
      seanceMark("jam");
      if (first) A.earnXP(10);
      $("#jamFb").innerHTML = `<div class="fb-ok">✅ Cinq minutes jouées. Question honnête : combien de phrases ont vraiment respecté la règle ?</div>`;
    }
    btn("jamGo", go); btn("jamPause", pause);
    $("#exQuit").onclick = () => { stop(); closeSheet(); };
  }

  return { init: init, view: view, wire: wire, seanceCard: seanceCard, seanceMark: seanceMark };
})();

/* =========================================================================
   LA CLÉ — parcours d'apprentissage + définitions des drills
   Chaque leçon : {id, chap, title, sub, key(=idée clé), body(HTML),
                   demo(spec rendu par app.js), quiz{q,choices,answer,explain}}
   ========================================================================= */
const CHAPTERS = [
  { id: 1, emoji: "🧱", title: "Les fondations", sub: "Les 12 notes, la formule magique" },
  { id: 2, emoji: "🎡", title: "Les 12 gammes & le cercle", sub: "Construire n'importe quelle gamme + armures" },
  { id: 3, emoji: "🔗", title: "Majeur ↔ mineure", sub: "Le lien : la relative (mêmes notes)" },
  { id: 4, emoji: "⭐", title: "Les pentatoniques", sub: "Ta boîte à outils pour improviser" },
  { id: 5, emoji: "🎸", title: "Le manche", sub: "Toutes les notes, les notes cibles" },
  { id: 6, emoji: "🎯", title: "Tonalité & impro", sub: "Le grand final : improviser sur tout" },
  { id: 7, emoji: "🌈", title: "Les modes", sub: "Bonus : la couleur en plus" },
  { id: 8, emoji: "🎼", title: "Les accords à 4 sons", sub: "Les 7es, la dominante, le ii–V–I" },
  { id: 9, emoji: "🎺", title: "Le blues", sub: "La grille, et pourquoi elle viole les règles" },
  { id: 10, emoji: "🗣️", title: "Le phrasé", sub: "Ce qui sépare jouer juste de jouer bien" },
];

const LESSONS = [
  /* ===== CHAPITRE 1 — FONDATIONS ===== */
  {
    id: "notes12", chap: 1, title: "Les 12 notes", sub: "L'alphabet complet de la musique",
    key: "Toute la musique occidentale tient dans 12 notes qui bouclent en rond.",
    body: `<p>Il n'existe que <b>12 notes</b>. Après la 12e, ça recommence, une octave plus haut. Sur le piano, c'est visible : le motif de touches (2 noires puis 3 noires) se répète à l'infini.</p>
<p>Les 7 lettres <b>C D E F G A B</b> (Do Ré Mi Fa Sol La Si) sont les touches <b>blanches</b>. Les 5 touches <b>noires</b> se glissent entre elles : ce sont les dièses (♯, un demi-ton plus haut) et bémols (♭, un demi-ton plus bas). Do♯ = Ré♭ : <b>même touche, deux noms</b> (on choisit le nom selon le contexte).</p>
<p class="tip">Repère fondamental : la touche noire manque <b>entre Mi–Fa (E–F)</b> et <b>entre Si–Do (B–C)</b>. C'est de là que vient toute la théorie qui suit.</p>`,
    demo: { kind: "piano", show: "chromatic", octaves: 1 },
    quiz: { q: "Combien de notes différentes existe-t-il avant que ça recommence ?", choices: ["7", "8", "12", "24"], answer: 2, explain: "12 : les 7 blanches + les 5 noires. Ensuite l'octave supérieure répète le même motif." },
  },
  {
    id: "tonsemi", chap: 1, title: "Ton & demi-ton", sub: "La plus petite distance",
    key: "Demi-ton = touche voisine. Ton = on saute une touche. C'est l'unité de mesure de tout.",
    body: `<p>Un <b>demi-ton</b> (½), c'est la plus petite distance : d'une touche à la <b>touche immédiatement voisine</b> (blanche ou noire, peu importe). Sur la guitare, c'est <b>une case</b>.</p>
<p>Un <b>ton</b> (T) = <b>deux demi-tons</b> = on saute une touche au milieu. Sur la guitare, <b>deux cases</b>.</p>
<p>Exemples : Do→Do♯ = ½ ton. Do→Ré = 1 ton (on saute Do♯). Mi→Fa = ½ ton (pas de noire entre eux !). Si→Do = ½ ton aussi.</p>
<p class="tip">Grave-toi ça : <b>E–F et B–C sont naturellement à un demi-ton</b>. Partout ailleurs entre deux lettres voisines, il y a un ton.</p>`,
    demo: { kind: "piano", show: "chromatic", octaves: 1 },
    quiz: { q: "Combien y a-t-il entre Mi et Fa (E et F) ?", choices: ["Un ton", "Un demi-ton", "Un ton et demi"], answer: 1, explain: "Un demi-ton : il n'y a pas de touche noire entre eux. Idem pour Si–Do (B–C)." },
  },
  {
    id: "formulemaj", chap: 1, title: "La formule magique", sub: "T–T–½–T–T–T–½",
    key: "La gamme majeure = TON–TON–DEMI–TON–TON–TON–DEMI. Une seule formule, 12 gammes.",
    body: `<p>Voici <b>LA</b> formule à connaître par cœur. À partir de n'importe quelle note, monte selon :</p>
<p class="formula">Ton · Ton · ½ · Ton · Ton · Ton · ½</p>
<p>…et tu obtiens la <b>gamme majeure</b> de cette note. Applique-la depuis Do (C) : Do →(T) Ré →(T) Mi →(½) Fa →(T) Sol →(T) La →(T) Si →(½) Do. Résultat : <b>C D E F G A B</b> — que des blanches. C'est pour ça que Do majeur est la gamme « de référence ».</p>
<p>Applique la <b>même</b> formule depuis Sol (G) et tu tomberas forcément sur un Fa♯. C'est la formule qui décide, pas le hasard.</p>
<p class="tip">Cette formule est le squelette de presque tout : gammes, accords, tonalités. Maîtrise-la et le reste tombe.</p>`,
    demo: { kind: "piano", tonic: "C", show: "major", steps: true },
    quiz: { q: "Quelle est la formule de la gamme majeure ?", choices: ["T–½–T–T–½–T–T", "T–T–½–T–T–T–½", "½–T–T–T–½–T–T", "T–T–T–½–T–T–½"], answer: 1, explain: "Ton–Ton–demi–Ton–Ton–Ton–demi. Les deux demi-tons tombent entre 3-4 et 7-8." },
  },

  /* ===== CHAPITRE 2 — LES 12 GAMMES & LE CERCLE ===== */
  {
    id: "construire", chap: 2, title: "Construire une gamme", sub: "N'importe laquelle, à la demande",
    key: "Applique la formule depuis la tonique. Une lettre par degré, jamais deux fois la même.",
    body: `<p>Méthode infaillible pour épeler une gamme majeure :</p>
<ul><li>Écris les <b>7 lettres</b> dans l'ordre à partir de ta tonique (ex. pour Ré : D E F G A B C).</li>
<li>Applique la formule T–T–½–T–T–T–½ et ajoute ♯ ou ♭ pour tomber juste.</li></ul>
<p>Ré majeur : D →(T) E →(T) F<b>♯</b> →(½) G →(T) A →(T) B →(T) C<b>♯</b> →(½) D. On écrit <b>F♯ et C♯</b> (jamais G♭ à la place de F♯ : chaque lettre n'apparaît qu'une fois).</p>
<p class="tip">Règle d'or : une gamme utilise <b>les 7 lettres, chacune une seule fois</b>. Si tu as deux « sortes de Fa », tu t'es trompé de nom.</p>`,
    demo: { kind: "piano", tonic: "D", show: "major" },
    quiz: { q: "En Ré majeur, comment note-t-on la 3e note ?", choices: ["G♭", "F♯", "F", "E♯"], answer: 1, explain: "F♯. La lettre F doit apparaître (une lettre par degré), donc F♯ et surtout pas G♭." },
  },
  {
    id: "cercle", chap: 2, title: "Le cercle des quintes", sub: "La carte de toutes les tonalités",
    key: "Monte de quinte (5 notes) → +1 dièse à chaque pas. L'ordre des dièses : Fa Do Sol Ré La Mi Si.",
    body: `<p>Range les 12 tonalités en cercle. Pars de Do (0 altération). À chaque fois que tu montes d'une <b>quinte</b> (5 notes plus haut : Do→Sol→Ré→La…), tu <b>ajoutes un dièse</b>.</p>
<p>Dans l'autre sens (descendre d'une quinte : Do→Fa→Si♭…), tu <b>ajoutes un bémol</b>.</p>
<p>Les dièses arrivent toujours dans le même ordre : <b>Fa Do Sol Ré La Mi Si</b> (F C G D A E B). Les bémols dans l'ordre inverse.</p>
<p class="tip">Le cercle, c'est ton GPS : il te dit instantanément combien d'altérations a une tonalité, et quelles tonalités sont « voisines » (donc sonnent bien ensemble).</p>`,
    demo: { kind: "circle" },
    quiz: { q: "En montant d'une quinte (ex. Do → Sol), qu'arrive-t-il à l'armure ?", choices: ["+1 bémol", "+1 dièse", "rien ne change", "on perd un dièse"], answer: 1, explain: "+1 dièse à chaque quinte montante. Sol majeur = 1 dièse (F♯), Ré = 2, etc." },
  },
  {
    id: "armure", chap: 2, title: "Armure, clef, tonalité", sub: "⚠️ Les 3 mots qu'on confond",
    key: "Clef = symbole pour LIRE. Tonalité = le centre de gravité du morceau. Rien à voir !",
    body: `<p>Tu as dit « je sais pas la diff entre gamme et clé ». On règle ça maintenant, c'est capital.</p>
<ul>
<li><b>Note</b> : une des 12 hauteurs.</li>
<li><b>Gamme</b> (scale) : une suite de notes selon une formule. « Do majeur » comme gamme = les 7 notes C D E F G A B.</li>
<li><b>Tonalité</b> (key, en anglais) : le <b>centre de gravité</b> d'un morceau — la note/gamme autour de laquelle tout tourne, celle qui sonne comme « la maison ». Être « en Do majeur » = le morceau se repose sur Do. <b>C'est ça que veulent dire les musiciens par « je suis en Do ».</b></li>
<li><b>Clef</b> (clef de Sol 𝄞) : le <b>symbole</b> en début de portée qui sert juste à <b>lire</b> les notes. Ça n'a <b>rien</b> à voir avec la tonalité.</li>
<li><b>Armure</b> : les ♯/♭ juste après la clef, qui <b>annoncent la tonalité</b>.</li>
</ul>
<p class="tip">Le piège : en anglais « key » = tonalité. En français « clé/clef » = le symbole. Quand tu demandes « je suis dans quelle clé ? », tu veux dire « quelle <b>tonalité</b> ? ». À partir d'ici, dis <b>tonalité</b>.</p>`,
    demo: { kind: "html", id: "armureTable" },
    quiz: { q: "« Ce morceau est en La mineur. » De quoi parle-t-on ?", choices: ["De la clef (symbole de lecture)", "De la tonalité (le centre de gravité)", "Du tempo"], answer: 1, explain: "De la tonalité : le morceau tourne autour de La mineur. La clef, elle, sert seulement à lire la partition." },
  },

  /* ===== CHAPITRE 3 — MAJEUR / MINEURE RELATIVE ===== */
  {
    id: "relative", chap: 3, title: "La mineure relative", sub: "Le lien que tu voulais d'abord",
    key: "Chaque gamme majeure a une mineure jumelle : mêmes notes, tonique = le 6e degré.",
    body: `<p>Voici l'idée qui va tout débloquer. Prends Do majeur : <b>C D E F G A B</b>. Maintenant démarre la <b>même</b> suite de notes à partir du <b>6e degré</b>, le La (A) :</p>
<p class="formula">A B C D E F G = La mineur</p>
<p>Ce sont <b>exactement les mêmes notes</b> ! Do majeur et La mineur sont des <b>relatives</b> : même « boîte à notes », mais un centre de gravité différent (Do vs La). C'est pour ça qu'à la guitare, une seule position de penta te sert pour la version majeure ET mineure.</p>
<p>Pour trouver la relative mineure : <b>compte 3 demi-tons vers le bas</b> depuis la tonique majeure (ou prends le 6e degré). Do → La. Sol → Mi. Fa → Ré.</p>
<p class="tip">Conséquence énorme pour l'impro : si tu connais tes gammes majeures, tu connais <b>gratuitement</b> les mineures. Deux pour le prix d'une.</p>`,
    demo: { kind: "relatives", tonic: "C" },
    quiz: { q: "Quelle est la relative mineure de Sol majeur (G) ?", choices: ["Ré mineur", "Mi mineur", "La mineur", "Si mineur"], answer: 1, explain: "Mi mineur (Em) : le 6e degré de Sol majeur, ou 3 demi-tons sous Sol. Mêmes notes que G majeur." },
  },
  {
    id: "couleur", chap: 3, title: "La couleur majeur / mineur", sub: "Joyeux vs mélancolique — et pourquoi",
    key: "Ce n'est pas les notes qui changent, c'est la note d'où tu pars et sur laquelle tu te reposes.",
    body: `<p>Majeur = lumineux, « content ». Mineur = sombre, mélancolique. Mais Do majeur et La mineur ont les <b>mêmes 7 notes</b>… Alors d'où vient la différence ?</p>
<p>De la <b>note-maison</b>. En majeur, tout se résout sur Do, et l'intervalle Do→Mi est une <b>tierce majeure</b> (grande, lumineuse). En mineur, tout se résout sur La, et La→Do est une <b>tierce mineure</b> (plus resserrée, sombre).</p>
<p>La <b>3e note</b> (la tierce) est le juge de paix : tierce majeure = accord/gamme majeur, tierce mineure = mineur.</p>
<p class="tip">Pour l'impro, retiens ça : viser la <b>tierce</b> du bon type, c'est ce qui fait « sonner » ton solo juste et coloré.</p>`,
    demo: { kind: "compareThird" },
    quiz: { q: "Quelle note décide si ça sonne majeur ou mineur ?", choices: ["La tonique", "La quinte", "La tierce (3e note)", "La septième"], answer: 2, explain: "La tierce : majeure (2 tons au-dessus de la tonique) = lumineux ; mineure (1 ton ½) = sombre." },
  },
  {
    id: "reconnaitre", chap: 3, title: "Majeur ou mineur ?", sub: "Le reconnaître à l'oreille et sur le papier",
    key: "Regarde où le morceau se repose (souvent le 1er et le dernier accord). C'est là ta tonique.",
    body: `<p>Comment savoir si un morceau est majeur ou mineur ?</p>
<ul>
<li><b>À l'oreille</b> : il sonne joyeux/ouvert → probablement majeur. Sombre/tendu/triste → mineur.</li>
<li><b>Sur les accords</b> : le morceau se <b>repose</b> souvent sur son accord de tonique. Regarde le <b>premier</b> et surtout le <b>dernier</b> accord : c'est très souvent la tonique. Si c'est un accord mineur (ex. Am), pense mineur ; majeur (ex. C), pense majeur.</li>
</ul>
<p>Astuce : deux morceaux avec les mêmes accords (C, F, G, Am) peuvent être « en Do majeur » ou « en La mineur » selon celui sur lequel ils <b>retombent</b>. Même boîte à notes, centre différent.</p>
<p class="tip">Pour improviser, la boîte à notes est la <b>même</b> (relatives) — donc même si tu hésites majeur/mineur, tes notes justes ne changent pas. Rassurant, non ?</p>`,
    demo: { kind: "html", id: "majminEar" },
    quiz: { q: "Un morceau enchaîne Am–F–C–G et retombe toujours sur Am. Centre le plus probable ?", choices: ["Do majeur", "La mineur", "Fa majeur"], answer: 1, explain: "La mineur : il se repose sur Am. (Mêmes notes que Do majeur, mais le centre de gravité est La.)" },
  },

  /* ===== CHAPITRE 4 — PENTATONIQUES ===== */
  {
    id: "majpenta", chap: 4, title: "La penta majeure", sub: "Enlève les 2 notes qui « accrochent »",
    key: "Penta majeure = gamme majeure SANS le 4e et le 7e degré. 5 notes qui sonnent bien partout.",
    body: `<p>La gamme majeure a 7 notes. Deux d'entre elles (le <b>4e</b> et le <b>7e</b> degré) créent des tensions qui peuvent « accrocher » quand on improvise. On les enlève :</p>
<p class="formula">1 · 2 · 3 · 5 · 6 &nbsp;→&nbsp; penta MAJEURE</p>
<p>Do majeur (C D E F G A B) → penta = <b>C D E G A</b> (on retire F et B). Cinq notes solides qui sonnent bien sur à peu près tout ce qui est majeur.</p>
<p class="tip">La penta, c'est ton <b>filet de sécurité</b> pour l'impro : difficile de faire une fausse note avec. On construit tout le solo là-dessus, puis on ajoute des couleurs.</p>`,
    demo: { kind: "piano", tonic: "C", show: "majpenta" },
    quiz: { q: "Quels degrés enlève-t-on à la gamme majeure pour obtenir la penta majeure ?", choices: ["Le 2 et le 6", "Le 4 et le 7", "Le 3 et le 5", "Le 1 et le 8"], answer: 1, explain: "Le 4e et le 7e. Reste 1-2-3-5-6, cinq notes très stables." },
  },
  {
    id: "minpenta", chap: 4, title: "La penta mineure", sub: "La reine de l'impro",
    key: "Penta mineure = la penta majeure de sa relative. Am penta = C penta, mêmes notes.",
    body: `<p>La <b>penta mineure</b> est la gamme la plus utilisée en solo (blues, rock, pop…). Formule depuis la tonique mineure :</p>
<p class="formula">1 · ♭3 · 4 · 5 · ♭7 &nbsp;→&nbsp; penta MINEURE</p>
<p>La mineur → <b>A C D E G</b>. Regarde bien : ce sont <b>les mêmes 5 notes</b> que la penta majeure de Do (C D E G A) ! Normal : Am est la relative de C. <b>Une seule forme sur le manche = deux usages</b> (majeur ou mineur).</p>
<p class="tip">C'est LE raccourci de l'impro guitare : tu apprends <b>une</b> position de penta, tu improvises en majeur (centre sur la 2e note de la forme) ou en mineur (centre sur la 1re). Deux couleurs, un seul dessin.</p>`,
    demo: { kind: "fretboard", tonic: "A", show: "minpenta" },
    quiz: { q: "La penta mineure de La (Am) contient les mêmes notes que la penta majeure de… ?", choices: ["Fa", "Sol", "Do", "Ré"], answer: 2, explain: "Do : Am et C sont relatives. A C D E G = C D E G A. Une seule boîte à notes." },
  },
  {
    id: "allpentas", chap: 4, title: "Toutes les pentas au piano", sub: "Ton objectif : les 12 par cœur",
    key: "Enlève 4 et 7 de chaque gamme majeure. Entraîne-les jusqu'à ce que ça sorte tout seul.",
    body: `<p>Ton objectif affiché : <b>connaître toutes les pentas au piano</b>. La méthode est toujours la même — penta majeure = gamme majeure moins le 4 et le 7. Le drill « Penta majeure de X » (onglet 🔥) te fait tourner les 12 jusqu'à l'automatisme.</p>
<p>Pars des plus faciles (touches blanches ou presque) : C (C D E G A), G (G A B D E), F (F G A C D). Puis attaque celles avec des altérations.</p>
<p class="tip">Vise l'automatisme : « penta de Mi♭ » doit sortir en moins de 3 secondes. C'est ça, « connaître » — pas « savoir recalculer ».</p>`,
    demo: { kind: "piano", tonic: "G", show: "majpenta" },
    quiz: { q: "Penta majeure de Fa (F) ?", choices: ["F G A C D", "F G A B♭ D", "F A C D E", "F G B♭ C E"], answer: 0, explain: "F majeur = F G A B♭ C D E. On retire le 4 (B♭) et le 7 (E) → F G A C D." },
  },
  {
    id: "bluenote", chap: 4, title: "La blue note", sub: "La note qui salit (dans le bon sens)",
    key: "Ajoute le ♭5 à la penta mineure → gamme blues. À utiliser en passage, pas en appui.",
    body: `<p>Prends la penta mineure et glisse une note en plus : le <b>♭5</b> (quinte bémol). Ça donne la <b>gamme blues</b> :</p>
<p class="formula">1 · ♭3 · 4 · ♭5 · 5 · ♭7</p>
<p>La blues → A C D <b>E♭</b> E G. Ce E♭ est la <b>blue note</b> : elle sonne « sale », tendue, expressive. Elle se joue <b>en passage</b> (on glisse dessus vers le 5), jamais en note d'appui longue.</p>
<p class="tip">La blue note, c'est l'assaisonnement. Une pincée = ça pète. Toute la casserole = immangeable.</p>`,
    demo: { kind: "fretboard", tonic: "A", show: "blues" },
    quiz: { q: "La blue note qu'on ajoute à la penta mineure, c'est le… ?", choices: ["♭2", "♭5", "♭6", "♯7"], answer: 1, explain: "Le ♭5. En La mineur c'est le E♭. On la joue en passage vers la quinte." },
  },

  /* ===== CHAPITRE 5 — LE MANCHE ===== */
  {
    id: "notesmanche", chap: 5, title: "Les notes sur le manche", sub: "Ton objectif : tout le manche",
    key: "6 cordes à vide : Mi La Ré Sol Si Mi. À la case 12, chaque corde répète sa note à vide.",
    body: `<p>Autre objectif que tu t'es fixé : <b>connaître toutes les notes sur le manche</b>. Point de départ, les cordes à vide, de la grave à l'aiguë : <b>Mi La Ré Sol Si Mi</b> (E A D G B E).</p>
<p>Ensuite, chaque case monte d'un <b>demi-ton</b>. Corde de Mi grave : case 1 = Fa, case 3 = Sol, case 5 = La… À la <b>case 12</b>, tu retrouves la note à vide (une octave plus haut) : tout se répète ensuite.</p>
<p>Repères visuels (les points) : cases <b>3, 5, 7, 9</b> et double point à la <b>12</b>. Sers-t'en comme balises.</p>
<p class="tip">Ne « mémorise » pas 72 cases. Apprends d'abord les cordes de <b>Mi</b> (grave et aiguë, identiques !) et de <b>La</b> : c'est là que tu poses tes accords barrés et tes toniques.</p>`,
    demo: { kind: "fretboard", show: "allnotes" },
    quiz: { q: "Sur la corde de Mi grave, quelle note à la case 5 ?", choices: ["Sol", "La", "Si", "Do"], answer: 1, explain: "La (A). Mi→Fa(1)→F♯(2)→Sol(3)→G♯(4)→La(5). C'est aussi la corde à vide juste au-dessus." },
  },
  {
    id: "octaves", chap: 5, title: "Trouver n'importe quelle note", sub: "Les formes d'octave = triche légale",
    key: "Une même note se trouve à plein d'endroits. Les formes d'octave te la donnent partout.",
    body: `<p>Tu n'as pas besoin de mémoriser chaque case. Apprends les <b>formes d'octave</b> : depuis une note connue, la même note (une octave plus haut) est toujours au même endroit relatif.</p>
<ul>
<li>De la corde 6 (Mi grave) à la corde 4 (Ré) : <b>+2 cordes, +2 cases</b>.</li>
<li>De la corde 5 (La) à la corde 3 (Sol) : <b>+2 cordes, +2 cases</b> aussi.</li></ul>
<p>Donc si tu sais qu'un Sol est à la case 3 corde 6, tu sais qu'un autre Sol est case 5 corde 4. Tu « propages » tes toniques partout.</p>
<p class="tip">Combine avec les cordes de Mi et La mémorisées : tu peux placer <b>n'importe quelle tonique</b> sur tout le manche en quelques secondes.</p>`,
    demo: { kind: "fretboard", tonic: "G", show: "single" },
    quiz: { q: "Un Sol (G) est case 3 sur la corde de Mi grave. Où est le Sol le plus proche via la forme d'octave ?", choices: ["Corde de Ré, case 5", "Corde de La, case 3", "Corde de Si, case 3"], answer: 0, explain: "Corde de Ré, case 5 : +2 cordes, +2 cases. La forme d'octave classique corde 6 → corde 4." },
  },
  {
    id: "pentamanche", chap: 5, title: "La penta sur le manche", sub: "La position 1, mobile",
    key: "Une seule forme de penta, que tu déplaces : sa tonique te dit dans quelle gamme tu es.",
    body: `<p>La force de la guitare : les formes sont <b>mobiles</b>. La « position 1 » de la penta mineure est un dessin de 2 notes par corde que tu peux glisser n'importe où.</p>
<p>Place sa tonique sur la note que tu veux : mets-la sur le La (case 5, corde 6) → tu joues <b>La mineur penta</b>. Glisse-la case 8 → <b>Do mineur penta</b>. Le dessin ne change pas, seule la position change.</p>
<p>Et souviens-toi (chap. 4) : cette même forme sert en majeur — il suffit de considérer la relative majeure comme centre.</p>
<p class="tip">Priorité absolue si tu veux improviser vite : <b>cette forme + savoir où est ta tonique</b>. Avec ça seul, tu soloes déjà sur des milliers de morceaux.</p>`,
    demo: { kind: "fretboard", tonic: "A", show: "minpenta", frets: 12 },
    quiz: { q: "Tu joues la forme de penta mineure avec sa tonique sur le Do. Tu es en… ?", choices: ["Do majeur penta", "Do mineur penta", "La mineur penta"], answer: 1, explain: "Do mineur penta : la tonique de la forme est sur Do. Déplace la forme = change de gamme." },
  },
  {
    id: "cibles", chap: 5, title: "Les notes cibles", sub: "« Je suis en C → je vise C E G »",
    key: "Les notes de l'accord en cours (sa triade) sonnent toujours juste. Vise-les, surtout la tierce.",
    body: `<p>Tu l'as dit toi-même : « je suis en C, alors je vise C / E / G ». <b>Exactement.</b> Ces trois notes sont l'accord de Do (sa triade). Ce sont tes <b>notes cibles</b> : elles sonnent bien à coup sûr parce que ce sont les notes de l'accord qui joue.</p>
<p>Méthode d'impro pro : on se balade dans la penta/gamme (les notes « de passage »), mais on <b>atterrit</b> sur une note cible, surtout en fin de phrase. Et la note reine, c'est la <b>tierce</b> (le E pour un accord de C) : c'est elle qui « chante » le mieux.</p>
<p>Quand l'accord change (C → F), tes cibles changent (C E G → F A C). Suivre les notes cibles accord par accord = le secret des solos qui « collent » à la musique.</p>
<p class="tip">Débute simple : reste dans la penta, mais <b>finis tes phrases sur une note cible</b>. Ça transforme immédiatement un solo brouillon en solo qui sonne.</p>`,
    demo: { kind: "fretboard", tonic: "C", show: "triadTargets" },
    quiz: { q: "Sur un accord de Sol (G), quelles sont tes 3 notes cibles ?", choices: ["G B D", "G A D", "G C E", "A C E"], answer: 0, explain: "G B D : la triade de Sol majeur (1-3-5). La tierce (B) est la note la plus « chantante » à viser." },
  },

  /* ===== CHAPITRE 6 — TONALITÉ & IMPRO ===== */
  {
    id: "trouvertona", chap: 6, title: "Trouver la tonalité", sub: "À partir des accords d'une chanson",
    key: "Liste les accords. La tonalité est celle dont ils sont tous des degrés (I ii iii IV V vi vii°).",
    body: `<p>On y est. Donne-moi les accords d'un morceau, je te donne la tonalité — et l'onglet 🎯 le fait pour toi. Le principe :</p>
<ul>
<li>Chaque tonalité majeure a <b>7 accords « maison »</b> (ses degrés). En Do : C · Dm · Em · F · G · Am · B°.</li>
<li>Prends les accords du morceau et cherche la tonalité dans laquelle <b>ils rentrent tous</b>.</li>
<li>Indices : la tonalité se <b>repose</b> souvent sur son accord I (le 1er/dernier), et l'accord V (dominante, majeur) « pousse » vers elle.</li></ul>
<p>Ex. : G – C – D → tous dans Sol majeur (I – IV – V) → tonalité = <b>Sol majeur</b>. Ex. : Am – F – C – G → Do majeur (vi – IV – I – V).</p>
<p class="tip">Une fois la tonalité trouvée, tu tiens ta <b>boîte à notes</b> pour improviser sur TOUT le morceau. C'est le point de bascule.</p>`,
    demo: { kind: "chords", tonic: "C" },
    quiz: { q: "Un morceau utilise G, C et D. Tonalité la plus probable ?", choices: ["Do majeur", "Ré majeur", "Sol majeur", "La mineur"], answer: 2, explain: "Sol majeur : G=I, C=IV, D=V. Le trio I-IV-V le plus classique qui soit." },
  },
  {
    id: "accordstona", chap: 6, title: "Les accords d'une tonalité", sub: "I ii iii IV V vi vii°",
    key: "Majeur, mineur, mineur, majeur, majeur, mineur, diminué. Toujours dans cet ordre.",
    body: `<p>Dans chaque tonalité majeure, les 7 accords « maison » ont toujours les mêmes qualités :</p>
<p class="formula">I&nbsp;maj · ii&nbsp;min · iii&nbsp;min · IV&nbsp;maj · V&nbsp;maj · vi&nbsp;min · vii°&nbsp;dim</p>
<p>En Do : <b>C · Dm · Em · F · G · Am · B°</b>. Cette grille explique 90% de la pop/rock : les fameux « 4 accords » (I–V–vi–IV = C–G–Am–F) en sont juste 4 piochés là-dedans.</p>
<p>Savoir ça te sert dans les deux sens : <b>composer</b> (piocher des accords qui vont ensemble) et <b>analyser</b> (reconnaître les degrés → trouver la tonalité).</p>
<p class="tip">Le vi (mineur) est la relative mineure du I. En Do, le vi c'est Am → boucle bouclée avec le chapitre 3.</p>`,
    demo: { kind: "chords", tonic: "G" },
    quiz: { q: "Dans une tonalité majeure, l'accord de degré V est… ?", choices: ["mineur", "majeur", "diminué"], answer: 1, explain: "Majeur. Ordre : I maj, ii min, iii min, IV maj, V maj, vi min, vii° dim." },
  },
  {
    id: "surquoi", chap: 6, title: "Sur quelles notes improviser", sub: "Le système à 3 cercles",
    key: "Gamme = sûr. Penta = plus sûr. Notes de l'accord en cours = cibles. Emboîte les trois.",
    body: `<p>Voici le système complet, du plus large au plus précis :</p>
<ul>
<li><b>1. La gamme de la tonalité</b> = toutes tes notes « permises ». En Do majeur : C D E F G A B. Tu ne peux pas vraiment te tromper dedans.</li>
<li><b>2. La pentatonique</b> = la gamme moins les 2 notes qui accrochent. Ton <b>filet de sécurité</b> : encore plus dur de faire une fausse note.</li>
<li><b>3. Les notes de l'accord en cours</b> = tes <b>cibles</b>. Sur C tu vises C E G ; quand ça passe à F, tu vises F A C. Atterris dessus.</li></ul>
<p>La recette : <b>navigue</b> dans la penta/gamme, <b>atterris</b> sur les notes cibles (surtout la tierce), <b>assaisonne</b> avec une blue note de temps en temps.</p>
<p class="tip">L'onglet 🎯 t'affiche ces 3 cercles sur le piano ET sur ton manche, pour n'importe quel morceau. C'est ton cockpit d'impro.</p>`,
    demo: { kind: "threeCircles", tonic: "C" },
    quiz: { q: "Quel est le rôle des « notes cibles » (notes de l'accord) ?", choices: ["Les éviter", "Les notes sur lesquelles atterrir", "Elles sont fausses"], answer: 1, explain: "Ce sont les notes qui sonnent le plus juste : on y atterrit, surtout en fin de phrase. La tierce en priorité." },
  },
  {
    id: "methode", chap: 6, title: "La méthode complète", sub: "Improviser sur n'importe quoi, pas à pas",
    key: "Tonalité → boîte à notes → position sur ton manche → cibler l'accord → phraser.",
    body: `<p>Ta routine, à appliquer sur tout morceau :</p>
<ul>
<li><b>1. Trouve la tonalité</b> (onglet 🎯 ou : regarde l'accord de repos).</li>
<li><b>2. Sors ta boîte à notes</b> : la penta/gamme de cette tonalité (majeure et mineure = mêmes notes, relatives).</li>
<li><b>3. Place-la sur le manche</b> : une position de penta autour d'une tonique que tu repères.</li>
<li><b>4. Écoute l'accord en cours</b> et vise ses notes cibles (surtout la tierce).</li>
<li><b>5. Phrase</b> : joue des idées courtes, laisse des silences, atterris sur une cible, recommence.</li></ul>
<p>Au début, fais juste 1→3 (reste dans la penta). Ajoute 4 quand tu es à l'aise. Le 5, c'est le goût, ça vient en jouant sur des backing tracks.</p>
<p class="tip">Le but de LA CLÉ : que cette routine devienne un <b>réflexe</b>. On/off, tu regardes une grille, tu sais où viser. C'est ça, être le king de l'impro.</p>`,
    demo: { kind: "threeCircles", tonic: "A", minor: true },
    quiz: { q: "Première étape pour improviser sur un morceau inconnu ?", choices: ["Jouer vite", "Trouver la tonalité", "Mettre de la disto"], answer: 1, explain: "Trouver la tonalité : elle te donne ta boîte à notes. Tout le reste en découle." },
  },

  /* ===== CHAPITRE 7 — MODES (BONUS) ===== */
  {
    id: "cestquoimode", chap: 7, title: "C'est quoi un mode", sub: "Bonus — quand la penta ne suffit plus",
    key: "Un mode = la gamme majeure jouée en partant d'un autre degré. Même notes, autre couleur.",
    body: `<p>Tu m'as dit « les modes ensuite, si c'est utile ». C'est du <b>bonus</b> : tu peux déjà improviser sans. Mais voilà l'idée, en une phrase.</p>
<p>Un <b>mode</b>, c'est la gamme majeure démarrée sur un <b>autre degré</b>. Do majeur joué de Ré à Ré = mode <b>dorien</b> de Ré. Mêmes notes que Do majeur, mais le centre est Ré → une <b>couleur</b> différente (ici : mineur, mais plus « ouvert » que le mineur naturel).</p>
<p>C'est le prolongement direct de la relative mineure (chap. 3) : là tu partais du 6e degré (mode <b>éolien</b> = mineur naturel). Les modes, c'est pareil pour les 5 autres degrés.</p>
<p class="tip">Utilité concrète : ajouter une couleur précise (dorien = mineur jazzy, mixolydien = majeur bluesy). Mais d'abord, maîtrise penta + notes cibles. Les modes, c'est la cerise.</p>`,
    demo: { kind: "modeDemo", tonic: "D", mode: "dorian" },
    quiz: { q: "Le mode dorien de Ré utilise les mêmes notes que quelle gamme majeure ?", choices: ["Ré majeur", "Do majeur", "Sol majeur"], answer: 1, explain: "Do majeur : le dorien de Ré, c'est Do majeur démarré sur son 2e degré (Ré). Mêmes notes, autre centre." },
  },
  {
    id: "7modes", chap: 7, title: "Les 7 modes d'un coup d'œil", sub: "Bonus — la table complète",
    key: "Ionien(maj) · Dorien · Phrygien · Lydien · Mixolydien · Éolien(min) · Locrien.",
    body: `<p>Les 7 modes = les 7 points de départ de la gamme majeure :</p>
<ul>
<li><b>Ionien</b> (1er degré) = gamme majeure. Lumineux.</li>
<li><b>Dorien</b> (2e) = mineur, mais avec une 6e majeure → mineur « ouvert », jazzy/funky.</li>
<li><b>Phrygien</b> (3e) = mineur sombre, saveur espagnole/metal (2e mineure).</li>
<li><b>Lydien</b> (4e) = majeur rêveur (4e augmentée). Le son « film ».</li>
<li><b>Mixolydien</b> (5e) = majeur avec 7e mineure → bluesy, rock, dominante.</li>
<li><b>Éolien</b> (6e) = mineur naturel. Le mineur « standard ».</li>
<li><b>Locrien</b> (7e) = instable, rare (quinte diminuée).</li></ul>
<p class="tip">Les deux les plus rentables pour improviser : <b>dorien</b> (sur les vamps mineures) et <b>mixolydien</b> (sur les accords de dominante / le rock-blues). Commence par ceux-là.</p>`,
    demo: { kind: "modeDemo", tonic: "G", mode: "mixolydian" },
    quiz: { q: "Quel mode sonne « majeur bluesy » et va bien sur un accord de 7 (dominante) ?", choices: ["Lydien", "Phrygien", "Mixolydien", "Locrien"], answer: 2, explain: "Le mixolydien : majeur avec une 7e mineure. Le son du rock et du blues sur les accords de dominante." },
  },

  /* ===== CHAPITRE 7 (suite) — LES MODES EN PRATIQUE ===== */
  {
    id: "modecar", chap: 7, title: "La note qui fait la couleur", sub: "Une seule note sépare deux modes",
    key: "Chaque mode a UNE note caractéristique. C'est elle qu'on vise — le reste est identique.",
    body: `<p>Voici le malentendu qui bloque tout le monde : on croit qu'il faut apprendre sept nouvelles gammes. <b>Faux.</b> En Do majeur, les sept modes utilisent <b>exactement les mêmes sept notes</b>. Rien à apprendre en plus.</p>
<p>Ce qui change, c'est le <b>centre</b> (la note qui sonne comme la maison) et surtout <b>une seule note</b> qui donne sa couleur au mode. On l'appelle la note caractéristique.</p>
<p>Le cas le plus parlant : <b>dorien</b> et <b>éolien</b> (le mineur naturel) sont deux modes mineurs. Une seule note les sépare — la <b>6e</b>. Majeure en dorien, mineure en éolien. Un demi-ton, et tu passes de « cool, ouvert » à « triste, romantique ». C'est tout.</p>
<p class="tip">Conséquence pratique énorme : pour sonner dorien, tu n'as pas à jouer une nouvelle gamme. Tu joues ta penta mineure habituelle et tu <b>ajoutes la 6e majeure</b> en la faisant entendre. Une note.</p>`,
    demo: { kind: "modeDemo", tonic: "D", mode: "dorian" },
    quiz: { q: "Quelle note sépare le dorien du mineur naturel ?", choices: ["La 2e", "La 6e", "La 7e", "La tierce"], answer: 1, explain: "La 6e : majeure en dorien, mineure en éolien. Un demi-ton d'écart, et toute la couleur change." },
  },
  {
    id: "modequand", chap: 7, title: "Quel mode sur quel accord", sub: "Le mode suit l'accord, pas l'inverse",
    key: "Chaque degré de la gamme porte son mode : ii → dorien, V → mixolydien, IV → lydien.",
    body: `<p>On ne choisit pas un mode au hasard : il est <b>imposé par l'accord</b> qui joue. En Do majeur, chaque degré porte son mode, et ça tombe toujours pareil :</p>
<p><b>I</b> Cmaj7 → ionien &nbsp;·&nbsp; <b>ii</b> Dm7 → <b>dorien</b> &nbsp;·&nbsp; <b>iii</b> Em7 → phrygien &nbsp;·&nbsp; <b>IV</b> Fmaj7 → <b>lydien</b> &nbsp;·&nbsp; <b>V</b> G7 → <b>mixolydien</b> &nbsp;·&nbsp; <b>vi</b> Am7 → éolien &nbsp;·&nbsp; <b>vii</b> Bm7♭5 → locrien.</p>
<p>Les deux qui rapportent le plus : <b>dorien</b> (sur les vamps mineures — le mineur du rock et du jazz) et <b>mixolydien</b> (sur tout accord de 7 — le son du blues). Si tu n'en travailles que deux, prends ceux-là.</p>
<p>Le locrien, lui, ne sert quasiment jamais comme centre : il est instable. Connais-le pour comprendre le système, ne perds pas de temps à improviser dessus.</p>
<p class="tip">Va dans <b>🎯 Impro → 🌈 Modes</b> : entre tes accords, et l'app te sort les sept modes de ta tonalité avec le manche, l'accord correspondant et la note à viser.</p>`,
    demo: { kind: "chords", tonic: "C" },
    quiz: { q: "Un morceau tourne sur Dm7 pendant huit mesures. Quel mode ?", choices: ["Ré phrygien", "Ré dorien", "Ré lydien", "Ré locrien"], answer: 1, explain: "Ré dorien : le mode du 2e degré, et le mineur le plus utilisé en impro. Sa 6e majeure (le Si) est ce qui l'empêche de sonner plaintif." },
  },
  {
    id: "modemanche", chap: 7, title: "Les modes sur le manche", sub: "Une seule boîte, sept centres",
    key: "Tu ne déplaces pas ta main : tu changes la note sur laquelle tu te reposes.",
    body: `<p>Sur la guitare, c'est encore plus simple qu'au piano — et c'est là que les guitaristes se compliquent la vie pour rien.</p>
<p>Si tu connais tes positions de Do majeur sur le manche, <b>tu connais déjà les sept modes</b>. Les cases sont les mêmes. Ce qui change, c'est la note où tu <b>atterris</b>, celle que tu fais sonner longtemps, celle sur laquelle tu finis ta phrase.</p>
<p>Joue la même position. Repose-toi sur le Ré → ça sonne dorien. Repose-toi sur le Sol → ça sonne mixolydien. Même main, même boîte, deux couleurs.</p>
<p>C'est pour ça que « apprendre les modes » ne veut pas dire apprendre des positions : ça veut dire <b>entendre le centre</b> et savoir viser la note caractéristique.</p>
<p class="tip">Exercice concret, aux doigts : mets un drone (l'app en a un dans l'Impro) sur Ré. Joue les notes de Do majeur. Fais sonner le Si (la 6e majeure) longuement. Tu viens de jouer du dorien sans rien apprendre de nouveau.</p>`,
    demo: { kind: "fretboard", tonic: "D", show: "dorian" },
    quiz: { q: "Tu joues les positions de Do majeur mais tu te reposes sur Sol. Ça sonne…", choices: ["Sol lydien", "Sol ionien", "Sol mixolydien", "Sol dorien"], answer: 2, explain: "Sol mixolydien : le 5e degré de Do. Mêmes notes, centre sur Sol, et la 7e (Fa naturel) donne la couleur bluesy." },
  },

  /* ===== CHAPITRE 8 — LES ACCORDS À 4 SONS ===== */
  {
    id: "septiemes", chap: 8, title: "Ajouter la 7e", sub: "Trois notes → quatre, et tout se colore",
    key: "maj7 = doux/rêveur · m7 = velours · 7 (dominante) = tendu, veut se résoudre.",
    body: `<p>Une triade, c'est 1-3-5. Ajoute une quatrième note, la <b>7e</b>, et l'accord passe de « juste » à « caractérisé ». C'est le saut qui sépare la pop de tout le reste.</p>
<p>Trois familles à retenir, et elles suffisent pour 90 % de ce que tu joueras :</p>
<p><b>maj7</b> (1-3-5-7) : Cmaj7 = Do Mi Sol <b>Si</b>. Doux, flottant, un peu rêveur. C'est l'accord de repos.<br>
<b>m7</b> (1-♭3-5-♭7) : Dm7 = Ré Fa La <b>Do</b>. Velouté, sans tristesse appuyée. Le mineur moderne.<br>
<b>7</b>, dite <b>dominante</b> (1-3-♭7) : G7 = Sol Si Ré <b>Fa</b>. Tendu. Il <b>tire</b> vers ailleurs.</p>
<p>Le piège classique : Cmaj7 et C7 n'ont rien à voir. Le premier a un Si, le second un Si♭. Le premier se repose, le second pousse. Un demi-ton, deux fonctions opposées.</p>
<p class="tip">Sur ta guitare aux doigts, les 7es sonnent souvent mieux <b>sans la quinte</b> : garde la fondamentale, la tierce et la 7e. Trois doigts, et l'accord est déjà complet à l'oreille.</p>`,
    demo: { kind: "piano", tonic: "C", show: "major" },
    quiz: { q: "Quelle note transforme un C majeur (Do Mi Sol) en C7 ?", choices: ["Si", "Si♭", "La", "Fa"], answer: 1, explain: "Si♭ : la 7e mineure. Avec Si naturel on obtient Cmaj7 (repos) ; avec Si♭, C7 (tension)." },
  },
  {
    id: "dominante", chap: 8, title: "La dominante, le moteur", sub: "Pourquoi G7 veut rentrer à la maison",
    key: "L'accord de 7 contient un triton — un intervalle instable qui exige une résolution.",
    body: `<p>Pourquoi un G7 « veut » aller vers C ? Ce n'est pas une convention, c'est physique.</p>
<p>Dans G7 (Sol Si Ré Fa), regarde <b>Si</b> et <b>Fa</b> : trois tons d'écart. Cet intervalle s'appelle le <b>triton</b>, et il est instable — l'oreille le vit comme une question suspendue.</p>
<p>Et il se résout tout seul : le <b>Si</b> monte d'un demi-ton vers <b>Do</b>, le <b>Fa</b> descend d'un demi-ton vers <b>Mi</b>. Do et Mi : les deux premières notes de l'accord de C. La tension se dénoue exactement là.</p>
<p>C'est le moteur de la musique occidentale depuis quatre siècles. Le V qui tombe sur le I. Une fois que tu l'entends, tu l'entends partout — dans Bach comme dans le blues.</p>
<p class="tip">C'est aussi ton outil de composition le plus rentable : pour donner de l'élan avant n'importe quel accord, glisse la dominante qui le précède. Avant un Fa, mets un C7. Ça pousse.</p>`,
    demo: { kind: "chords", tonic: "C" },
    quiz: { q: "Dans G7, quelles deux notes forment le triton qui crée la tension ?", choices: ["Sol et Ré", "Si et Fa", "Sol et Fa", "Ré et Fa"], answer: 1, explain: "Si et Fa. Le Si monte vers Do, le Fa descend vers Mi : la résolution vers C majeur est déjà écrite dans l'accord." },
  },
  {
    id: "iiVI", chap: 8, title: "Le ii–V–I", sub: "La phrase la plus utilisée de toute la musique",
    key: "Dm7 → G7 → Cmaj7 : préparation, tension, résolution. Le socle du jazz et de la pop.",
    body: `<p>Si tu ne dois retenir qu'un enchaînement, c'est celui-là. En Do : <b>Dm7 → G7 → Cmaj7</b>.</p>
<p>Sa logique est un récit en trois temps. <b>Dm7</b> (le ii) prépare : il installe, sans tension. <b>G7</b> (le V) tend : le triton pose la question. <b>Cmaj7</b> (le I) résout : on est rentré.</p>
<p>Regarde les basses : Ré → Sol → Do. Des quintes descendantes — le cercle des quintes, celui que tu connais déjà, en train de faire son travail.</p>
<p>Ce qui rend cet enchaînement si précieux pour l'impro : il se déplace. Un morceau de jazz, c'est souvent une suite de ii–V–I dans différentes tonalités. Reconnaître le motif, c'est comprendre la moitié du morceau d'un coup d'œil.</p>
<p class="tip">Dans <b>🎯 Impro</b>, le préréglage « ii–V–I (en C) » te sort les notes cibles accord par accord. Travaille-le lentement : trois accords, une phrase par accord, qui atterrit sur une note cible.</p>`,
    demo: { kind: "threeCircles", tonic: "C" },
    quiz: { q: "En Sol majeur, quel est le ii–V–I ?", choices: ["Am7 – D7 – Gmaj7", "Bm7 – E7 – Amaj7", "Em7 – A7 – Dmaj7", "Dm7 – G7 – Cmaj7"], answer: 0, explain: "Am7 – D7 – Gmaj7. Le ii de Sol est La, le V est Ré, le I est Sol. Les basses descendent de quinte en quinte." },
  },
  {
    id: "guidetones", chap: 8, title: "Improviser sur les 7es", sub: "Deux notes suffisent : la 3 et la 7",
    key: "La tierce et la 7e portent la couleur de l'accord. Vise-les, le reste est décoration.",
    body: `<p>Sur un accord à quatre sons, toutes les notes ne pèsent pas pareil. La <b>fondamentale</b>, le bassiste la joue déjà. La <b>quinte</b> ne dit rien (elle est dans presque tous les accords). Restent la <b>tierce</b> et la <b>7e</b> : ce sont elles qui portent l'identité.</p>
<p>On les appelle les <b>guide tones</b>. La tierce dit majeur ou mineur. La 7e dit repos ou tension. Avec ces deux notes seules, on reconnaît l'accord.</p>
<p>La méthode qui fait immédiatement « pro » : sur un ii–V–I, joue <b>uniquement</b> les tierces et les 7es, en les reliant par le chemin le plus court. Dm7 (Fa, Do) → G7 (Si, Fa) → Cmaj7 (Mi, Si). Regarde : le Fa reste, puis descend sur Mi ; le Do descend sur Si. Presque pas de mouvement.</p>
<p>C'est le secret des lignes qui « collent » aux accords au lieu de flotter au-dessus : tu ne cours pas après la gamme, tu suis deux notes qui bougent à peine.</p>
<p class="tip">Exercice, lentement, aux doigts : joue le ii–V–I en boucle et ne joue QUE les guide tones. Quand ça coule, autorise-toi une note de passage entre deux. C'est déjà de l'impro.</p>`,
    demo: { kind: "fretboard", tonic: "C", show: "triadTargets" },
    quiz: { q: "Sur Dm7, quels sont les deux guide tones ?", choices: ["Ré et La", "Fa et Do", "Ré et Fa", "La et Do"], answer: 1, explain: "Fa (la tierce mineure) et Do (la 7e mineure). La fondamentale est au bassiste, la quinte ne caractérise rien." },
  },

  /* ===== CHAPITRE 9 — LE BLUES ===== */
  {
    id: "blues12", chap: 9, title: "Les 12 mesures", sub: "La grille que tout le monde connaît",
    key: "I–I–I–I / IV–IV–I–I / V–IV–I–V : douze mesures, trois accords, tous en dominante.",
    body: `<p>Le blues, c'est une grille de <b>douze mesures</b> qui tourne en boucle. En La : A7 partout, D7 au quatrième temps du récit, E7 pour relancer.</p>
<p>Mesures 1-4 : <b>A7</b>. Mesures 5-6 : <b>D7</b>. Mesures 7-8 : <b>A7</b>. Mesure 9 : <b>E7</b>. Mesure 10 : <b>D7</b>. Mesure 11 : <b>A7</b>. Mesure 12 : <b>E7</b> (le « turnaround », qui te ramène au début).</p>
<p>Le détail qui compte, et qui viole la théorie que tu viens d'apprendre : <b>les trois accords sont des dominantes</b>. En théorie, une tonalité n'a qu'une seule dominante (le V). Ici, I, IV et V sont tous en 7. C'est une anomalie assumée — et c'est précisément ce qui fait le son du blues.</p>
<p class="tip">Cette grille est ton terrain d'essai pour tout le reste : mixolydien sur chaque accord, guide tones, blue notes. Douze mesures, trois accords, et de quoi travailler pendant des années.</p>`,
    demo: { kind: "chords", tonic: "A" },
    quiz: { q: "Qu'est-ce qui est anormal, théoriquement, dans un blues en La ?", choices: ["Il n'y a que 3 accords", "Le I, le IV et le V sont TOUS des accords de 7", "Il fait 12 mesures", "Il commence sur le IV"], answer: 1, explain: "Les trois sont des dominantes. Une tonalité n'en admet normalement qu'une (le V). Cette entorse est la signature sonore du blues." },
  },
  {
    id: "bluesmix", chap: 9, title: "Majeur ET mineur en même temps", sub: "La friction qui fait le blues",
    key: "On joue la penta mineure sur des accords majeurs. Le frottement est le style.",
    body: `<p>Voilà l'autre anomalie, et la plus déroutante quand on vient de la théorie : sur un blues en La (accords <b>majeurs</b>), on improvise avec la <b>penta mineure</b> de La.</p>
<p>Donc tu joues un Do naturel (tierce mineure) pendant que l'accord joue un Do♯ (tierce majeure). En théorie pure, c'est une faute. À l'oreille, c'est <b>le son du blues</b> — cette friction est exactement ce qu'on vient y chercher.</p>
<p>Les grands joueurs font mieux : ils <b>mélangent</b> les deux pentas, majeure et mineure, et se déplacent de l'une à l'autre. La mineure pour mordre, la majeure pour chanter. C'est là qu'est le vocabulaire.</p>
<p>Et la <b>blue note</b> (la ♭5, le Mi♭ en La) se joue toujours <b>en passage</b> — on la traverse, on ne s'y installe pas. Elle grince, c'est son rôle.</p>
<p class="tip">Aux doigts, essaie ceci : joue la penta mineure de La, puis, sur le D7, glisse vers la penta majeure. Le simple fait de changer de couleur au changement d'accord suffit à faire raconter quelque chose à ton solo.</p>`,
    demo: { kind: "fretboard", tonic: "A", show: "blues" },
    quiz: { q: "Pourquoi joue-t-on la penta MINEURE sur un blues en accords majeurs ?", choices: ["Par erreur historique", "Parce que le frottement tierce mineure / tierce majeure EST le son du blues", "Parce que c'est plus facile", "Parce que les accords sont en fait mineurs"], answer: 1, explain: "Le frottement est le style. La tierce mineure jouée contre la tierce majeure de l'accord crée la tension caractéristique du blues." },
  },
  {
    id: "bluesmanche", chap: 9, title: "Le blues sur le manche", sub: "Une position, trois accords",
    key: "La penta mineure de la tonalité passe sur les 12 mesures. Puis on affine par accord.",
    body: `<p>Bonne nouvelle pour la guitare : sur un blues en La, <b>la penta mineure de La passe sur les douze mesures</b>. Une seule position, aucun déplacement obligatoire. C'est pour ça que le blues est le premier terrain d'impro de tous les guitaristes.</p>
<p>C'est le niveau 1, et il fonctionne. Le niveau 2 consiste à <b>suivre les accords</b> : sur le D7, viser les notes de D7 ; sur le E7, viser celles de E7. Le solo cesse de flotter et commence à coller.</p>
<p>Le niveau 3, c'est le mixolydien de chaque accord — La mixolydien sur A7, Ré mixolydien sur D7. Tu retrouves ici tout le chapitre 7 : même boîte, centre qui se déplace.</p>
<p class="tip">Ne saute pas les étages. Le niveau 1 pendant des semaines, en travaillant le <b>rythme</b> et les silences plutôt que les notes. Un blues joué avec trois notes bien placées bat un blues joué avec toute la gamme.</p>`,
    demo: { kind: "fretboard", tonic: "A", show: "minpenta" },
    quiz: { q: "Sur un blues en La, que peux-tu jouer sur les 12 mesures sans te tromper ?", choices: ["La penta majeure de Ré", "La penta mineure de La", "La gamme de Mi majeur", "Rien, il faut changer à chaque accord"], answer: 1, explain: "La penta mineure de La passe sur toute la grille. C'est le filet de sécurité — ensuite on affine accord par accord." },
  },

  /* ===== CHAPITRE 10 — LE PHRASÉ ===== */
  {
    id: "phrase", chap: 10, title: "Une phrase, pas une gamme", sub: "Le silence fait partie du solo",
    key: "Joue court, respire, répète un motif. Personne ne retient une gamme montée-descendue.",
    body: `<p>Tu connais maintenant assez de théorie pour ne plus jamais jouer de fausse note. Et pourtant ça peut encore sonner mal. Pourquoi ? Parce que <b>jouer juste et jouer bien sont deux choses différentes</b>.</p>
<p>Le défaut numéro un de l'improvisateur qui débute : il joue <b>sans arrêt</b>. Des notes justes, en continu, sans respiration. À l'oreille, ça ne raconte rien — c'est un exercice, pas une phrase.</p>
<p>Une phrase musicale fonctionne comme une phrase parlée : elle est <b>courte</b>, elle a un contour, et elle finit. Puis il y a un <b>silence</b>. Le silence n'est pas un trou à combler : c'est ce qui rend la phrase suivante audible.</p>
<p>Et le procédé le plus puissant, celui que tout le monde sous-estime : la <b>répétition</b>. Joue un motif de trois notes. Rejoue-le. Rejoue-le une troisième fois en changeant la dernière note. Tu viens de créer une attente et de la satisfaire — c'est de la musique, pas de la gymnastique.</p>
<p class="tip">Contrainte utile : impose-toi de jouer <b>quatre notes maximum</b>, puis de te taire pendant la même durée. C'est frustrant les cinq premières minutes, et c'est ce qui transforme un solo.</p>`,
    demo: { kind: "html", id: "phraseDemo" },
    quiz: { q: "Quel est le défaut le plus courant d'un solo de débutant ?", choices: ["Trop de fausses notes", "Jouer sans arrêt, sans silence ni motif", "Jouer trop lentement", "Rester dans la penta"], answer: 1, explain: "Le flux continu. Sans silence ni répétition de motif, même des notes parfaitement justes ne racontent rien." },
  },
  {
    id: "tension", chap: 10, title: "Tension et résolution", sub: "Où atterrir, et quand",
    key: "Note cible sur un temps fort = résolution. Note de passage sur un temps faible = tension.",
    body: `<p>Tu sais déjà <b>quelles</b> notes viser. Reste le plus important : <b>quand</b>.</p>
<p>La même note ne produit pas le même effet selon l'endroit où elle tombe. Une note cible posée sur un <b>temps fort</b> (le 1, le 3) sonne comme une arrivée. La même note glissée sur un contretemps devient un simple passage.</p>
<p>D'où la règle qui structure tout le phrasé : <b>les notes de tension se placent sur les temps faibles, les notes de repos sur les temps forts</b>. C'est ce qui donne l'impression que le soliste « sait où il va ».</p>
<p>Et l'inverse est un outil : poser volontairement une note de tension sur un temps fort, puis la résoudre juste après. Tu crées une attente d'une fraction de seconde et tu la satisfais. C'est exactement le mécanisme du triton dans G7, transposé à ta ligne mélodique.</p>
<p class="tip">Test simple : enregistre-toi. Si tes phrases finissent au hasard, elles finiront sur des notes de passage et ça sonnera « inachevé ». Décide à l'avance sur quelle note tu atterris.</p>`,
    demo: { kind: "fretboard", tonic: "C", show: "triadTargets" },
    quiz: { q: "Où placer de préférence une note cible pour qu'elle sonne comme une arrivée ?", choices: ["Sur un temps faible", "Sur un temps fort", "N'importe où", "En dehors du tempo"], answer: 1, explain: "Sur un temps fort. C'est le placement rythmique, pas seulement le choix de la note, qui crée la sensation de résolution." },
  },
  {
    id: "assaisonner", chap: 10, title: "Assaisonner", sub: "Chromatismes, bends, dynamique",
    key: "Les notes hors gamme fonctionnent si elles sont brèves et résolues. Le son compte autant que la note.",
    body: `<p>Dernier étage : les notes qui ne sont dans aucune gamme, et qui pourtant sonnent bien.</p>
<p>Le <b>chromatisme d'approche</b> : pour atteindre une note cible, arrive dessus par le demi-ton juste en dessous. Tu veux le Mi ? Joue Ré♯ puis Mi. Le Ré♯ n'appartient à rien, il passe en une croche, et il rend l'arrivée inévitable à l'oreille. Règle unique : <b>bref, et résolu</b>.</p>
<p>Le <b>bend</b> : sur la guitare, tirer la corde d'un demi-ton ou d'un ton vers une note cible. C'est le chromatisme, mais continu — et c'est ce qui donne une voix à ton jeu. Sur la tierce mineure du blues tirée vers la majeure, c'est tout le vocabulaire en un geste.</p>
<p>La <b>dynamique</b>, enfin : jouer fort ou doux, attaquer près du chevalet ou près du manche. Aux doigts, tu as un contrôle que le médiator n'a pas — la pulpe pour le rond, l'ongle pour le mordant. Deux notes identiques jouées différemment racontent deux choses.</p>
<p class="tip">Ordre de priorité si tu veux progresser vite : <b>rythme</b> d'abord, <b>silence</b> ensuite, <b>son</b> ensuite, <b>notes</b> en dernier. C'est exactement l'inverse de l'ordre dans lequel on apprend.</p>`,
    demo: { kind: "html", id: "assaisonDemo" },
    quiz: { q: "À quelle condition une note hors gamme sonne-t-elle bien ?", choices: ["Si elle est tenue longtemps", "Si elle est brève et résolue vers une note cible", "Si elle est jouée fort", "Jamais, il faut rester dans la gamme"], answer: 1, explain: "Brève et résolue. Un chromatisme d'approche dure une fraction de temps et débouche sur une note de l'accord — c'est ce qui le rend juste." },
  },
];

/* --- Drills génératifs (les générateurs sont dans app.js) --- */
const DRILLS = [
  { id: "spellMajor",  emoji: "🎼", name: "Épeler une gamme majeure", desc: "Nomme les 7 notes de X majeur" },
  { id: "keysig",      emoji: "🔑", name: "Armure d'une tonalité",     desc: "Combien de ♯ ou ♭ a X majeur ?" },
  { id: "relmin",      emoji: "🔗", name: "Relative mineure",          desc: "Trouve la mineure jumelle de X" },
  { id: "majpentaD",   emoji: "⭐", name: "Penta majeure",             desc: "Les 5 notes de la penta de X" },
  { id: "minpentaD",   emoji: "🌙", name: "Penta mineure",             desc: "Les 5 notes de la penta mineure de Xm" },
  { id: "triadD",      emoji: "🎹", name: "Les notes d'un accord",     desc: "Épelle la triade de X" },
  { id: "diatonic",    emoji: "🏠", name: "Accords d'une tonalité",    desc: "Nomme les degrés I…vii de X" },
  { id: "fretNote",    emoji: "🎸", name: "Note sur le manche",        desc: "Quelle note à telle corde/case ?" },
  { id: "targets",     emoji: "🎯", name: "Notes cibles",              desc: "Les 3 notes à viser sur l'accord X" },
  { id: "findkey",     emoji: "🧭", name: "Trouver la tonalité",       desc: "Quelle tonalité pour ces accords ?" },
];

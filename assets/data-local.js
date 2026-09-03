/* Contenu de démarrage.
   Ce fichier sera remplacé par les appels Supabase à l'étape suivante :
   la forme des données ne changera pas, seule leur provenance. */

window.Data = {

  /* Clés de DÉMONSTRATION, volontairement devinables : ce fichier est servi
     publiquement, rien de sensible ne doit y figurer. Les vraies clés privées
     sont tirées au sort dans Supabase et ne quittent jamais la base — Jieun
     les copie depuis son espace. */
  eleves: {
    marie:    { prenom: "Marie",    prenomKo: "마리",     cle: "marie-demo" },
    brooklyn: { prenom: "Brooklyn", prenomKo: "브루클린", cle: "brooklyn-demo" }
  },

  /* Fiches permanentes, visibles par tout le monde */
  ressources: [
    { titre: "Hangul — référence complète",
      desc:  "Voyelles, consonnes, consonnes tendues, construction du bloc",
      url:   "ressources/hangul.html", type: "fiche" }
  ],

  lecons: []
};

/* ---- Le QCM de démarrage : l'alphabet ---------------------------------- */
/* Douze questions, à remplacer par celles de Jieun dès la prochaine leçon.  */

var qcmHangul = [
  { t: 'En <b>début</b> de bloc, comment se prononce <span class="hg">ㅇ</span> ?',
    o: ['[ng], comme dans « parking »',
        '[o], comme la lettre o',
        'Rien du tout — il ne fait que tenir la place de la voyelle',
        '[h] aspiré'],
    r: 2,
    e: 'Un bloc coréen commence <b>toujours</b> par une consonne. Quand la syllabe commence par un son de voyelle, on écrit ㅇ pour occuper la case : 아 se lit [a], pas [nga]. En fin de bloc, ce même ㅇ se prononce [ng] — voir la question 6.' },

  { t: 'Où se place la voyelle <span class="hg">ㅗ</span> par rapport à la consonne ?',
    o: ['À droite de la consonne',
        'En dessous de la consonne',
        'À gauche de la consonne',
        'Au-dessus de la consonne'],
    r: 1,
    e: 'Les voyelles <b>horizontales</b> (ㅗ ㅛ ㅜ ㅠ ㅡ) se glissent sous la consonne : 고. Les voyelles <b>verticales</b> (ㅏ ㅑ ㅓ ㅕ ㅣ) se posent à sa droite : 가. La forme de la lettre indique sa place.' },

  { t: 'Quel bloc se lit <b>[na]</b> ?',
    o: ['<span class="hg">나</span>', '<span class="hg">다</span>',
        '<span class="hg">마</span>', '<span class="hg">라</span>'],
    r: 0,
    e: 'ㄴ [n] + ㅏ [a] = 나. Les trois autres se lisent 다 [da], 마 [ma], 라 [ra]. Repère la consonne d’abord, la voyelle ensuite.' },

  { t: 'Comment se prononce <span class="hg">ㅡ</span> ?',
    o: ['[ou], lèvres bien arrondies',
        '[u] français, comme dans « lune »',
        'Comme un [i] très bref',
        '[eu] de gorge, lèvres étirées et jamais arrondies'],
    r: 3,
    e: 'Ce son n’existe pas en français. Étire les lèvres comme pour sourire et émets un son de gorge. Le piège est de le confondre avec <b>ㅜ</b> [ou], où les lèvres sont au contraire arrondies en avant.' },

  { t: 'Quelle est la différence entre <span class="hg">ㄱ</span> et <span class="hg">ㄲ</span> ?',
    o: ['ㄲ est <b>tendue</b> : gorge serrée, aucun souffle',
        'ㄲ est simplement prononcée plus longtemps',
        'ㄲ est aspirée, avec beaucoup de souffle',
        'Aucune — ce sont deux façons d’écrire la même lettre'],
    r: 0,
    e: 'Le coréen range ses consonnes par séries de trois : <b>simple</b> ㄱ, <b>aspirée</b> ㅋ (souffle marqué), <b>tendue</b> ㄲ (gorge serrée, zéro souffle). Tiens une feuille de papier devant ta bouche : elle s’envole sur ㅋ, bouge à peine sur ㄱ, ne bouge pas du tout sur ㄲ.' },

  { t: 'Dans <span class="hg">강</span>, quelle lettre occupe le batchim et comment se prononce-t-elle ?',
    o: ['ㅏ, qui se prononce [a]',
        'ㄱ, qui se prononce [k]',
        'ㅇ, qui se prononce [ng]',
        'ㅇ, qui reste muet'],
    r: 2,
    e: 'Le <b>batchim</b> est la consonne posée sous le bloc. Ici c’est ㅇ, et en position finale il se prononce [ng] : 강 = [kang]. La même lettre est muette en début de bloc — c’est sa position, et elle seule, qui décide de son rôle.' },

  { t: 'Quelle voyelle se prononce <b>[yeo]</b> ?',
    o: ['<span class="hg">ㅑ</span>', '<span class="hg">ㅕ</span>',
        '<span class="hg">ㅛ</span>', '<span class="hg">ㅠ</span>'],
    r: 1,
    e: 'Le <b>deuxième trait</b> ajoute un [y] devant la voyelle : ㅓ [eo] devient ㅕ [yeo]. La logique vaut partout — ㅏ→ㅑ [ya], ㅗ→ㅛ [yo], ㅜ→ㅠ [you]. Une seule règle pour huit lettres.' },

  { t: 'Quel est le rapport entre <span class="hg">ㅐ</span> et <span class="hg">ㅔ</span> aujourd’hui ?',
    o: ['ㅐ est une consonne, ㅔ une voyelle',
        'Elles s’opposent nettement à l’oreille',
        'ㅐ ne s’emploie plus dans le coréen moderne',
        'Elles se sont fondues : la plupart des Coréens les prononcent pareil'],
    r: 3,
    e: 'Historiquement ㅐ était plus ouvert que ㅔ. Cette différence a presque disparu chez les locuteurs d’aujourd’hui. Conséquence pratique : l’orthographe de ces mots <b>s’apprend par cœur</b>, ton oreille ne t’aidera pas.' },

  { t: 'Comment se prononce <span class="hg">ㄹ</span> ?',
    o: ['Toujours comme un [l] français',
        '[r] bref en début de syllabe, [l] en fin de syllabe',
        'Toujours comme un [r] roulé espagnol',
        'Comme le [r] français, celui de « rue »'],
    r: 1,
    e: 'Sa <b>position</b> décide du son : 라 donne [ra], un r bref frappé du bout de la langue ; 할 donne [hal]. C’est pourquoi 할아버지 se dit [ha-ra-beo-ji] — le ㅇ qui suit étant muet, le ㄹ glisse dessus et redevient une attaque. Jamais le [r] raclé du français.' },

  { t: 'Combien de <b>lettres</b> compte le bloc <span class="hg">한</span> ?',
    o: ['Une seule', 'Deux', 'Trois', 'Quatre'],
    r: 2,
    e: 'ㅎ + ㅏ + ㄴ = 한. Un bloc n’est pas une lettre mais une <b>syllabe</b> : le coréen empile ses lettres dans un carré au lieu de les aligner de gauche à droite. C’est la seule vraie différence avec notre alphabet.' },

  { t: 'Comment écrit-on le son <b>[i]</b> tout seul ?',
    o: ['<span class="hg">이</span>', '<span class="hg">ㅣ</span>',
        '<span class="hg">아</span>', '<span class="hg">니</span>'],
    r: 0,
    e: 'Une voyelle ne s’écrit <b>jamais</b> seule : il lui faut une consonne devant. On place donc le ㅇ muet, et ㅇ + ㅣ donne 이. Écrire ㅣ isolé, c’est comme écrire un accent sans la lettre qui va dessous.' },

  { t: 'Combien existe-t-il de consonnes <b>tendues</b> ?',
    o: ['Trois', 'Quatre', 'Sept', 'Cinq'],
    r: 3,
    e: 'Exactement cinq — ㄲ ㄸ ㅃ ㅆ ㅉ — obtenues en doublant ㄱ ㄷ ㅂ ㅅ ㅈ. Les neuf autres consonnes ne se doublent pas.' }
];

var recapHangul =
'Aujourd’hui, l’alphabet en entier : les dix voyelles simples, les quatorze consonnes de base, ' +
'les cinq consonnes tendues, et surtout la règle qui commande tout le reste — un bloc coréen est ' +
'une syllabe, jamais une lettre isolée.\n\n' +
'Trois choses à retenir avant la prochaine fois :\n\n' +
'1. Tout bloc commence par une consonne. Si le son commence par une voyelle, on met le ㅇ muet pour tenir la place.\n' +
'2. La forme de la voyelle indique où elle se pose : verticale à droite (가), horizontale en dessous (고).\n' +
'3. Les consonnes vont par séries de trois : simple, aspirée, tendue. Le souffle est ce qui les sépare.\n\n' +
'La fiche de référence reste disponible en permanence — sers-t’en pendant le QCM, ce n’est pas de la triche.';

/* Une leçon par élève : chacun a son parcours et ses propres réponses. */
['marie', 'brooklyn'].forEach(function (e) {
  window.Data.lecons.push({
    id: 'l1-' + e,
    eleve: e,
    numero: 1,
    date: '2026-08-30',
    titre: 'L’alphabet hangul',
    titreKo: '한글',
    recap: recapHangul,
    docs: [{ titre: 'Hangul — référence complète', url: 'ressources/hangul.html',
             type: 'fiche interactive' }],
    questions: qcmHangul
  });
});

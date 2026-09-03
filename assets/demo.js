/* Contenu de démonstration pour la phase d'essai.
   Remplit la base locale comme si le site tournait depuis un mois : plusieurs
   leçons par élève, un brouillon, et des passages déjà enregistrés.
   Sert uniquement à juger l'usage — rien de tout cela ne part en ligne. */

window.Demo = (function () {

  function q(t, o, r, e) { return { t: t, o: o, r: r, e: e }; }

  var syllabe = [
    q('Où s’écrit le <span class="hg">받침</span> dans le bloc ?',
      ['À droite de la voyelle', 'Sous le groupe consonne + voyelle',
       'Au-dessus de la consonne', 'Avant la consonne'], 1,
      'Le batchim se pose <b>sous</b> le groupe déjà formé. Le bloc se lit donc de haut en bas une fois la voyelle passée.'),
    q('Comment se lit <span class="hg">한국</span> ?',
      ['[ha-nu-ku]', '[han-gouk]', '[ han-kouk ]', '[ha-nou-gou]'], 1,
      'ㄱ entre deux voyelles s’adoucit et se dit [g] : 한 + 국 donne [han-gouk].'),
    q('Combien de sons finaux distincts existe-t-il à l’oral ?',
      ['Quatre', 'Sept', 'Quatorze', 'Vingt-sept'], 1,
      'Vingt-sept batchim s’écrivent, mais ils se ramènent à <b>sept sons</b> seulement à l’oreille.'),
    q('Comment se prononce <span class="hg">밥</span> (le riz) ?',
      ['[ba-beu]', '[pap], le p final bloqué', '[pa]', '[bap-eu]'], 1,
      'Le batchim final est <b>bloqué</b> : la bouche se ferme et le son s’arrête, sans relâchement.'),
    q('La syllabe suivante commence par <span class="hg">ㅇ</span>. Que devient la finale ?',
      ['Elle disparaît', 'Elle se double',
       'Elle glisse sur la syllabe suivante', 'Elle devient une voyelle'], 2,
      'Le ㅇ n’a pas de consonne propre : la finale vient l’occuper. C’est la règle qui explique 한국어 → [han-gou-geo].')
  ];

  var presenter = [
    q('Dans <span class="hg">저는 마리예요</span>, que signifie <span class="hg">저는</span> ?',
      ['Je suis contente', 'Moi, je — le thème, en registre poli',
       'Mon nom', 'Bonjour'], 1,
      '저 est le « je » poli, 는 la particule de thème. Ensemble : « quant à moi ».'),
    q('Après un prénom qui finit par une <b>voyelle</b>, on écrit :',
      ['이에요', '예요', '이예요', '에요'], 1,
      'Voyelle finale → <b>예요</b> ; consonne finale → <b>이에요</b>. 마리 finit par une voyelle.'),
    q('Que demande <span class="hg">이름이 뭐예요?</span>',
      ['Quel âge as-tu ?', 'D’où viens-tu ?',
       'Comment t’appelles-tu ?', 'Que fais-tu ?'], 2,
      '이름 = le nom, 뭐 = quoi. Mot à mot : « le nom, c’est quoi ? »'),
    q('Que dit-on en serrant la main à quelqu’un pour la première fois ?',
      ['감사합니다', '반갑습니다', '죄송합니다', '안녕히 가세요'], 1,
      '반갑습니다 : « enchanté ». 감사합니다 est un merci, 죄송합니다 une excuse.')
  ];

  var tendues = [
    q('Combien de consonnes tendues existe-t-il ?',
      ['Trois', 'Cinq', 'Sept', 'Dix'], 1,
      'Cinq : <span class="hg">ㄲ ㄸ ㅃ ㅆ ㅉ</span>, obtenues en doublant ㄱ ㄷ ㅂ ㅅ ㅈ.'),
    q('Comment se prononce <span class="hg">ㅃ</span> ?',
      ['Avec beaucoup de souffle', 'Gorge serrée, aucun souffle',
       'Comme un b français', 'Plus longtemps qu’un ㅂ'], 1,
      'Tendue veut dire <b>gorge serrée et zéro souffle</b>. Une feuille tenue devant la bouche ne doit pas bouger.'),
    q('Laquelle de ces lettres n’est <b>pas</b> tendue ?',
      ['<span class="hg">ㄲ</span>', '<span class="hg">ㅋ</span>',
       '<span class="hg">ㅆ</span>', '<span class="hg">ㅉ</span>'], 1,
      'ㅋ est <b>aspirée</b>, pas tendue : elle s’accompagne au contraire d’un souffle marqué.'),
    q('Qu’est-ce qui sépare <span class="hg">오빠</span> de <span class="hg">오바</span> ?',
      ['La longueur de la voyelle', 'Le ton de la voix',
       'La tension de la consonne', 'Rien, c’est le même mot'], 2,
      'Seule la <b>tension</b> les distingue — et elle change complètement le mot. C’est le contraste le plus difficile pour une oreille française.')
  ];

  var nombres = [
    q('Comment dit-on <b>trois</b> en sino-coréen ?',
      ['<span class="hg">일</span>', '<span class="hg">이</span>',
       '<span class="hg">삼</span>', '<span class="hg">사</span>'], 2,
      '일 이 삼 사 오 = 1 2 3 4 5. 삼 vaut trois.'),
    q('À quoi servent les nombres sino-coréens ?',
      ['À compter les objets', 'Aux dates, à l’argent, aux numéros',
       'À dire son âge', 'À compter les personnes'], 1,
      'Deux systèmes cohabitent : le sino-coréen pour dates, argent et numéros ; le coréen natif pour compter objets, personnes et l’âge.')
  ];

  function lecon(id, eleve, num, date, titre, titreKo, recap, questions, publiee, docs) {
    return { id: id, eleve: eleve, numero: num, date: date, titre: titre,
             titreKo: titreKo, recap: recap, docs: docs || [],
             questions: questions, publiee: publiee };
  }

  var fiche = { titre: 'Hangul — référence complète',
                url: 'ressources/hangul.html', type: 'fiche interactive' };

  function construire() {
    var alphabet = (window.qcmHangul || []).slice();
    var recapAlpha = window.recapHangul ||
      'L’alphabet en entier : voyelles, consonnes, consonnes tendues.';

    var lecons = [
      /* --- Marie ------------------------------------------------------- */
      lecon('d-m1', 'marie', 1, '2026-08-03', 'L’alphabet hangul', '한글',
        recapAlpha, alphabet, true, [fiche]),

      lecon('d-m2', 'marie', 2, '2026-08-10', 'Lire une syllabe', '받침',
        'On sait lire les lettres, maintenant on lit les blocs.\n\n' +
        'Le 받침 est la consonne posée sous le groupe consonne + voyelle. ' +
        'Vingt-sept s’écrivent, sept seulement s’entendent.\n\n' +
        'Deux réflexes à installer :\n' +
        '1. Une finale se bloque, elle ne se relâche jamais : 밥 se dit [pap], pas [pa-beu].\n' +
        '2. Si la syllabe suivante commence par ㅇ, la finale glisse dessus. C’est toute l’explication de 한국어.\n\n' +
        'Relis la fiche à voix haute, lentement. La vitesse viendra seule.',
        syllabe, true, [fiche]),

      lecon('d-m3', 'marie', 3, '2026-08-17', 'Se présenter', '자기소개',
        'Première vraie phrase : 저는 마리예요.\n\n' +
        'La structure ne bouge jamais : thème + 는/은, puis le mot, puis 예요/이에요.\n\n' +
        'La seule chose à surveiller :\n' +
        '1. Le mot finit par une voyelle → 예요.\n' +
        '2. Le mot finit par une consonne → 이에요.\n\n' +
        'Trois formules à savoir dire sans réfléchir : 안녕하세요, 반갑습니다, 이름이 뭐예요?',
        presenter, true, []),

      lecon('d-m4', 'marie', 4, '2026-08-31', 'Les nombres sino-coréens', '한자어 숫자',
        'Les nombres 일 이 삼 사 오.\n\n' +
        'Attention, il existe deux systèmes de nombres en coréen. Celui-ci sert aux ' +
        'dates, à l’argent et aux numéros de téléphone. L’autre, purement coréen, ' +
        'sert à compter les objets et les personnes — on le verra la prochaine fois.',
        nombres, false, []),

      /* --- Brooklyn ---------------------------------------------------- */
      lecon('d-b1', 'brooklyn', 1, '2026-08-05', 'L’alphabet hangul', '한글',
        recapAlpha, alphabet, true, [fiche]),

      lecon('d-b2', 'brooklyn', 2, '2026-08-19', 'Les consonnes tendues', '된소리',
        'Le point le plus difficile pour une oreille française.\n\n' +
        'Trois séries pour la même famille de sons : simple (ㄱ), aspirée (ㅋ) avec ' +
        'beaucoup de souffle, tendue (ㄲ) avec la gorge serrée et aucun souffle.\n\n' +
        'L’exercice de la feuille de papier :\n' +
        '1. Tiens une feuille devant ta bouche.\n' +
        '2. Sur ㅋ elle s’envole, sur ㄱ elle bouge à peine, sur ㄲ elle ne bouge pas du tout.\n\n' +
        'Répète 오빠 / 오바 jusqu’à entendre la différence. C’est long, c’est normal.',
        tendues, true, [fiche]),

      lecon('d-b3', 'brooklyn', 3, '2026-08-31', 'Se présenter', '자기소개',
        'Brouillon — à compléter après le cours de mercredi.',
        [], false, [])
    ];

    /* Quelques passages déjà enregistrés, pour juger le tableau de bord */
    var j = function (n, h) {
      var d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 12, 0, 0);
      return d.toISOString();
    };
    var reponses = [
      { lecon: 'd-m3', eleve: 'marie',    score: 4,  total: 4,  le: j(1, 19) },
      { lecon: 'd-m2', eleve: 'marie',    score: 4,  total: 5,  le: j(3, 21) },
      { lecon: 'd-m2', eleve: 'marie',    score: 3,  total: 5,  le: j(4, 18) },
      { lecon: 'd-m1', eleve: 'marie',    score: 10, total: 12, le: j(9, 20) },
      { lecon: 'd-b2', eleve: 'brooklyn', score: 2,  total: 4,  le: j(2, 22) },
      { lecon: 'd-b1', eleve: 'brooklyn', score: 7,  total: 12, le: j(11, 20) }
    ];

    var eleves = Object.keys(Data.eleves).map(function (id) {
      var e = Data.eleves[id];
      return { id: id, prenom: e.prenom, prenomKo: e.prenomKo || '', cle: e.cle };
    });

    return { eleves: eleves, ressources: [fiche], lecons: lecons, reponses: reponses };
  }

  return {
    charger: function () {
      localStorage.setItem('cavj:base', JSON.stringify(construire()));
    },
    effacer: function () {
      Object.keys(localStorage)
        .filter(function (k) { return k.indexOf('cavj:') === 0; })
        .forEach(function (k) { localStorage.removeItem(k); });
    }
  };

})();

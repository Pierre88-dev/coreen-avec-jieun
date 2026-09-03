/* Espace élève : liste des leçons, récapitulatif, documents, QCM, recherche.
   Les réponses sont pour l'instant gardées dans le navigateur ; à l'étape
   suivante elles partiront aussi vers Supabase pour le tableau de bord.

   Cloisonnement : tout ce qui est affiché ici — liste, recherche, résultats —
   ne porte QUE sur les leçons de l'élève dont l'adresse est ouverte. */

(function () {

  /* L'adresse porte une clé imprévisible, pas un prénom : personne ne tombe
     sur l'espace d'un autre en changeant un mot dans la barre d'adresse. */
  var cleUrl = (new URLSearchParams(location.search).get('e') || '').toLowerCase();

  var eleve = null, eleveId = '', lecons = [], ressources = [];

  var courante   = null;
  var etat       = null;
  var termeActif = '';

  var elListe  = document.getElementById('listeLecons');
  var elRess   = document.getElementById('listeRess');
  var elMain   = document.getElementById('contenu');
  var elQui    = document.getElementById('qui');
  var elMarque = document.getElementById('marque');
  var elQ      = document.getElementById('q');
  var elRes    = document.getElementById('resultats');
  var elNb     = document.getElementById('nbRes');

  /* ---------- démarrage ------------------------------------------------ */

  elMain.innerHTML = '<div class="vide"><p>Chargement…</p></div>';

  Base.espaceEleve(cleUrl).then(installer).catch(function (e) {
    console.error(e);
    elMain.innerHTML = '<div class="vide"><h1>Le site ne répond pas</h1>' +
      '<p>Réessaie dans un instant. Si ça persiste, préviens Jieun.</p></div>';
  });

  function installer(espace) {
    if (!espace || !espace.eleve) return adresseInconnue();

    eleve      = espace.eleve;
    eleveId    = eleve.id;
    lecons     = espace.lecons || [];
    ressources = espace.ressources || [];

    /* Le logo ramène l'élève chez lui, jamais sur une page listant les autres. */
    elMarque.href = 'eleve.html?e=' + encodeURIComponent(eleve.cle);
    document.getElementById('quiIni').textContent = eleve.prenom.charAt(0);
    document.getElementById('quiNom').textContent = eleve.prenom;
    elQui.hidden = false;
    document.title = eleve.prenom + ' — coréen avec Jieun';

    elRess.innerHTML = ressources.map(function (r) {
      return lienDoc(r.url, r.titre, etiquette(r));
    }).join('') || '<p class="rienEncore">Aucune fiche pour l’instant.</p>';

    if (!lecons.length) {
      elMain.innerHTML =
        '<div class="vide"><h1>Rien encore</h1>' +
        '<p>Tes leçons apparaîtront ici dès que Jieun aura publié la première : ' +
        'le récapitulatif du cours, les fiches à garder, et un QCM pour vérifier ' +
        'ce qui est acquis.</p></div>';
    } else {
      dessinerListe();
      ouvrir(lecons[0]);
    }

    brancherRecherche();
  }

  function adresseInconnue() {
    document.querySelector('.shell').innerHTML =
      '<div class="vide"><h1>Cette adresse ne mène nulle part</h1>' +
      '<p>Chaque élève a son lien privé, que Jieun lui a envoyé en entier. ' +
      'Il ne se devine pas et ne se raccourcit pas.</p>' +
      '<p>Reprends le lien d’origine, ou redemande-le à Jieun.</p></div>';
    var c = document.querySelector('.cherche');
    if (c) c.remove();
    elMarque.removeAttribute('href');
  }

  /* ---------- recherche ------------------------------------------------- */

  function brancherRecherche() {
    var t;
    elQ.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { chercher(elQ.value); }, 120);
    });
    elQ.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { elQ.value = ''; fermerResultats(); elQ.blur(); }
      if (e.key === 'Enter') {
        var p = elRes.querySelector('.hit');
        if (p) { e.preventDefault(); p.click(); }
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.cherche')) fermerResultats();
    });
  }

  function chercher(saisie) {
    var n = normal(saisie).t.trim();
    if (n.length < 2) return fermerResultats();

    var trouves = [];

    lecons.forEach(function (l) {
      var brut = texteLecon(l);
      if (normal(brut).t.indexOf(n) >= 0) {
        trouves.push({ type: 'lecon', l: l, extrait: extraitAutour(brut, n) });
      }
    });

    Data.ressources.forEach(function (r) {
      if (normal(r.titre + ' ' + (r.desc || '')).t.indexOf(n) >= 0) {
        trouves.push({ type: 'fiche', r: r });
      }
    });

    if (!trouves.length) {
      elRes.innerHTML = '<p class="rien">Rien pour « ' + echapper(saisie.trim()) +
        ' ». Essaie un mot du récapitulatif, ou un caractère en hangul.</p>';
      elRes.hidden = false;
      elNb.textContent = 'aucun résultat';
      return;
    }

    elNb.textContent = trouves.length + (trouves.length > 1 ? ' résultats' : ' résultat');

    elRes.innerHTML = trouves.map(function (h) {
      if (h.type === 'fiche') {
        return '<a class="hit" role="option" href="' + h.r.url + '" target="_blank" rel="noopener">' +
               '<span class="ti">' + echapper(h.r.titre) + '</span>' +
               '<span class="ex">Fiche de référence</span></a>';
      }
      return '<button class="hit" role="option" data-id="' + h.l.id + '">' +
             '<span class="ti">' + echapper(h.l.titre) + '</span>' +
             '<span class="ex">' + h.extrait + '</span></button>';
    }).join('');
    elRes.hidden = false;

    Array.prototype.forEach.call(elRes.querySelectorAll('button.hit'), function (b) {
      b.addEventListener('click', function () {
        var l = lecons.filter(function (x) { return x.id === b.dataset.id; })[0];
        termeActif = elQ.value.trim();
        fermerResultats();
        ouvrir(l, termeActif);
      });
    });
  }

  function fermerResultats() {
    elRes.hidden = true; elRes.innerHTML = '';
    if (!elQ.value.trim()) elNb.textContent = '';
  }

  /* Texte brut d'une leçon : titre, récapitulatif, questions, explications */
  function texteLecon(l) {
    var s = l.titre + ' ' + (l.titreKo || '') + ' ' + l.recap;
    l.questions.forEach(function (q) {
      s += ' ' + dehtml(q.t) + ' ' + q.o.map(dehtml).join(' ') + ' ' + dehtml(q.e);
    });
    return s.replace(/\s+/g, ' ');
  }

  /* L'index trouvé porte sur le texte normalisé, dont la longueur diffère de
     l'original (accents, et surtout décomposition du hangul). On repasse par
     la table de correspondance pour découper au bon endroit. */
  function extraitAutour(texte, n) {
    var nz = normal(texte), p = nz.t.indexOf(n);
    if (p < 0) return echapper(texte.slice(0, 90));
    var i = nz.map[p], j = nz.map[p + n.length - 1] + 1;
    var d = Math.max(0, i - 34), f = Math.min(texte.length, j + 46);
    return (d > 0 ? '…' : '') + echapper(texte.slice(d, i)) +
           '<b>' + echapper(texte.slice(i, j)) + '</b>' +
           echapper(texte.slice(j, f)) + (f < texte.length ? '…' : '');
  }

  /* ---------- surlignage ------------------------------------------------ */

  /* Normalise en gardant la correspondance avec les positions d'origine,
     pour que « ecrit » retrouve « écrit » sans décaler le surlignage. */
  function normal(s) {
    var t = '', map = [];
    for (var i = 0; i < s.length; i++) {
      var d = s[i].normalize('NFD'), c = '';
      for (var j = 0; j < d.length; j++) {
        var cp = d.charCodeAt(j);
        if (cp >= 0x300 && cp <= 0x36f) continue;   /* diacritique combinant */
        c += d[j];
      }
      c = c.toLowerCase();
      for (var k = 0; k < c.length; k++) { t += c[k]; map.push(i); }
    }
    return { t: t, map: map };
  }

  function surligner(racine, terme) {
    var n = normal(terme).t.trim();
    if (n.length < 2) return 0;

    var w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode.nodeName;
        if (p === 'SCRIPT' || p === 'STYLE' || p === 'MARK') return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    var noeuds = [], total = 0;
    while (w.nextNode()) noeuds.push(w.currentNode);

    noeuds.forEach(function (node) {
      var s = node.nodeValue, nz = normal(s), pos = 0, last = 0, n1 = 0;
      var frag = document.createDocumentFragment();
      while ((pos = nz.t.indexOf(n, pos)) !== -1) {
        var d = nz.map[pos], f = nz.map[pos + n.length - 1] + 1;
        if (d > last) frag.appendChild(document.createTextNode(s.slice(last, d)));
        var m = document.createElement('mark');
        m.textContent = s.slice(d, f);
        frag.appendChild(m);
        last = f; n1++; pos += n.length;
      }
      if (!n1) return;
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      node.parentNode.replaceChild(frag, node);
      total += n1;
    });

    return total;
  }

  function appliquerSurlignage() {
    if (!termeActif) return;
    /* le QCM a déjà été surligné par dessinerQcm : on compte dans le DOM,
       pas sur le retour de cette seule passe. */
    surligner(elMain, termeActif);
    var n = elMain.querySelectorAll('mark').length;
    var bandeau = document.getElementById('bandeau');
    if (bandeau) {
      bandeau.innerHTML =
        '<span class="txt">« <b>' + echapper(termeActif) + '</b> » — ' +
        (n ? n + (n > 1 ? ' occurrences surlignées' : ' occurrence surlignée')
           : 'rien dans cette leçon') + '</span>' +
        '<button type="button" id="effacerS">Effacer</button>';
      bandeau.hidden = false;
      document.getElementById('effacerS').addEventListener('click', function () {
        termeActif = ''; elQ.value = ''; elNb.textContent = ''; ouvrir(courante);
      });
    }
    var premier = elMain.querySelector('mark');
    if (premier) premier.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ---------- liste des leçons ----------------------------------------- */

  function dessinerListe() {
    elListe.innerHTML = lecons.map(function (l) {
      var s = lireScore(l), n = l.questions.length;
      var pastille = s === null
        ? '<span class="sc neuf">à faire</span>'
        : '<span class="sc' + (s / n < .6 ? ' bas' : '') + '">' + s + '/' + n + '</span>';
      return '<li><button type="button" data-id="' + l.id + '">' +
        '<span class="txt"><span class="ti">' + echapper(l.titre) + '</span>' +
        '<span class="d">' + dateFr(l.date) + '</span></span>' + pastille + '</button></li>';
    }).join('');

    Array.prototype.forEach.call(elListe.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        termeActif = '';
        ouvrir(lecons.filter(function (l) { return l.id === b.dataset.id; })[0]);
      });
    });
    marquerActive();
  }

  function marquerActive() {
    if (!courante) return;
    Array.prototype.forEach.call(elListe.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', b.dataset.id === courante.id);
      if (b.dataset.id === courante.id) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  /* ---------- ouverture d'une leçon ------------------------------------ */

  function ouvrir(lecon, terme) {
    courante = lecon;
    termeActif = terme || '';
    etat = charger(lecon) || { rep: vide(lecon) };
    marquerActive();

    var meta = (lecon.numero ? 'Leçon ' + lecon.numero + ' · ' : '') + dateFr(lecon.date);
    var docs = (lecon.docs || []).map(carteDoc).join('');

    elMain.innerHTML =
      '<div class="bandeau" id="bandeau" hidden></div>' +

      '<div class="entete"><div class="bloc">' +
        '<h1>' + echapper(lecon.titre) + '</h1>' +
        (lecon.titreKo ? '<div class="titre-ko">' + echapper(lecon.titreKo) + '</div>' : '') +
        '<div class="meta">' + meta + '</div>' +
      '</div>' +
      '<div class="sceau"><svg width="56" height="56" aria-hidden="true">' +
        '<use href="#fleur" fill="var(--vert)"></use></svg></div></div>' +

      '<section class="section"><h2>Ce qu’on a vu</h2>' +
        '<div class="recap">' + formaterRecap(lecon.recap) + '</div></section>' +

      (docs ? '<section class="section"><h2>À garder</h2>' +
              '<div class="docs">' + docs + '</div></section>' : '') +

      '<section class="qcm" id="carteQcm"></section>';

    dessinerQcm();
    appliquerSurlignage();
  }

  /* ---------- le QCM ---------------------------------------------------- */

  function dessinerQcm() {
    var qs = courante.questions, n = qs.length;
    var repondues = etat.rep.filter(function (r) { return r !== null; }).length;
    var fini = repondues === n;

    var html =
      '<div class="qcm-tete"><div class="bloc">' +
        '<h2>Questions de la leçon</h2>' +
        '<div class="info">La correction s’affiche à chaque réponse.</div>' +
      '</div></div>';

    qs.forEach(function (q, i) {
      var don = etat.rep[i];
      var revele = don !== null;

      html += '<div class="q"><div class="tete">' +
              '<span class="num">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
              '<span class="enonce">' + q.t + '</span></div><div class="reps">';

      q.o.forEach(function (opt, j) {
        var cl = 'opt', et = '';
        if (revele) {
          if (j === q.r && don === q.r)      { cl += ' juste';   et = 'JUSTE'; }
          else if (j === q.r)                { cl += ' revelee'; et = 'BONNE RÉPONSE'; }
          else if (j === don)                { cl += ' faux';    et = 'VOTRE RÉPONSE'; }
        }
        html += '<button type="button" class="' + cl + '" data-q="' + i + '" data-o="' + j + '"' +
                (revele ? ' disabled' : '') + '>' +
                '<span class="lt">' + 'ABCD'[j] + '</span>' +
                '<span class="tx">' + opt + '</span>' +
                (et ? '<span class="et">' + et + '</span>' : '') + '</button>';
      });

      html += '</div>';
      if (revele) {
        html += '<div class="pourquoi"><span class="k">POURQUOI</span>' +
                '<span class="tx">' + q.e + '</span></div>';
      }
      html += '</div>';
    });

    html += '<div class="pied">';
    if (fini) {
      html += '<span class="final">Score : <b>' + score() + '</b> sur ' + n + '</span>' +
              '<span style="flex:1"></span>' +
              '<button type="button" class="bt sec" id="rejouer">Recommencer</button>';
    } else {
      html += '<div class="avance">' +
                '<span class="lbl">' + repondues + ' réponse' + (repondues > 1 ? 's' : '') +
                ' sur ' + n + '</span>' +
                '<span class="jauge"><i style="width:' +
                  Math.round(repondues / n * 100) + '%"></i></span>' +
              '</div>';
    }
    html += '</div>';

    var carte = document.getElementById('carteQcm');
    carte.innerHTML = html;
    brancher();
    /* le QCM est redessiné à chaque clic : on y remet le surlignage */
    if (termeActif) surligner(carte, termeActif);
  }

  function brancher() {
    var c = document.getElementById('carteQcm');

    Array.prototype.forEach.call(c.querySelectorAll('.opt'), function (b) {
      b.addEventListener('click', function () {
        etat.rep[+b.dataset.q] = +b.dataset.o;
        sauver(); dessinerQcm(); dessinerListe(); remonter();
      });
    });

    var re = c.querySelector('#rejouer');
    if (re) re.addEventListener('click', function () {
      etat = { rep: vide(courante) };
      sauver(); dessinerQcm(); dessinerListe();
      c.scrollIntoView({ block: 'start' });
    });
  }

  /* ---------- utilitaires ---------------------------------------------- */

  function score() {
    return courante.questions.reduce(function (n, q, i) {
      return n + (etat.rep[i] === q.r ? 1 : 0);
    }, 0);
  }

  function vide(l) { return l.questions.map(function () { return null; }); }

  function cle(l) { return 'cavj:' + eleveId + ':' + l.id; }

  function sauver() {
    try { localStorage.setItem(cle(courante), JSON.stringify(etat)); } catch (e) {}
  }

  /* Remonte la tentative à Jieun, une seule fois par parcours terminé.
     Silencieux par construction : si ça échoue, l'élève ne doit pas s'en
     apercevoir — sa progression est de toute façon gardée dans son navigateur. */
  var remonte = {};
  function remonter() {
    var fini = etat.rep.every(function (r) { return r !== null; });
    var marque = courante.id + ':' + etat.rep.join(',');
    if (!fini || remonte[marque]) return;
    remonte[marque] = true;
    Base.enregistrerReponse(cleUrl, courante.id, etat.rep,
                            score(), courante.questions.length);
  }

  function charger(l) {
    try {
      var v = JSON.parse(localStorage.getItem(cle(l)));
      if (v && v.rep && v.rep.length === l.questions.length) return v;
    } catch (e) {}
    return null;
  }

  /* Score affiché dans la liste : seulement quand la leçon est terminée */
  function lireScore(l) {
    var v = charger(l);
    if (!v) return null;
    var fini = v.rep.every(function (r) { return r !== null; });
    if (!fini) return null;
    return l.questions.reduce(function (n, q, i) {
      return n + (v.rep[i] === q.r ? 1 : 0);
    }, 0);
  }

  /* Récapitulatif : texte libre saisi par Jieun, converti en paragraphes,
     listes numérotées, et hangul mis en couleur. */
  function formaterRecap(texte) {
    return String(texte).split(/\n\s*\n/).map(function (bloc) {
      var lignes = bloc.split('\n').filter(function (l) { return l.trim(); });
      var liste = lignes.length && lignes.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); });
      if (liste) {
        return '<ol>' + lignes.map(function (l) {
          return '<li>' + hangul(echapper(l.replace(/^\s*\d+[.)]\s+/, ''))) + '</li>';
        }).join('') + '</ol>';
      }
      return '<p>' + hangul(echapper(lignes.join(' '))) + '</p>';
    }).join('');
  }

  /* Colore les suites de caractères coréens sans toucher au reste */
  function hangul(s) {
    return s.replace(/[ᄀ-ᇿ㄰-㆏가-힣]+/g, function (m) {
      return '<span class="hg">' + m + '</span>';
    });
  }

  function etiquette(d) {
    if (d.type) return d.type.toUpperCase();
    return /\.pdf($|\?)/i.test(d.url) ? 'PDF' : 'FICHE';
  }

  function lienDoc(url, titre, type) {
    return '<a class="doc" href="' + url + '" target="_blank" rel="noopener">' +
           '<span class="t">' + echapper(titre) + '</span>' +
           '<span class="x">' + echapper(type) + '</span></a>';
  }

  function carteDoc(d) {
    var pdf = /\.pdf($|\?)/i.test(d.url);
    return '<a class="carte" href="' + d.url + '" target="_blank" rel="noopener">' +
           '<span class="k' + (pdf ? ' pdf' : '') + '">' + echapper(etiquette(d)) + '</span>' +
           '<span class="n">' + echapper(d.titre) + '</span>' +
           '<span class="a">' + (pdf ? 'Télécharger' : 'Ouvrir') + '</span></a>';
  }

  function dateFr(iso) {
    var m = ['janvier','février','mars','avril','mai','juin','juillet',
             'août','septembre','octobre','novembre','décembre'];
    var p = iso.split('-');
    return (+p[2]) + ' ' + m[+p[1] - 1] + ' ' + p[0];
  }

  function dehtml(s) { return String(s).replace(/<[^>]*>/g, ''); }

  function echapper(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

})();

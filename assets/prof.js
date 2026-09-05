/* Espace professeur : rédiger une leçon, y attacher des documents,
   composer le QCM, publier. Passe entièrement par Base — il ne sait pas
   si les données vivent dans Supabase ou dans le navigateur. */

(function () {

  var elCo      = document.getElementById('connexion');
  var elAtelier = document.getElementById('atelier');
  var elEleves  = document.getElementById('choixEleve');
  var elListe   = document.getElementById('listeLecons');
  var elEditeur = document.getElementById('editeur');
  var elMode    = document.getElementById('badgeMode');
  var elQui     = document.getElementById('profQui');

  var eleves = [], eleveCourant = null, lecons = [], brouillon = null, modifie = false;

  /* ---------- connexion ------------------------------------------------ */

  Base.session().then(function (s) {
    elMode.textContent = Base.mode() === 'local' ? 'mode local' : 'en ligne';
    elMode.className = 'badge ' + (Base.mode() === 'local' ? 'loc' : 'ok');
    if (s) entrer(s); else montrerConnexion();
  });

  function montrerConnexion() {
    elCo.hidden = false; elAtelier.hidden = true;
    document.getElementById('aideMode').innerHTML = Base.mode() === 'local'
      ? 'Le site n’est pas encore relié à sa base. Tu peux entrer avec ' +
        '<b>n’importe quelle adresse</b> pour essayer l’interface : tout ce que tu ' +
        'écriras restera dans ce navigateur.'
      : 'Entre l’adresse et le mot de passe du compte professeur.';
  }

  document.getElementById('formCo').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = document.getElementById('erreurCo');
    err.hidden = true;
    Base.connexion(document.getElementById('coEmail').value.trim(),
                   document.getElementById('coMdp').value)
      .then(entrer)
      .catch(function (x) { err.textContent = x.message; err.hidden = false; });
  });

  document.getElementById('sortir').addEventListener('click', function () {
    if (modifie && !confirm('Des modifications ne sont pas enregistrées. Sortir quand même ?')) return;
    Base.deconnexion().then(function () { location.reload(); });
  });

  function entrer(s) {
    elCo.hidden = true; elAtelier.hidden = false;
    elQui.textContent = s.email;
    elQui.hidden = false;
    document.getElementById('sortir').hidden = false;
    Base.eleves().then(function (l) {
      eleves = l;
      elEleves.innerHTML = eleves.map(function (e) {
        return '<option value="' + e.id + '">' + ech(e.prenom) + '</option>';
      }).join('');
      if (eleves.length) choisirEleve(eleves[0].id);
    });
  }

  elEleves.addEventListener('change', function () {
    if (!confirmerAbandon()) { elEleves.value = eleveCourant.id; return; }
    choisirEleve(elEleves.value);
  });

  function choisirEleve(id) {
    eleveCourant = eleves.filter(function (e) { return e.id === id; })[0];
    elEleves.value = id;
    dessinerLien();
    rafraichirListe();
  }

  /* Le lien privé de l'élève. Il ne figure dans aucun fichier du site :
     il vient de la base, et c'est ici que Jieun le récupère pour l'envoyer. */
  function dessinerLien() {
    /* new URL plutôt qu'un découpage de location.href : Cloudflare Pages sert
       la page sans son extension, l'adresse est donc « /prof » et non
       « /prof.html ». Chercher « prof.html » n'y trouvait rien, et les deux
       morceaux se collaient en « /profeleve.html ». Le navigateur, lui, résout
       le chemin relatif correctement dans les deux cas. */
    var lien = new URL('eleve.html?e=' + encodeURIComponent(eleveCourant.cle),
                       location.href).href;
    document.getElementById('lienEleve').innerHTML =
      '<div class="lien-prive">' +
        '<span class="lbl2">Son lien privé</span>' +
        '<code>' + ech(lien) + '</code>' +
        '<button type="button" class="bt sec" id="copierLien">Copier le lien</button>' +
      '</div>';
    document.getElementById('copierLien').addEventListener('click', function () {
      var b = this;
      copier(lien).then(function () {
        b.textContent = 'Lien copié';
        setTimeout(function () { b.textContent = 'Copier le lien'; }, 1800);
      });
    });
  }

  /* ---------- les résultats -------------------------------------------- */

  document.getElementById('voirResultats').addEventListener('click', function () {
    if (!confirmerAbandon()) return;
    brouillon = null; modifie = false; marquerActive();
    elEditeur.innerHTML = '<div class="vide"><p>Chargement…</p></div>';

    Base.resultats(eleveCourant.id).then(function (rs) {
      var titre = {};
      lecons.forEach(function (l) { titre[l.id] = l.titre; });

      if (!rs.length) {
        elEditeur.innerHTML =
          '<div class="vide"><h1>Pas encore de tentative</h1>' +
          '<p>Dès que ' + ech(eleveCourant.prenom) + ' aura terminé un QCM, tu verras ' +
          'ici chaque passage : la date et le score.</p>' +
          '<p>Une leçon peut être refaite autant de fois qu’il veut — tous les ' +
          'passages restent, pour que tu voies la progression et pas seulement ' +
          'le dernier résultat.</p></div>';
        return;
      }

      /* une ligne par tentative, la plus récente en haut */
      elEditeur.innerHTML =
        '<div class="entete"><div class="bloc">' +
          '<h1>Résultats de ' + ech(eleveCourant.prenom) + '</h1>' +
          '<div class="meta">' + rs.length +
            (rs.length > 1 ? ' passages enregistrés' : ' passage enregistré') + '</div>' +
        '</div></div>' +
        '<div class="section" style="grid-template-columns:1fr">' +
          '<table class="tableau"><thead><tr>' +
            '<th>Leçon</th><th>Quand</th><th class="num">Score</th>' +
          '</tr></thead><tbody>' +
          rs.map(function (r) {
            var part = r.total ? r.score / r.total : 0;
            return '<tr>' +
              '<td>' + ech(titre[r.lecon] || r.intitule || 'Leçon supprimée') + '</td>' +
              '<td class="pale">' + quand(r.le) + '</td>' +
              '<td class="num"><span class="sc ' + (part < .6 ? 'bas' : '') + '">' +
                r.score + '/' + r.total + '</span></td>' +
            '</tr>';
          }).join('') +
          '</tbody></table>' +
        '</div>';
    });
  });

  function quand(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) +
           ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function rafraichirListe(garderId) {
    return Base.leconsDe(eleveCourant.id).then(function (l) {
      lecons = l;
      elListe.innerHTML = lecons.length ? lecons.map(function (x) {
        return '<li><button type="button" data-id="' + x.id + '">' +
          '<span class="txt"><span class="ti">' + ech(x.titre || 'Sans titre') + '</span>' +
          '<span class="d">' + dateFr(x.date) + '</span></span>' +
          '<span class="sc ' + (x.publiee ? '' : 'neuf') + '">' +
          (x.publiee ? 'publiée' : 'brouillon') + '</span></button></li>';
      }).join('') : '<li class="rienEncore">Aucune leçon pour ' + ech(eleveCourant.prenom) + '.</li>';

      Array.prototype.forEach.call(elListe.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          if (!confirmerAbandon()) return;
          ouvrir(b.dataset.id);
        });
      });

      var cible = garderId || (brouillon && brouillon.id);
      if (cible && lecons.some(function (x) { return x.id === cible; })) ouvrir(cible);
      else if (!brouillon) accueil();
      else marquerActive();
    });
  }

  function marquerActive() {
    Array.prototype.forEach.call(elListe.querySelectorAll('button'), function (b) {
      b.classList.toggle('on', !!brouillon && b.dataset.id === brouillon.id);
    });
  }

  function confirmerAbandon() {
    return !modifie || confirm('Cette leçon a des modifications non enregistrées. Les abandonner ?');
  }

  /* ---------- accueil de l'atelier -------------------------------------- */

  function accueil() {
    brouillon = null; modifie = false; marquerActive();
    elEditeur.innerHTML =
      '<div class="vide"><h1>Prête à écrire</h1>' +
      '<p>Choisis une leçon à gauche pour la reprendre, ou crée-en une nouvelle : ' +
      'tu écris le récapitulatif du cours, tu joins tes fiches, puis tu composes le QCM.</p>' +
      '<p>Une leçon reste en <b>brouillon</b> tant que tu ne l’as pas publiée. ' +
      'L’élève ne voit que les leçons publiées.</p></div>';
  }

  document.getElementById('nouvelle').addEventListener('click', function () {
    if (!confirmerAbandon()) return;
    var n = lecons.reduce(function (m, l) { return Math.max(m, l.numero || 0); }, 0) + 1;
    brouillon = {
      id: null, eleve: eleveCourant.id, numero: n,
      date: new Date().toISOString().slice(0, 10),
      titre: '', titreKo: '', recap: '', porteeQcm: '',
      docs: [], questions: [], publiee: false
    };
    modifie = true; dessiner(); marquerActive();
  });

  function ouvrir(id) {
    Base.lecon(id).then(function (l) {
      brouillon = l; modifie = false; dessiner(); marquerActive();
    });
  }

  /* ---------- l'éditeur -------------------------------------------------- */

  function dessiner() {
    var b = brouillon;

    elEditeur.innerHTML =
      '<div class="barre-etat">' +
        '<span class="etiq ' + (b.publiee ? 'pub' : 'bro') + '">' +
          (b.publiee ? 'Publiée' : 'Brouillon') + '</span>' +
        '<span class="sauve" id="etatSauve"></span>' +
        '<span style="flex:1"></span>' +
        (b.id ? '<a class="bt sec" id="apercu" target="_blank" rel="noopener" ' +
                'href="eleve.html?e=' + encodeURIComponent(eleveCourant.cle) + '">Voir côté élève</a>' : '') +
        '<button type="button" class="bt" id="enregistrer">Enregistrer</button>' +
      '</div>' +

      '<section class="bloc-form">' +
        champ('Titre de la leçon', '<input id="fTitre" type="text" value="' + att(b.titre) +
              '" placeholder="Les consonnes finales">') +
        champ('Titre en coréen <span class="opt2">facultatif</span>',
              '<input id="fTitreKo" class="ko" type="text" value="' + att(b.titreKo) +
              '" placeholder="받침">') +
        '<div class="duo">' +
          champ('Numéro', '<input id="fNum" type="number" min="1" value="' + att(b.numero || '') + '">') +
          champ('Date', '<input id="fDate" type="date" value="' + att(b.date) + '">') +
        '</div>' +
      '</section>' +

      '<section class="bloc-form">' +
        champ('Ce qu’on a vu',
          '<textarea id="fRecap" rows="12" placeholder="Aujourd’hui on a vu…">' +
          ech(b.recap) + '</textarea>' +
          '<p class="aide">Écris comme tu parles. Une ligne vide sépare deux paragraphes ; ' +
          'des lignes qui commencent par « 1. », « 2. » deviennent une liste numérotée. ' +
          'Le coréen se met en couleur tout seul.</p>') +
      '</section>' +

      '<section class="bloc-form">' +
        '<h3>Documents à joindre</h3>' +
        '<div id="listeDocs"></div>' +
        '<input type="file" id="fFichier" accept="application/pdf,image/png,image/jpeg,image/webp" hidden>' +
        '<div class="duo">' +
          '<button type="button" class="bt sec" id="televerser">Téléverser un fichier</button>' +
          '<button type="button" class="bt sec" id="ajoutDoc">Ajouter un lien</button>' +
        '</div>' +
        '<p class="aide" id="etatDoc">Le PDF de la leçon se téléverse ici. C’est ' +
          'lui que lira l’API pour écrire le QCM — un simple lien vers une page ' +
          'web ne s’y prête pas.</p>' +
      '</section>' +

      '<section class="bloc-form">' +
        '<h3>Le QCM</h3>' +
        champ('Sur quoi porte le QCM ? <span class="opt2">facultatif</span>',
          '<input id="fPortee" type="text" value="' + att(b.porteeQcm || '') +
          '" placeholder="les chapitres 1 à 3">' +
          '<p class="aide">Le document joint contient souvent plus que ce qui a été ' +
          'vu en cours. Écris ici la portion à couvrir — « les chapitres 1 à 3 », ' +
          '« jusqu’à la page 4 ». Laissé vide, le QCM porte sur tout le document. ' +
          'Cette ligne part dans la consigne ; l’élève ne la voit jamais.</p>') +
        '<div class="atelier-qcm">' +
          '<button type="button" class="bt" id="genererQcm">Générer le QCM</button>' +
          '<select class="select mince" id="fModele" aria-label="Modèle">' +
            '<option value="claude-opus-5">Opus 5 — le plus sûr</option>' +
            '<option value="claude-sonnet-5">Sonnet 5 — 2,5 fois moins cher</option>' +
          '</select>' +
          '<label class="nb"><span>questions</span>' +
            '<input id="fNbQ" type="number" min="4" max="30" value="12"></label>' +
        '</div>' +
        '<p class="aide" id="estimeQcm"></p>' +
        '<p class="erreur" id="erreurQcm" hidden></p>' +

        '<div class="atelier-qcm repli">' +
          '<button type="button" class="bt sec" id="copierPrompt">Copier la consigne pour Claude</button>' +
          '<button type="button" class="bt sec" id="ouvrirColle">Coller un QCM</button>' +
          '<span class="cpt" id="cptQ"></span>' +
        '</div>' +
        '<div id="zoneColle" hidden>' +
          '<textarea id="fColle" rows="6" placeholder="Colle ici la réponse de Claude…"></textarea>' +
          '<div class="atelier-qcm">' +
            '<button type="button" class="bt" id="lireColle">Charger ces questions</button>' +
            '<button type="button" class="bt sec" id="annulerColle">Annuler</button>' +
          '</div>' +
          '<p class="erreur" id="erreurColle" hidden></p>' +
        '</div>' +
        '<div id="listeQ"></div>' +
        '<button type="button" class="bt sec p" id="ajoutQ">Ajouter une question</button>' +
      '</section>' +

      '<section class="bloc-form pied-form">' +
        '<label class="bascule"><input type="checkbox" id="fPubliee"' +
          (b.publiee ? ' checked' : '') + '> <span>Publiée — visible par ' +
          ech(eleveCourant.prenom) + '</span></label>' +
        (b.id ? '<button type="button" class="lien-danger" id="supprimer">Supprimer cette leçon</button>' : '') +
      '</section>';

    dessinerDocs(); dessinerQuestions(); brancher();
  }

  function champ(lbl, html) {
    return '<label class="champ"><span class="lbl">' + lbl + '</span>' + html + '</label>';
  }

  /* ---------- documents -------------------------------------------------- */

  /* Un document déposé se reconnaît à son adresse : elle pointe dans le
     bucket. On ne s'appuie pas sur un drapeau qu'il faudrait maintenir — les
     leçons déjà en base n'en auraient pas. */
  function estDepose(d) {
    return /\/storage\/v1\/object\/public\/documents\//.test(String(d.url || ''));
  }

  function dessinerDocs() {
    var z = document.getElementById('listeDocs');
    if (!brouillon.docs.length) {
      z.innerHTML = '<p class="aide">Aucun document.</p>';
      return;
    }
    z.innerHTML = brouillon.docs.map(function (d, i) {
      var titre = '<input type="text" data-i="' + i + '" data-k="titre" value="' +
        att(d.titre) + '" placeholder="Titre affiché">';

      /* Un fichier déposé n'a plus d'adresse à saisir : elle est décidée par
         la base. On montre ce qu'elle vaut — le poids et le nombre de pages,
         qui sont ce qui détermine le coût d'une génération. */
      var milieu = estDepose(d)
        ? '<a class="jeton-doc" href="' + att(d.url) + '" target="_blank" ' +
            'rel="noopener" title="Ouvrir le fichier">' + ech(detailsDoc(d)) + '</a>'
        : '<input type="text" data-i="' + i + '" data-k="url" value="' + att(d.url) +
            '" placeholder="ressources/fiche.pdf">';

      return '<div class="ligne-doc">' + titre + milieu +
        '<button type="button" class="x" data-sup="' + i + '" aria-label="Retirer">Retirer</button>' +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(z.querySelectorAll('input'), function (inp) {
      inp.addEventListener('input', function () {
        brouillon.docs[+inp.dataset.i][inp.dataset.k] = inp.value;
        toucher();
      });
    });
    Array.prototype.forEach.call(z.querySelectorAll('[data-sup]'), function (b) {
      b.addEventListener('click', function () {
        /* La ligne disparaît du brouillon, le fichier reste dans le bucket.
           C'est voulu : rien ne se supprime, et deux leçons peuvent pointer
           vers le même fichier. */
        brouillon.docs.splice(+b.dataset.sup, 1);
        toucher(); dessinerDocs(); dessinerEstimation();
      });
    });
  }

  function detailsDoc(d) {
    var bouts = [(d.type || 'fichier').toUpperCase()];
    if (d.pages)  bouts.push(d.pages + (d.pages > 1 ? ' pages' : ' page'));
    if (d.taille) bouts.push(poids(d.taille));
    return bouts.join(' · ');
  }

  function poids(o) {
    if (o < 1024) return o + ' o';
    if (o < 1024 * 1024) return Math.round(o / 1024) + ' Ko';
    return (o / 1048576).toFixed(1).replace('.', ',') + ' Mo';
  }

  /* ---------- le téléversement ------------------------------------------- */

  function accueillirFichier(fichier) {
    if (!fichier) return;
    var etat = document.getElementById('etatDoc');
    var bt = document.getElementById('televerser');

    etat.textContent = 'Lecture de « ' + fichier.name + ' »…';
    etat.className = 'aide';
    bt.disabled = true;

    compterPages(fichier).then(function (pages) {
      etat.textContent = 'Envoi de « ' + fichier.name + ' »…';
      return Base.televerser(fichier).then(function (url) {
        brouillon.docs.push({
          titre: sansExtension(fichier.name),
          url: url,
          type: /pdf/i.test(fichier.type) ? 'pdf' : 'image',
          pages: pages,
          taille: fichier.size
        });
        toucher(); dessinerDocs(); dessinerEstimation();
        etat.textContent = 'Fichier déposé. Il partira avec la leçon au prochain ' +
                           'enregistrement.';
      });
    }).catch(function (e) {
      etat.textContent = e.message;
      etat.className = 'aide err';
    }).then(function () {
      bt.disabled = false;
      document.getElementById('fFichier').value = '';
    });
  }

  function sansExtension(nom) {
    return String(nom).replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() ||
           'Document';
  }

  /* Le nombre de pages, relevé une fois au dépôt, sert à annoncer le coût
     d'une génération avant de la lancer. pdf.js est chargé à la demande et
     uniquement ici : personne d'autre ne le paie, et s'il ne se charge pas,
     on continue sans le compte plutôt que de bloquer le dépôt. */
  function compterPages(fichier) {
    var estPdf = /pdf/i.test(fichier.type) || /\.pdf$/i.test(fichier.name);
    if (!estPdf) return Promise.resolve(null);

    var base = 'https://esm.sh/pdfjs-dist@4.8.69/build/';
    return import(base + 'pdf.mjs').then(function (m) {
      m.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.mjs';
      return fichier.arrayBuffer().then(function (buf) {
        return m.getDocument({ data: new Uint8Array(buf) }).promise;
      });
    }).then(function (doc) {
      var n = doc.numPages;
      doc.destroy();
      return n;
    }).catch(function (e) {
      console.warn('Pages non comptées :', e);
      return null;
    });
  }

  /* ---------- questions --------------------------------------------------- */

  function dessinerQuestions() {
    var z = document.getElementById('listeQ');
    var qs = brouillon.questions;
    document.getElementById('cptQ').textContent =
      qs.length ? qs.length + (qs.length > 1 ? ' questions' : ' question') : '';

    if (!qs.length) {
      z.innerHTML = '<p class="aide">Aucune question pour l’instant. Copie la consigne, ' +
        'colle-la dans Claude avec ton récapitulatif, puis rapporte sa réponse ici.</p>';
      return;
    }

    z.innerHTML = qs.map(function (q, i) {
      return '<div class="q-edit"><div class="q-tete">' +
        '<span class="num">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
        '<input type="text" class="enonce" data-i="' + i + '" data-k="t" value="' + att(q.t) +
          '" placeholder="Énoncé de la question">' +
        '<button type="button" class="x" data-supq="' + i + '">Retirer</button></div>' +
        q.o.map(function (o, j) {
          return '<label class="opt-edit' + (q.r === j ? ' bonne' : '') + '">' +
            '<input type="radio" name="bonne' + i + '" data-i="' + i + '" data-r="' + j + '"' +
              (q.r === j ? ' checked' : '') + ' aria-label="Bonne réponse ' + 'ABCD'[j] + '">' +
            '<span class="lt">' + 'ABCD'[j] + '</span>' +
            '<input type="text" data-i="' + i + '" data-o="' + j + '" value="' + att(o) +
              '" placeholder="Proposition ' + 'ABCD'[j] + '">' +
          '</label>';
        }).join('') +
        '<textarea class="expl" data-i="' + i + '" data-k="e" rows="2" ' +
          'placeholder="Pourquoi cette réponse est la bonne">' + ech(q.e || '') + '</textarea>' +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(z.querySelectorAll('[data-k]'), function (inp) {
      inp.addEventListener('input', function () {
        brouillon.questions[+inp.dataset.i][inp.dataset.k] = inp.value; toucher();
      });
    });
    Array.prototype.forEach.call(z.querySelectorAll('[data-o]'), function (inp) {
      inp.addEventListener('input', function () {
        brouillon.questions[+inp.dataset.i].o[+inp.dataset.o] = inp.value; toucher();
      });
    });
    Array.prototype.forEach.call(z.querySelectorAll('[data-r]'), function (r) {
      r.addEventListener('change', function () {
        brouillon.questions[+r.dataset.i].r = +r.dataset.r; toucher(); dessinerQuestions();
      });
    });
    Array.prototype.forEach.call(z.querySelectorAll('[data-supq]'), function (b) {
      b.addEventListener('click', function () {
        brouillon.questions.splice(+b.dataset.supq, 1); toucher(); dessinerQuestions();
      });
    });
  }

  /* ---------- la génération par l'API ------------------------------------- */

  /* Ordres de grandeur, pas une facture. Une page de PDF vaut à peu près
     2000 tokens qu'elle soit lue comme texte ou comme image ; une question
     coûte environ 250 tokens à écrire, et le raisonnement du modèle en
     consomme quelques milliers de plus. Le coût VRAI revient de l'API après
     coup et s'affiche à la place — c'est lui qui fait foi, et c'est lui qui
     est rangé dans la table « generations ». */
  var TOKENS_PAR_PAGE = 2000, TOKENS_PAR_QUESTION = 250, TOKENS_REFLEXION = 2500;
  var TARIFS = {                                  /* dollars par million de tokens */
    'claude-opus-5':   { entree: 5, sortie: 25, nom: 'Opus 5' },
    'claude-sonnet-5': { entree: 2, sortie: 10, nom: 'Sonnet 5' }
  };

  function docsDeposes() {
    return brouillon.docs.filter(estDepose);
  }

  function dessinerEstimation() {
    var z = document.getElementById('estimeQcm');
    if (!z) return;

    var ds = docsDeposes();
    if (!ds.length) {
      z.textContent = 'Téléverse d’abord le PDF de la leçon : c’est lui que ' +
                      'l’API lit. Le récapitulatif sert seulement à cibler.';
      return;
    }

    var modele = document.getElementById('fModele').value;
    var nombre = +document.getElementById('fNbQ').value || 12;
    var t = TARIFS[modele] || TARIFS['claude-opus-5'];

    /* Une seule page inconnue et l'addition ne veut plus rien dire : on le
       dit, plutôt que d'annoncer un chiffre faux. */
    var pages = 0, incertain = false;
    ds.forEach(function (d) { if (d.pages) pages += d.pages; else incertain = true; });

    var quoi = ds.length + (ds.length > 1 ? ' documents' : ' document') +
               (pages ? ', ' + pages + (pages > 1 ? ' pages' : ' page') : '');

    if (incertain && !pages) {
      z.textContent = quoi + ' · coût inconnu, le nombre de pages n’a pas pu ' +
                      'être compté. Ce sera de l’ordre de quelques dizaines de centimes.';
      return;
    }

    var dollars = (pages * TOKENS_PAR_PAGE / 1e6) * t.entree +
                  ((nombre * TOKENS_PAR_QUESTION + TOKENS_REFLEXION) / 1e6) * t.sortie;

    z.textContent = quoi + ' · environ ' + sous(dollars) + ' avec ' + t.nom +
                    (incertain ? ' (au moins : un document n’a pas été compté)' : '') +
                    '. Le coût réel s’affichera après.';
  }

  /* En centimes de dollar : l'API facture en dollars, on n'invente pas de
     taux de change. */
  function sous(dollars) {
    var c = dollars * 100;
    if (c < 1) return 'moins d’un centime';
    return (c < 10 ? c.toFixed(1).replace('.', ',') : Math.round(c)) + ' ¢';
  }

  function lancerGeneration() {
    var err = document.getElementById('erreurQcm');
    var bt  = document.getElementById('genererQcm');
    var z   = document.getElementById('estimeQcm');
    err.hidden = true;

    var ds = docsDeposes();
    if (!ds.length) {
      err.textContent = 'Il faut d’abord téléverser le PDF de la leçon.';
      err.hidden = false; return;
    }
    if (brouillon.questions.length &&
        !confirm('Remplacer les ' + brouillon.questions.length +
                 ' questions existantes par celles que Claude va écrire ?')) return;

    var modele = document.getElementById('fModele').value;
    var nombre = +document.getElementById('fNbQ').value || 12;

    bt.disabled = true;
    var t0 = Date.now();
    z.textContent = 'Claude lit le document… cela prend en général une minute.';

    Base.genererQcm({
      modele: modele,
      nombre: nombre,
      leconId: brouillon.id || null,
      portee: brouillon.porteeQcm || '',
      recap: brouillon.recap || '',
      documents: ds.map(function (d) { return d.url; })
    }).then(function (r) {
      brouillon.questions = r.questions;
      toucher(); dessinerQuestions();
      var nom = (TARIFS[r.modele] || {}).nom || r.modele;
      z.textContent = r.questions.length + ' questions écrites par ' + nom +
        ' en ' + Math.round((Date.now() - t0) / 1000) + ' s, pour ' +
        sous(r.centimes / 100) + '. Relis-les avant de publier.';
    }).catch(function (e) {
      err.textContent = e.message;
      err.hidden = false;
      dessinerEstimation();
    }).then(function () {
      bt.disabled = false;
    });
  }

  /* ---------- la consigne pour Claude ------------------------------------- */

  function consigne() {
    var portee = (brouillon.porteeQcm || '').trim();
    return 'Tu prépares un QCM de coréen pour un élève francophone débutant.\n\n' +
      'Voici le récapitulatif de la leçon, écrit par sa professeure :\n\n' +
      '---\n' + (brouillon.recap || '(récapitulatif à compléter)') + '\n---\n\n' +
      (portee ? 'Le QCM doit porter sur ' + portee + ', et sur rien d’autre : ' +
                'ignore ce qui sort de cette portion, même si le document en parle.\n\n' : '') +
      'Fabrique 12 questions à choix multiple qui testent précisément ce contenu.\n' +
      'Règles :\n' +
      '- écris les énoncés et les explications EN FRANÇAIS, même si le cours ' +
      'est en coréen : une élève débutante ne peut pas lire une question ' +
      'rédigée en hangul. Seul le coréen sur lequel porte la question s’écrit ' +
      'en hangul ;\n' +
      '- exactement 4 propositions par question, une seule juste ;\n' +
      '- fais varier la position de la bonne réponse ;\n' +
      '- les mauvaises propositions doivent être plausibles, pas absurdes ;\n' +
      '- chaque explication dit POURQUOI, et ne se contente pas de répéter la réponse ;\n' +
      '- le hangul s’écrit tel quel, sans translittération dans l’énoncé.\n\n' +
      'Réponds UNIQUEMENT par un tableau JSON, sans texte autour, de cette forme :\n' +
      '[{"t":"énoncé","o":["A","B","C","D"],"r":0,"e":"explication"}]\n\n' +
      'où « r » est l’indice de la bonne réponse, de 0 à 3.\n' +
      'N’écris aucune balise autour du coréen : le site le met en couleur ' +
      'tout seul. Écris le hangul nu, jamais entouré d’un <span>. Seul ' +
      '<b>gras</b> est admis.';
  }

  function lireJson(txt) {
    var t = String(txt).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    var d = t.indexOf('['), f = t.lastIndexOf(']');
    if (d < 0 || f < d) throw new Error('Je ne trouve pas de tableau JSON là-dedans. Colle la réponse entière de Claude, crochets compris.');
    var v;
    try { v = JSON.parse(t.slice(d, f + 1)); }
    catch (e) { throw new Error('Le JSON est mal formé : ' + e.message); }
    if (!Array.isArray(v) || !v.length) throw new Error('Le tableau est vide.');
    v.forEach(function (q, i) {
      var n = 'Question ' + (i + 1) + ' : ';
      if (!q || typeof q.t !== 'string' || !q.t.trim()) throw new Error(n + 'énoncé manquant.');
      if (!Array.isArray(q.o) || q.o.length !== 4) throw new Error(n + 'il faut exactement 4 propositions.');
      if (typeof q.r !== 'number' || q.r < 0 || q.r > 3) throw new Error(n + '« r » doit valoir 0, 1, 2 ou 3.');
    });
    return v.map(function (q) {
      return { t: q.t, o: q.o.map(String), r: q.r, e: typeof q.e === 'string' ? q.e : '' };
    });
  }

  /* ---------- branchements ------------------------------------------------ */

  function brancher() {
    ['fTitre', 'fTitreKo', 'fNum', 'fDate', 'fRecap', 'fPortee'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () {
        var e = document.getElementById(id);
        if (id === 'fTitre')   brouillon.titre     = e.value;
        if (id === 'fTitreKo') brouillon.titreKo   = e.value;
        if (id === 'fNum')     brouillon.numero    = e.value ? +e.value : null;
        if (id === 'fDate')    brouillon.date      = e.value;
        if (id === 'fRecap')   brouillon.recap     = e.value;
        if (id === 'fPortee')  brouillon.porteeQcm = e.value;
        toucher();
      });
    });

    document.getElementById('fPubliee').addEventListener('change', function () {
      brouillon.publiee = this.checked; toucher();
      var e = document.querySelector('.barre-etat .etiq');
      e.textContent = this.checked ? 'Publiée' : 'Brouillon';
      e.className = 'etiq ' + (this.checked ? 'pub' : 'bro');
    });

    document.getElementById('ajoutDoc').addEventListener('click', function () {
      brouillon.docs.push({ titre: '', url: '', type: '' }); toucher(); dessinerDocs();
    });

    var champFichier = document.getElementById('fFichier');
    document.getElementById('televerser').addEventListener('click', function () {
      champFichier.click();
    });
    champFichier.addEventListener('change', function () {
      accueillirFichier(champFichier.files && champFichier.files[0]);
    });

    document.getElementById('genererQcm').addEventListener('click', lancerGeneration);
    document.getElementById('fModele').addEventListener('change', dessinerEstimation);
    document.getElementById('fNbQ').addEventListener('input', dessinerEstimation);
    dessinerEstimation();

    document.getElementById('ajoutQ').addEventListener('click', function () {
      brouillon.questions.push({ t: '', o: ['', '', '', ''], r: 0, e: '' });
      toucher(); dessinerQuestions();
    });

    document.getElementById('copierPrompt').addEventListener('click', function () {
      var b = this;
      copier(consigne()).then(function () {
        b.textContent = 'Consigne copiée';
        setTimeout(function () { b.textContent = 'Copier la consigne pour Claude'; }, 1800);
      });
    });

    document.getElementById('ouvrirColle').addEventListener('click', function () {
      var z = document.getElementById('zoneColle');
      z.hidden = !z.hidden;
      if (!z.hidden) document.getElementById('fColle').focus();
    });
    document.getElementById('annulerColle').addEventListener('click', function () {
      document.getElementById('zoneColle').hidden = true;
      document.getElementById('erreurColle').hidden = true;
    });
    document.getElementById('lireColle').addEventListener('click', function () {
      var err = document.getElementById('erreurColle');
      try {
        var qs = lireJson(document.getElementById('fColle').value);
        if (brouillon.questions.length &&
            !confirm('Remplacer les ' + brouillon.questions.length + ' questions existantes ?')) return;
        brouillon.questions = qs;
        document.getElementById('fColle').value = '';
        document.getElementById('zoneColle').hidden = true;
        err.hidden = true; toucher(); dessinerQuestions();
      } catch (e) { err.textContent = e.message; err.hidden = false; }
    });

    document.getElementById('enregistrer').addEventListener('click', enregistrer);

    var sup = document.getElementById('supprimer');
    if (sup) sup.addEventListener('click', function () {
      /* Cette phrase disait le contraire de ce que fait la base : reponses
         range lecon_id « on delete set null », et un passage garde l'intitulé
         et une photographie de ses questions. Il survit donc à la suppression.
         Le dire juste évite deux erreurs : renoncer pour rien à effacer un
         brouillon, et croire qu'on efface un mauvais score avec la leçon. */
      if (!confirm('Supprimer définitivement « ' + (brouillon.titre || 'cette leçon') +
                   ' » ?\n\nLes passages déjà enregistrés par les élèves, eux, ' +
                   'restent : ils gardent l’intitulé et les questions du jour. ' +
                   'Supprimer une leçon n’efface aucun score.')) return;
      Base.supprimer(brouillon.id).then(function () {
        brouillon = null; modifie = false; rafraichirListe(); accueil();
      });
    });
  }

  function enregistrer() {
    var pb = probleme();
    if (pb) { signaler(pb, true); return; }
    var bt = document.getElementById('enregistrer');
    bt.disabled = true; signaler('Enregistrement…');
    Base.enregistrer(brouillon)
      .then(function (id) {
        brouillon.id = id; modifie = false;
        signaler('Enregistré');
        return rafraichirListe(id);
      })
      .catch(function (e) { signaler(e.message, true); })
      .then(function () { bt.disabled = false; });
  }

  /* Ce qui empêche de publier — pas ce qui empêche d'enregistrer un brouillon */
  function probleme() {
    if (!brouillon.titre.trim()) return 'Il manque le titre de la leçon.';
    if (!brouillon.date) return 'Il manque la date.';
    if (!brouillon.publiee) return null;
    if (!brouillon.recap.trim()) return 'Une leçon publiée a besoin d’un récapitulatif.';
    if (!brouillon.questions.length) return 'Une leçon publiée a besoin d’au moins une question.';
    for (var i = 0; i < brouillon.questions.length; i++) {
      var q = brouillon.questions[i];
      if (!q.t.trim()) return 'Question ' + (i + 1) + ' : l’énoncé est vide.';
      for (var j = 0; j < 4; j++) {
        if (!String(q.o[j]).trim()) return 'Question ' + (i + 1) + ' : la proposition ' +
          'ABCD'[j] + ' est vide.';
      }
    }
    return null;
  }

  function signaler(txt, erreur) {
    var e = document.getElementById('etatSauve');
    if (!e) return;
    e.textContent = txt; e.className = 'sauve' + (erreur ? ' err' : '');
    if (!erreur && txt === 'Enregistré') setTimeout(function () {
      if (e.textContent === 'Enregistré') e.textContent = '';
    }, 2500);
  }

  function toucher() {
    modifie = true;
    signaler('Modifications non enregistrées');
  }

  window.addEventListener('beforeunload', function (e) {
    if (modifie) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- outils ------------------------------------------------------ */

  function copier(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(txt).catch(function () { return repli(txt); });
    }
    return repli(txt);
  }
  function repli(txt) {
    var t = document.createElement('textarea');
    t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
    return Promise.resolve();
  }

  function dateFr(iso) {
    var m = ['janvier','février','mars','avril','mai','juin','juillet',
             'août','septembre','octobre','novembre','décembre'];
    var p = String(iso).split('-');
    return (+p[2]) + ' ' + m[+p[1] - 1] + ' ' + p[0];
  }

  function ech(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function att(s) { return ech(s); }

})();

/* Couche de données — une seule porte pour tout le site.

   Deux implémentations derrière la même interface :
     · « supabase » dès que CONFIG porte une URL et une clé
     · « local »   sinon : tout vit dans le navigateur, rien n'est partagé

   Les pages ne savent pas laquelle tourne. Brancher Supabase se réduit donc
   à remplir config.js — aucun autre fichier ne change. */

window.Base = (function () {

  var CFG   = window.CONFIG || {};
  var reel  = !!(CFG.SUPABASE_URL && CFG.SUPABASE_CLE);
  var sb    = null;
  var pret  = null;

  /* ------------------------------------------------------------------ */
  /*  Démarrage                                                          */
  /* ------------------------------------------------------------------ */

  function demarrer() {
    if (pret) return pret;
    pret = reel
      ? import('https://esm.sh/@supabase/supabase-js@2')
          .then(function (m) {
            sb = m.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_CLE);
          })
          .catch(function (e) {
            /* réseau coupé, CDN bloqué : on ne laisse pas la page muette */
            reel = false;
            console.warn('Supabase inaccessible, repli en mode local.', e);
          })
      : Promise.resolve();
    return pret;
  }

  /* ------------------------------------------------------------------ */
  /*  Stockage du mode local                                             */
  /* ------------------------------------------------------------------ */

  var CLE = 'cavj:base';

  function lire() {
    try {
      var v = JSON.parse(localStorage.getItem(CLE));
      if (v && v.lecons) return v;
    } catch (e) {}
    return semer();
  }

  function ecrire(d) {
    try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) {}
    return d;
  }

  /* Première ouverture : on reprend le contenu livré avec le site. */
  function semer() {
    var d = { eleves: [], ressources: [], lecons: [], reponses: [] };
    if (window.Data) {
      d.eleves = Object.keys(Data.eleves).map(function (id) {
        var e = Data.eleves[id];
        return { id: id, prenom: e.prenom, prenomKo: e.prenomKo || '', cle: e.cle };
      });
      d.ressources = (Data.ressources || []).slice();
      d.lecons = (Data.lecons || []).map(function (l) {
        return {
          id: l.id, eleve: l.eleve, numero: l.numero || null, date: l.date,
          titre: l.titre, titreKo: l.titreKo || '', recap: l.recap,
          docs: (l.docs || []).slice(), questions: (l.questions || []).slice(),
          publiee: true
        };
      });
    }
    return ecrire(d);
  }

  function neuf() {
    return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ------------------------------------------------------------------ */
  /*  Connexion                                                          */
  /* ------------------------------------------------------------------ */

  function session() {
    return demarrer().then(function () {
      if (!reel) {
        try { return localStorage.getItem('cavj:prof') ? { email: localStorage.getItem('cavj:prof') } : null; }
        catch (e) { return null; }
      }
      return sb.auth.getSession().then(function (r) {
        return r.data.session ? { email: r.data.session.user.email } : null;
      });
    });
  }

  function connexion(email, motDePasse) {
    return demarrer().then(function () {
      if (!reel) {
        if (!email) throw new Error('Indique une adresse email.');
        try { localStorage.setItem('cavj:prof', email); } catch (e) {}
        return { email: email };
      }
      return sb.auth.signInWithPassword({ email: email, password: motDePasse })
        .then(function (r) {
          if (r.error) throw new Error(traduire(r.error.message));
          return { email: r.data.user.email };
        });
    });
  }

  function deconnexion() {
    return demarrer().then(function () {
      if (!reel) { try { localStorage.removeItem('cavj:prof'); } catch (e) {} return; }
      return sb.auth.signOut();
    });
  }

  function traduire(m) {
    if (/invalid login/i.test(m)) return 'Email ou mot de passe incorrect.';
    if (/email not confirmed/i.test(m)) return 'Cette adresse n’a pas encore été confirmée.';
    if (/rate limit/i.test(m)) return 'Trop de tentatives. Attends une minute.';
    return m;
  }

  /* ------------------------------------------------------------------ */
  /*  Lecture                                                            */
  /* ------------------------------------------------------------------ */

  function eleves() {
    return demarrer().then(function () {
      if (!reel) return lire().eleves.slice();
      return sb.from('eleves').select('id,prenom,prenom_ko,cle').order('prenom')
        .then(function (r) {
          if (r.error) throw new Error(r.error.message);
          return r.data.map(function (e) {
            return { id: e.id, prenom: e.prenom, prenomKo: e.prenom_ko || '', cle: e.cle };
          });
        });
    });
  }

  function leconsDe(eleveId) {
    return demarrer().then(function () {
      if (!reel) {
        return lire().lecons
          .filter(function (l) { return l.eleve === eleveId; })
          .sort(function (a, b) { return b.date.localeCompare(a.date); });
      }
      return sb.from('lecons')
        .select('id,eleve_id,numero,date,titre,titre_ko,recap,portee_qcm,publiee')
        .eq('eleve_id', eleveId).order('date', { ascending: false })
        .then(function (r) {
          if (r.error) throw new Error(r.error.message);
          return r.data.map(deSupabase);
        });
    });
  }

  /* Une leçon complète : questions et documents compris */
  function lecon(id) {
    return demarrer().then(function () {
      if (!reel) {
        return lire().lecons.filter(function (l) { return l.id === id; })[0] || null;
      }
      return Promise.all([
        sb.from('lecons').select('*').eq('id', id).single(),
        sb.from('questions').select('*').eq('lecon_id', id).order('ordre'),
        sb.from('documents').select('*').eq('lecon_id', id).order('ordre')
      ]).then(function (rs) {
        if (rs[0].error) throw new Error(rs[0].error.message);
        var l = deSupabase(rs[0].data);
        l.questions = (rs[1].data || []).map(function (q) {
          return { t: q.enonce, o: q.options, r: q.bonne, e: q.explication };
        });
        l.docs = (rs[2].data || []).map(function (d) {
          return { titre: d.titre, url: d.url, type: d.type,
                   pages: d.pages, taille: d.taille_octets };
        });
        return l;
      });
    });
  }

  function deSupabase(l) {
    return {
      id: l.id, eleve: l.eleve_id, numero: l.numero, date: l.date,
      titre: l.titre, titreKo: l.titre_ko || '', recap: l.recap || '',
      porteeQcm: l.portee_qcm || '',
      publiee: !!l.publiee, docs: [], questions: []
    };
  }

  function resultats(eleveId) {
    return demarrer().then(function () {
      if (!reel) {
        return lire().reponses.filter(function (r) { return r.eleve === eleveId; });
      }
      return sb.from('reponses').select('*').eq('eleve_id', eleveId)
        .order('envoye_le', { ascending: false }).limit(100)
        .then(function (r) {
          if (r.error) throw new Error(r.error.message);
          return r.data.map(function (x) {
            return { lecon: x.lecon_id, eleve: x.eleve_id, intitule: x.intitule || '',
                     score: x.score, total: x.total, le: x.envoye_le };
          });
        });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Écriture                                                           */
  /* ------------------------------------------------------------------ */

  function enregistrer(l) {
    return demarrer().then(function () {
      if (!reel) {
        var d = lire();
        if (!l.id) l.id = neuf();
        var i = d.lecons.map(function (x) { return x.id; }).indexOf(l.id);
        if (i >= 0) d.lecons[i] = l; else d.lecons.push(l);
        ecrire(d);
        return l.id;
      }

      var champs = {
        eleve_id: l.eleve, numero: l.numero || null, date: l.date,
        titre: l.titre, titre_ko: l.titreKo || null,
        recap: l.recap || '', portee_qcm: l.porteeQcm || '',
        publiee: !!l.publiee
      };
      var etape = l.id
        ? sb.from('lecons').update(champs).eq('id', l.id).select('id').single()
        : sb.from('lecons').insert(champs).select('id').single();

      return etape.then(function (r) {
        if (r.error) throw new Error(r.error.message);
        var id = r.data.id;
        /* questions et documents sont remplacés en bloc : plus simple à
           raisonner qu'une réconciliation ligne à ligne, et le volume est
           dérisoire (12 questions). */
        return sb.from('questions').delete().eq('lecon_id', id)
          .then(function () { return sb.from('documents').delete().eq('lecon_id', id); })
          .then(function () {
            var qs = (l.questions || []).map(function (q, i) {
              return { lecon_id: id, ordre: i, enonce: q.t, options: q.o,
                       bonne: q.r, explication: q.e || '' };
            });
            return qs.length ? sb.from('questions').insert(qs) : null;
          })
          .then(function () {
            var ds = (l.docs || []).map(function (d, i) {
              return { lecon_id: id, titre: d.titre, url: d.url,
                       type: d.type || null, ordre: i,
                       pages: d.pages || null, taille_octets: d.taille || null };
            });
            return ds.length ? sb.from('documents').insert(ds) : null;
          })
          .then(function () { return id; });
      });
    });
  }

  function supprimer(id) {
    return demarrer().then(function () {
      if (!reel) {
        var d = lire();
        d.lecons = d.lecons.filter(function (l) { return l.id !== id; });
        ecrire(d);
        return;
      }
      return sb.from('lecons').delete().eq('id', id).then(function (r) {
        if (r.error) throw new Error(r.error.message);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Le dépôt de fichiers                                               */
  /* ------------------------------------------------------------------ */

  /* Range un fichier dans le bucket et rend son adresse publique.

     Chaque fichier part sous un uuid tiré au sort, et garde son nom derrière :
     l'adresse reste imprévisible, mais le navigateur propose quand même
     « lecon-3.pdf » quand l'élève enregistre. Deux téléversements du même
     fichier ne se marchent donc jamais dessus — on ne remplace rien, on ajoute.

     En mode local il n'y a nulle part où déposer : on le dit franchement
     plutôt que de laisser croire que le fichier est parti quelque part. */
  function televerser(fichier) {
    return demarrer().then(function () {
      if (!reel) {
        throw new Error('Le site n’est pas relié à sa base : il n’y a pas encore ' +
                        'd’endroit où déposer un fichier. Indique un chemin à la place.');
      }
      var nom = String(fichier.name || 'document')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  /* les accents cassent les URL */
        .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(-80) || 'document';
      var chemin = uuid() + '/' + nom;

      return sb.storage.from('documents')
        .upload(chemin, fichier, { contentType: fichier.type || 'application/octet-stream' })
        .then(function (r) {
          if (r.error) throw new Error(traduireDepot(r.error));
          return sb.storage.from('documents').getPublicUrl(chemin).data.publicUrl;
        });
    });
  }

  function traduireDepot(e) {
    var m = e.message || String(e);
    if (/exceeded the maximum allowed size|payload too large/i.test(m)) {
      return 'Ce fichier dépasse 32 Mo, la limite du dépôt.';
    }
    if (/mime type|not supported/i.test(m)) {
      return 'Ce type de fichier n’est pas accepté : PDF ou image.';
    }
    if (/row-level security|not authorized|jwt/i.test(m)) {
      return 'Ta session a expiré. Déconnecte-toi et reconnecte-toi.';
    }
    return m;
  }

  /* crypto.randomUUID n'existe qu'en HTTPS et sur localhost. Le site vit dans
     les deux, mais un repli coûte trois lignes et évite une panne opaque. */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  /* ------------------------------------------------------------------ */
  /*  La génération du QCM par l'API Claude                              */
  /* ------------------------------------------------------------------ */

  /* Le site n'appelle JAMAIS l'API Claude directement : la clé est payante à
     l'usage et tout ce que porte cette page est public. Il s'adresse à une
     fonction serveur de Cloudflare (functions/api/qcm.js), qui détient la clé
     et vérifie que l'appelant est bien Jieun. On lui transmet donc le jeton de
     sa session Supabase — c'est lui qui prouve qui elle est. */
  function genererQcm(demande) {
    return demarrer().then(function () {
      if (!reel) {
        throw new Error('La génération passe par le serveur du site : elle ne ' +
                        'fonctionne qu’en ligne. Utilise « Copier la consigne » ' +
                        'en attendant.');
      }
      return sb.auth.getSession();
    }).then(function (r) {
      var jeton = r.data.session && r.data.session.access_token;
      if (!jeton) throw new Error('Ta session a expiré. Reconnecte-toi.');

      return fetch(new URL('api/qcm', location.href).href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                   'Authorization': 'Bearer ' + jeton },
        body: JSON.stringify(demande)
      });
    }).then(function (rep) {
      return rep.json().catch(function () { return {}; }).then(function (d) {
        if (!rep.ok) {
          throw new Error(d.erreur ||
            'Le serveur a répondu ' + rep.status + '. Réessaie dans un instant.');
        }
        return d;
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Côté élève : tout son espace à partir de sa clé privée              */
  /* ------------------------------------------------------------------ */

  /* Rend null si la clé est inconnue. Côté Supabase, c'est une fonction
     qui répond, pas une table : impossible d'énumérer les élèves ni de
     lire l'espace d'un autre. */
  function espaceEleve(cleUrl) {
    var cle = String(cleUrl || '').toLowerCase();
    return demarrer().then(function () {
      if (!cle) return null;

      if (!reel) {
        var d = lire();
        var e = d.eleves.filter(function (x) { return x.cle === cle; })[0];
        if (!e) return null;
        return {
          eleve: e,
          ressources: d.ressources.slice(),
          lecons: d.lecons
            .filter(function (l) { return l.eleve === e.id && l.publiee; })
            .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
        };
      }

      return sb.rpc('espace_eleve', { cle_url: cle }).then(function (r) {
        if (r.error) throw new Error(r.error.message);
        return r.data || null;
      });
    });
  }

  function enregistrerReponse(cleUrl, leconId, choix, score, total, intitule) {
    return demarrer().then(function () {
      if (!reel) {
        /* En mode local on enregistre quand même : c'est ce qui permet
           d'essayer le tableau de bord avant d'avoir une vraie base. */
        var d = lire();
        var e = d.eleves.filter(function (x) { return x.cle === String(cleUrl).toLowerCase(); })[0];
        if (!e) return;
        d.reponses.unshift({ lecon: leconId, eleve: e.id, intitule: intitule || '',
                             score: score, total: total, le: new Date().toISOString() });
        d.reponses = d.reponses.slice(0, 200);
        ecrire(d);
        return;
      }
      /* En ligne, le score n'est pas envoyé : la fonction le recalcule depuis
         les bonnes réponses de la base, fige l'intitulé et les questions, et
         range le tout dans le passage. Rien ne dépend plus de ce que le
         navigateur affirme. */
      return sb.rpc('enregistrer_reponse', {
        cle_url: String(cleUrl).toLowerCase(), p_lecon: leconId, p_test: null,
        p_choix: choix
      }).then(function (r) {
        if (r.error) console.warn('Réponse non enregistrée :', r.error.message);
      });
    });
  }

  /* ------------------------------------------------------------------ */

  return {
    demarrer: demarrer,
    espaceEleve: espaceEleve, enregistrerReponse: enregistrerReponse,
    mode: function () { return reel ? 'supabase' : 'local'; },
    session: session, connexion: connexion, deconnexion: deconnexion,
    eleves: eleves, leconsDe: leconsDe, lecon: lecon, resultats: resultats,
    enregistrer: enregistrer, supprimer: supprimer,
    televerser: televerser, genererQcm: genererQcm,
    reinitialiserLocal: function () { try { localStorage.removeItem(CLE); } catch (e) {} }
  };

})();

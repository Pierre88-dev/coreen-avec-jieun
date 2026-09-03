/* Couche de données — une seule porte pour tout le site.

   Deux implémentations derrière la même interface :
     · « supabase » dès que CONFIG porte une URL et une clé
     · « local »   sinon : tout vit dans le navigateur, rien n'est partagé

   Les pages ne savent pas laquelle tourne. Brancher Supabase se réduit donc
   à remplir config.js — aucun autre fichier ne change. */

window.Base = (function () {

  var CFG   = window.CONFIG || {};
  var reel  = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON);
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
            sb = m.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON);
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
        .select('id,eleve_id,numero,date,titre,titre_ko,recap,publiee')
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
          return { titre: d.titre, url: d.url, type: d.type };
        });
        return l;
      });
    });
  }

  function deSupabase(l) {
    return {
      id: l.id, eleve: l.eleve_id, numero: l.numero, date: l.date,
      titre: l.titre, titreKo: l.titre_ko || '', recap: l.recap || '',
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
            return { lecon: x.lecon_id, eleve: x.eleve_id,
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
        recap: l.recap || '', publiee: !!l.publiee
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
                       type: d.type || null, ordre: i };
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

  function enregistrerReponse(cleUrl, leconId, choix, score, total) {
    return demarrer().then(function () {
      if (!reel) {
        /* En mode local on enregistre quand même : c'est ce qui permet
           d'essayer le tableau de bord avant d'avoir une vraie base. */
        var d = lire();
        var e = d.eleves.filter(function (x) { return x.cle === String(cleUrl).toLowerCase(); })[0];
        if (!e) return;
        d.reponses.unshift({ lecon: leconId, eleve: e.id,
                             score: score, total: total, le: new Date().toISOString() });
        d.reponses = d.reponses.slice(0, 200);
        ecrire(d);
        return;
      }
      return sb.rpc('enregistrer_reponse', {
        cle_url: String(cleUrl).toLowerCase(), p_lecon: leconId,
        p_choix: choix, p_score: score, p_total: total
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
    reinitialiserLocal: function () { try { localStorage.removeItem(CLE); } catch (e) {} }
  };

})();

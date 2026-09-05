/* Génère un QCM à partir des PDF d'une leçon, en appelant l'API Claude.
   ---------------------------------------------------------------------------
   Cette fonction tourne sur le serveur de Cloudflare, pas dans le navigateur.
   C'est tout l'intérêt : elle détient la clé d'API, qui est payante à l'usage
   et n'a rien à faire dans une page publique ni dans le dépôt.

   Cloudflare Pages ramasse tout seul les fichiers de « functions/ » : le
   chemin functions/api/qcm.js répond à l'adresse /api/qcm. Aucune
   configuration, aucune compilation, aucun paquet npm — le projet n'en a
   jamais eu et ce n'est pas ce fichier qui va en introduire un. D'où l'appel
   à l'API en fetch brut plutôt qu'avec le SDK Anthropic.

   VARIABLES À RÉGLER dans Cloudflare > le projet > Settings > Variables :

     CLE_API_CLAUDE   (secret)  la clé sk-ant-… du compte de Pierre
     EMAILS_PROF      (texte)   les adresses autorisées, séparées par une
                                virgule. VIDE = personne ne peut générer.

   L'URL et la clé publishable de Supabase sont reprises ci-dessous par
   défaut : elles sont déjà publiques dans assets/config.js. Les variables
   SUPABASE_URL et SUPABASE_CLE permettent de les changer sans toucher au code.
   --------------------------------------------------------------------------- */

/* Repli sur les mêmes valeurs que assets/config.js. Elles sont publiques par
   nature — elles finissent dans la page que voit n'importe quel visiteur. */
const SUPABASE_URL_PARDEFAUT = 'https://gatxsrpwskdbsrulqdon.supabase.co';
const SUPABASE_CLE_PARDEFAUT = 'sb_publishable_FgGYjwPe-XXN87VKHLuxTA_ahP4Tfyl';

/* Les deux seuls modèles que le site accepte. La liste est ici, côté serveur,
   et pas dans la page : sans elle, il suffirait de bricoler la requête pour
   faire tourner la facture sur un modèle plus cher. */
const MODELES = {
  'claude-opus-5':   { entree: 5.00, sortie: 25.00 },
  'claude-sonnet-5': { entree: 2.00, sortie: 10.00 }
};

const MAX_DOCUMENTS = 6;
const MAX_QUESTIONS = 100;

export async function onRequestPost({ request, env }) {
  try {
    return await traiter(request, env);
  } catch (e) {
    /* Le message brut d'une exception peut contenir n'importe quoi ; on le
       journalise pour Pierre et on ne renvoie qu'une phrase à Jieun. */
    console.error('qcm:', e && e.stack || e);
    return refus(500, 'Quelque chose a cassé côté serveur. Réessaie, et si ça ' +
                      'recommence préviens Pierre.');
  }
}

async function traiter(request, env) {

  /* ---------- 1. la clé d'API est-elle là ? -------------------------- */

  const cleApi = env.CLE_API_CLAUDE;
  if (!cleApi) {
    return refus(503, 'La clé d’API n’est pas encore réglée sur le serveur. ' +
                      'Pierre doit ajouter CLE_API_CLAUDE dans Cloudflare.');
  }

  /* ---------- 2. qui appelle ? --------------------------------------- */

  /* La page envoie le jeton de la session Supabase de Jieun. On ne le décode
     pas nous-mêmes : on le présente à Supabase, qui dit à qui il appartient.
     Un jeton fabriqué, expiré ou volé à un élève ne passe pas — les élèves
     n'ont d'ailleurs aucun compte. */
  const urlBase = env.SUPABASE_URL || SUPABASE_URL_PARDEFAUT;
  const cleBase = env.SUPABASE_CLE || SUPABASE_CLE_PARDEFAUT;

  const entete = request.headers.get('Authorization') || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7).trim() : '';
  if (!jeton) return refus(401, 'Il faut être connecté pour générer un QCM.');

  const qui = await fetch(urlBase + '/auth/v1/user', {
    headers: { apikey: cleBase, Authorization: 'Bearer ' + jeton }
  });
  if (!qui.ok) return refus(401, 'Ta session a expiré. Reconnecte-toi.');
  const utilisateur = await qui.json();
  const email = String(utilisateur.email || '').trim().toLowerCase();

  /* Fermé par défaut : tant que la liste est vide, personne ne génère. C'est
     volontaire — une variable oubliée doit bloquer, pas ouvrir la porte. */
  const autorises = String(env.EMAILS_PROF || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!autorises.length) {
    return refus(503, 'Aucun compte n’est encore autorisé à générer. Pierre ' +
                      'doit régler EMAILS_PROF dans Cloudflare.');
  }
  if (!email || autorises.indexOf(email) < 0) {
    return refus(403, 'Ce compte n’est pas autorisé à générer des QCM.');
  }

  /* ---------- 3. la demande ------------------------------------------ */

  let d;
  try { d = await request.json(); }
  catch (e) { return refus(400, 'Requête illisible.'); }

  const modele = MODELES[d.modele] ? d.modele : 'claude-opus-5';
  const nombre = Math.min(MAX_QUESTIONS, Math.max(1, parseInt(d.nombre, 10) || 12));
  const portee = texteCourt(d.portee, 400);
  const recap  = texteCourt(d.recap, 6000);

  /* Les adresses viennent du navigateur : on ne les suit pas les yeux fermés.
     Seuls les fichiers du bucket de ce projet sont acceptés — sinon la
     fonction devient une machine à faire lire n'importe quelle page du web
     par l'API, aux frais de Pierre. */
  const prefixe = urlBase + '/storage/v1/object/public/documents/';
  const documents = (Array.isArray(d.documents) ? d.documents : [])
    .map(u => String(u || ''))
    .filter(u => u.startsWith(prefixe))
    .slice(0, MAX_DOCUMENTS);

  if (!documents.length) {
    return refus(400, 'Il faut au moins un document téléversé sur cette leçon : ' +
                      'c’est lui que l’API lit pour écrire les questions.');
  }

  /* ---------- 4. l'appel --------------------------------------------- */

  const corps = {
    model: modele,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: SYSTEME,
    messages: [{
      role: 'user',
      content: [
        /* Les documents d'abord, la consigne ensuite : c'est l'ordre que
           l'API attend. Elle va chercher les PDF elle-même par leur adresse,
           ce qui évite à cette fonction de les recopier — d'où le bucket
           public, et d'où la limite de 32 Mo posée au téléversement. */
        ...documents.map(url => ({
          type: 'document',
          source: { type: 'url', url: url }
        })),
        { type: 'text', text: consigne(nombre, portee, recap) }
      ]
    }],
    output_config: { format: { type: 'json_schema', schema: SCHEMA } }
  };

  let rep = await appeler(cleApi, corps);

  /* output_config est récent. Si cette installation de l'API ne le connaît
     pas encore, on refait l'appel sans lui : la consigne demande déjà le JSON,
     et la relecture ci-dessous est de toute façon tolérante. */
  if (rep.statut === 400 && /output_config|json_schema|schema/i.test(rep.texte || '')) {
    delete corps.output_config;
    rep = await appeler(cleApi, corps);
  }

  if (rep.statut !== 200) {
    await journaliser(urlBase, cleBase, jeton, {
      lecon_id: d.leconId || null, modele: modele, statut: 'erreur',
      erreur: (rep.texte || '').slice(0, 500)
    });
    return refus(502, messageApi(rep));
  }

  const message = rep.json;

  if (message.stop_reason === 'refusal') {
    return refus(422, 'L’API a refusé de traiter ce document. Si c’est un ' +
                      'scan illisible, réessaie avec un fichier plus net.');
  }
  if (message.stop_reason === 'max_tokens') {
    return refus(502, 'La réponse a été coupée avant la fin. Demande moins de ' +
                      'questions, ou découpe le document.');
  }

  /* ---------- 5. la relecture ---------------------------------------- */

  const texte = (message.content || [])
    .filter(b => b.type === 'text').map(b => b.text).join('');

  let questions;
  try { questions = relire(texte, nombre); }
  catch (e) {
    await journaliser(urlBase, cleBase, jeton, {
      lecon_id: d.leconId || null, modele: modele, statut: 'illisible',
      erreur: e.message,
      tokens_entree: usage(message, 'input_tokens'),
      tokens_sortie: usage(message, 'output_tokens'),
      cout_centimes: cout(modele, message)
    });
    return refus(502, 'La réponse de l’API n’avait pas la forme attendue : ' +
                      e.message + ' Réessaie.');
  }

  /* ---------- 6. la trace ------------------------------------------- */

  const centimes = cout(modele, message);
  await journaliser(urlBase, cleBase, jeton, {
    lecon_id: d.leconId || null, modele: modele, statut: 'ok',
    tokens_entree: usage(message, 'input_tokens'),
    tokens_sortie: usage(message, 'output_tokens'),
    cout_centimes: centimes
  });

  return reponse(200, {
    questions: questions,
    modele: modele,
    centimes: centimes,
    tokensEntree: usage(message, 'input_tokens'),
    tokensSortie: usage(message, 'output_tokens')
  });
}

/* ------------------------------------------------------------------ */
/*  L'API                                                              */
/* ------------------------------------------------------------------ */

async function appeler(cleApi, corps) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cleApi,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(corps)
  });
  const texte = await r.text();
  let json = null;
  try { json = JSON.parse(texte); } catch (e) {}
  return { statut: r.status, texte: texte, json: json };
}

function messageApi(rep) {
  const m = rep.json && rep.json.error && rep.json.error.message || '';
  if (rep.statut === 401) return 'La clé d’API est refusée. Pierre doit la vérifier.';
  if (rep.statut === 429) return 'L’API est saturée pour l’instant. Réessaie dans une minute.';
  if (rep.statut === 400 && /credit|balance/i.test(m)) {
    return 'Le compte d’API n’a plus de crédit. Préviens Pierre.';
  }
  if (rep.statut >= 500) return 'L’API ne répond pas correctement. Réessaie dans un instant.';
  return 'L’API a répondu ' + rep.statut + (m ? ' : ' + m : '') + '.';
}

function usage(message, champ) {
  return (message.usage && message.usage[champ]) || 0;
}

/* Le coût réel de CET appel, en centimes de dollar — l'API facture en
   dollars, on ne va pas inventer un taux de change. Arrondi au centième de
   centime, ce qui suffit largement pour une addition de fin de mois. */
function cout(modele, message) {
  const t = MODELES[modele];
  if (!t) return 0;
  const entree = usage(message, 'input_tokens') +
                 usage(message, 'cache_creation_input_tokens') +
                 usage(message, 'cache_read_input_tokens');
  const dollars = (entree / 1e6) * t.entree +
                  (usage(message, 'output_tokens') / 1e6) * t.sortie;
  return Math.round(dollars * 100 * 100) / 100;
}

/* La trace des coûts ne doit jamais faire échouer une génération réussie :
   Jieun a ses questions, c'est ce qui compte. On écrit avec le jeton de sa
   session — la fonction serveur n'a donc aucun pouvoir propre sur la base. */
async function journaliser(urlBase, cleBase, jeton, ligne) {
  try {
    await fetch(urlBase + '/rest/v1/generations', {
      method: 'POST',
      headers: {
        apikey: cleBase,
        Authorization: 'Bearer ' + jeton,
        'content-type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(ligne)
    });
  } catch (e) {
    console.error('trace non enregistrée :', e && e.message);
  }
}

/* ------------------------------------------------------------------ */
/*  La consigne                                                        */
/* ------------------------------------------------------------------ */

const SYSTEME =
  'Tu écris des QCM de coréen pour des élèves francophones débutants, à ' +
  'partir des documents de cours qu’on te donne.\n\n' +
  'LA LANGUE DE TRAVAIL EST LE FRANÇAIS. Les énoncés et les explications ' +
  's’écrivent en français, toujours, même quand le document de cours est ' +
  'entièrement en coréen — et il l’est souvent, puisqu’il vient d’une ' +
  'professeure coréenne. Une élève débutante ne peut pas lire une question ' +
  'rédigée en coréen : elle n’apprend alors rien et ne peut même pas dire ce ' +
  'qu’elle n’a pas compris.\n\n' +
  'Le coréen ne figure que là où il est la matière même : les formes, les mots ' +
  'et les phrases sur lesquels porte la question. Une proposition de réponse ' +
  'peut donc être entièrement en hangul — c’est normal et souhaitable. Un ' +
  'énoncé ou une explication, jamais.\n\n' +
  'Ce qui compte plus que tout : une question fausse enseigne une erreur, et ' +
  'c’est la professeure qui devra la rattraper en cours. Dans le doute, écris ' +
  'une question plus simple mais dont tu es sûr, jamais une question ' +
  'astucieuse dont tu n’es pas certain. Ne pose de question que sur ce qui est ' +
  'écrit dans les documents ; n’invente aucune règle, aucun vocabulaire, ' +
  'aucune tournure qui n’y figure pas.';

function consigne(nombre, portee, recap) {
  let t = 'Les documents ci-dessus sont le cours. C’est d’eux que doivent ' +
          'sortir les questions.\n\n';

  if (recap) {
    t += 'La professeure a noté ce qui a été vu en classe :\n\n---\n' + recap +
         '\n---\n\nCe récapitulatif dit sur quoi porter les questions, ' +
         'pas ce qu’elles doivent contenir : la matière est dans les ' +
         'documents.\n\n';
  }
  if (portee) {
    t += 'Le QCM porte sur ' + portee + ', et sur rien d’autre : ignore le ' +
         'reste des documents, même s’il est intéressant.\n\n';
  }

  t += 'Écris ' + nombre + ' question' + (nombre > 1 ? 's' : '') +
       ' à choix multiple.\n' +
       'Règles :\n' +
       '- **énoncés et explications en français**, quelle que soit la langue ' +
       'du document. Seul le coréen sur lequel porte la question s’écrit en ' +
       'hangul, tel quel, sans translittération ;\n' +
       '- exactement 4 propositions par question, une seule juste ;\n' +
       '- fais varier la position de la bonne réponse ;\n' +
       '- les mauvaises propositions doivent être plausibles, pas absurdes : ' +
       'ce sont les confusions qu’un débutant fait vraiment ;\n' +
       '- chaque explication dit POURQUOI, et ne se contente pas de répéter ' +
       'la réponse ;\n' +
       '- le hangul s’écrit tel quel, sans translittération dans l’énoncé ;\n' +
       '- deux questions ne portent jamais sur le même point.\n\n' +
       'N’écris AUCUNE balise HTML autour du coréen : le site le met en ' +
       'couleur tout seul à l’affichage. Écris le hangul nu, jamais entouré ' +
       'd’un <span>. La seule balise admise est <b>gras</b>, et seulement ' +
       'pour insister sur un point.\n\n' +
       'Réponds par un objet JSON : {"questions":[{"t":"énoncé",' +
       '"o":["A","B","C","D"],"r":0,"e":"explication"}]}, où « r » est ' +
       'l’indice de la bonne réponse, de 0 à 3.';
  return t;
}

const SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          t: { type: 'string' },
          o: { type: 'array', items: { type: 'string' } },
          r: { type: 'integer', minimum: 0, maximum: 3 },
          e: { type: 'string' }
        },
        required: ['t', 'o', 'r', 'e'],
        additionalProperties: false
      }
    }
  },
  required: ['questions'],
  additionalProperties: false
};

/* ------------------------------------------------------------------ */
/*  Relecture — la même exigence que pour un QCM collé à la main       */
/* ------------------------------------------------------------------ */

function relire(txt, attendu) {
  let t = String(txt || '').trim()
    .replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  /* Avec output_config on reçoit {"questions":[…]} ; sans lui le modèle rend
     souvent le tableau nu, parfois entouré de quelques mots. On essaie les
     deux découpes et on garde celle qui donne des questions.

     L'ordre compte : dans un tableau nu, le premier « { » et le dernier « } »
     encadrent une SEULE question, qui se relit sans erreur et masquerait
     toutes les autres. On regarde donc le tableau en premier. */
  const decoupes = [
    [t.indexOf('['), t.lastIndexOf(']')],
    [t.indexOf('{'), t.lastIndexOf('}')]
  ];

  let qs = null;
  for (const [d, f] of decoupes) {
    if (d < 0 || f <= d) continue;
    let v;
    try { v = JSON.parse(t.slice(d, f + 1)); } catch (e) { continue; }
    const liste = Array.isArray(v) ? v : (v && v.questions);
    if (Array.isArray(liste) && liste.length) { qs = liste; break; }
  }

  if (!qs) throw new Error('pas de JSON exploitable dans la réponse.');

  return qs.slice(0, attendu).map((q, i) => {
    const n = 'question ' + (i + 1) + ' : ';
    if (!q || typeof q.t !== 'string' || !q.t.trim()) throw new Error(n + 'énoncé vide.');
    if (!Array.isArray(q.o) || q.o.length !== 4) throw new Error(n + 'il faut 4 propositions.');
    if (q.o.some(o => !String(o == null ? '' : o).trim())) {
      throw new Error(n + 'une proposition est vide.');
    }
    const r = typeof q.r === 'number' ? q.r : parseInt(q.r, 10);
    if (!(r >= 0 && r <= 3)) throw new Error(n + '« r » doit valoir 0, 1, 2 ou 3.');
    return {
      t: String(q.t), o: q.o.map(o => String(o)), r: r,
      e: typeof q.e === 'string' ? q.e : ''
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Menue monnaie                                                      */
/* ------------------------------------------------------------------ */

function texteCourt(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function reponse(statut, obj) {
  return new Response(JSON.stringify(obj), {
    status: statut,
    headers: { 'content-type': 'application/json; charset=utf-8',
               'cache-control': 'no-store' }
  });
}

function refus(statut, message) {
  return reponse(statut, { erreur: message });
}

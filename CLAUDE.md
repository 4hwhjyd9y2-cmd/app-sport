# TEMPO · app de musculation

App web hors ligne, une page HTML autonome par fichier, sans dépendance ni build. Elle est servie par GitHub Pages depuis `main`, et utilisée sur iPhone, ajoutée à l'écran d'accueil depuis Safari.

Ce dépôt est **public** : n'y écris jamais de données personnelles (nom, âge, poids, taille, historique de séances, codes de sauvegarde).

## Fichiers

| Fichier | Rôle | Clés localStorage |
|---|---|---|
| `index.html` | App maison d'origine, une seule séance full body | `TEMPO_*` |
| `salle.html` | App principale : séances en salle du lundi, du mardi et du jeudi, plus Maison | `TEMPO_S_*` |

Les deux apps cohabitent sur le même domaine sans se lire l'une l'autre. `index.html` est figé : n'y touche que sur demande explicite.

## Contexte d'entraînement

- Débutant en musculation, venu de la calisthénie. Objectif : prise de masse saine, plus une base de force pour la calisthénie (tractions, dips, L-sit, relevés suspendus).
- 3 séances par semaine en salle depuis le 30/11/2026 : lundi haut du corps, mardi jambes et abdos, jeudi corps entier. Il n'est disponible que du lundi au jeudi (déplacements le week-end). Avant, 2 séances corps entier (A le mardi, B le jeudi). La séance Maison reste disponible en dépannage.
- Pourquoi 3 séances : plus de volume par muscle (vers 10 à 12 séries par semaine) et tractions et dips 2 fois par semaine pour la force. Séries à 1 ou 2 répétitions de l'échec.
- Il délègue les choix techniques d'entraînement : décide, puis explique brièvement pourquoi, plutôt que de proposer un menu d'options.
- Il colle ses séances au format de l'export de l'app. Analyse-les objectivement, exercice par exercice, avant de proposer des changements.

### Points d'attention connus

- Contrôle lombo-pelvien : les fléchisseurs de hanche dominent sur les abdos profonds, le bas du dos se creuse quand les jambes descendent. D'où le dead bug (maison) et le hollow body (mardi). Ne pas ajouter de travail des fléchisseurs de hanche pour régler ça.
- Prise de main : elle lâche avant les abdos en suspension. D'où les relevés de jambes à la chaise romaine (mardi) et la suspension à la barre en fin de séance (lundi et jeudi). Retour aux relevés suspendus quand il tient 40 s en suspension à chaque séance **et** 3 × 12 jambes tendues à la chaise sans creuser le dos (fin octobre 2026 : 40 s pas encore systématique, et retour aux genoux pliés à la chaise parce que le dos se creusait jambes tendues).
- Développé couché : il sent les pecs sur les premières répétitions puis surtout les épaules. La fiche insiste sur omoplates tirées vers les fesses et gardées, coudes à 45°, arrêt de la série quand les épaules prennent le relais.
- Le bas du dos se creuse aussi sous charge au développé couché, et au hollow body quand les jambes descendent trop. Les fiches techniques disent d'arrêter la série ou de remonter les jambes à ce moment-là, plutôt que de forcer.
- Ischios : soulevé de terre roumain aux haltères (id 116) le mardi, leg curl assis (id 113) le jeudi après les fentes bulgares. Le hip thrust ne travaille que peu l'arrière des cuisses.
- L-sit en tuck : il sent peu les abdos et les genoux tendent à descendre. La fiche insiste sur genoux au-dessus des hanches et bassin enroulé, sur barres de dips.
- L-sit : id 115 (ancien id 110) depuis l'ajout d'un niveau intermédiaire « tuck + une jambe à moitié tendue », le saut entre tuck + jambe tendue et tuck étant trop grand.
- Il s'entraîne dans deux salles différentes selon les semaines (machines différentes). Ne jamais écrire le nom de ces salles dans le dépôt.
- En salle, le tronc va en fin de séance (le gainage doit rester disponible sous charge lourde). À la maison, sans charge lourde, le contrôle moteur était placé tôt.
- Les pompes ont été gardées volontairement (préférence de l'utilisateur), et les dips assistés y donnent accès (lundi et jeudi).

## Structure de `salle.html`

- `EX_C` (lundi), `EX_A` (mardi), `EX_B` (jeudi), `EX_MAISON` : tableaux d'exercices. `PROGRAMS` les associe aux boutons de l'accueil (`label` : Lundi, Mardi, Jeudi, Maison ; `name` : « Séance du lundi »…). Les id de programme `A` et `B` sont gardés parce qu'ils nomment les clés de stockage : l'historique d'avant le 30/11/2026 (séances corps entier) y reste. `OLD_ORDER` garde l'ordre des anciennes séances A et B pour leur export.
- Exercices présents dans plusieurs séances (tractions 104, dips 202, rowing aux anneaux 204, L-sit 115, suspension 112) : une constante (`TRACTIONS`, `DIPS`, `ROWING`, `LSIT`, `SUSPENSION`) copiée dans chaque séance par `like(base, { sets, ... })`. Même `id`, donc même historique et même niveau partout : seuls `sets` et `easyUntil` peuvent changer d'une séance à l'autre.
- Niveaux : enregistrés par séance (`TEMPO_S_LEVELS_<prog>`), mais `saveLevel` recopie un changement dans toutes les séances qui ont l'exercice, et `loadLevels` reprend le niveau d'une autre séance quand la séance affichée n'en a pas encore.
- Un exercice : `id`, `name`, `short`, `muscle`, `type` (`machine` | `reps` | `pushup` | `hold`), `sets`, `target`, `lo`/`hi` (fourchette de répétitions), `rest` (secondes), et selon le cas :
  - `startKg`, `kgStep` : charge de départ et palier de progression (machines et haltères)
  - `perSide`, `sideWord` : répétitions par côté
  - `hold` : durée cible pour les tenues
  - `levels` + `lvl0` + `techByLevel` : variantes de difficulté, chacune avec sa fiche technique ; sinon `tech` seul
  - `assistLevels`, `startAssist`, `assistStep` : niveaux où l'on saisit un poids d'assistance (machine à tractions, machine à dips)
- Fiche technique : `place`, `move`, `feel`, `avoid` (séparés par `;`), `note` facultative.
- Poids des haltères : toujours le poids d'**un** haltère.
- Double progression (`suggestLoad`) : la charge proposée monte de `kgStep` (ou l'assistance baisse de `assistStep`) seulement si, à la dernière séance, **toutes** les séries prévues ce jour-là (4 le lundi, 3 le jeudi pour tractions et dips) ont atteint `hi` répétitions. La même charge est proposée pour toutes les séries : celle avec laquelle le plus de séries ont atteint `lo` la dernière fois (à égalité, la plus lourde, ou l'assistance la plus faible). Jamais de montée série par série. Il faisait souvent une pyramide (1re série plus légère) : les séries de montée (champ `ramp`) la remplacent.
- Stagnation (`stallBase`) : si les 3 dernières séances de l'exercice sont à la même charge sans qu'aucune des deux plus récentes ne gagne de répétition en moyenne, la charge proposée baisse d'environ 10 % (arrondie au `kgStep`, au moins un palier), ou l'assistance remonte d'un `assistStep`. La montée passe avant.
- Rappel du jeudi (`easyUntil`, `EASY_UNTIL` = 17/12/2026) : jusqu'à cette date, dips et tractions du jeudi s'arrêtent 2 à 3 répétitions avant l'échec (coudes qui s'habituent à 2 séances par semaine). L'écran d'effort l'affiche, et l'entrée de la séance est marquée `easy:true` : ces séances ne servent ni à monter la charge ni à repérer une stagnation.
- « Dernière fois » et charge proposée cherchent dans l'historique de toutes les séances (`allHistory`), les `id` étant uniques entre séances : un exercice déplacé de A vers B garde son historique. Ne jamais réutiliser un `id` d'une séance dans une autre pour un exercice différent.
- Mise en page iPhone (style iOS) : barre de navigation en haut (« Accueil » pour quitter une séance en cours, qui reste enregistrée, titre centré, bouton son), zone `.scroll`, `.bottom-bar` fixée en bas sur un fondu, avec les boutons principaux en capsules. Listes groupées (`.section` > `.group` > `.row`), contrôles segmentés (`.seg`). Texte en `rem` sur `-apple-system-body` pour suivre la taille de texte de l'iPhone ; barre de navigation et boutons plafonnés. Thème sombre seul (usage en salle). Pas de petites étiquettes en majuscules, pas d'emoji ni de symbole comme icône (SVG en ligne), texte gris ≥ 4,5:1. Fiche technique repliable (`details.tech`), ouverte à la 1re série. Pendant une tenue, `body.holding` affiche le chrono en plein écran.
- Style iOS 26, validé le 26/11/2026 (il le voulait « beau, impressionnant, actuel ») : halo de la couleur de la phase en haut de l'écran (`#app::before`, `--glow`, `--glow2`) ; dégradé de la phase `--grad` (de `--c0` à `--c1`, orange vers rouge à l'effort, vert d'eau vers bleu au repos, recalculé sur `body` pour suivre `data-phase`) sur le bouton principal, la barre de progression, l'anneau du chrono et la charge ; cartes en verre (`--glass`, `--glass-edge`) ; boutons secondaires, « Accueil » et son en bulles de verre ; chiffres arrondis et gras (`--num`, `ui-rounded`) ; accueil avec une carte de séance (`.hero` : jour, groupe musculaire, exercices, séries, minutes). `prefers-reduced-transparency` repasse en surfaces pleines.
- Écran de repos : carte « À suivre » (`nextPreview`) avec la prochaine série ou le prochain exercice, ses répétitions et sa charge proposée, et la préparation à faire avant s'il y en a une.
- Échauffement et étirements (séances en salle C, A et B, programmes marqués `warmup:true` ; spécification complète dans `docs/echauffement/cahier-des-charges.md`) :
  - phase `warmup` après « Commencer » (rameur 4 min, dead bug), puis phase `stretch` après la dernière série (6 chronos enchaînés : ischios 2 × 60 s, fléchisseurs de hanche en version active 2 × 30 s par côté) avant « Séance terminée » ;
  - séance : champs facultatifs `warmup` et `stretch` (`"done"` | `"skipped"`), repris dans l'export ; séance en cours : champ facultatif `phase` (`"warmup"` | `"prep"` | `"stretch"`) pour reprendre au bon écran ;
  - exercice : `ramp` (séries de montée : `{ pct, reps }`, `{ bodyweight:true, reps }`, `{ assistPlus, reps }`, arrondies au `kgStep`, à égalité vers le bas, au moins un palier, via `rampSets`) et `prep` (préparation ; liste de clés de `MOVES`). Les deux s'affichent sur une page à part, phase `prep` (« Préparation », `renderPrep`), ouverte par `goSet` avant l'écran d'effort de la 1re série quand l'exercice en a (`hasPrep`) ; un seul bouton, « Aller à la 1re série », rien d'enregistré, reprise sur cette page (`phase:"prep"` dans la séance en cours). L'écran d'effort n'en montre plus rien. Chaque mouvement de `MOVES` a une fiche au format des exercices. Pas de dessins : les bonhommes en traits ont été jugés trop sommaires. Rien pendant les repos : ils servent à récupérer ;
  - séance Maison : aucun échauffement ni étirement.
- Tests : `node tools/check.js` vérifie aussi les règles de l'échauffement (séries de montée, déroulé, reprise, export).
- Chrono global de séance, durée enregistrée dans `durationMs` et ajoutée à l'export.
- Salle : choix « Salle 1 / Salle 2 » sur l'accueil (renommable, noms stockés dans `TEMPO_S_GYM_NAMES`, choix courant dans `TEMPO_S_GYM`), enregistré dans `session.gym`. Un exercice marqué `gymDep:true` ne compare ses charges (machine ou assistance) qu'avec les séances de la même salle ; les séances sans salle, antérieures à cette fonction, servent de repli.
- Sauvegarde / restauration par code JSON. La restauration **fusionne** : elle ajoute les séances absentes (dédoublonnées par `date`) et ne remplace pas les niveaux ni la séance en cours déjà présents.

## Règles de modification

1. **Ne jamais renommer les clés de stockage** (`TEMPO_S_HIST_<prog>`, `TEMPO_S_LEVELS_<prog>`, `TEMPO_S_ACTIVE_<prog>`, `TEMPO_S_PROG`, `TEMPO_S_SOUND`, `TEMPO_S_GYM`, `TEMPO_S_GYM_NAMES`) : l'historique de l'utilisateur deviendrait invisible.
2. **Garder l'`id` d'un exercice** tant que ses charges restent comparables. Ne donner un nouvel `id` que si l'exercice change vraiment (autre machine, autre mouvement), et prévenir l'utilisateur que cet exercice repart de zéro.
3. Si tu changes les niveaux d'un exercice existant, vérifie que les index déjà enregistrés gardent leur sens, sinon change l'`id`.
4. `techByLevel.length` doit toujours être égal à `levels.length`.
5. Dans tout texte visible par l'utilisateur, **pas de tiret long** ; écrire en français, au tutoiement.
6. Après chaque modification, lance `node tools/check.js` : il vérifie la syntaxe du script et la cohérence des exercices.

## Mise à jour sur l'iPhone

Sur iOS, une app ajoutée à l'écran d'accueil a son propre stockage : **supprimer l'icône efface toutes les données**. Pour mettre à jour : pousser sur `main`, attendre 1 à 2 minutes que Pages redéploie, fermer complètement l'app, la rouvrir depuis la même icône. Conseiller de copier une sauvegarde (bouton « Sauvegarder / restaurer ») avant chaque mise à jour.

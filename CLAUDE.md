# TEMPO · app de musculation

App web hors ligne, une page HTML autonome par fichier, sans dépendance ni build. Elle est servie par GitHub Pages depuis `main`, et utilisée sur iPhone, ajoutée à l'écran d'accueil depuis Safari.

Ce dépôt est **public** : n'y écris jamais de données personnelles (nom, âge, poids, taille, historique de séances, codes de sauvegarde).

## Fichiers

| Fichier | Rôle | Clés localStorage |
|---|---|---|
| `index.html` | App maison d'origine, une seule séance full body | `TEMPO_*` |
| `salle.html` | App principale : Séance A (salle, mardi), Séance B (salle, jeudi), Maison | `TEMPO_S_*` |

Les deux apps cohabitent sur le même domaine sans se lire l'une l'autre. `index.html` est figé : n'y touche que sur demande explicite.

## Contexte d'entraînement

- Débutant en musculation, venu de la calisthénie. Objectif : prise de masse saine, plus une base de force pour la calisthénie (tractions, dips, L-sit, relevés suspendus).
- 2 séances par semaine en salle (mardi et jeudi), à cause de déplacements le week-end. La séance Maison reste disponible en dépannage.
- Il délègue les choix techniques d'entraînement : décide, puis explique brièvement pourquoi, plutôt que de proposer un menu d'options.
- Il colle ses séances au format de l'export de l'app. Analyse-les objectivement, exercice par exercice, avant de proposer des changements.

### Points d'attention connus

- Contrôle lombo-pelvien : les fléchisseurs de hanche dominent sur les abdos profonds, le bas du dos se creuse quand les jambes descendent. D'où le dead bug (maison) et le hollow body (séance B). Ne pas ajouter de travail des fléchisseurs de hanche pour régler ça.
- Prise de main : elle lâche avant les abdos en suspension. D'où les relevés de jambes à la chaise romaine et la suspension à la barre en fin de séance A. Retour aux relevés suspendus quand il tient 40 s en suspension à chaque séance **et** 3 × 12 jambes tendues à la chaise sans creuser le dos (fin octobre 2026 : 40 s pas encore systématique, et retour aux genoux pliés à la chaise parce que le dos se creusait jambes tendues).
- Le bas du dos se creuse aussi sous charge au développé couché, et au hollow body quand les jambes descendent trop. Les fiches techniques disent d'arrêter la série ou de remonter les jambes à ce moment-là, plutôt que de forcer.
- Ischios : leg curl assis (id 113) en séance A, le hip thrust ne travaillant que peu l'arrière des cuisses.
- L-sit en tuck : il sent peu les abdos et les genoux tendent à descendre. La fiche insiste sur genoux au-dessus des hanches et bassin enroulé, sur barres de dips.
- Il s'entraîne dans deux salles différentes selon les semaines (machines différentes). Ne jamais écrire le nom de ces salles dans le dépôt.
- En salle, le tronc va en fin de séance (le gainage doit rester disponible sous charge lourde). À la maison, sans charge lourde, le contrôle moteur était placé tôt.
- Les pompes ont été gardées volontairement (préférence de l'utilisateur), et les dips assistés y donnent accès en séance B.

## Structure de `salle.html`

- `EX_MAISON`, `EX_A`, `EX_B` : tableaux d'exercices. `PROGRAMS` les associe aux boutons de l'accueil.
- Un exercice : `id`, `name`, `short`, `muscle`, `type` (`machine` | `reps` | `pushup` | `hold`), `sets`, `target`, `lo`/`hi` (fourchette de répétitions), `rest` (secondes), et selon le cas :
  - `startKg`, `kgStep` : charge de départ et palier de progression (machines et haltères)
  - `perSide`, `sideWord` : répétitions par côté
  - `hold` : durée cible pour les tenues
  - `levels` + `lvl0` + `techByLevel` : variantes de difficulté, chacune avec sa fiche technique ; sinon `tech` seul
  - `assistLevels`, `startAssist`, `assistStep` : niveaux où l'on saisit un poids d'assistance (machine à tractions, machine à dips)
- Fiche technique : `place`, `move`, `feel`, `avoid` (séparés par `;`), `note` facultative.
- Poids des haltères : toujours le poids d'**un** haltère.
- Double progression (`suggestLoad`) : quand une série atteint `hi` répétitions, la charge proposée la fois suivante monte de `kgStep` (ou l'assistance baisse de `assistStep`) pour cette série-là.
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

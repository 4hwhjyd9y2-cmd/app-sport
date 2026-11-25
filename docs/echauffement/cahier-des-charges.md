# Cahier des charges · Échauffement et étirements des séances en salle

Version du 18/11/2026. Ce document se lit sans la conversation qui l'a produit : tout ce qui est décidé est écrit ici.

## 1. Contexte

- **L'appli** : TEMPO, application web de musculation utilisée sur iPhone, ajoutée à l'écran d'accueil depuis Safari. Elle guide une séance série par série : écran d'effort, puis écran de repos où l'on saisit ses résultats.
- **Dépôt et fichiers** : dépôt public `app-sport`, servi par GitHub Pages depuis la branche `main`. La fonction décrite ici concerne uniquement `salle.html` (séances A, B et Maison). `index.html` n'est pas concerné. Les règles du projet sont dans `CLAUDE.md`.
- **Données** : uniquement dans le `localStorage` du téléphone, clés `TEMPO_S_*`. Une sauvegarde (code JSON) permet de les copier et de les restaurer.
- **Point de départ** : l'appli ne propose aucun échauffement. L'utilisateur ne s'échauffe pas et fait souvent une « pyramide » (une 1re série plus légère, comptée comme série de travail). Un simple rappel en bas de l'écran d'effort lui demande de s'échauffer hors de l'appli à la 1re série d'un exercice chargé.
- **Contraintes permanentes** :
  - dépôt public : aucune donnée personnelle (historique, charges réelles, nom des salles, codes de sauvegarde) ;
  - aucune mise en ligne sur `main` sans accord explicite de l'utilisateur ;
  - un seul fichier `salle.html`, sans dépendance ni build (décision du 18/11/2026, voir section 9) ;
  - ne jamais renommer une clé de stockage, garder les `id` d'exercice ;
  - textes de l'appli en français, au tutoiement, sans tiret long ;
  - thème sombre seul ;
  - après chaque modification, `node tools/check.js` doit passer.

## 2. Moments d'usage

| Quand | Je veux savoir | Pour décider |
|---|---|---|
| Je lance une séance A ou B | Quoi faire avant ma 1re série | Démarrer sans réfléchir |
| Avant un exercice chargé | Quelles séries de montée faire, à quelle charge | Arriver prêt à la charge du jour, sans me fatiguer |
| Juste avant un exercice sensible | Quelle préparation faire | Ne pas arriver froid sur une articulation sensible |
| Après la dernière série | Quels étirements faire, combien de temps | Ne pas les oublier |

## 3. Principes

- **Pas de nouvel onglet.** Tout s'insère dans le déroulé existant de la séance : accueil, effort, repos, fin.
- **Échauffement réparti** : un court bloc au début (rameur, dead bug), puis chaque préparation juste avant l'exercice qu'elle sert, à la 1re série de cet exercice. Une articulation préparée se refroidit en 15 à 20 minutes environ : la préparer au début de séance ne sert à rien pour un exercice placé 30 minutes plus tard.
- **Séries de montée** : courtes (peu de répétitions), pour préparer sans fatiguer. Elles ne sont pas enregistrées. Ensuite, toutes les séries de travail se font à la même charge.
- **Tout au poids du corps** pour l'échauffement, sauf le rameur et les séries de montée.
- **Étirements après la séance seulement** : un étirement tenu longtemps avant l'effort fait perdre un peu de force.
- **Règles de lecture** de l'appli, inchangées : rien de coupé ni de débordant à 375 px de large, zones à toucher d'au moins 44 px, un seul grand chiffre par écran, texte gris contrasté à 4,5:1 au moins.
- **Séance Maison** : aucun changement.

## 4. Écran par écran

### 4.1 Écran Échauffement (nouveau)

- **Usage** : je lance la séance A ou B et je veux savoir quoi faire avant la 1re série.
- **Quand il s'affiche** : juste après « Commencer la séance », pour les séances A et B seulement. Il s'affiche aussi en reprenant une séance quittée sur cet écran.
- **Contenu, de haut en bas** :
  - barre de navigation : « Accueil » à gauche, titre « Échauffement », bouton son ;
  - titre « Échauffement », sous-titre « Environ 6 min avant ta 1re série » ;
  - **1. Rameur, 4 min** :
    - « De 0 à 2 min : environ 20 coups par minute. Facile, tu peux parler en phrases complètes. »
    - « De 2 à 4 min : environ 24 coups par minute. Modéré, tu parles encore en phrases courtes. »
    - « Résistance 3 à 5. Jambes, puis dos, puis bras ; au retour, dans l'ordre inverse. »
  - **2. Dead bug, 8 par côté, lentement** : « Allongé sur le dos, bas du dos plaqué au sol, bras tendus vers le plafond, genoux pliés à 90° au-dessus des hanches. Tends lentement un bras et la jambe opposée sans que le bas du dos décolle, reviens, change de côté. » ;
  - barre du bas : « Passer » (petit, à gauche) et « C'est fait » (principal).
- **Ce que je peux faire** :
  - « C'est fait » : enregistre l'échauffement comme fait et ouvre l'écran d'effort du 1er exercice ;
  - « Passer » : enregistre l'échauffement comme passé et ouvre l'écran d'effort du 1er exercice ;
  - « Accueil » : revient à l'accueil, la séance reste en cours et se reprend sur cet écran.
- **Règles** : pas de chrono pour le rameur, son propre écran affiche le temps. Le chrono global de séance démarre dès cet écran, comme aujourd'hui au lancement.
- **Technique** :
  - nouvelle phase `warmup` ;
  - champ facultatif `warmup` de la séance : `"done"` ou `"skipped"` ;
  - champ facultatif `phase` de la séance en cours enregistrée (`TEMPO_S_ACTIVE_<prog>`) : `"warmup"` ou `"stretch"`. Sans ce champ, la reprise fonctionne comme aujourd'hui ;
  - un indicateur `warmup:true` sur les programmes A et B dans `PROGRAMS`.

### 4.2 Séries de montée sur l'écran d'effort (modifié)

- **Usage** : avant un exercice chargé, je veux savoir quelles séries de montée faire et à quelle charge.
- **Quand** : sur l'écran d'effort de la **1re série** des exercices listés ci-dessous, et seulement eux.
- **Contenu** : une section « Séries de montée », placée juste sous le bloc des repères (réps, charge, repos), avec une ligne par série de montée, puis une note : « Hors appli, environ 1 min de repos entre elles. Ensuite, toutes tes séries à {charge du jour}. »
- **Exercices concernés et séries de montée** :

| Séance | Exercice (id) | Séries de montée |
|---|---|---|
| A | Presse à cuisses (101) | 50 % × 8, puis 75 % × 4 |
| A | Développé couché (103) | 50 % × 8, puis 75 % × 4 |
| A | Tractions assistées (104) | assistance + 10 kg × 4 |
| B | Fentes bulgares (201) | poids du corps × 6 par jambe |
| B | Leg curl assis (113) | 50 % × 8 |
| B | Dips assistés (202) | assistance + 10 kg × 4 |

- **Règles de calcul** :
  - la base est la charge proposée par l'appli pour la séance (fonction `suggestLoad`), ou la charge de départ s'il n'y a pas d'historique ;
  - charge d'une série de montée = pourcentage × base, arrondie au multiple le plus proche du palier de l'exercice (`kgStep`) ; à égalité entre deux multiples, on prend le plus bas ;
  - la charge d'une série de montée vaut au moins un palier (`kgStep`), jamais 0 ;
  - assistance : base + 10 kg, sans arrondi supplémentaire ;
  - si l'exercice n'est pas au niveau assisté (tractions ou dips à un autre niveau que la machine), aucune série de montée n'est affichée ;
  - exemples, sur des charges inventées : base 100 kg, palier 5 → 50 kg × 8, puis 75 kg × 4. Base 115 kg, palier 5 → 55 kg × 8 (57,5 est à égalité entre 55 et 60, on prend le plus bas), puis 85 kg × 4. Base 15 kg, palier 2,5 → 7,5 kg × 8, puis 10 kg × 4 (11,25 est à égalité entre 10 et 12,5). Base 12 kg, palier 2 → poids du corps × 6, puis 8 kg × 4. Assistance 12 kg → 22 kg × 4.
- **À retirer** : le rappel générique « Avant cette série, échauffe-toi hors de l'app… » de l'écran d'effort, remplacé par cette section.
- **Technique** : champ facultatif `ramp` sur les exercices concernés, liste d'éléments de la forme `{ pct, reps }`, `{ bodyweight:true, reps }` ou `{ assistPlus, reps }`, avec `perSide` hérité de l'exercice. Une fonction pure `rampSets(ex, base)` renvoie les lignes à afficher.

### 4.3 Préparation juste avant l'exercice (modifié le 18/11/2026)

- **Usage** : juste avant un exercice qui sollicite une articulation sensible, je veux savoir quelle préparation faire.
- **Quand** : sur l'écran d'effort de la **1re série** de l'exercice préparé, avant ses séries de montée. Un temps dédié : les repos restent pour récupérer.
- **Contenu** : une section « Préparation, avant cet exercice », une ligne par mouvement (nom et dose, avec une courte explication dessous), placée au-dessus de la section « Séries de montée ».
- **Préparations** :

| Séance | Exercice préparé | Mouvements | Durée |
|---|---|---|---|
| A | Développé couché (103) | Y-T-W au sol, 5 de chaque lettre | environ 1 min |
| A | Tractions assistées (104) | Tractions scapulaires × 8 | environ 30 s |
| A | L-sit (115) | Poignets 30 s ; dips scapulaires × 8 | environ 1 min |
| B | Dips assistés (202) | Y-T-W au sol, 5 de chaque lettre ; poignets 30 s ; dips scapulaires × 8 | environ 2 min |
| B | Développé militaire (209) | Glissés au mur × 8 | environ 30 s |

- **Explications des mouvements** (texte affiché sous chaque nom) :
  - **Y-T-W au sol** : « Allongé sur le ventre, front au sol, pouces vers le plafond. Décolle les bras en Y, puis en T (bras écartés), puis en W (coudes pliés, ramenés vers les côtes), en serrant les omoplates à chaque fois. »
  - **Tractions scapulaires** : « Suspendu à la barre, bras tendus. Sans plier les coudes, tire les épaules vers le bas, puis relâche-les doucement. »
  - **Dips scapulaires** : « En appui sur les barres de dips, bras tendus. Laisse descendre le corps en montant les épaules vers les oreilles, puis repousse les épaules vers le bas. »
  - **Poignets** : « Cercles de poignets dans les deux sens, puis à 4 pattes, bascule lentement le poids du corps d'avant en arrière sur les mains. »
  - **Glissés au mur** : « Dos, tête et fesses contre le mur, bras en W contre le mur. Fais glisser les bras vers le haut jusqu'au Y, sans décoller le bas du dos ni les bras du mur. »
- **Technique** : champ facultatif `prep` sur l'exercice préparé, liste d'éléments `{ name, dose, how }` pris dans `PREP`. Aucune donnée enregistrée.

### 4.4 Écran Étirements (nouveau)

- **Usage** : après la dernière série, je veux savoir quels étirements faire et combien de temps.
- **Quand il s'affiche** : pour les séances A et B, à la place de l'écran « Séance terminée », après la dernière série (qu'elle soit faite ou passée). L'écran « Séance terminée » s'affiche ensuite. Il s'affiche aussi en reprenant une séance quittée sur cet écran.
- **Contenu, de haut en bas** :
  - barre de navigation : « Accueil », titre « Étirements », bouton son ;
  - titre « Étirements », sous-titre « Environ 4 min. Ta séance est enregistrée à la fin, ou si tu passes. » ;
  - l'étirement en cours : nom, côté s'il y a lieu, explication, chrono en anneau ;
  - la liste des 6 étapes, l'étape en cours mise en avant, les étapes finies marquées comme faites ;
  - barre du bas : « Passer » et « Démarrer » avant le premier chrono ; pendant les chronos, « Passer les étirements ».
- **Les 6 étapes, dans l'ordre** :
  1. Ischios, 60 s : « Assis, jambes tendues devant toi. Penche le buste vers les pieds en gardant le dos long, sans forcer. »
  2. Ischios, 60 s (même texte).
  3. Fléchisseurs de hanche, genou gauche au sol, 30 s.
  4. Fléchisseurs de hanche, genou droit au sol, 30 s.
  5. Fléchisseurs de hanche, genou gauche au sol, 30 s.
  6. Fléchisseurs de hanche, genou droit au sol, 30 s.
  - Explication des fléchisseurs (version active) : « Un genou au sol, buste droit. Serre le fessier du côté du genou au sol et enroule le bassin, pubis vers le nombril. N'avance pas les hanches : l'étirement vient seulement de l'enroulement. »
- **Ce que je peux faire** :
  - « Démarrer » lance l'étape 1. À la fin de chaque chrono, un bip, puis 5 secondes de transition affichant l'étape suivante (« Change de côté » quand c'est le cas), puis le chrono suivant démarre seul ;
  - à la fin de l'étape 6 : étirements enregistrés comme faits, puis écran « Séance terminée » ;
  - « Passer » ou « Passer les étirements » à tout moment : étirements enregistrés comme passés, puis écran « Séance terminée » ;
  - « Accueil » : revient à l'accueil, la séance reste en cours et se reprend sur cet écran, à l'étape 1.
- **Règles** : la séance est écrite dans l'historique au passage à « Séance terminée », comme aujourd'hui. Sa durée inclut donc les étirements.
- **Technique** : nouvelle phase `stretch` ; champ facultatif `stretch` de la séance : `"done"` ou `"skipped"`. Le chrono réutilise le compte à rebours existant (`startCountdown`, anneau `ringHTML`, bips). L'écran reste allumé comme pendant le reste de la séance.

### 4.5 Export (modifié)

- **Contenu** : quand la séance contient `warmup` ou `stretch`, une ligne s'ajoute sous la 1re ligne de l'export de cette séance, par exemple « Échauffement : fait · Étirements : passés ». Un champ absent n'apparaît pas dans la ligne.
- **Règle** : les séances enregistrées avant cette fonction s'exportent exactement comme aujourd'hui.

### 4.6 Écran Séance terminée et accueil

- Aucun changement visible, en dehors du passage par l'écran Étirements avant la fin.

## 5. Données

- **Séance** (élément de `TEMPO_S_HIST_<prog>`) : deux champs facultatifs nouveaux, `warmup` et `stretch`, valant `"done"` ou `"skipped"`.
- **Séance en cours** (`TEMPO_S_ACTIVE_<prog>`) : un champ facultatif nouveau, `phase`, valant `"warmup"` ou `"stretch"`. Absent, la reprise fonctionne comme aujourd'hui.
- **Exercices** (dans le code) : champs facultatifs `ramp` et `prep`, décrits en 4.2 et 4.3.
- **Programmes** (dans le code) : indicateur `warmup:true` sur A et B.
- **Aucune migration** : tous les nouveaux champs sont facultatifs. Aucune clé de stockage n'est renommée. Une ancienne sauvegarde se restaure sans changement.

## 6. Tests

À ajouter dans `tools/check.js`, exécuté avec Node, sur des données inventées :

1. `rampSets` : base 100 kg, palier 5, séries 50 % × 8 et 75 % × 4 → 50 kg × 8 et 75 kg × 4.
2. Arrondi à égalité vers le bas : base 115 kg, palier 5 → 55 kg × 8 et 85 kg × 4.
3. Palier décimal : base 15 kg, palier 2,5 → 7,5 kg × 8 et 10 kg × 4.
4. Minimum : base 4 kg, palier 2,5, 50 % → 2,5 kg, jamais 0.
5. Poids du corps puis pourcentage : base 12 kg, palier 2, poids du corps × 6 et 60 % × 4 → « poids du corps × 6 » et 8 kg × 4, par jambe.
6. Assistance : assistance proposée 12 kg → 22 kg × 4. Tractions à un niveau non assisté → aucune ligne.
7. Déroulé de la séance A : « Commencer » → phase `warmup` ; « C'est fait » → effort, exercice 1, série 1, et `warmup` vaut `"done"` ; dernière série → phase `stretch` ; « Passer » → fin, `stretch` vaut `"skipped"`, séance écrite dans l'historique.
8. Séance Maison : « Commencer » → effort directement ; dernière série → fin directement ; aucun champ `warmup` ni `stretch`.
9. Reprise : séance quittée en phase `warmup` → reprend sur l'écran Échauffement ; en phase `stretch` → reprend sur l'écran Étirements.
10. Export : séance avec `warmup:"done"` et `stretch:"skipped"` → ligne « Échauffement : fait · Étirements : passés » ; séance sans ces champs → export identique à l'actuel.
11. Préparation : affichée à la 1re série de l'exercice préparé seulement, jamais sur les écrans de repos.
12. Rendu sans erreur des nouveaux écrans (Échauffement, Étirements, chaque étape) dans le faux navigateur de `tools/check.js`.

## 7. Critères d'acceptation

- Les 12 tests de la section 6 passent, ainsi que les vérifications existantes de `node tools/check.js`.
- À 375 px et à 390 px de large, en thème sombre : aucun texte coupé, aucun débordement horizontal, aucune zone à toucher sous 44 px, sur les écrans Échauffement, Étirements, effort avec préparation et séries de montée.
- Les charges des séries de montée affichées correspondent aux règles de 4.2 pour la charge proposée du jour.
- Une ancienne sauvegarde se restaure, et ses séances s'exportent comme avant.
- La séance Maison se déroule exactement comme avant.
- `git grep` ne trouve aucune donnée personnelle dans le dépôt (historique, charges réelles, nom des salles, code de sauvegarde).
- Ce qui n'a pas pu être vérifié est dit explicitement : en particulier le rendu sur un vrai iPhone et un usage en séance réelle.

## 8. Hors périmètre

- **Séance Maison** : elle commence déjà par du contrôle du bassin, n'a pas de charge lourde et sert en dépannage.
- **Enregistrement des séries de montée et de chaque mouvement d'échauffement** : seul « fait ou passé » est enregistré, pour l'échauffement de départ et pour les étirements.
- **Chrono du rameur** : l'écran du rameur affiche le temps.
- **Passage aux conventions techniques de la méthode** (`moteur.js` séparé, page de tests, service worker, CSP) : session à part, pour ne pas mélanger une refonte technique et une nouvelle fonction.
- **Thème clair** : l'appli reste en thème sombre seul.
- **Autres étirements** (pectoraux, épaules) : aucun problème de souplesse repéré sur ces zones.
- **Matériel** (élastique, poulie) : l'échauffement reste au poids du corps.

## 9. Clarifications

- 18/11/2026 : échauffement réparti (court bloc au début, puis préparation juste avant chaque exercice), plutôt qu'un bloc unique en début de séance.
- 18/11/2026 : une routine propre à chaque séance (A et B), affichée par l'appli, plutôt qu'une routine commune à mémoriser.
- 18/11/2026 : tout au poids du corps, sans élastique ni poulie.
- 18/11/2026 : rameur 4 min en 2 paliers (environ 20 puis 24 coups par minute), résistance 3 à 5.
- 18/11/2026 : enregistrement limité à « fait ou passé » pour l'échauffement et pour les étirements, visible dans l'export.
- 18/11/2026 : écran Étirements avec chronos enchaînés, avant « Séance terminée ».
- 18/11/2026 : étirement des fléchisseurs de hanche en version active (bassin enroulé, hanches non avancées), 2 × 30 s par côté. Ischios 2 × 60 s.
- 18/11/2026 : fichier unique `salle.html` conservé ; les nouvelles règles de calcul sont testées dans `tools/check.js`.
- 18/11/2026 : séance Maison hors périmètre.
- 18/11/2026 : la préparation ne se fait plus pendant les repos (pas le temps de la faire en récupérant) : elle a un temps dédié, juste avant l'exercice préparé, à sa 1re série.
- 25/11/2026 : plus de série de montée au hip thrust (il suit la presse, hanches déjà chaudes) ; fentes bulgares réduites à une série au poids du corps ; étirements des fléchisseurs nommés par le genou au sol (« genou gauche au sol ») plutôt que par le côté.
- 25/11/2026 : chaque mouvement d'échauffement et d'étirement (dead bug, Y-T-W, tractions scapulaires, dips scapulaires, poignets, glissés au mur, ischios, fléchisseurs de hanche) a une fiche au même format que les exercices (placement, mouvement, où le sentir, à éviter) et des dessins de la position de départ et d'arrivée, toujours visibles ; la fiche se déplie avec « Comment faire ». Données : `MOVES` (fiches) et `FIGS` (dessins), même clé ; le champ `prep` d'un exercice liste des clés de `MOVES`.

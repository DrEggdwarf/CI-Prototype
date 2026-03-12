# Contexte projet — CI Intelligence Dashboard

## 1. Présentation générale

Application de pilotage pour un service **Contrôle Interne** d'entreprise.  
Elle permet à un responsable (admin) de visualiser, planifier, assigner et suivre l'ensemble des contrôles périodiques à effectuer par son équipe d'auditeurs.

L'IA est intégrée de façon **silencieuse et contextuelle** : elle enrichit les données affichées, génère des suggestions et détecte des signaux faibles — sans jamais se présenter comme un chatbot générique. Un assistant LLM conversationnel est disponible en accès rapide (FAB) pour les questions ponctuelles.

---

## 2. Structure de données

### 2.1 Contrôles (`controls`)

Chaque contrôle est une ligne du CSV source. Colonnes attendues :

| Champ | Type | Description |
|---|---|---|
| `id` | int | Identifiant unique |
| `name` | string | Libellé du contrôle |
| `domain` | string | Domaine métier : Finance, IT, RH, Achats, Logistique, Juridique |
| `crit` | enum | Criticité : `critical`, `high`, `medium`, `low` |
| `freq` | string | Fréquence : Hebdo, Mensuel, Trimestriel, Annuel ( pouvoir intégrer des valeurs spécifique, récurence journaliere, hebdo, mensuelle, avoir des date one shot ou des seleciton de date specifique, pouvoir choisir le 1er lundi du mois avoir un systeme extremement complet pour choisir la periodicité  cron ? ) |
| `duration` | int | le nombre de temps que ça occupe, 1 jour , 2 jours ect permet de définir la taille du segment dans la itmeline  |
| `due` | date (DD/MM/YYYY) | Date d'échéance |
| `assignee` | int \| null | ID du membre assigné (null = non assigné) |
| `status` | enum | `pending`, `overdue`, `done` |
| `passRate` | int (0–100) | Taux de succès historique (%) |

**Exemple CSV :**
```csv
id,name,domain,crit,freq,duration,due,assignee,status,passRate
1,Réconciliation bancaire,Finance,critical,Mensuel,4,10/03/2026,1,pending,60
2,Contrôle accès SI,IT,critical,Mensuel,1,12/03/2026,2,pending,80
3,Notes de frais,Finance,high,Hebdo,4,09/03/2026,,overdue,75
```

### 2.2 Membres de l'équipe (`members`)

Peut être une feuille séparée du CSV ou un fichier dédié.

| Champ | Type | Description |
|---|---|---|
| `id` | int | Identifiant unique |
| `name` | string | Nom complet |
| `role` | string | Rôle : Auditeur Senior, Auditeur, Contrôleur(se), etc. |
| `initials` | string | 2 lettres pour l'avatar |
| `color` | hex | Couleur avatar |
| `load` | int (0–100) | Charge actuelle en % |

### 2.3 Picking IA (`picks`)

Généré dynamiquement, non éditable manuellement.

| Champ | Description |
|---|---|
| `id` | Référence au contrôle |
| `score` | Score de pertinence 0–100 |
| `reason` | Justification textuelle courte |
| `tags` | Tableau de tags explicatifs |

### 2.4 Signaux faibles (`signals`)

Générés par le moteur IA, non éditables.

| Champ | Description |
|---|---|
| `icon` | Emoji de représentation |
| `title` | Titre court du signal |
| `desc` | Description détaillée |
| `sev` | Sévérité : `h` (élevé), `m` (moyen), `l` (faible) |

### 2.5 Historique par contrôle (`historyData`)

Structure par entrée :
```json
{
  "dot": "#hex",         // couleur du point timeline
  "act": "string",       // type d'action (Contrôle réussi, Échoué, Note...)
  "who": "string",       // auteur
  "date": "string",      // date lisible
  "body": "string",      // description de l'action
  "aiQ": "string|null",  // question de clôture IA posée
  "aiA": "string|null"   // réponse saisie par l'auditeur
}
```

---

## 3. Architecture des vues

### 3.1 En-tête global (Header)

- Logo application
- **5 KPIs** affichés en ligne : Complétés / En cours / En retard / Signaux IA / Taux de succès
- Chaque KPI est cliquable (prévu pour filtrer)
- Avatar de l'utilisateur connecté à droite

### 3.2 Barre d'outils (Toolbar)

- **Sélecteur de période** : navigation ‹ › + modes Semaine / Mois / Trimestre
- **Filtres chips** : par domaine (Finance, IT, RH, Achats, Logistique, Juridique) + Critique + En retard
  - Un filtre actif colore le chip dans la couleur du domaine
  - Plusieurs filtres peuvent être actifs simultanément
- **Barre de recherche** : filtre texte en temps réel sur le nom des contrôles
- Les filtres s'appliquent simultanément à la timeline ET au kanban

### 3.3 Timeline (50% de la hauteur disponible)

Vue principale, la plus importante visuellement.

**Principe :**
- Axe horizontal = jours de la période sélectionnée
- Colonne de largeur fixe `CW = 44px` par jour
- Lignes « lanes » (6 par défaut) pour éviter les chevauchements
- Placement automatique : un contrôle est placé dans la première lane disponible à sa date d'échéance
- La journée actuelle est surlignée (fond bleu clair) et marquée d'une ligne verticale bleue
- Scroll horizontal si la période dépasse la largeur de l'écran
- Au chargement : scroll positionné automatiquement sur aujourd'hui

**Chips de contrôle :**
- Hauteur fixe 24px, largeur adaptée au nom (min = CW-4, max = CW×6)
- Couleur par criticité (voir charte graphique)
- Contrôles `done` : grisés, semi-transparents
- Clic sur un chip → ouvre la modal de détail

### 3.4 Kanban (50% de la hauteur disponible)

4 colonnes + 1 panel signaux, disposés horizontalement.

#### Colonne 1 — À assigner
- Contrôles sans `assignee` et non `done`
- Liste simple, une carte par contrôle
- Cartes **draggables** (HTML5 drag & drop)
- Barre d'indication visuelle en haut

#### Colonne 2 — En cours · par auditeur
- Une **ligne-membre** par personne de l'équipe (5 membres)
- Chaque ligne est un **drawer accordéon** (clic pour ouvrir/fermer)
- En-tête de ligne : avatar, nom, rôle, badges criticité, barre de charge %
- Contenu ouvert : liste des contrôles assignés à ce membre + zone de drop visible
- La colonne est la **cible du drag & drop** : on dépose une carte sur la ligne du membre voulu
- Alerte toast si la charge du membre > 80%
- À l'assignation, le drawer du membre concerné s'ouvre automatiquement

#### Colonne 3 — Complétés
- Contrôles avec `status === 'done'`
- Cartes grisées avec texte barré

#### Colonne 4 — Picking IA
- Suggestions de contrôles à sélectionner pour le picking aléatoire
- Affiche score, justification courte, tags
- Bordure gauche violette (couleur IA)
- Clic → ouvre modal de détail

#### Panel Signaux IA (fixe, à droite)
- Toujours visible, non scrollable horizontalement
- Largeur fixe ~242px
- 5 cartes de signaux faibles avec icône, titre, description, badge de sévérité

### 3.5 Modal de détail

S'ouvre au clic sur n'importe quel contrôle (timeline, kanban, picking).

**Colonne gauche (flex:1) :**
- Timeline historique des actions (format fil d'ariane avec points colorés)
- Pour chaque entrée : type d'action, auteur, date, description
- Si une question de clôture IA a été posée : bloc violet avec question + réponse
- Zone de saisie de commentaire en bas (textarea expandable au focus)
- Bouton "Envoyer" → ajoute le commentaire en tête de liste

**Colonne droite (248px fixe) :**
- **Analyse IA** : score de risque circulaire (100 - passRate), avec classe de couleur (rouge/jaune/vert)
- **Signaux détectés** : liste des 3 premiers signaux du dashboard, en mini format

### 3.6 Questions de clôture IA

Après chaque contrôle finalisé, l'IA pose 1-2 questions contextuelles adaptées :
- Contrôle échoué → "Quelle est la cause principale ?"
- Récidive d'échec → "Problème ponctuel ou structurel ?"
- Premier contrôle d'un auditeur → "Points de vigilance non documentés ?"
- Contrôle réussi après échecs → "Qu'est-ce qui a changé ?"

Les réponses sont stockées dans l'historique et alimentent la mémoire institutionnelle IA.

### 3.7 Assistant LLM (FAB)

- Bouton flottant ✦ en bas à droite (gradient violet)
- Panel chat 330×460px avec animation d'ouverture spring
- Contexte du dashboard injecté dans chaque requête
- Chips de questions rapides pré-définies (disparaissent après usage) :
  - "Contrôles à risque"
  - "Charge équipe"
  - "Picking recommandé"
  - "Synthèse du mois"
- Animation de typing (3 points) avant réponse
- L'assistant répond en tenant compte des données réelles du dashboard

---

## 4. Comportements interactifs

### Drag & Drop
- Source : cartes de la colonne "À assigner"
- Cible : lignes-membres de la colonne "En cours"
- Feedback visuel : bordure violette + fond légèrement teinté sur la cible survolée
- Post-drop : toast de confirmation (vert OK / orange si surcharge), drawer ouvert automatiquement, re-render du kanban

### Filtres
- Multi-sélection
- Application temps réel sur timeline + kanban
- Recherche texte combinable avec les filtres chips

### Période
- Modes : Semaine (7j) / Mois / Trimestre
- Navigation ‹ › décale d'une unité dans le mode actif
- La timeline se recalcule et se repositionne sur aujourd'hui si visible

### Accordion membres
- Clic sur l'en-tête de ligne → toggle ouvert/fermé
- Chevron rotatif (90°) pour indiquer l'état
- État mémorisé en mémoire (Set d'IDs ouverts)

---

## 5. Logique IA embarquée

### Scoring de picking (algorithme indicatif)
Score = f(ancienneté_picking, taux_échec_historique, changements_périmètre, signaux_faibles_liés, période_risque)

Les contrôles non sélectionnés depuis longtemps, avec historique d'échecs et signaux actifs obtiennent les scores les plus hauts.

### Détection de signaux faibles
Croisements analysés :
- Plusieurs contrôles d'un même domaine en échec simultané → risque systémique
- Délai de réalisation qui s'allonge sur les dernières occurrences → signal dégradation
- Même motif d'échec répété sans action corrective → récidive non traitée
- Charge d'un membre > 80% avec contrôles critiques concentrés → surcharge
- Contrôle non sélectionné en picking depuis N mois → sous-couverture

### Score de risque (modal)
`riskScore = 100 - passRate`
- > 35 → Rouge, "Attention requise"
- 20–35 → Jaune, "Surveillance active"
- < 20 → Vert, "Risque maîtrisé"

---

## 6. Contraintes techniques

- Application **single-file HTML** (HTML + CSS + JS inline)
- **Aucune dépendance externe** sauf Google Fonts
- Chargement des données depuis un CSV parsé en JS au démarrage
- Pas de backend pour le prototype — toutes les mutations sont en mémoire
- Compatible navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Hauteur totale = 100vh, layout entièrement en flex colonnes/lignes, **aucun scroll vertical sur body**
- La timeline et le kanban occupent chacun **exactement 50%** de la hauteur disponible (après header + toolbar)
# Charte graphique — CI Intelligence Dashboard

## 1. Philosophie de design

**Thème :** Clair, professionnel, dense mais lisible  
**Registre :** SaaS enterprise · tableau de bord analytique · outil métier  
**Principe :** L'information prime sur la décoration. Chaque élément visuel a une fonction. L'IA est signalée par une couleur dédiée (violet) mais ne s'impose jamais.

**Ce qu'on évite :**
- Gradients décoratifs gratuits
- Ombres lourdes
- Animations inutiles
- Couleurs trop vives ou trop pâles
- Typo générique (Inter, Roboto, Arial)

---

## 2. Palette de couleurs

### Couleurs de surface (CSS variables)

```css
:root {
  --bg:      #eef0f6;  /* Fond général de l'application */
  --s1:      #ffffff;  /* Surface principale (panels, header, cards) */
  --s2:      #f5f6fa;  /* Surface secondaire (hover, inputs, badges) */
  --s3:      #eceef5;  /* Surface tertiaire (fond de tags, separateurs) */
  --border:  #e0e4ef;  /* Bordure standard */
  --border2: #c8cedc;  /* Bordure renforcée (focus, hover actif) */
}
```

### Couleurs de texte

```css
--text:  #16213a;  /* Texte principal — très foncé, quasi noir */
--text2: #5a6a85;  /* Texte secondaire — gris bleuté */
--text3: #9aaabe;  /* Texte tertiaire — gris clair, labels, placeholders */
```

### Couleurs sémantiques (criticité)

```css
--critical: #dc2626;  /* Critique — rouge */
--high:     #ea6c10;  /* Élevé   — orange */
--medium:   #b58a00;  /* Moyen   — ambre foncé (jamais jaune pur) */
--low:      #16a34a;  /* Faible  — vert */
```

### Couleur IA

```css
--ai:  #7c3aed;  /* Violet principal — accent IA */
--ai2: #6d28d9;  /* Violet foncé — FAB, send button */
```

### Couleur accent (actions, liens, sélections)

```css
--accent: #2563eb;  /* Bleu — onglet actif, bouton principal, today */
```

### Couleurs par domaine métier

```css
Finance:    #2563eb   /* Bleu */
IT:         #7c3aed   /* Violet */
RH:         #0891b2   /* Cyan */
Achats:     #d97706   /* Ambre */
Logistique: #db2777   /* Rose */
Juridique:  #059669   /* Vert émeraude */
```

---

## 3. Typographie

### Polices

```
Principale : Outfit (Google Fonts)
  - Weights utilisés : 300, 400, 500, 600, 700, 800
  - Usage : tout le texte de l'interface

Monospace : DM Mono (Google Fonts)
  - Weights : 400, 500
  - Usage : KPIs numériques, dates, pourcentages, scores IA, codes
```

Import Google Fonts :
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Échelle typographique

| Usage | Taille | Weight | Police |
|---|---|---|---|
| KPI principal | 17px | 700 | DM Mono |
| Titre section | 15px | 700 | Outfit |
| Titre card | 11–12px | 600 | Outfit |
| Corps texte | 11–13px | 400 | Outfit |
| Label section | 10px | 700 | Outfit (uppercase, letter-spacing: .6px) |
| Label micro | 9–10px | 500–600 | Outfit |
| Date / code | 9–10px | 400 | DM Mono |

**Règle :** Les labels de section sont toujours en `text-transform: uppercase` avec `letter-spacing: .5–.8px`.

---

## 4. Espacements et bordures

### Border radius

```css
--r: 7px;   /* Cards, panels, inputs, chips */
/* Boutons primaires : 6px */
/* Pills / badges : 10–20px (border-radius: 20px) */
/* Avatars : 50% */
/* FAB : 50% */
/* Modal : 12px */
```

### Bordures

```css
border: 1px solid var(--border);   /* Bordure standard partout */
border: 1px solid var(--border2);  /* Bordure hover / focus */
```

### Ombres

Utilisation **minimale** :
```css
/* Header */
box-shadow: 0 1px 6px rgba(0,0,0,.06);

/* Card hover */
box-shadow: 0 3px 10px rgba(0,0,0,.07);

/* Modal */
box-shadow: 0 20px 60px rgba(0,0,0,.12);

/* FAB */
box-shadow: 0 4px 18px rgba(124,58,237,.32);
box-shadow: 0 6px 24px rgba(124,58,237,.48);  /* hover */

/* LLM panel */
box-shadow: 0 10px 48px rgba(0,0,0,.09);
```

---

## 5. Composants

### 5.1 Cards de contrôle

```
Background   : var(--s1)
Border       : 1px solid var(--border)
Border-radius: var(--r)
Padding      : 9px 11px 9px 13px  (padding-left plus grand pour la stripe)
Stripe       : bande colorée gauche 3px, hauteur 100%, couleur = criticité
Cursor       : grab (draggable) / pointer (lecture seule)

Hover :
  border-color: var(--border2)
  transform: translateY(-1px)
  box-shadow: 0 3px 10px rgba(0,0,0,.07)
```

### 5.2 Tags / badges

**Tag criticité :**
```css
font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 3px;
/* Critique */ background: #fef2f2; color: #dc2626;
/* Élevé    */ background: #fff7ed; color: #c2410c;
/* Moyen    */ background: #fefce8; color: #92400e;
/* Faible   */ background: #f0fdf4; color: #15803d;
```

**Tag domaine :**
```css
background: var(--s3); color: var(--text2);
/* avec couleur domaine via style inline */
```

**Badge IA :**
```css
font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
background: rgba(124,58,237,.08); color: var(--ai);
border: 1px solid rgba(124,58,237,.18);
padding: 1px 7px; border-radius: 10px;
```

**Badge KPI membre (critique/élevé) :**
```css
font-size: 9px; font-family: DM Mono; padding: 1px 5px; border-radius: 3px;
/* C */ background: #fef2f2; color: var(--critical);
/* H */ background: #fff7ed; color: var(--high);
```

### 5.3 Barre de charge membre

```css
height: 3px; background: var(--s3); border-radius: 2px; overflow: hidden;
/* Fill OK    (≤60%) */ background: var(--low);
/* Fill Warn  (≤80%) */ background: var(--medium);
/* Fill High  (>80%) */ background: var(--critical);
```

### 5.4 Chips de filtre

```css
padding: 3px 9px; font-size: 11px; font-weight: 600; border-radius: 20px;
border: 1px solid var(--border); background: var(--s1); color: var(--text2);

/* Actif — par défaut */
background: var(--text); color: #fff; border-color: var(--text);

/* Actif — par domaine (couleur propre au domaine) */
/* Ex Finance: */ background: #2563eb; border-color: #2563eb; color: #fff;
```

### 5.5 Chips de la timeline

```css
height: 24px; border-radius: 5px; padding: 0 8px;
font-size: 10px; font-weight: 600; white-space: nowrap;
box-shadow: 0 1px 3px rgba(0,0,0,.09);

/* Critique */ background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5;
/* Élevé    */ background: #fff7ed; color: #c2410c; border: 1px solid #fdba74;
/* Moyen    */ background: #fefce8; color: #92400e; border: 1px solid #fde68a;
/* Faible   */ background: #f0fdf4; color: #15803d; border: 1px solid #86efac;
/* Done     */ background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; opacity: .6;

/* Hover */
transform: translateY(-1px);
box-shadow: 0 3px 12px rgba(0,0,0,.14);
z-index: 10;
```

### 5.6 Boutons

**Bouton primaire (Send, Envoyer) :**
```css
background: var(--accent); color: #fff; border: none; border-radius: 6px;
padding: 0 14px; height: 30px; font-family: Outfit; font-size: 11px; font-weight: 600;
hover: background: #1d4ed8;
```

**FAB (Floating Action Button) :**
```css
width: 46px; height: 46px; border-radius: 50%;
background: linear-gradient(135deg, var(--ai2), var(--ai));
color: #fff; font-size: 18px; border: none;
box-shadow: 0 4px 18px rgba(124,58,237,.32);
hover: transform: scale(1.07); box-shadow étendue;
```

**Bouton navigation (‹ ›) :**
```css
background: var(--s2); border: 1px solid var(--border); color: var(--text2);
width: 26px; height: 26px; border-radius: 5px;
hover: background: var(--s3);
```

**Bouton fermer modal (✕) :**
```css
background: var(--s2); border: 1px solid var(--border); color: var(--text2);
width: 26px; height: 26px; border-radius: 6px; font-size: 13px;
hover: background: var(--s3);
```

### 5.7 Score de risque (modal IA)

Cercle de 44×44px, border 2px :
```css
/* Risque élevé (>35)  */ background: #fef2f2; color: #dc2626; border: 2px solid #fca5a5;
/* Risque moyen (20–35)*/ background: #fefce8; color: #b58a00; border: 2px solid #fde68a;
/* Risque faible (<20) */ background: #f0fdf4; color: #16a34a; border: 2px solid #86efac;
font-size: 15px; font-weight: 800; font-family: DM Mono;
```

### 5.8 Drawer membre (ligne kanban)

```css
/* Conteneur */
background: var(--s1); border: 1px solid var(--border); border-radius: var(--r);
transition: .15s;

/* Drop over */
border-color: var(--ai); background: rgba(124,58,237,.03);

/* Header ligne */
padding: 7px 10px; cursor: pointer;
hover: background: var(--s2);

/* Chevron */
font-size: 10px; color: var(--text3);
open: transform: rotate(90deg); transition: .2s;
```

### 5.9 Bloc IA dans l'historique

```css
background: rgba(124,58,237,.04);
border: 1px solid rgba(124,58,237,.12);
border-radius: 6px; padding: 8px; margin-top: 6px;
Label: font-size 9px, font-weight 700, color var(--ai), uppercase, letter-spacing .4px
Question: font-size 10px, color var(--text2), font-style italic
Réponse: font-size 10px, color var(--text), font-weight 500
```

### 5.10 Toast de notification

```css
position: fixed; bottom: 76px; left: 50%; transform: translateX(-50%);
padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
white-space: nowrap; z-index: 999;

/* Succès */ background: #f0fdf4; color: #16a34a; border: 1px solid #86efac;
/* Alerte */ background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5;
Durée: 3 secondes, puis suppression du DOM
```

---

## 6. Layout global

```
100vh
├── Header (52px) — fixe
├── Toolbar (42px) — fixe
└── main-split (flex: 1, flex-direction: column)
    ├── Timeline (flex: 1, min-height: 0) → ~50% de main-split
    └── Kanban  (flex: 1, min-height: 0, flex-direction: row) → ~50%
        ├── Col À assigner     (flex: 1.1)
        ├── Col En cours       (flex: 2.2)
        ├── Col Complétés      (flex: 1)
        ├── Col Picking IA     (flex: 1.2)
        └── Panel Signaux      (width: 242px, flex-shrink: 0)
```

**Règle absolue :** `body` n'a jamais de scroll. Chaque zone scrollable définit son propre `overflow-y: auto` ou `overflow-x: auto`.

---

## 7. Animations et transitions

```css
/* Transitions standard */
transition: .12s;   /* Hover sur chips, filtres, nav */
transition: .15s;   /* Cards, member rows */
transition: .2s;    /* Chevron rotation */
transition: .4s;    /* Barres de charge (fill) */

/* Modal */
animation: fadeIn .18s ease;   /* Overlay */
animation: slideUp .18s ease;  /* Panel */
@keyframes slideUp { from { transform: translateY(12px); opacity: 0; } }

/* LLM Panel (spring) */
transition: .2s cubic-bezier(.34, 1.56, .64, 1);
closed: transform: translateY(16px) scale(.95); opacity: 0;
open:   transform: none; opacity: 1;

/* Typing indicator */
@keyframes bounce { 30% { transform: translateY(-5px); } }
3 dots, animation-delay: 0, .15s, .3s; duration: .9s; infinite;
```

---

## 8. Scrollbars

```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
```

---

## 9. Icônes et représentations visuelles

- **Aucune lib d'icônes** — usage d'emojis natifs pour les signaux (⚠️ 📉 🔄 👤 🕐) et d'emojis inline pour les métadonnées (📁 🔄 📅 👤)
- **Chevron** : caractère `›` rotatif CSS
- **FAB** : caractère `✦` (étoile spéciale)
- **Avatar** : cercle 28–30px, fond `couleur + 18` (18% opacité), texte initiales en couleur pleine

---

## 10. Règles d'accessibilité et d'UX

1. **Contraste** : tout texte sur fond blanc respecte un ratio minimum de 4.5:1
2. **États vides** : toujours afficher un message `color: var(--text3)` centré
3. **Feedback drag** : bordure + fond coloré immédiatement au survol
4. **Toast** : centré en bas, non bloquant, disparaît seul en 3s
5. **Zone de drop visible** : dans chaque drawer membre, afficher explicitement "↓ Déposer ici pour assigner"
6. **Dates en retard** : `color: var(--critical); font-weight: 700;` + texte "· RETARD"
7. **Dates proches (< 5 jours)** : `color: var(--medium);`
8. **Placeholder inputs** : toujours `color: var(--text3)`
9. **Focus visible** : `border-color: var(--border2)` sur tous les inputs au focus, jamais d'outline natif supprimé sans remplacement

# Décisions d'Architecture (ADR)

## ADR-001 : Stack technique
- **Date** : 2026-03-11
- **Statut** : Accepté
- **Décision** : Ruby on Rails 8.1 + Inertia.js + React 18 + Vite
- **Raison** : Rails pour la productivité backend, Inertia pour éviter une SPA complexe avec API, React pour l'écosystème composants
- **Conséquences** : Pas de routing client-side, les controllers Rails gèrent le routing via Inertia

## ADR-002 : Base de données
- **Date** : 2026-03-11
- **Statut** : Accepté
- **Décision** : SQLite en développement, PostgreSQL en production
- **Raison** : SQLite simplifie le setup dev, PostgreSQL pour la robustesse en prod

## ADR-003 : Orchestration IA via Claude Code natif
- **Date** : 2026-03-11
- **Statut** : Accepté
- **Décision** : Utiliser Claude Code comme orchestrateur multi-agents, pas de clé API séparée
- **Raison** : Éviter le doublon de coûts, sub-agents via l'outil Agent intégré

## ADR-004 : RiskSignal au lieu de Signal
- **Date** : 2026-03-11
- **Statut** : Accepté
- **Décision** : Modèle nommé RiskSignal avec self.table_name = "signals"
- **Raison** : Ruby a un module built-in Signal qui empêche de définir Signal < ApplicationRecord

## ADR-005 : Persistent Layout Inertia
- **Date** : 2026-03-11
- **Statut** : Accepté
- **Décision** : Navbar persistante via le pattern Inertia persistent layout (AppLayout)
- **Raison** : Évite le re-render de la navbar à chaque navigation, conserve l'état

## ADR-006 : Design System tokens JS + CSS variables
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Tokens exportés en JS (tokens.js) ET en CSS variables (globals.css)
- **Raison** : JS tokens pour les inline styles React, CSS variables pour les styles de base (body, scrollbars)
- **Fonts** : Outfit (UI) + DM Mono (données numériques)

## ADR-007 : useFilters hook centralisé
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Hook unique useFilters() pour toute la logique de filtrage/période du dashboard
- **Raison** : Centralise period modes (week/month/quarter/custom), domain toggles, criticality, overdue, search
- **Conséquences** : Le Toolbar est purement présentatif, Dashboard passe les props du hook

## ADR-008 : Inline styles React au lieu de CSS modules
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Styles inline via objets JS (const styles = {...}) en bas de chaque composant
- **Raison** : Cohérence avec les tokens JS, co-localisation styles/composant, pas de build CSS supplémentaire

## ADR-009 : API controllers sous namespace Api::
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Mutations (assign, comment, upload) via API JSON controllers avec skip_forgery_protection
- **Raison** : Le drag&drop et les formulaires AJAX n'envoient pas le token CSRF facilement avec Inertia

## ADR-010 : Resizable split pane Timeline/Kanban
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Timeline fit-content par défaut + handle draggable pour resize manuel + double-clic reset
- **Raison** : L'utilisateur veut adapter la vue selon son écran (16" vs 27"), timeline = vue principale

## ADR-011 : Domaines en base de données (modèle Domain)
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Remplacer Control::DOMAINS (constante hardcodée) par un modèle Domain avec CRUD
- **Raison** : L'admin doit pouvoir ajouter/modifier/supprimer des domaines métier sans toucher au code
- **Conséquences** : Control valide domain via Domain.pluck(:key), Domain.key = slug technique, restrict_with_error empêche de supprimer un domaine utilisé

## ADR-012 : Settings page tabbée avec CRUD complet
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Page Settings en 3 onglets (Membres / Contrôles / Domaines) avec CRUD complet sur chaque entité
- **Raison** : L'admin ne doit être bloqué sur rien — contrôles évoluent (lois, processus, politique interne)
- **Conséquences** : API CRUD complète sous /api/ pour les 3 ressources, modales create/edit, confirmation delete

## ADR-013 : Workspace = dashboard personnel 4 panels
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Workspace en grid 2x2 (Timeline perso, Kanban perso, TodoList, Chat équipe)
- **Raison** : Le user non-admin n'a accès qu'à son espace — il doit avoir tous les outils pour travailler efficacement
- **Conséquences** : Composants workspace/ séparés de dashboard/, réutilisent les mêmes données mais filtrées sur le membre

## ADR-014 : Todo = tâches texte libre par membre
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Modèle Todo (content, priority, tags JSON, position) rattaché au Member, CRUD via API nestée
- **Raison** : Le user organise son travail librement, l'admin peut aussi ajouter des tâches depuis Settings
- **Conséquences** : API /api/members/:id/todos avec reorder, visible dans Workspace et Settings

## ADR-015 : Chat équipe via ActionCable
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : TeamMessage + ActionCable (async adapter dev, Redis prod) avec fallback polling 10s
- **Raison** : Communication temps réel entre les membres de l'équipe, intégrée dans le workspace
- **Conséquences** : Channel TeamChatChannel, broadcast après création, @rails/actioncable côté client

## ADR-016 : FAB IA = shell chat UI
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Bouton flottant bottom-right ouvrant un panel chat, shell pour l'instant (réponse automatique)
- **Raison** : Préparer l'intégration LLM future sans bloquer le développement
- **Conséquences** : Composant AiChatFab dans AppLayout, visible sur toutes les pages

## ADR-017 : Auth Devise sur Member (pas de modèle User)
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Ajouter Devise directement sur Member (email, encrypted_password, admin boolean)
- **Raison** : Éviter un modèle User séparé et le mapping User↔Member, plus simple pour le prototype
- **Conséquences** : Seul l'admin peut créer des comptes, login via Inertia POST, sessions Devise

## ADR-018 : Side Navbar remplace Top Navbar
- **Date** : 2026-03-12
- **Statut** : Accepté
- **Décision** : Sidebar verticale collapsible (220px/60px) remplace la navbar horizontale
- **Raison** : Plus esthétique, plus claire, meilleure utilisation de l'espace vertical
- **Conséquences** : AppLayout en flex row, liens conditionnels par rôle admin/membre, état collapsed en localStorage

## ADR-019 : Dock bar macOS remplace FAB IA
- **Date** : 2026-03-13
- **Statut** : Accepté
- **Décision** : Dock bar type macOS en bas de l'écran (drawer hover) remplace le FAB IA flottant
- **Raison** : Navigation plus intuitive, regroupe tous les outils (chat, IA, email, documents, todo, news, profil, settings) en un point unique
- **Conséquences** : Effet CSS `:has()` + unités em pour le zoom, PNG icons, glassmorphisme, zone hover 70px, chaque item ouvre un modal dédié

## ADR-020 : i18n complet FR/EN via Rails locales → Inertia
- **Date** : 2026-03-13
- **Statut** : Accepté
- **Décision** : Toutes les chaînes UI traduites en FR et EN via config/locales/*.yml, transmises par inertia_share
- **Raison** : Application bilingue, le membre choisit sa langue dans la sidebar ou le modal profil
- **Conséquences** : ~180 clés de traduction, hook useTranslation() côté React, fallback sur la clé si traduction absente

## ADR-021 : Documents et News en base de données
- **Date** : 2026-03-13
- **Statut** : Accepté
- **Décision** : Modèles Document et NewsItem en DB avec API JSON, accessibles via les modals du dock
- **Raison** : Cloud documents partagé pour les contrôles, flux actualité interne avec catégories/tags
- **Conséquences** : Active Storage à prévoir pour les vrais fichiers, admin CRUD news à ajouter

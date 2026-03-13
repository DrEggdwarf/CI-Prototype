# Sprint Log

<!-- Format :
## Sprint YYYY-MM-DD — Nom de la feature
- **Tickets** : X exécutés
- **Agents utilisés** : @backend (sonnet), @frontend (haiku), ...
- **Fichiers modifiés** : [liste]
- **Décisions prises** : [résumé]
- **Statut** : Terminé / En cours
-->

## Sprint 2026-03-11 — Boilerplate initial
- **Tickets** : Setup Rails + Inertia + React + Vite + Multi-agents IA
- **Agents utilisés** : aucun (setup manuel)
- **Fichiers créés** :
  - app/controllers/home_controller.rb
  - app/frontend/entrypoints/application.jsx
  - app/frontend/pages/Home.jsx
  - config/vite.json, vite.config.ts, package.json
  - ai/agents/*.yml (8 agents), ai/workflows/*.yml (2 workflows)
  - CLAUDE.md (framework Manager 5 phases)
- **Bugs résolus** :
  - `vite_javascript_tag "application"` génère `.js` mais fichier est `.jsx` → utiliser `"application.jsx"`
  - `@vitejs/plugin-react` nécessite `vite_react_refresh_tag` dans le layout avant le JS
- **Statut** : Terminé

## Sprint 2026-03-11 — i18n + Question Relay
- **Tickets** : i18n multilingue (fr/en) + convention question relay agents
- **Agents utilisés** : aucun (implémentation directe)
- **Fichiers créés** :
  - config/locales/fr.yml, config/locales/en.yml
  - config/initializers/i18n.rb
  - app/controllers/application_controller.rb (locale detection + inertia_share)
  - app/frontend/lib/useTranslation.js
  - app/frontend/components/LocaleSwitcher.jsx
- **Décisions prises** :
  - i18n Option A : Rails détecte la locale, passe traductions via inertia_share
  - Question relay : agents signalent avec `QUESTIONS:` + `BLOCKER: true`
- **Statut** : Terminé

## Sprint 2026-03-11 — Sprint 1 : Backend Foundation
- **Tickets** : 6 (modèles, migrations, seeds, controllers, routes, API)
- **Agents utilisés** : @architect, @database, @backend, @frontend (sub-agents)
- **Fichiers créés** :
  - 6 modèles : Member, Control, Comment, Attachment, RiskSignal, Pick
  - 6 migrations : CreateMembers, CreateControls, CreateComments, CreateAttachments, CreateSignals, CreatePicks
  - db/seeds.rb (8 membres, 200 contrôles, 212 commentaires, 5 signaux, 10 picks)
  - config/routes.rb (root dashboard, workspace/:member_id, settings, api namespace)
  - app/controllers/ : dashboard, workspace, settings, api/base, api/controls, api/comments, api/attachments, api/members
- **Décisions prises** :
  - Signal renommé en RiskSignal (conflit avec Ruby Signal module)
  - API controllers sous namespace Api:: avec skip_forgery_protection
  - Seeds RNG avec Random.new(42) pour reproductibilité
- **Bugs résolus** :
  - Conflit Ruby Signal → renommé RiskSignal avec self.table_name = "signals"
  - Port conflicts WSL2 → fuser -k + kill -9 sur ports 3000/3036
  - Stale server.pid → suppression manuelle tmp/pids/server.pid
- **Statut** : Terminé

## Sprint 2026-03-11 — Sprint 2 : Layout + Navbar + Design System
- **Tickets** : 5 (tokens, globals CSS, navbar, layout, pages shells)
- **Agents utilisés** : @frontend (sub-agents)
- **Fichiers créés** :
  - app/frontend/styles/tokens.js (design tokens JS : colors, fonts, radii)
  - app/frontend/styles/globals.css (CSS variables, Outfit + DM Mono, scrollbars)
  - app/frontend/layouts/AppLayout.jsx (persistent Inertia layout)
  - app/frontend/components/shared/Navbar.jsx (dynamic nav links)
  - app/frontend/pages/Workspace.jsx (shell)
  - app/frontend/pages/Settings.jsx (shell read-only)
- **Fichiers modifiés** :
  - app/frontend/entrypoints/application.jsx (auto-wrap pages in AppLayout)
  - app/controllers/application_controller.rb (current_member_id shared prop)
- **Décisions prises** :
  - Persistent layout Inertia pour navbar entre navigations
  - Navbar en haut avec lien workspace dynamique via current_member_id
- **Statut** : Terminé

## Sprint 2026-03-12 — Sprint 3 : Dashboard Components
- **Tickets** : 6 (KpiBar, Toolbar, Timeline, Kanban, KanbanCard, ControlModal)
- **Agents utilisés** : @frontend (sub-agents)
- **Fichiers créés** :
  - app/frontend/components/dashboard/KpiBar.jsx (5 KPIs)
  - app/frontend/components/dashboard/Toolbar.jsx (période, domaines, filtres, recherche)
  - app/frontend/components/dashboard/Timeline.jsx (Gantt horizontal, lanes, drag-scroll)
  - app/frontend/components/dashboard/Kanban.jsx (4 colonnes, MemberDrawer, PickCard, collapse)
  - app/frontend/components/dashboard/KanbanCard.jsx (carte contrôle avec stripe criticité)
  - app/frontend/components/dashboard/ControlModal.jsx (modal détail avec portal)
  - app/frontend/components/dashboard/SignalPanel.jsx (panel signaux IA)
  - app/frontend/lib/useFilters.js (hook filtrage centralisé)
- **Fichiers modifiés** :
  - app/frontend/pages/Dashboard.jsx (assemblage complet)
- **Statut** : Terminé

## Sprint 2026-03-12 — Corrections & Améliorations UX
- **Tickets** : itérations sur feedback utilisateur (pas de sprint formel)
- **Corrections appliquées** :
  1. Unicode escapes fixés dans Kanban.jsx + ControlModal.jsx (\\u00c0 → À, etc.)
  2. Seeds répartis sur toute l'année 2026 (janvier-décembre au lieu de mars-mai)
  3. Timeline drag-to-scroll ajouté (mousedown/move/up, seuil 3px)
  4. Custom date range picker ajouté (chip Personnalisé + formulaire inline)
  5. Kanban colonnes repliables (collapse/expand avec header clickable)
  6. KanbanCard tailles augmentées (padding, fonts 10-13px)
  7. Timeline auto-sizing : panel flex "0 0 auto" + maxHeight 70%
  8. Timeline lanes/chips agrandis : LANE_H=42, CHIP_H=32, CW=48, font 12px
  9. Kanban filtres par colonne cumulatifs (Set criticités, tout sélectionné par défaut)
  10. Resizer draggable entre timeline et kanban (double-clic = reset)
  11. KanbanCard texte sur 2 lignes (-webkit-line-clamp: 2)
- **Statut** : Terminé

## Sprint 2026-03-12 — Sprint 4 : Workspace + API Integration + Toasts
- **Tickets** : 4 (API backend, Dashboard API, Workspace page, Toast system)
- **Agents utilisés** : @frontend x2 (sub-agents parallèles), Manager direct
- **Fichiers créés** :
  - app/frontend/lib/useToast.js (ToastProvider context + composant toast stack)
- **Fichiers modifiés** :
  - app/frontend/pages/Dashboard.jsx (handleAssign → fetch PATCH + toast success/warning charge)
  - app/frontend/components/dashboard/ControlModal.jsx (commentaires → fetch POST + optimistic UI)
  - app/frontend/pages/Workspace.jsx (page complète : header membre, contrôles groupés, commentaires, statut)
  - app/frontend/layouts/AppLayout.jsx (wrappé avec ToastProvider)
  - app/frontend/styles/globals.css (animation toast-slide-in)
- **Fonctionnalités livrées** :
  - Drag&drop assign fonctionnel (API réelle + reload Inertia)
  - Commentaires dans ControlModal (optimistic UI + rollback erreur)
  - Workspace agent : header membre, contrôles par statut, panel inline avec commentaires + "marquer terminé"
  - Toast notifications : success (assignation), warning (charge > 80%), error (échec)
- **Statut** : Terminé

## Sprint 2026-03-12 — Sprint 5 : Settings — Admin CRUD Complet
- **Tickets** : 5 (Domain model, API CRUD, Settings tabbé, Controls tab, Domains tab)
- **Agents utilisés** : @database (sonnet), @backend (sonnet), @frontend x3 (sonnet, parallèles)
- **Fichiers créés** :
  - db/migrate/20260312093807_create_domains.rb
  - app/models/domain.rb
  - app/controllers/api/domains_controller.rb
  - app/frontend/components/settings/MembersTab.jsx
  - app/frontend/components/settings/ControlsTab.jsx
  - app/frontend/components/settings/DomainsTab.jsx
- **Fichiers modifiés** :
  - app/models/control.rb (suppression DOMAINS constant, lien Domain dynamique)
  - config/routes.rb (CRUD complet members, controls, domains)
  - app/controllers/api/controls_controller.rb (index, create, destroy + params étendus)
  - app/controllers/api/members_controller.rb (create, destroy)
  - app/controllers/settings_controller.rb (domains DB, controls avec assignee)
  - app/frontend/pages/Settings.jsx (réécriture : layout tabbé 3 onglets)
  - db/seeds.rb (création domaines avant contrôles)
- **Décisions prises** :
  - Domaines désormais en DB (modèle Domain) au lieu de constante hardcodée
  - Settings page = admin complet avec 3 onglets (Membres / Contrôles / Domaines)
  - CRUD via API JSON + router.reload() + toast notifications
  - Domain.key comme clé technique (slug), restrict_with_error sur delete
- **Statut** : Terminé

## Sprint 2026-03-12 — Sprint 6 : UX Fixes + Navbar + Workspace v2 + FAB + Todo + Chat
- **Tickets** : 8 (quick fixes, navbar, FAB IA, modèles DB, API, workspace timeline+kanban, todo+chat, settings todo)
- **Agents utilisés** : @frontend x6 (parallèles), @database (sonnet), @backend (sonnet), Manager (assemblage)
- **Fichiers créés** :
  - app/frontend/components/shared/AiChatFab.jsx (FAB IA + panel chat shell)
  - app/frontend/components/workspace/WorkspaceTimeline.jsx (timeline perso)
  - app/frontend/components/workspace/WorkspaceKanban.jsx (kanban perso 3 colonnes)
  - app/frontend/components/workspace/TodoPanel.jsx (todo list éditable)
  - app/frontend/components/workspace/TeamChatPanel.jsx (chat équipe temps réel)
  - app/models/todo.rb + db/migrate/20260312140001_create_todos.rb
  - app/models/team_message.rb + db/migrate/20260312140002_create_team_messages.rb
  - app/channels/team_chat_channel.rb (ActionCable)
  - app/controllers/api/todos_controller.rb (CRUD + reorder)
  - app/controllers/api/team_messages_controller.rb (index + create + broadcast)
- **Fichiers modifiés** :
  - app/frontend/pages/Workspace.jsx (réécriture complète : grid 4 panels)
  - app/frontend/components/shared/Navbar.jsx (centrée, dropdown profil, langue FR/EN)
  - app/frontend/components/dashboard/KanbanCard.jsx (minHeight fixe, flexShrink: 0)
  - app/frontend/components/dashboard/Kanban.jsx (flexShrink: 0 sur drawers)
  - app/frontend/components/settings/MembersTab.jsx (gestion todos par membre)
  - app/frontend/components/settings/DomainsTab.jsx (fix prop défensive)
  - app/frontend/layouts/AppLayout.jsx (AiChatFab ajouté)
  - app/controllers/application_controller.rb (current_member partagé)
  - app/controllers/workspace_controller.rb (todos, team_messages, all_members)
  - app/controllers/settings_controller.rb (todos)
  - app/models/member.rb (has_many :todos, :team_messages)
  - config/routes.rb (todos nestés, team_messages)
  - db/seeds.rb (todos + team_messages)
  - package.json (@rails/actioncable)
- **Décisions prises** :
  - Workspace = dashboard personnel en 4 panels grid (timeline, kanban, todo, chat)
  - Todo = tâches texte libre par membre, priorité, tags JSON, position triable
  - Chat équipe via ActionCable (async dev, Redis prod) avec fallback polling
  - FAB IA = shell chat UI, connexion LLM prévue sprint futur
  - Navbar avec dropdown profil (infos membre, liens, langue, déconnexion)
- **Statut** : Terminé

## Sprint 2026-03-12 — Sprint 7 : Auth Devise + Side Navbar
- **Tickets** : 5 (Devise setup, auth controllers, login page, side navbar, rôle client)
- **Agents utilisés** : @backend x2 (sonnet), @frontend x2 (sonnet, parallèles)
- **Fichiers créés** :
  - app/frontend/pages/Auth/Login.jsx (page connexion Inertia)
  - app/frontend/components/shared/Sidebar.jsx (sidebar verticale collapsible)
  - app/controllers/members/sessions_controller.rb (Devise custom pour Inertia)
  - db/migrate/20260312140003_add_devise_to_members.rb (email, password, admin)
  - config/initializers/devise.rb
- **Fichiers modifiés** :
  - app/models/member.rb (devise + admin?)
  - app/controllers/application_controller.rb (authenticate_member!, require_admin!)
  - app/controllers/dashboard_controller.rb (require_admin!)
  - app/controllers/settings_controller.rb (require_admin!)
  - app/controllers/workspace_controller.rb (authorize_workspace!)
  - app/controllers/api/members_controller.rb (require_admin! + email/password/admin params)
  - app/controllers/api/domains_controller.rb (require_admin!)
  - app/frontend/layouts/AppLayout.jsx (Sidebar remplace Navbar)
  - config/routes.rb (devise_for custom sessions)
  - db/seeds.rb (email + password + admin)
  - Gemfile (gem devise)
- **Décisions prises** :
  - Auth Devise directement sur Member (pas de User séparé)
  - Admin: robin.borg@verisure.fr, membres classiques avec emails générés
  - Side navbar collapsible (220px/60px), liens conditionnels par rôle
  - Admin → Dashboard + Settings + tous Workspaces. Membre → son Workspace uniquement
  - Login page sans AppLayout, POST Inertia pour CSRF
- **Statut** : Terminé

## Sprint 2026-03-13 — Sprint 8 : Dock Bar, i18n complet, UX Polish, Documents & News

- **Tickets** : 14+ (dock bar, 7 modals, i18n FR/EN, sidebar icons, toolbar responsive, KPI fix, kanban collapse, DnD fix, documents, news, glassmorphisme)
- **Agents utilisés** : @frontend x8 (parallèles), @backend x3, @database x2, @security, @architect, @quality, @testing, @a11y, @performance
- **Fichiers créés** :
  - app/frontend/components/shared/DockBar.jsx (dock macOS avec effet CSS :has(), em units)
  - app/frontend/components/dock/DockModal.jsx (modal portal générique)
  - app/frontend/components/dock/ChatModal.jsx (chat équipe autonome)
  - app/frontend/components/dock/AiModal.jsx (shell assistant IA)
  - app/frontend/components/dock/TodoModal.jsx (todo list autonome)
  - app/frontend/components/dock/ProfileModal.jsx (profil + préférences + stats)
  - app/frontend/components/dock/EmailModal.jsx (générateur reporting mail, preview live)
  - app/frontend/components/dock/DocumentsModal.jsx (cloud documents partagé)
  - app/frontend/components/dock/NewsModal.jsx (flux actualité avec tags/filtres)
  - app/models/document.rb + migration
  - app/models/news_item.rb + migration
  - app/controllers/api/documents_controller.rb
  - app/controllers/api/news_items_controller.rb
  - public/icons/ (8 PNG icons macOS style)
- **Fichiers modifiés** :
  - app/frontend/layouts/AppLayout.jsx (DockBar + DockModal, suppression AiChatFab)
  - app/frontend/components/shared/Sidebar.jsx (Font Awesome icons, i18n)
  - app/frontend/components/dashboard/Toolbar.jsx (responsive fix, glassmorphisme, i18n)
  - app/frontend/components/dashboard/KpiBar.jsx (non-cliquable, i18n)
  - app/frontend/components/dashboard/Kanban.jsx (typo augmentée, i18n)
  - app/frontend/components/dashboard/SignalPanel.jsx (typo augmentée, i18n)
  - app/frontend/components/dashboard/KanbanCard.jsx (i18n)
  - app/frontend/components/dashboard/ControlModal.jsx (i18n)
  - app/frontend/components/workspace/WorkspaceKanban.jsx (colonnes collapsibles, DnD fix, i18n)
  - app/frontend/pages/Dashboard.jsx, Workspace.jsx, Settings.jsx, Auth/Login.jsx (i18n)
  - app/frontend/components/settings/*.jsx (i18n)
  - app/frontend/components/workspace/TodoPanel.jsx, TeamChatPanel.jsx (i18n)
  - config/locales/fr.yml, config/locales/en.yml (~180 clés de traduction)
  - config/routes.rb (documents, news_items)
  - db/seeds.rb (documents, news_items)
  - app/models/control.rb (ajout statut "in_progress")
  - app/controllers/application_controller.rb (APP_LOCALE_KEYS étendu)
- **Décisions prises** :
  - Dock bar macOS remplace FAB IA — présent sur toutes les pages, drawer hover bottom
  - Chaque item du dock ouvre un modal dédié (Chat, IA, Email, Documents, Todo, Actualité, Profil, Paramètres)
  - Email modal = générateur de rapport avec preview live HTML
  - Documents = cloud partagé avec filtres type, lien contrôle
  - News = flux RSS interne avec catégories et tags
  - i18n complet FR/EN sur toutes les pages
  - Toolbar dashboard : glassmorphisme
  - Dock : zone hover étendue (70px) pour meilleure ergonomie
- **Bugs résolus** :
  - DnD Workspace kanban : targetStatus dupliqué → ajout statut "in_progress"
  - Security : uploaded_by_id mass-assignment → forcé à current_member.id
  - i18n Login : translations vides → passage via sessions_controller + fallbacks
- **Statut** : Terminé

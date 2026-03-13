# frozen_string_literal: true

# =============================================================================
# Seeds — Contrôle Interne (Verisure Prototype)
# Idempotent : supprime puis recrée toutes les données.
# =============================================================================

puts "🧹 Nettoyage des données existantes..."
Document.destroy_all
NewsItem.destroy_all
Pick.destroy_all
Comment.destroy_all
Attachment.destroy_all
Control.destroy_all
RiskSignal.destroy_all
Todo.destroy_all
TeamMessage.destroy_all
Member.destroy_all
Domain.destroy_all

# ---------------------------------------------------------------------------
# 0. DOMAINES (6)
# ---------------------------------------------------------------------------
puts "🏷️  Création des domaines..."

domains_data = [
  { name: "Finance",     key: "finance",     color: "#2563eb", position: 0, description: "Contrôles financiers, comptables et de trésorerie" },
  { name: "IT",          key: "it",          color: "#7c3aed", position: 1, description: "Contrôles des systèmes d'information, cybersécurité et infrastructure" },
  { name: "RH",          key: "rh",          color: "#0891b2", position: 2, description: "Contrôles des ressources humaines, paie et conformité sociale" },
  { name: "Achats",      key: "achats",      color: "#d97706", position: 3, description: "Contrôles des processus achats, fournisseurs et approvisionnements" },
  { name: "Logistique",  key: "logistique",  color: "#db2777", position: 4, description: "Contrôles logistiques, stocks, transport et entreposage" },
  { name: "Juridique",   key: "juridique",   color: "#059669", position: 5, description: "Contrôles juridiques, conformité réglementaire et contractuelle" }
]

domains_data.each { |attrs| Domain.create!(attrs) }
puts "   ✅ #{Domain.count} domaines créés"

# ---------------------------------------------------------------------------
# 1. MEMBRES (8)
# ---------------------------------------------------------------------------
puts "👥 Création des membres..."

members_data = [
  { name: "Robin Borg",       role: "Responsable CI",    initials: "RB", color: "#6366f1", load: 85, email: "robin.borg@verisure.fr",       password: "azerty", admin: true },
  { name: "Marc Dupont",      role: "Auditeur Senior",   initials: "MD", color: "#f59e0b", load: 75, email: "marc.dupont@verisure.fr",      password: "azerty", admin: false },
  { name: "Nadia Belkacem",   role: "Contrôleuse",       initials: "NB", color: "#10b981", load: 60, email: "nadia.belkacem@verisure.fr",   password: "azerty", admin: false },
  { name: "Thomas Renard",    role: "Auditeur",          initials: "TR", color: "#ef4444", load: 45, email: "thomas.renard@verisure.fr",    password: "azerty", admin: false },
  { name: "Claire Moreau",    role: "Auditrice Senior",  initials: "CM", color: "#8b5cf6", load: 90, email: "claire.moreau@verisure.fr",    password: "azerty", admin: false },
  { name: "Julien Petit",     role: "Contrôleur",        initials: "JP", color: "#3b82f6", load: 35, email: "julien.petit@verisure.fr",     password: "azerty", admin: false },
  { name: "Fatima Zahra",     role: "Auditrice",         initials: "FZ", color: "#ec4899", load: 55, email: "fatima.zahra@verisure.fr",     password: "azerty", admin: false },
  { name: "David Chen",       role: "Analyste Risques",  initials: "DC", color: "#14b8a6", load: 20, email: "david.chen@verisure.fr",       password: "azerty", admin: false }
]

members = members_data.map { |attrs| Member.create!(attrs) }
puts "   ✅ #{Member.count} membres créés"

# ---------------------------------------------------------------------------
# 2. CONTRÔLES (200)
# ---------------------------------------------------------------------------
puts "📋 Création des 200 contrôles..."

# Noms réalistes par domaine
control_names = {
  "finance" => [
    "Réconciliation bancaire mensuelle",
    "Validation rapprochement fournisseurs",
    "Contrôle balance âgée clients",
    "Vérification écritures de cut-off",
    "Revue provisions clients douteux",
    "Contrôle TVA déductible",
    "Audit notes de frais direction",
    "Contrôle trésorerie quotidienne",
    "Vérification imputation analytique",
    "Contrôle rapprochement inter-sociétés",
    "Revue engagements hors bilan",
    "Validation écritures d'inventaire",
    "Contrôle immobilisations en cours",
    "Rapprochement comptabilité auxiliaire",
    "Vérification journaux de ventes",
    "Contrôle caisse et espèces",
    "Revue provisions pour risques",
    "Contrôle factures à établir",
    "Vérification charges constatées d'avance",
    "Contrôle produits constatés d'avance",
    "Audit créances clients export",
    "Contrôle devises et couvertures",
    "Vérification emprunts et intérêts",
    "Contrôle comptes d'attente",
    "Revue écritures manuelles significatives",
    "Contrôle lettrage comptes tiers",
    "Vérification TVA collectée",
    "Contrôle paiements fournisseurs",
    "Revue marges brutes par activité",
    "Contrôle budget vs réalisé mensuel",
    "Vérification amortissements comptables",
    "Contrôle valorisation des stocks",
    "Revue crédit clients et limites",
    "Contrôle flux de trésorerie prévisionnels"
  ],
  "it" => [
    "Contrôle accès au SI",
    "Revue logs serveurs critiques",
    "Test plan de reprise d'activité",
    "Contrôle sauvegardes quotidiennes",
    "Revue comptes à privilèges élevés",
    "Audit licences logicielles",
    "Contrôle changements en production",
    "Scan de vulnérabilités trimestriel",
    "Revue droits d'accès applications métier",
    "Contrôle politique mots de passe",
    "Test restauration sauvegardes",
    "Audit sécurité réseau",
    "Contrôle mises à jour critiques",
    "Revue séparation des environnements",
    "Contrôle antivirus et EDR",
    "Test plan de continuité informatique",
    "Revue accès VPN et télétravail",
    "Contrôle flux réseau sortants",
    "Audit configuration pare-feu",
    "Contrôle gestion des incidents IT",
    "Revue SLA prestataires hébergement",
    "Contrôle chiffrement données sensibles",
    "Test de phishing interne",
    "Revue journaux d'authentification",
    "Contrôle accès bases de données",
    "Vérification certificats SSL/TLS",
    "Contrôle comptes de service",
    "Revue politique BYOD",
    "Contrôle décommissionnement serveurs",
    "Audit cloud et données externalisées",
    "Revue gestion des correctifs",
    "Contrôle segmentation réseau",
    "Test de charge applications critiques",
    "Contrôle accès physique salle serveurs"
  ],
  "rh" => [
    "Contrôle paie mensuelle",
    "Vérification déclarations sociales",
    "Audit temps de travail",
    "Contrôle habilitations DRH",
    "Revue contrats intérimaires",
    "Contrôle soldes de tout compte",
    "Vérification cotisations retraite",
    "Contrôle registre du personnel",
    "Revue politique rémunération variable",
    "Contrôle conformité contrats de travail",
    "Vérification DSN mensuelle",
    "Contrôle absences et congés",
    "Audit formation obligatoire",
    "Revue entretiens annuels réalisés",
    "Contrôle médecine du travail",
    "Vérification mutuelle et prévoyance",
    "Contrôle égalité professionnelle H/F",
    "Revue notes de frais collaborateurs",
    "Contrôle avantages en nature",
    "Vérification obligations DOETH",
    "Contrôle procédures disciplinaires",
    "Revue accords d'entreprise",
    "Contrôle télétravail et avenants",
    "Vérification index égalité salariale",
    "Contrôle DPAE et formalités embauche",
    "Revue organigramme et délégations",
    "Contrôle heures supplémentaires",
    "Vérification élections CSE",
    "Contrôle clauses de non-concurrence",
    "Revue politique mobilité interne",
    "Contrôle participation et intéressement",
    "Vérification portabilité droits",
    "Contrôle documents de fin de contrat",
    "Revue plan de développement des compétences"
  ],
  "achats" => [
    "Validation bons de commande",
    "Contrôle réception marchandises",
    "Audit fournisseurs critiques",
    "Revue engagements hors budget",
    "Contrôle séparation des tâches achats",
    "Vérification contrats cadres fournisseurs",
    "Contrôle appels d'offres conformité",
    "Revue conditions tarifaires négociées",
    "Contrôle factures sans commande",
    "Audit base fournisseurs doublons",
    "Vérification RIB fournisseurs",
    "Contrôle seuils de commande",
    "Revue risque fournisseur unique",
    "Contrôle délais de paiement légaux",
    "Vérification conformité sous-traitance",
    "Contrôle achats hors catalogue",
    "Revue performances fournisseurs QCD",
    "Contrôle engagements pluriannuels",
    "Audit processus demande d'achat",
    "Vérification assurances fournisseurs",
    "Contrôle conformité RSE fournisseurs",
    "Revue litiges fournisseurs en cours",
    "Contrôle avoirs fournisseurs",
    "Vérification clauses pénalités contrats",
    "Contrôle achats inter-sociétés",
    "Revue budget achats vs consommé",
    "Contrôle réceptions partielles",
    "Vérification certificats qualité fournisseurs",
    "Contrôle achats d'urgence",
    "Revue renouvellement contrats",
    "Contrôle consignations et emballages",
    "Vérification conformité devoir de vigilance",
    "Contrôle frais généraux récurrents",
    "Revue sourcing alternatif"
  ],
  "logistique" => [
    "Inventaire tournant mensuel",
    "Contrôle expéditions quotidien",
    "Revue écarts de stock",
    "Audit transporteurs annuel",
    "Contrôle conditions de stockage",
    "Vérification traçabilité lots",
    "Contrôle retours et avoirs logistiques",
    "Revue taux de service livraison",
    "Contrôle picking et préparation",
    "Audit conformité ADR matières dangereuses",
    "Vérification calibrage instruments pesée",
    "Contrôle températures chambre froide",
    "Revue coûts logistiques par canal",
    "Contrôle emballages et conditionnement",
    "Vérification documents douaniers",
    "Contrôle inventaire annuel",
    "Revue optimisation tournées livraison",
    "Contrôle stock de sécurité",
    "Vérification assurances transport",
    "Contrôle réception qualité entrants",
    "Revue obsolescence produits stockés",
    "Contrôle gestion des déchets",
    "Vérification plan de chargement",
    "Contrôle suivi GPS flotte",
    "Revue indicateurs supply chain",
    "Contrôle accès zones entrepôt",
    "Vérification contrats entreposage",
    "Contrôle consommables emballage",
    "Revue capacité stockage vs prévisions",
    "Contrôle cross-docking opérations",
    "Vérification normes HACCP entrepôt",
    "Contrôle litiges transport",
    "Revue politique de palettisation",
    "Contrôle inventaire produits périssables"
  ],
  "juridique" => [
    "Revue contrats cadres",
    "Contrôle conformité RGPD",
    "Veille réglementaire trimestrielle",
    "Audit procurations bancaires",
    "Contrôle délégations de signature",
    "Revue contentieux en cours",
    "Contrôle conformité anti-corruption",
    "Vérification registre des traitements RGPD",
    "Contrôle assurances groupe",
    "Revue clauses contractuelles types",
    "Contrôle droit des sociétés AG/CA",
    "Vérification obligations CNIL",
    "Contrôle propriété intellectuelle",
    "Revue engagements conditionnels",
    "Contrôle conformité Sapin II",
    "Vérification politique cadeaux et invitations",
    "Contrôle cartographie des risques juridiques",
    "Revue mandats sociaux",
    "Contrôle conformité droit du travail",
    "Vérification registre bénéficiaires effectifs",
    "Contrôle sanctions internationales",
    "Revue politique protection des données",
    "Contrôle obligations déclaratives annuelles",
    "Vérification conformité DORA",
    "Contrôle archivage légal",
    "Revue pouvoir de représentation",
    "Contrôle clauses de confidentialité",
    "Vérification conformité LCB-FT",
    "Contrôle gestion des réclamations",
    "Revue politique lanceurs d'alerte",
    "Contrôle conventions réglementées",
    "Vérification conformité taxonomie UE",
    "Contrôle reporting extra-financier",
    "Revue accords de non-divulgation"
  ]
}

# Distribution par domaine : proportionnelle, total = 200
domain_counts = {
  "finance"     => 34,
  "it"          => 34,
  "rh"          => 34,
  "achats"      => 34,
  "logistique"  => 32,
  "juridique"   => 32
}

# Criticality weights: ~15% critical, ~25% high, ~35% medium, ~25% low
criticality_weights = [
  *Array.new(15, "critical"),
  *Array.new(25, "high"),
  *Array.new(35, "medium"),
  *Array.new(25, "low")
]

# Frequency weights
frequency_weights = [
  *Array.new(5, "daily"),
  *Array.new(15, "weekly"),
  *Array.new(35, "monthly"),
  *Array.new(30, "quarterly"),
  *Array.new(15, "yearly")
]

# Status weights: ~30% done, ~10% overdue, ~60% pending
status_weights = [
  *Array.new(30, "done"),
  *Array.new(10, "overdue"),
  *Array.new(60, "pending")
]

# Seed RNG pour résultats reproductibles
rng = Random.new(42)

# Dates : étalées sur toute l'année 2026 (janvier à décembre)
today = Date.new(2026, 3, 12)
year_start = Date.new(2026, 1, 1)
year_end   = Date.new(2026, 12, 31)
year_days  = (year_end - year_start).to_i  # 364

controls = []
control_index = 0

domain_counts.each do |domain, count|
  names = control_names[domain].shuffle(random: rng)

  count.times do |i|
    name = names[i % names.size]
    criticality = criticality_weights.sample(random: rng)
    frequency = frequency_weights.sample(random: rng)
    status = status_weights.sample(random: rng)
    duration = rng.rand(1..8)

    # Cohérence statut / date — réparti uniformément sur 2026
    case status
    when "overdue"
      # due_date doit être dans le passé (1 jan → 11 mars 2026)
      days_before = (today - year_start).to_i  # 70 jours
      due_date = year_start + rng.rand(0..[days_before - 1, 0].max)
    when "done"
      # due_date passée ou récente (1 jan → aujourd'hui + 20 jours)
      latest = [year_start + ((today - year_start).to_i + 20), year_end].min
      due_date = year_start + rng.rand(0..(latest - year_start).to_i)
    when "pending"
      # due_date plutôt future (quelques jours avant aujourd'hui → 31 déc)
      earliest = [today - 5, year_start].max
      due_date = earliest + rng.rand(0..(year_end - earliest).to_i)
    end

    pass_rate = case status
                when "done" then rng.rand(70..100)
                when "overdue" then rng.rand(40..75)
                else rng.rand(50..95)
                end

    # ~70% assignés
    assignee = rng.rand(100) < 70 ? members.sample(random: rng) : nil

    control = Control.create!(
      name: name,
      domain: domain,
      criticality: criticality,
      frequency: frequency,
      status: status,
      duration: duration,
      due_date: due_date,
      pass_rate: pass_rate,
      assignee: assignee
    )

    controls << control
    control_index += 1
  end
end

puts "   ✅ #{Control.count} contrôles créés"

# Stats par domaine
Domain.ordered.pluck(:key).each do |d|
  cnt = Control.where(domain: d).count
  puts "      #{d.ljust(12)} → #{cnt}"
end

# Stats par statut
Control::STATUSES.each do |s|
  cnt = Control.where(status: s).count
  puts "      #{s.ljust(12)} → #{cnt}"
end

# ---------------------------------------------------------------------------
# 3. COMMENTAIRES (2-4 par contrôle done/overdue)
# ---------------------------------------------------------------------------
puts "💬 Création des commentaires..."

action_types = %w[controle_reussi echec note assignation relance]

comment_bodies = {
  "controle_reussi" => [
    "Contrôle réalisé avec succès. Aucune anomalie détectée.",
    "Résultats conformes aux attendus. Documentation archivée.",
    "Vérification terminée. Toutes les pièces justificatives sont présentes.",
    "Contrôle passé. Écarts mineurs corrigés en séance.",
    "Exécution conforme. Rapport transmis au responsable.",
    "Contrôle validé. Les indicateurs sont dans les seuils acceptables.",
    "Revue effectuée sans observation. Prochaine échéance planifiée.",
    "Contrôle bouclé. Conformité totale constatée."
  ],
  "echec" => [
    "Anomalie détectée : écart significatif par rapport au référentiel.",
    "Contrôle échoué. Documentation manquante pour 3 opérations.",
    "Non-conformité identifiée. Action corrective requise sous 5 jours.",
    "Écart majeur constaté. Escalade au responsable CI en cours.",
    "Résultat non satisfaisant. Demande de justificatifs complémentaires envoyée.",
    "Contrôle KO. Procédure non respectée sur 2 points critiques.",
    "Échec du contrôle : données incomplètes dans le système source.",
    "Non-conformité récurrente. Proposition de plan d'action corrective."
  ],
  "note" => [
    "Point d'attention : le délai de réponse du service concerné s'allonge.",
    "Note : nouveau référentiel applicable à partir du mois prochain.",
    "Information : le périmètre de ce contrôle sera élargi au T2.",
    "Remarque : process stable, envisager passage en fréquence trimestrielle.",
    "Note interne : bien penser à inclure la filiale dans le scope.",
    "Observation : tendance positive sur les 3 derniers mois.",
    "Note : la méthodologie a été mise à jour conformément à l'audit externe.",
    "Point de suivi : attente retour du service juridique sur ce dossier."
  ],
  "assignation" => [
    "Contrôle assigné suite à la revue d'allocation des charges.",
    "Réassignation effectuée pour équilibrer la charge de l'équipe.",
    "Prise en charge du contrôle suite au départ de l'auditeur précédent.",
    "Assignation validée en comité de pilotage CI.",
    "Transfert de responsabilité acté. Passation documentée.",
    "Nouvel assigné désigné. Briefing effectué."
  ],
  "relance" => [
    "Relance envoyée au responsable opérationnel. Délai : 48h.",
    "Deuxième relance. En attente des justificatifs depuis 10 jours.",
    "Relance escaladée à la direction. Blocage depuis 2 semaines.",
    "Rappel envoyé pour fourniture des documents manquants.",
    "Relance formelle par email. Copie au N+1 du responsable.",
    "Troisième relance. Risque de non-conformité signalé au COMEX."
  ]
}

authors = members.map(&:name)

done_or_overdue = controls.select { |c| c.status.in?(%w[done overdue]) }

done_or_overdue.each do |control|
  nb_comments = rng.rand(2..4)
  # Générer des dates de commentaire étalées avant la due_date
  base_date = [control.due_date, today].min
  comment_dates = nb_comments.times.map { base_date - rng.rand(1..45) }.sort

  nb_comments.times do |i|
    action = if control.status == "done" && i == nb_comments - 1
               "controle_reussi"
             elsif control.status == "overdue" && i == nb_comments - 1
               rng.rand(2) == 0 ? "echec" : "relance"
             else
               action_types.sample(random: rng)
             end

    body = comment_bodies[action].sample(random: rng)
    author = authors.sample(random: rng)

    Comment.create!(
      control: control,
      author: author,
      action_type: action,
      body: body,
      created_at: comment_dates[i],
      updated_at: comment_dates[i]
    )
  end
end

puts "   ✅ #{Comment.count} commentaires créés"

# ---------------------------------------------------------------------------
# 4. SIGNAUX FAIBLES (5)
# ---------------------------------------------------------------------------
puts "⚡ Création des signaux faibles..."

signals_data = [
  {
    icon: "trending-up",
    title: "Hausse des anomalies achats",
    description: "Le taux d'échec des contrôles achats a augmenté de 18% ce trimestre. 4 contrôles fournisseurs en non-conformité récurrente. Risque de fraude ou de défaillance processus à investiguer.",
    severity: "h"
  },
  {
    icon: "clock",
    title: "Retards chroniques domaine RH",
    description: "Les contrôles paie et déclarations sociales accusent un retard moyen de 8 jours sur les 3 derniers mois. L'équipe RH signale un manque de ressources pour fournir les justificatifs.",
    severity: "m"
  },
  {
    icon: "shield-alert",
    title: "Comptes à privilèges non revus depuis 6 mois",
    description: "La revue des comptes à privilèges élevés (Active Directory, bases de données, cloud) n'a pas été réalisée au T4 2025 ni au T1 2026. Risque d'accès non autorisé critique.",
    severity: "h"
  },
  {
    icon: "file-warning",
    title: "Écarts d'inventaire récurrents",
    description: "Les 3 derniers inventaires tournants montrent un taux d'écart supérieur à 3%, contre un seuil acceptable de 1%. Les articles high-value sont particulièrement concernés.",
    severity: "m"
  },
  {
    icon: "scale",
    title: "Nouvelle réglementation DORA non intégrée",
    description: "L'entrée en vigueur de DORA (Digital Operational Resilience Act) nécessite la mise à jour de 12 contrôles IT et la création de 3 nouveaux contrôles. Échéance de conformité : juin 2026.",
    severity: "l"
  }
]

signals_data.each { |attrs| RiskSignal.create!(attrs) }
puts "   ✅ #{RiskSignal.count} signaux faibles créés"

# ---------------------------------------------------------------------------
# 5. PICKS IA (10)
# ---------------------------------------------------------------------------
puts "🤖 Création des picks IA..."

# Sélectionner 10 contrôles pending variés pour les picks
pending_controls = controls.select { |c| c.status == "pending" }.shuffle(random: rng)
pickable = pending_controls.first(10)

pick_reasons = [
  "Contrôle critique non exécuté depuis 45 jours avec un historique d'échecs récurrents. Priorité haute recommandée.",
  "Corrélation détectée entre ce contrôle et 2 signaux faibles actifs. Risque systémique potentiel.",
  "Le pass_rate de ce contrôle est en baisse de 15 points sur les 6 derniers mois. Tendance préoccupante.",
  "Contrôle réglementaire avec échéance proche. Non-conformité potentielle en cas de retard.",
  "Nouveau périmètre impacté par un changement organisationnel récent. Risque de gap de contrôle.",
  "Fournisseur critique associé avec un score de risque dégradé. Contrôle préventif recommandé.",
  "Contrôle bloqué depuis 3 relances sans réponse du service opérationnel. Escalade suggérée.",
  "Domaine sous-contrôlé par rapport au risk appetite défini. Rééquilibrage nécessaire.",
  "Anomalie statistique détectée sur les données source. Vérification manuelle recommandée.",
  "Contrôle à forte interdépendance : 4 autres contrôles en dépendent. Impact cascade potentiel."
]

pick_tags_options = [
  ["critique", "réglementaire"],
  ["tendance", "dégradation"],
  ["corrélation", "signal-faible"],
  ["échéance", "conformité"],
  ["organisationnel", "gap"],
  ["fournisseur", "risque-tiers"],
  ["escalade", "blocage"],
  ["sous-contrôle", "risk-appetite"],
  ["anomalie", "données"],
  ["interdépendance", "cascade"]
]

pickable.each_with_index do |control, idx|
  score = case idx
          when 0..2 then rng.rand(85..98)
          when 3..5 then rng.rand(65..84)
          else rng.rand(45..64)
          end

  Pick.create!(
    control: control,
    score: score,
    reason: pick_reasons[idx],
    tags: pick_tags_options[idx]
  )
end

puts "   ✅ #{Pick.count} picks IA créés"

# ---------------------------------------------------------------------------
# 6. TODOS (3-5 par membre)
# ---------------------------------------------------------------------------
puts "📝 Création des todos..."

todo_contents = [
  "Finaliser le rapport d'audit Q1 2026",
  "Relire la procédure de réconciliation bancaire",
  "Préparer la réunion COMEX sur les risques IT",
  "Mettre à jour la cartographie des risques achats",
  "Vérifier les accès VPN des prestataires externes",
  "Rédiger la note de synthèse contrôle paie février",
  "Planifier les inventaires tournants du mois prochain",
  "Envoyer les relances fournisseurs en retard",
  "Valider les KPIs du tableau de bord CI",
  "Revoir les clauses contractuelles du contrat LogiTrans",
  "Mettre à jour le registre des traitements RGPD",
  "Préparer le support de formation contrôle interne",
  "Analyser les écarts d'inventaire entrepôt Sud",
  "Suivre le plan d'action corrective achats hors catalogue",
  "Documenter la nouvelle procédure de validation BC",
  "Contacter le cabinet d'audit externe pour le planning",
  "Consolider les résultats des contrôles IT trimestriels",
  "Vérifier la conformité des notes de frais direction",
  "Mettre à jour le backlog des contrôles en retard",
  "Préparer l'ordre du jour du comité de pilotage CI",
  "Réviser les seuils d'alerte du scoring fournisseurs",
  "Archiver les dossiers de contrôle clôturés en janvier",
  "Organiser le point hebdomadaire avec l'équipe audit",
  "Rédiger le compte-rendu de la revue des risques",
  "Demander les justificatifs manquants au service RH",
  "Tester la restauration des sauvegardes serveur prod",
  "Vérifier les délégations de signature à jour",
  "Préparer le reporting mensuel pour la direction",
  "Suivre les actions correctives du dernier audit",
  "Mettre à jour la matrice RACI du processus achats"
]

todo_tags_options = [
  ["urgent"],
  ["review"],
  ["documentation"],
  ["urgent", "review"],
  ["documentation", "review"],
  ["urgent", "documentation"],
  ["planification"],
  ["suivi"],
  ["conformité"],
  ["audit"],
  []
]

priorities = %w[low medium high]
priority_weights = [*Array.new(25, "low"), *Array.new(50, "medium"), *Array.new(25, "high")]

shuffled_todos = todo_contents.shuffle(random: rng)
todo_idx = 0

members.each do |member|
  nb_todos = rng.rand(3..5)

  nb_todos.times do |i|
    content = shuffled_todos[todo_idx % shuffled_todos.size]
    todo_idx += 1

    completed = rng.rand(100) < 35
    priority = priority_weights.sample(random: rng)
    tags = todo_tags_options.sample(random: rng)

    Todo.create!(
      member: member,
      content: content,
      completed: completed,
      priority: priority,
      position: i,
      tags: tags.to_json
    )
  end
end

puts "   ✅ #{Todo.count} todos créés"

# ---------------------------------------------------------------------------
# 7. MESSAGES D'ÉQUIPE (20 messages sur les dernières 48h)
# ---------------------------------------------------------------------------
puts "💬 Création des messages d'équipe..."

now = Time.current
messages_data = [
  { body: "Bonjour à tous, je lance la campagne de contrôles du mois de mars. Merci de vérifier vos assignations.", offset_hours: 47 },
  { body: "J'ai détecté un écart significatif sur la réconciliation bancaire de février. @Sophie, tu peux jeter un œil ?", offset_hours: 45 },
  { body: "Les justificatifs pour le contrôle paie de février sont enfin arrivés. Je les uploade dans l'outil.", offset_hours: 43 },
  { body: "Rappel : le comité de pilotage CI est prévu jeudi à 14h. Merci de préparer vos points de suivi.", offset_hours: 40 },
  { body: "Le scan de vulnérabilités trimestriel est terminé. 3 findings medium, 0 critical. Rapport disponible.", offset_hours: 38 },
  { body: "J'ai relancé le service achats pour les contrôles en retard. Toujours pas de réponse depuis 10 jours.", offset_hours: 35 },
  { body: "Bonne nouvelle : le taux de conformité global remonte à 87% ce mois-ci. On progresse !", offset_hours: 32 },
  { body: "Est-ce que quelqu'un peut prendre en charge les contrôles logistiques pendant l'absence de Thomas ?", offset_hours: 28 },
  { body: "Je me porte volontaire pour les contrôles logistiques. Je regarde le périmètre cet après-midi.", offset_hours: 27 },
  { body: "Merci Fatima ! Je te fais un briefing rapide par Teams à 15h.", offset_hours: 26 },
  { body: "Attention : nouvelle version du référentiel achats applicable au 1er avril. J'envoie le diff par mail.", offset_hours: 22 },
  { body: "J'ai terminé la revue des comptes à privilèges. 2 comptes orphelins identifiés, désactivation en cours.", offset_hours: 19 },
  { body: "Le reporting mensuel est prêt. Je l'envoie à la direction demain matin première heure.", offset_hours: 16 },
  { body: "Point rapide : les inventaires tournants de mars montrent une amélioration, écart à 1.8% (vs 3.2% en février).", offset_hours: 12 },
  { body: "J'ai mis à jour la matrice des risques IT avec les résultats du dernier pentest. RAS côté critique.", offset_hours: 10 },
  { body: "Quelqu'un a accès au dossier partagé des contrôles juridiques ? Je n'arrive plus à y accéder.", offset_hours: 8 },
  { body: "C'est corrigé, c'était un problème de droits AD. Tu devrais pouvoir y accéder maintenant.", offset_hours: 7 },
  { body: "Merci David ! C'est bon, ça fonctionne.", offset_hours: 6 },
  { body: "Je finis le contrôle des provisions pour risques ce soir. Résultats demain matin.", offset_hours: 3 },
  { body: "N'oubliez pas de mettre à jour vos statuts dans l'outil avant vendredi soir. Bon courage à tous !", offset_hours: 1 }
]

# Assign messages to members in a realistic conversation pattern
message_authors = [
  members[0], # Sophie Laurent - Responsable CI
  members[1], # Marc Dupont
  members[2], # Nadia Belkacem
  members[0], # Sophie Laurent
  members[4], # Claire Moreau
  members[1], # Marc Dupont
  members[0], # Sophie Laurent
  members[0], # Sophie Laurent
  members[6], # Fatima Zahra
  members[3], # Thomas Renard
  members[4], # Claire Moreau
  members[7], # David Chen
  members[2], # Nadia Belkacem
  members[3], # Thomas Renard
  members[7], # David Chen
  members[5], # Julien Petit
  members[7], # David Chen
  members[5], # Julien Petit
  members[1], # Marc Dupont
  members[0]  # Sophie Laurent
]

messages_data.each_with_index do |msg, idx|
  created = now - msg[:offset_hours].hours

  TeamMessage.create!(
    member: message_authors[idx],
    body: msg[:body],
    created_at: created,
    updated_at: created
  )
end

puts "   ✅ #{TeamMessage.count} messages d'équipe créés"

# ---------------------------------------------------------------------------
# 8. DOCUMENTS (10)
# ---------------------------------------------------------------------------
puts "📄 Création des documents..."

# Sample controls by domain for realistic attachment
finance_controls  = controls.select { |c| c.domain == "finance" }.first(5)
it_controls       = controls.select { |c| c.domain == "it" }.first(5)
rh_controls       = controls.select { |c| c.domain == "rh" }.first(3)
juridique_controls = controls.select { |c| c.domain == "juridique" }.first(3)

documents_seed = [
  {
    name: "Procédure de réconciliation bancaire",
    file_url: "https://docs.verisure.fr/finance/procedure-reconciliation-bancaire.pdf",
    file_type: "pdf",
    file_size: 245_120,
    description: "Procédure détaillée pour la réconciliation bancaire mensuelle, incluant les étapes de validation et les responsabilités.",
    uploaded_by: members[0],
    control: finance_controls[0],
    shared: true
  },
  {
    name: "Matrice des risques IT 2026",
    file_url: "https://docs.verisure.fr/it/matrice-risques-it-2026.xlsx",
    file_type: "xlsx",
    file_size: 87_040,
    description: "Cartographie complète des risques IT avec scoring, probabilité d'occurrence et mesures de mitigation.",
    uploaded_by: members[7],
    control: it_controls[0],
    shared: true
  },
  {
    name: "Rapport d'audit interne Q4 2025",
    file_url: "https://docs.verisure.fr/audit/rapport-audit-interne-q4-2025.pdf",
    file_type: "pdf",
    file_size: 1_024_000,
    description: "Rapport complet de l'audit interne du quatrième trimestre 2025, avec observations et recommandations.",
    uploaded_by: members[1],
    control: nil,
    shared: true
  },
  {
    name: "Plan de contrôle annuel 2026",
    file_url: "https://docs.verisure.fr/planning/plan-controle-annuel-2026.xlsx",
    file_type: "xlsx",
    file_size: 156_672,
    description: "Planning annuel de tous les contrôles prévus en 2026, avec fréquences, assignations et domaines.",
    uploaded_by: members[0],
    control: nil,
    shared: true
  },
  {
    name: "Référentiel contrôle interne v3.2",
    file_url: "https://docs.verisure.fr/referentiel/referentiel-ci-v3.2.docx",
    file_type: "docx",
    file_size: 512_000,
    description: "Version à jour du référentiel de contrôle interne. Inclut les mises à jour réglementaires DORA et Sapin II.",
    uploaded_by: members[4],
    control: nil,
    shared: true
  },
  {
    name: "Résultats scan vulnérabilités T1 2026",
    file_url: "https://docs.verisure.fr/it/scan-vulnerabilites-t1-2026.pdf",
    file_type: "pdf",
    file_size: 324_608,
    description: "Rapport du scan de vulnérabilités trimestriel. 3 findings medium, 0 critical. Actions correctives planifiées.",
    uploaded_by: members[7],
    control: it_controls[1],
    shared: true
  },
  {
    name: "Tableau de bord KPIs contrôle interne",
    file_url: "https://docs.verisure.fr/reporting/tableau-bord-kpis-ci.pptx",
    file_type: "pptx",
    file_size: 2_097_152,
    description: "Présentation PowerPoint du tableau de bord mensuel destinée au COMEX.",
    uploaded_by: members[0],
    control: nil,
    shared: true
  },
  {
    name: "Politique de gestion des accès SI",
    file_url: "https://docs.verisure.fr/it/politique-gestion-acces-si.pdf",
    file_type: "pdf",
    file_size: 198_656,
    description: "Politique officielle de gestion des droits d'accès aux systèmes d'information, validée par la DSI.",
    uploaded_by: members[7],
    control: it_controls[2],
    shared: true
  },
  {
    name: "Modèle contrat fournisseur type",
    file_url: "https://docs.verisure.fr/juridique/modele-contrat-fournisseur-type.docx",
    file_type: "docx",
    file_size: 73_728,
    description: "Template de contrat fournisseur intégrant les clauses RSE, RGPD, et devoir de vigilance.",
    uploaded_by: members[4],
    control: juridique_controls[0],
    shared: true
  },
  {
    name: "Capture écran anomalie réconciliation fév.",
    file_url: "https://docs.verisure.fr/finance/anomalie-reconciliation-fev-2026.png",
    file_type: "image",
    file_size: 524_288,
    description: "Capture d'écran illustrant l'écart détecté lors de la réconciliation bancaire de février 2026.",
    uploaded_by: members[1],
    control: finance_controls[1],
    shared: false
  }
]

documents_seed.each { |attrs| Document.create!(attrs) }
puts "   ✅ #{Document.count} documents créés"

# ---------------------------------------------------------------------------
# 9. NEWS ITEMS (18)
# ---------------------------------------------------------------------------
puts "📰 Création des news items..."

now_time = Time.current

news_seed = [
  {
    title: "DORA : publication des normes techniques définitives par l'ESMA",
    summary: "L'Autorité européenne des marchés financiers a publié le 15 janvier 2026 les normes techniques réglementaires définitives (RTS) concernant le Digital Operational Resilience Act. Les établissements financiers disposent de 6 mois pour se mettre en conformité sur les volets ICT risk management et incident reporting.",
    source_url: "https://www.esma.europa.eu/press-news/esma-news/dora-rts-published",
    source_name: "ESMA",
    category: "cyber",
    tags: ["DORA", "réglementation", "conformité", "ICT"],
    published_at: now_time - 55.days,
    pinned: true
  },
  {
    title: "Sapin II : actualisation du guide pratique AFA 2026",
    summary: "L'Agence Française Anticorruption a mis à jour en février 2026 son guide pratique sur la mise en conformité Sapin II. Nouvelles précisions sur le devoir de vigilance des filiales et le renforcement des obligations de cartographie des risques de corruption.",
    source_url: "https://www.agence-francaise-anticorruption.gouv.fr/guide-sapin-ii-2026",
    source_name: "AFA",
    category: "juridique",
    tags: ["Sapin II", "anticorruption", "AFA"],
    published_at: now_time - 40.days,
    pinned: true
  },
  {
    title: "Bilan des contrôles IT : résultats du scan T1 2026",
    summary: "Le scan de vulnérabilités trimestriel réalisé par l'équipe IT Security a identifié 3 findings de sévérité moyenne et aucun finding critique. Les correctifs ont été appliqués sur l'ensemble des systèmes en moins de 72 heures. Le rapport complet est disponible dans le cloud partagé.",
    source_url: nil,
    source_name: "Interne",
    category: "interne",
    tags: ["IT", "sécurité", "scan", "T1-2026"],
    published_at: now_time - 30.days,
    pinned: false
  },
  {
    title: "ANSSI : nouvelles recommandations sécurité des SI industriels",
    summary: "L'ANSSI a publié un guide actualisé sur la sécurisation des systèmes industriels (OT/ICS). Ce document introduit 12 nouvelles mesures obligatoires pour les opérateurs d'importance vitale et recommande une revue complète des architectures réseau segmentées.",
    source_url: "https://www.ssi.gouv.fr/guide/si-industriels-2026",
    source_name: "ANSSI",
    category: "cyber",
    tags: ["ANSSI", "OT", "ICS", "sécurité industrielle"],
    published_at: now_time - 25.days,
    pinned: false
  },
  {
    title: "RGPD : le montant moyen des amendes CNIL en hausse de 34% en 2025",
    summary: "La CNIL a publié son bilan annuel 2025 faisant état d'une hausse significative des sanctions. Le montant moyen des amendes a augmenté de 34%. Les principaux manquements constatés concernent le défaut de base légale, les transferts hors UE non conformes et la durée de conservation excessive des données.",
    source_url: "https://www.cnil.fr/bilan-sanctions-2025",
    source_name: "CNIL",
    category: "juridique",
    tags: ["RGPD", "CNIL", "sanctions", "données personnelles"],
    published_at: now_time - 22.days,
    pinned: false
  },
  {
    title: "Taux de conformité global : 87% en mars 2026",
    summary: "Le tableau de bord de contrôle interne de mars 2026 affiche un taux de conformité global de 87%, en hausse de 5 points par rapport à février. Les domaines finance et juridique progressent fortement. Le domaine achats reste sous surveillance avec un taux de 72%.",
    source_url: nil,
    source_name: "Interne",
    category: "interne",
    tags: ["KPI", "conformité", "tableau-de-bord"],
    published_at: now_time - 12.days,
    pinned: true
  },
  {
    title: "Décret sur l'index égalité professionnelle : nouvelles obligations 2026",
    summary: "Un décret paru au Journal Officiel du 3 février 2026 renforce les obligations de publication de l'index égalité H/F pour les entreprises de plus de 50 salariés. Les indicateurs relatifs aux augmentations individuelles et aux retours de congé maternité font l'objet de nouvelles modalités de calcul.",
    source_url: "https://www.legifrance.gouv.fr/jorf/decret-egalite-pro-2026",
    source_name: "Legifrance",
    category: "rh",
    tags: ["égalité professionnelle", "index H/F", "décret"],
    published_at: now_time - 38.days,
    pinned: false
  },
  {
    title: "Point de vigilance : fraude au virement bancaire en hausse",
    summary: "La Fédération Bancaire Française alerte sur une recrudescence des tentatives de fraude au virement international ciblant les services comptables et financiers. Les techniques de social engineering et d'usurpation d'identité de dirigeants (fraude au président) sont en forte progression au T1 2026.",
    source_url: "https://www.fbf.fr/alerte-fraude-virement-2026",
    source_name: "FBF",
    category: "finance",
    tags: ["fraude", "virement", "cybersécurité", "finance"],
    published_at: now_time - 18.days,
    pinned: false
  },
  {
    title: "Résultats inventaire tournant mars 2026 : écart à 1.8%",
    summary: "L'inventaire tournant de mars 2026 affiche un taux d'écart de 1.8%, en nette amélioration par rapport aux 3.2% de février. Les actions correctives menées sur les articles high-value portent leurs fruits. Objectif : revenir sous le seuil de 1% d'ici mai 2026.",
    source_url: nil,
    source_name: "Interne",
    category: "interne",
    tags: ["inventaire", "logistique", "écart"],
    published_at: now_time - 10.days,
    pinned: false
  },
  {
    title: "NIS2 : transposition en droit français publiée",
    summary: "La transposition de la directive NIS2 en droit français a été publiée au Journal Officiel. Elle étend le périmètre des entités concernées à plusieurs milliers de nouvelles organisations, impose des obligations renforcées de gestion des risques cyber et introduit des délais stricts de notification d'incidents (24h pour signalement initial).",
    source_url: "https://www.legifrance.gouv.fr/jorf/ordonnance-nis2-2026",
    source_name: "Legifrance",
    category: "cyber",
    tags: ["NIS2", "cybersécurité", "réglementation", "incident"],
    published_at: now_time - 50.days,
    pinned: false
  },
  {
    title: "LCB-FT : nouvelles lignes directrices ACPR sur la vigilance renforcée",
    summary: "L'ACPR a publié de nouvelles lignes directrices sur la lutte contre le blanchiment de capitaux et le financement du terrorisme. Focus sur la vigilance renforcée à l'égard des PPE et des relations d'affaires avec les pays à risque élevé selon le GAFI.",
    source_url: "https://acpr.banque-france.fr/lgd-lcb-ft-2026",
    source_name: "ACPR",
    category: "juridique",
    tags: ["LCB-FT", "ACPR", "blanchiment", "conformité"],
    published_at: now_time - 35.days,
    pinned: false
  },
  {
    title: "Lancement du nouveau portail de signalement interne",
    summary: "Conformément aux obligations de la loi Sapin II et de la directive Lanceurs d'alerte, le nouveau portail de signalement interne est en ligne depuis le 1er mars 2026. Tous les collaborateurs peuvent désormais signaler des manquements éthiques de manière sécurisée et anonyme.",
    source_url: nil,
    source_name: "Interne",
    category: "interne",
    tags: ["lanceur d'alerte", "éthique", "Sapin II"],
    published_at: now_time - 13.days,
    pinned: false
  },
  {
    title: "Hausse du SMIC au 1er janvier 2026 : impact sur les contrôles paie",
    summary: "Le SMIC a été revalorisé de 2.2% au 1er janvier 2026, passant à 1 801,80 € bruts mensuels. Les équipes RH doivent vérifier la conformité des rémunérations minimales conventionnelles dans les prochains contrôles paie et actualiser les paramétrages des logiciels de paie.",
    source_url: "https://www.service-public.fr/particuliers/vosdroits/smic-2026",
    source_name: "Service-Public",
    category: "rh",
    tags: ["SMIC", "paie", "rémunération"],
    published_at: now_time - 70.days,
    pinned: false
  },
  {
    title: "Alerte sécurité : vulnérabilité critique OpenSSL (CVE-2026-1337)",
    summary: "Une vulnérabilité critique de type buffer overflow a été découverte dans OpenSSL (versions 3.0 à 3.3). Un correctif est disponible. Toutes les équipes IT sont invitées à procéder à la mise à jour en urgence sur les serveurs exposés. Score CVSS : 9.8.",
    source_url: "https://www.cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2026-1337",
    source_name: "ANSSI",
    category: "cyber",
    tags: ["CVE", "OpenSSL", "patch", "urgence"],
    published_at: now_time - 8.days,
    pinned: true
  },
  {
    title: "Résultats revue comptes à privilèges : 2 comptes orphelins désactivés",
    summary: "La revue des comptes à privilèges élevés (Active Directory, bases de données, accès cloud) réalisée en mars 2026 a permis d'identifier et de désactiver 2 comptes orphelins actifs depuis plus de 90 jours. Aucun accès non autorisé constaté. Prochaine revue planifiée en juin.",
    source_url: nil,
    source_name: "Interne",
    category: "interne",
    tags: ["comptes à privilèges", "AD", "sécurité"],
    published_at: now_time - 7.days,
    pinned: false
  },
  {
    title: "Taxonomie UE : rapport de durabilité obligatoire pour 2026",
    summary: "Dans le cadre de la CSRD, les entreprises soumises à l'obligation de reporting extra-financier doivent intégrer les indicateurs de la taxonomie européenne dans leur rapport de durabilité 2026. Le contrôle de la conformité de ces déclarations est désormais du ressort des équipes de contrôle interne.",
    source_url: "https://www.ecologie.gouv.fr/csrd-taxonomie-ue",
    source_name: "Ministère Ecologie",
    category: "juridique",
    tags: ["CSRD", "taxonomie UE", "ESG", "reporting"],
    published_at: now_time - 45.days,
    pinned: false
  },
  {
    title: "Hausse des coûts logistiques : impact sur les contrôles fournisseurs",
    summary: "L'indice du coût du transport routier a progressé de 7.3% sur le premier trimestre 2026. Cette hausse impacte les marges et nécessite une révision des contrôles sur les conditions tarifaires négociées avec les prestataires logistiques. Revue des contrats cadres recommandée avant fin T2.",
    source_url: "https://www.aft.asso.fr/indice-cout-transport-t1-2026",
    source_name: "AFT",
    category: "finance",
    tags: ["logistique", "coûts", "fournisseurs", "transport"],
    published_at: now_time - 20.days,
    pinned: false
  },
  {
    title: "Formation obligatoire : mise à jour e-learning anticorruption disponible",
    summary: "Le module de formation e-learning anticorruption a été mis à jour pour intégrer les nouvelles lignes directrices AFA 2026. La formation est obligatoire pour l'ensemble des collaborateurs exposés. Les équipes RH doivent suivre les taux de complétion et s'assurer que 100% des collaborateurs concernés sont formés avant le 30 juin 2026.",
    source_url: nil,
    source_name: "Interne",
    category: "interne",
    tags: ["formation", "anticorruption", "e-learning", "Sapin II"],
    published_at: now_time - 5.days,
    pinned: false
  }
]

news_seed.each { |attrs| NewsItem.create!(attrs) }
puts "   ✅ #{NewsItem.count} news items créés"

# ---------------------------------------------------------------------------
# RÉSUMÉ FINAL
# ---------------------------------------------------------------------------
puts ""
puts "=" * 60
puts " SEED TERMINÉ"
puts "=" * 60
puts " Members       : #{Member.count}"
puts " Controls      : #{Control.count}"
puts " Comments      : #{Comment.count}"
puts " Signals       : #{RiskSignal.count}"
puts " Picks         : #{Pick.count}"
puts " Attachments   : #{Attachment.count}"
puts " Todos         : #{Todo.count}"
puts " TeamMessages  : #{TeamMessage.count}"
puts " Documents     : #{Document.count}"
puts " NewsItems     : #{NewsItem.count}"
puts "=" * 60

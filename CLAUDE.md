# CLAUDE.md — RedditLeads

## Ce que fait cette app

RedditLeads est un SaaS qui aide les entrepreneurs et marketeurs à trouver des clients potentiels sur Reddit. L'utilisateur configure des mots-clés et des subreddits à surveiller. L'app scanne Reddit automatiquement, affiche les posts pertinents dans un feed, et aide l'utilisateur à rédiger des réponses (avec templates et IA) pour générer des leads.

## Modèle économique

3 plans : Free, Pro (29€/mois), Business (79€/mois).
Les limites varient par plan : nombre de projets, keywords, scans, réponses IA, export CSV.
Paiement via Stripe.

## Stack technique

- **Framework** : Next.js 14+ (App Router)
- **UI** : Tailwind CSS + shadcn/ui
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth (email/password + Google OAuth)
- **API Reddit** : snoowrap (wrapper JS pour l'API Reddit)
- **Paiements** : Stripe (Checkout + webhooks pour gérer les abonnements)
- **Déploiement** : Vercel
- **Langage** : TypeScript (strict)

## Structure du projet

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Pages publiques (login, signup, onboarding)
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── (dashboard)/        # Pages protégées (nécessitent auth)
│   │   ├── feed/
│   │   ├── keywords/
│   │   ├── subreddits/
│   │   ├── templates/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── billing/
│   ├── api/                # API Routes
│   │   ├── reddit/         # Scan Reddit, fetch posts
│   │   ├── replies/        # Générer réponses IA
│   │   ├── stripe/         # Webhooks Stripe
│   │   └── cron/           # Jobs planifiés (scans auto)
│   ├── layout.tsx
│   └── page.tsx            # Landing page / redirect
├── components/
│   ├── ui/                 # Composants shadcn/ui (button, dialog, etc.)
│   ├── layout/             # Sidebar, Header, Navigation
│   ├── feed/               # PostCard, PostList, Filters
│   ├── keywords/           # KeywordForm, KeywordList
│   ├── templates/          # TemplateEditor, TemplateList
│   └── shared/             # EmptyState, LoadingState, UpgradeNudge
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Client Supabase (browser)
│   │   ├── server.ts       # Client Supabase (server)
│   │   └── middleware.ts   # Middleware auth
│   ├── reddit/
│   │   └── client.ts       # Client API Reddit
│   ├── stripe/
│   │   └── client.ts       # Config Stripe
│   └── utils.ts            # Fonctions utilitaires
├── hooks/                  # Custom React hooks
├── types/                  # Types TypeScript partagés
└── constants/              # Constantes (plans, limites, etc.)
```

## Modèle de données (tables Supabase)

### users
- id (uuid, PK, = auth.users.id)
- email (text)
- full_name (text, nullable)
- plan (text : 'free' | 'pro' | 'business', default 'free')
- stripe_customer_id (text, nullable)
- stripe_subscription_id (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

### projects
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- name (text)
- url (text, nullable — URL du produit/service)
- description (text, nullable)
- is_active (boolean, default true)
- created_at (timestamptz)

### keywords
- id (uuid, PK)
- project_id (uuid, FK → projects.id)
- keyword (text)
- is_active (boolean, default true)
- created_at (timestamptz)

### subreddits
- id (uuid, PK)
- project_id (uuid, FK → projects.id)
- name (text — sans le r/)
- is_active (boolean, default true)
- created_at (timestamptz)

### posts
- id (uuid, PK)
- project_id (uuid, FK → projects.id)
- reddit_id (text, unique — l'ID Reddit du post)
- title (text)
- body (text, nullable)
- author (text)
- subreddit (text)
- url (text — lien vers le post Reddit)
- score (integer)
- num_comments (integer)
- matched_keyword (text — le keyword qui a matché)
- relevance_score (integer, nullable — 1 à 10)
- status (text : 'new' | 'replied' | 'skipped' | 'saved', default 'new')
- reddit_created_at (timestamptz)
- found_at (timestamptz)

### replies
- id (uuid, PK)
- post_id (uuid, FK → posts.id)
- user_id (uuid, FK → users.id)
- content (text — le texte de la réponse)
- template_id (uuid, FK → templates.id, nullable)
- is_sent (boolean, default false)
- sent_at (timestamptz, nullable)
- tracking_clicks (integer, default 0)
- created_at (timestamptz)

### templates
- id (uuid, PK)
- project_id (uuid, FK → projects.id)
- name (text)
- content (text — avec placeholders comme {{product}}, {{keyword}})
- is_default (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)

### scans
- id (uuid, PK)
- project_id (uuid, FK → projects.id)
- status (text : 'running' | 'completed' | 'failed')
- posts_found (integer, default 0)
- started_at (timestamptz)
- completed_at (timestamptz, nullable)

## Conventions de code

### Général
- TypeScript strict partout, jamais de `any`
- Noms de fichiers en kebab-case : `post-card.tsx`, `use-posts.ts`
- Composants React en PascalCase : `PostCard`, `KeywordList`
- Un composant par fichier
- Imports absolus avec `@/` (déjà configuré par Next.js dans tsconfig)

### Composants
- Toujours des function components (jamais de class)
- Props typées avec une interface au-dessus du composant
- Utiliser shadcn/ui au maximum avant de créer un composant custom
- Pas de CSS custom — Tailwind uniquement

### Data fetching
- Server Components par défaut pour le fetch initial
- Client Components (`"use client"`) uniquement quand il faut de l'interactivité
- Supabase côté serveur pour les pages, côté client pour les mutations temps réel

### Gestion d'erreurs
- Toujours gérer les cas : loading, error, empty, data
- Utiliser les composants EmptyState et LoadingState partagés
- Toast (sonner) pour les feedbacks utilisateur (succès, erreur)

## Plans et limites

| Feature              | Free  | Pro (29€) | Business (79€) |
|----------------------|-------|-----------|-----------------|
| Projets              | 1     | 5         | Illimité        |
| Keywords par projet  | 3     | 20        | Illimité        |
| Subreddits surveillés| 3     | 20        | Illimité        |
| Scans par jour       | 1     | 12        | Temps réel      |
| Réponses IA / mois   | 10    | 100       | Illimité        |
| Export CSV           | Non   | Oui       | Oui             |
| Analytics            | Basic | Complet   | Complet + API   |

## Écrans de l'app (référence wireframe)

1. **Onboarding** (3 étapes) : Nom du projet → Ajouter keywords → Ajouter subreddits → Premier scan
2. **Feed** : Liste des posts trouvés, filtres (subreddit, keyword, date, statut), tri, actions (répondre, skip, sauvegarder)
3. **Keywords** : CRUD keywords, toggle actif/inactif, compteur de posts trouvés par keyword
4. **Subreddits** : CRUD subreddits, toggle actif/inactif
5. **Templates** : CRUD templates de réponses, placeholders, template par défaut
6. **Analytics** : Posts trouvés/jour, réponses envoyées, taux de réponse, top keywords
7. **Settings** (4 onglets) : Profil, Projet, Notifications, Compte
8. **Billing** : Plan actuel, usage, upgrade/downgrade, historique factures

## Ordre de développement

Phase 1 — Fondations :
1. Scaffold Next.js + Tailwind + shadcn/ui
2. Supabase : setup projet, tables, RLS policies
3. Auth : signup, login, logout, middleware protection routes
4. Layout dashboard : sidebar, header, navigation

Phase 2 — Cœur produit :
5. Onboarding : création projet + keywords + subreddits
6. Intégration Reddit API : scan par keywords/subreddits
7. Feed : affichage posts, filtres, tri
8. Reply flow : génération réponse (template d'abord, IA ensuite)

Phase 3 — Features complètes :
9. Templates CRUD
10. Analytics (basique : compteurs et graphiques)
11. Settings (profil, projet, notifications)

Phase 4 — Monétisation :
12. Stripe : checkout, webhooks, gestion abonnements
13. Limites par plan (enforcement côté serveur)
14. Upgrade nudges dans l'UI

## Notes pour Claude Code

- Je suis débutant en dev. Explique les étapes quand c'est pas évident.
- Quand tu crées un fichier, mets un commentaire en haut qui explique à quoi il sert.
- Ne fais pas tout d'un coup. Avance étape par étape, teste chaque étape avant de passer à la suivante.
- Si tu as besoin d'une variable d'environnement (clé API, URL Supabase, etc.), dis-le moi clairement avec le format exact à mettre dans `.env.local`.
- Privilégie toujours la solution la plus simple qui fonctionne. Pas d'over-engineering.
- Si quelque chose nécessite une action manuelle de ma part (créer un compte, cliquer dans une interface, copier une clé), dis-le explicitement.

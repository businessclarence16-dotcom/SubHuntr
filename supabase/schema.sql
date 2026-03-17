-- =============================================================
-- RedditLeads / SubHuntr — Schéma complet de la base de données
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- =============================================================

-- ========================
-- TABLE : users
-- Profil utilisateur, lié à auth.users de Supabase
-- ========================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'agency')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================
-- TABLE : projects
-- Un utilisateur peut avoir plusieurs projets (selon son plan)
-- ========================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========================
-- TABLE : keywords
-- Mots-clés à surveiller pour un projet donné
-- ========================
create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  keyword text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========================
-- TABLE : subreddits
-- Subreddits à surveiller pour un projet donné
-- ========================
create table public.subreddits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========================
-- TABLE : posts
-- Posts Reddit trouvés lors des scans
-- ========================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reddit_id text not null unique,
  title text not null,
  body text,
  author text not null,
  subreddit text not null,
  url text not null,
  score integer not null default 0,
  num_comments integer not null default 0,
  matched_keyword text not null,
  relevance_score integer check (relevance_score between 1 and 10),
  status text not null default 'new' check (status in ('new', 'replied', 'skipped', 'saved')),
  reddit_created_at timestamptz not null,
  found_at timestamptz not null default now()
);

-- ========================
-- TABLE : templates
-- Templates de réponses avec placeholders ({{product}}, {{keyword}}, etc.)
-- ========================
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================
-- TABLE : replies
-- Réponses rédigées par l'utilisateur pour un post
-- ========================
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  template_id uuid references public.templates(id) on delete set null,
  is_sent boolean not null default false,
  sent_at timestamptz,
  tracking_clicks integer not null default 0,
  created_at timestamptz not null default now()
);

-- ========================
-- TABLE : scans
-- Historique des scans Reddit effectués
-- ========================
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  posts_found integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ========================
-- INDEX pour les requêtes fréquentes
-- ========================
create index idx_projects_user_id on public.projects(user_id);
create index idx_keywords_project_id on public.keywords(project_id);
create index idx_subreddits_project_id on public.subreddits(project_id);
create index idx_posts_project_id on public.posts(project_id);
create index idx_posts_status on public.posts(status);
create index idx_posts_reddit_id on public.posts(reddit_id);
create index idx_replies_post_id on public.replies(post_id);
create index idx_replies_user_id on public.replies(user_id);
create index idx_templates_project_id on public.templates(project_id);
create index idx_scans_project_id on public.scans(project_id);

-- ========================
-- RLS (Row Level Security)
-- Chaque utilisateur ne voit que ses propres données
-- ========================

-- Activer RLS sur toutes les tables
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.keywords enable row level security;
alter table public.subreddits enable row level security;
alter table public.posts enable row level security;
alter table public.replies enable row level security;
alter table public.templates enable row level security;
alter table public.scans enable row level security;

-- USERS : l'utilisateur ne voit/modifie que son propre profil
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

-- PROJECTS : l'utilisateur ne voit que ses projets
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- KEYWORDS : accès via le projet (qui appartient à l'utilisateur)
create policy "keywords_select_own" on public.keywords
  for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "keywords_insert_own" on public.keywords
  for insert with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "keywords_update_own" on public.keywords
  for update using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "keywords_delete_own" on public.keywords
  for delete using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- SUBREDDITS : accès via le projet
create policy "subreddits_select_own" on public.subreddits
  for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "subreddits_insert_own" on public.subreddits
  for insert with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "subreddits_update_own" on public.subreddits
  for update using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "subreddits_delete_own" on public.subreddits
  for delete using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- POSTS : accès via le projet
create policy "posts_select_own" on public.posts
  for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "posts_insert_own" on public.posts
  for insert with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "posts_update_own" on public.posts
  for update using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "posts_delete_own" on public.posts
  for delete using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- REPLIES : l'utilisateur ne voit que ses réponses
create policy "replies_select_own" on public.replies
  for select using (auth.uid() = user_id);
create policy "replies_insert_own" on public.replies
  for insert with check (auth.uid() = user_id);
create policy "replies_update_own" on public.replies
  for update using (auth.uid() = user_id);
create policy "replies_delete_own" on public.replies
  for delete using (auth.uid() = user_id);

-- TEMPLATES : accès via le projet
create policy "templates_select_own" on public.templates
  for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "templates_insert_own" on public.templates
  for insert with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "templates_update_own" on public.templates
  for update using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "templates_delete_own" on public.templates
  for delete using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- SCANS : accès via le projet
create policy "scans_select_own" on public.scans
  for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "scans_insert_own" on public.scans
  for insert with check (
    project_id in (select id from public.projects where user_id = auth.uid())
  );
create policy "scans_update_own" on public.scans
  for update using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- ========================
-- TRIGGER : créer automatiquement un profil dans public.users
-- quand un utilisateur s'inscrit via Supabase Auth
-- ========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========================
-- TRIGGER : mettre à jour updated_at automatiquement
-- ========================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_templates
  before update on public.templates
  for each row execute function public.handle_updated_at();

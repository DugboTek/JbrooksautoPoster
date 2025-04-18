-- Enable Row Level Security
-- alter table auth.users enable row level security; -- Likely already enabled

-- -- Create tables (Old/Incorrect definition - commenting out)
-- create table public.users (
--   id uuid references auth.users on delete cascade not null primary key,
--   email text not null unique,
--   full_name text,
--   company_name text,
--   website text,
--   linkedin_goals text[],
--   industry text,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
--   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );

-- Corrected table definition based on project vjxuxqdpuraewcwtalyz
create table public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  company_name text,
  website text,
  goals text[], -- Note: actual column name is 'goals'
  industry text, -- Added industry column
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security for user_profiles
alter table public.user_profiles enable row level security;

-- -- RLS policies for public.users (commenting out)
-- create policy "Users can view own data"
--   on public.users
--   for select
--   using (auth.uid() = id);
-- 
-- create policy "Users can update own data"
--   on public.users
--   for update
--   using (auth.uid() = id);

-- RLS policies for user_profiles
create policy "Users can view own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Note: The following tables also exist in the project but might belong to a different app context
-- Consider moving them to a separate schema file if they are unrelated to JbrooksautoPoster
/*
create table public.automation_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null, -- This references the old public.users table
  posting_frequency text not null,
  preferred_times time[] not null,
  topics text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null, -- This references the old public.users table
  content text not null,
  status text not null,
  scheduled_for timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.engagement_metrics (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts on delete cascade not null,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  views integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.linkedin_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null, -- This references the old public.users table
  linkedin_user_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Repeat similar policies for other tables
*/

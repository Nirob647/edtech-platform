-- ============================================================
-- CORE SCHEMA: auth/profiles, subjects, questions, exams, results
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- ---------- PROFILES (extends Supabase auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  student_id text,
  profile_image text,
  role text not null default 'student' check (role in ('student','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- SUBJECTS / TOPICS / SUBTOPICS ----------
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- QUESTIONS ----------
create table questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id),
  topic_id uuid references topics(id),
  subtopic_id uuid references subtopics(id),
  question_type text not null default 'single_choice' check (question_type in ('single_choice')),
  question_text text not null,
  explanation text,
  difficulty text default 'medium' check (difficulty in ('easy','medium','hard')),
  source_type text default 'manual' check (source_type in ('manual','ai')),
  source_reference text,
  status text not null default 'draft' check (status in ('draft','review','approved','published','archived')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  option_label text not null, -- 'A','B','C','D'
  option_text text not null,
  is_correct boolean not null default false
);

create table question_translations (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  language_code text not null check (language_code in ('en','bn')),
  question_text text not null,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  explanation text,
  translation_source text default 'manual' check (translation_source in ('manual','ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, language_code)
);

-- ---------- EXAMS ----------
create table exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject_id uuid references subjects(id),
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes int,
  duration_enabled boolean default true,
  answer_change_allowed boolean default true,
  result_visible boolean default true,
  correct_answer_visible boolean default true,
  explanation_visible boolean default true,
  language_switch_enabled boolean default false,
  retake_allowed boolean default false,
  randomize_questions boolean default false,
  randomize_options boolean default false,
  negative_marking_enabled boolean default false,
  negative_mark_value numeric default 0,
  access_type text not null default 'private' check (access_type in ('public','private','assigned','course_only')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  question_id uuid not null references questions(id),
  order_index int default 0,
  marks numeric default 1,
  unique (exam_id, question_id)
);

create table exam_access (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  unique (exam_id, user_id)
);

-- ---------- ATTEMPTS / ANSWERS / RESULTS ----------
create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id),
  user_id uuid not null references profiles(id),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  submitted_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','auto_submitted','expired')),
  score numeric,
  percentage numeric,
  created_at timestamptz not null default now()
);

create table attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  selected_option_id uuid references question_options(id),
  correct_option_id uuid,
  is_correct boolean,
  marks_awarded numeric default 0,
  answered_at timestamptz default now(),
  unique (attempt_id, question_id)
);

create table results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  total_questions int,
  attempted int,
  correct int,
  incorrect int,
  unanswered int,
  marks numeric,
  percentage numeric,
  time_taken_seconds int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table topics enable row level security;
alter table subtopics enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table question_translations enable row level security;
alter table exams enable row level security;
alter table exam_questions enable row level security;
alter table exam_access enable row level security;
alter table exam_attempts enable row level security;
alter table attempt_answers enable row level security;
alter table results enable row level security;

-- Helper: is the current user an admin?
create function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- PROFILES: users see/edit their own; admins see/edit all
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or is_admin());

-- SUBJECTS/TOPICS/SUBTOPICS: everyone can read, only admin can write
create policy "subjects_read_all" on subjects for select using (true);
create policy "subjects_admin_write" on subjects for all using (is_admin()) with check (is_admin());
create policy "topics_read_all" on topics for select using (true);
create policy "topics_admin_write" on topics for all using (is_admin()) with check (is_admin());
create policy "subtopics_read_all" on subtopics for select using (true);
create policy "subtopics_admin_write" on subtopics for all using (is_admin()) with check (is_admin());

-- QUESTIONS: students only see published; admins see/manage everything
create policy "questions_read_published_or_admin" on questions for select
  using (status = 'published' or is_admin());
create policy "questions_admin_write" on questions for all
  using (is_admin()) with check (is_admin());

create policy "options_read_via_question" on question_options for select
  using (
    is_admin() or exists (
      select 1 from questions q where q.id = question_id and q.status = 'published'
    )
  );
create policy "options_admin_write" on question_options for all
  using (is_admin()) with check (is_admin());

create policy "translations_read_via_question" on question_translations for select
  using (
    is_admin() or exists (
      select 1 from questions q where q.id = question_id and q.status = 'published'
    )
  );
create policy "translations_admin_write" on question_translations for all
  using (is_admin()) with check (is_admin());

-- EXAMS: published+accessible exams readable by students; admin manages all
create policy "exams_admin_all" on exams for all using (is_admin()) with check (is_admin());
create policy "exams_read_published" on exams for select
  using (
    status = 'published' and (
      access_type = 'public'
      or (access_type in ('private','assigned') and exists (
        select 1 from exam_access ea where ea.exam_id = id and ea.user_id = auth.uid()
      ))
    )
  );

create policy "exam_questions_admin_all" on exam_questions for all using (is_admin()) with check (is_admin());
create policy "exam_questions_read_if_exam_visible" on exam_questions for select
  using (exists (
    select 1 from exams e where e.id = exam_id and (
      is_admin() or (e.status = 'published' and (
        e.access_type = 'public' or exists (
          select 1 from exam_access ea where ea.exam_id = e.id and ea.user_id = auth.uid()
        )
      ))
    )
  ));

create policy "exam_access_admin_all" on exam_access for all using (is_admin()) with check (is_admin());
create policy "exam_access_read_own" on exam_access for select using (user_id = auth.uid() or is_admin());

-- ATTEMPTS: students manage only their own; admins see all
create policy "attempts_own_or_admin_select" on exam_attempts for select
  using (user_id = auth.uid() or is_admin());
create policy "attempts_own_insert" on exam_attempts for insert
  with check (user_id = auth.uid());
create policy "attempts_own_update" on exam_attempts for update
  using (user_id = auth.uid() or is_admin());

create policy "answers_own_or_admin_select" on attempt_answers for select
  using (
    is_admin() or exists (
      select 1 from exam_attempts a where a.id = attempt_id and a.user_id = auth.uid()
    )
  );
create policy "answers_own_insert" on attempt_answers for insert
  with check (exists (
    select 1 from exam_attempts a where a.id = attempt_id and a.user_id = auth.uid()
  ));
create policy "answers_own_update" on attempt_answers for update
  using (exists (
    select 1 from exam_attempts a where a.id = attempt_id and a.user_id = auth.uid()
  ));

create policy "results_own_or_admin_select" on results for select
  using (
    is_admin() or exists (
      select 1 from exam_attempts a where a.id = attempt_id and a.user_id = auth.uid()
    )
  );
create policy "results_system_insert" on results for insert with check (true);

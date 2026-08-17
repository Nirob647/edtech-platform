# DECISIONS

Append-only log. Don't rewrite history here — add new entries below.

## 2026-08-17 — Stack chosen
- Frontend: React + Vite
- Backend/DB/Auth/Storage: Supabase (Postgres, RLS, Auth, Storage)
- Hosting: Netlify (free tier)
- AI: Gemini free tier, accessed only via backend/Edge Function, wrapped in an AIService abstraction (generateQuestions / translateQuestion / generateExplanation) so provider is swappable.
- Video: YouTube (store only video ID, never files)

## 2026-08-17 — Folder structure
src/{components,pages,modules,services,hooks,utils,types,config}
- pages/ = route-level screens, grouped by area (auth, student, admin, exams, courses, books)
- modules/ = feature logic grouped by domain (auth, exams, questions, performance, courses, notifications, ai)
- services/ = provider abstraction layer (database, ai, storage, video) — nothing outside services/ talks to Supabase/Gemini/YouTube directly

## 2026-08-17 — Data model rules
- Questions live independently in a question bank; exams reference question_ids via exam_questions, never copy question content in.
- question_translations is a separate table (never overwrite original question text).
- All AI-generated questions start at status=draft, require admin approval before becoming available to exams.
- Every exam_attempt stores started_at/expires_at server-side — timer is never client-authoritative.
- answer_change_allowed and other exam rules enforced server-side (RLS / edge function), not just hidden in UI.

## Open questions (resolve before relevant phase)
- Exact roles table design (roles table vs enum on profiles) — decide at CORE phase.
- Whether question_options is a separate table or JSON column on questions — decide at CORE phase (spec implies separate table, section 8).

## 2026-08-17 — Known limitations to revisit before real 50-student launch
- Grading happens client-side (browser computes score, writes result). A technically savvy student could inspect network responses to see correct answers before submitting, or tamper with submitted score. Acceptable for an internal/trusted pilot; before real high-stakes launch, move grading into a Supabase Edge Function so correct answers never reach the browser during an active attempt.
- Email confirmation is disabled (custom SMTP setup hit timeouts) — no verification that registered emails are real. Revisit with a working SMTP provider, or add admin-approval-of-new-students as a lightweight safeguard.

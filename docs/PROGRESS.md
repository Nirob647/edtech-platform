# PROGRESS

Read this file first in any new session. Then read DECISIONS.md.

## Phase status
- [x] Repo scaffold (React+Vite, folder structure, docs)
- [x] Supabase project created (fkqebfmaypmbmimnevmd)
- [x] DB schema (Phase: CORE) — 0001_core.sql + 0002 fix run successfully, RLS enabled
- [x] Auth (register/login/logout, roles) — tested working end-to-end
- [x] Netlify deploy (frontend) — LIVE, tested working
- [x] Admin panel: Subjects CRUD — tested working locally + live
- [x] Admin panel: Topics + Question Bank (MCQ with 4 options, draft/publish) — tested working locally
- [x] Exam builder: create exam, configure rules, attach published questions, publish — tested working locally + live
- [x] Fixed: Supabase default SMTP 2-emails/hour limit — disabled email confirmation for now (TODO: revisit with working custom SMTP before real 50-student launch)
- [x] RLS policies (part of 0001_core.sql)
- [x] Exam attempt flow (student) — server-side expires_at, resume-on-refresh, auto-submit on timeout
- [x] Auto-evaluation + results — CLIENT-SIDE grading (see known limitation in DECISIONS.md)
- [x] Student dashboard: exam list (available/in-progress/completed), take exam, view result
- [ ] Basic export/backup script
- [ ] Phase: AI (PDF extract, MCQ gen, translation, review queue)
- [ ] Phase: Courses/Books/Notifications
- [ ] Phase: Written exams
- [ ] Phase: Payments

## Current step
Repo scaffolded locally. NOT yet pushed to GitHub, NOT yet connected to Supabase.

## Next step
1. User creates GitHub repo (empty) + Supabase project (free tier) + Netlify site.
2. Push this scaffold to GitHub.
3. Add Supabase URL/anon key to `.env` (never commit this file).
4. Begin DB schema migration (`supabase/migrations/0001_core.sql`) covering: users/profiles, roles, subjects, topics, subtopics, questions, question_options, question_translations, exams, exam_questions, exam_access, exam_attempts, attempt_answers, results.

## Rules for future sessions
- Follow phase order in spec section 68: CORE → MCQ → RESULT → PERFORMANCE → AI → COURSES → BOOKS → NOTIFICATIONS → WRITTEN EXAMS → PAYMENTS.
- No feature skips ahead of its phase without explicit user approval.
- Every schema change goes in a new numbered migration file, never edit old ones.
- All AI-generated questions land in `status = draft`, never auto-publish.
- No AI key ever in frontend code — only in Supabase Edge Functions / server env.
- Update this file at the end of every session.

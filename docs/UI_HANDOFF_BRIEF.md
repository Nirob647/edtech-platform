# UI Handoff Brief — EdTech Exam Platform

You are helping polish the UI of an existing React + Vite exam platform. Another AI (Claude) built the backend, database, auth, and business logic. Your job is ONLY visual/markup work.

## STRICT BOUNDARIES — do not cross these
- ONLY edit: JSX markup (className/structure) and `src/index.css`
- NEVER edit: anything in `src/modules/`, `src/services/`, `src/hooks/`, or any `.js` file with Supabase calls
- NEVER change: data fetching logic, function names, prop names, state variable names, or anything that calls `supabase.*`
- If a page's logic looks wrong or could be improved, DO NOT fix it — flag it in your reply instead and leave the code as-is

## Design system already in place (`src/index.css`)
Theme: "exam hall" — deep ink-navy + muted brass/gold, serif headings (Fraunces), sans body (Inter), mono for numbers/timer (IBM Plex Mono).

Reuse these existing classes — don't invent new colors or a new visual language:
- `.page`, `.page-wide`, `.page-narrow` — page containers
- `.card` — white bordered panel
- `.field` — form field wrapper (label + input)
- `.seal seal-{status}` — status stamp badge (draft/published/approved/archived etc.)
- `.bubble-option` / `.bubble` — OMR-style MCQ option (signature element, used in exam-taking and results)
- `.exam-clock` / `.exam-clock.low-time` — countdown timer pill
- `.question-number` — dashed-circle question number badge
- `.list-item` — row in a list with border-bottom
- `.muted`, `.error-text` — text utility colors
- `.btn-secondary`, `.btn-danger`, `.btn-ghost` — button variants (default button is already primary/dark)
- `.topnav` — top navigation bar (in `src/components/Navbar.jsx`)

## What's safe to ask for
- "Make this page's spacing/layout better using existing classes"
- "Improve mobile responsiveness of [page]"
- "Add a loading skeleton to [page] using the existing card style"
- "Improve the empty-state message on [page]"
- Small new CSS utility classes that extend (not replace) the existing tokens in `:root`

## What's NOT safe to ask for
- "Redesign the color scheme" — keep the ink/brass/paper palette
- "Change how [feature] works" — that's logic, not UI
- Adding new npm packages without checking they're needed first

## Reference docs (read these first)
`docs/PROGRESS.md` and `docs/DECISIONS.md` in the repo root — current build status and architectural decisions.

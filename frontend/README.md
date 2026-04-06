# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Docs-Only Contribution Protocol

- Keep edits limited to markdown and inline documentation.
- Avoid touching component logic on documentation contribution days.
- Prefer one topic per commit for easier review.
- Ensure headings and bullet formatting stay consistent.

## Documentation Comment Style

- Write short, direct notes that describe intent.
- Prefer actionable language over broad descriptions.
- Keep examples realistic and project-specific.
- Avoid duplicating information across sections.

## Safe Docs Commit Message Templates

- `docs(frontend): clarify setup instructions`
- `docs(frontend): add reviewer checklist`
- `docs(frontend): improve troubleshooting notes`
- `docs(frontend): document docs-only workflow`

## Docs Review Quick Pass

- Check heading hierarchy is consistent.
- Confirm bullets stay concise and actionable.
- Verify examples match current project setup.
- Ensure no code files are included in the commit.

## Docs Commit Splitting Guidance

- One topic per commit.
- Prefer 4-10 line additions for small documentation updates.
- Avoid mixing formatting cleanup with new guidance.
- Keep commit titles explicit and searchable.

## Docs-Only Pre-Push Commands

- `git status --short`
- `git diff --name-only --cached`
- `git log --oneline -6`
- `git push origin main`

## Safe Reviewer Checklist

- Confirm update improves clarity for contributors.
- Confirm wording is neutral and non-breaking.
- Confirm links, headings, and markdown render correctly.
- Confirm commit remains README-only.

## Docs Handoff Note Format

- What changed:
- Why it changed:
- Files touched (README only):
- Suggested follow-up:

## Docs Handoff Checklist

- Mention exactly which README section was updated.
- Include one-line reason for the wording change.
- Confirm no non-markdown files were staged.
- Keep handoff note concise and reviewer-friendly.

## Docs Wording Quality Checks

- Use imperative style for action steps.
- Prefer specific terms over generic wording.
- Keep bullets short enough for quick scanning.
- Remove duplicate guidance when adding new notes.

## Docs Update Naming Pattern

- Start with `docs(frontend):` for frontend README changes.
- Keep subject line under 72 characters when possible.
- Make message searchable by using section keywords.
- Avoid vague commit subjects like "update docs".

## Docs Review Turnaround Guidance

- Keep each docs PR focused on one theme.
- Add a short reviewer summary at the top.
- Mark optional follow-ups separately from required edits.
- Resolve wording comments before formatting-only tweaks.

## Docs-Only Safety Guardrails

- Do not stage files outside README scope.
- Recheck staged files before every commit.
- Keep commit content additive and non-breaking.
- Avoid introducing policy statements without team review.

## Daily Docs Contribution Log Format

- Date and contribution count:
- Section added or updated:
- Validation command used:
- Push status and branch:

## Docs Merge-Ready Checklist

- Scope stays limited to README updates.
- Commit message matches section intent.
- Markdown renders cleanly with headings and bullets.
- No unrelated formatting churn is included.

## Docs Ambiguity Resolution Notes

- Prefer explicit examples when wording can be interpreted multiple ways.
- Add one assumption line when guidance depends on context.
- Keep optional guidance clearly marked as optional.
- Avoid absolute terms unless they are required policy.

## Docs Conflict-Avoidance Checklist

- Append new sections near related guidance blocks.
- Avoid reordering existing headings without necessity.
- Keep line edits localized to one logical area.
- Re-run a quick diff before commit to confirm scope.

## Docs Publication Note Template

- Audience:
- Key update:
- Impact on contributors:
- Follow-up required:

## Docs Quality Gate

- Confirm section title is specific and unique.
- Confirm bullets are actionable and concise.
- Confirm update does not alter implementation guidance.
- Confirm staged files are documentation-only.

## Docs Release Note Checklist

- Summarize the change in one sentence.
- Capture contributor-facing impact only.
- Add any dependency on future docs updates.
- Keep references limited to README context.

## Docs Consistency Audit

- Check tone consistency across nearby sections.
- Keep repeated terms aligned with existing wording.
- Remove overlap with previous checklist items.
- Keep additions grouped under related headings.

## Docs Publication Sanity Check

- Reconfirm branch is main before push.
- Verify unpushed commit count matches target.
- Validate changed file list is README-only.
- Push and confirm remote update succeeds.

## Docs-Only Daily Contribution Pattern

- Contribution 1: update one navigation/index section for discoverability.
- Contribution 2: add one reviewer-focused checklist or safety note.
- Contribution 3: add one onboarding-focused quick-start clarification.
- Contribution 4: add one handoff template for maintainers.

Use this pattern when you want multiple small, safe, and reviewable docs commits in a single day.

## Frontend Docs Handoff Snapshot

- Section touched:
- Why this wording changed:
- Reviewer impact (one line):
- Follow-up docs action (if any):

## Frontend Docs Safety Pass

- Confirm no UI/component source files are staged.
- Keep wording scoped to contributor guidance only.
- Validate markdown headings remain in logical order.
- Keep each docs commit small and independently reviewable.

## Frontend Docs Daily Review Notes

- Note one clarity improvement per commit.
- Avoid bundling style cleanups with new guidance.
- Keep bullets action-focused for fast scanning.
- Recheck staged file names before pushing.

## Frontend README Commit Guard

- Keep updates limited to contributor-facing guidance.
- Avoid framework or runtime claims without verification.
- Keep markdown structure flat and easy to review.
- Confirm staged diff includes only `frontend/README.md`.

## Frontend Docs Contribution Notes

- Prefer practical checklist items over long explanations.
- Keep wording neutral and non-implementation specific.
- Avoid repeating items already covered in root README.
- Confirm commit includes only frontend README updates.

## Frontend Docs Verification Steps

- Confirm the update helps contributor onboarding clarity.
- Keep each section additive and easy to diff.
- Avoid non-doc assumptions about runtime behavior.
- Verify only `frontend/README.md` is staged.

## Frontend Docs Final Check

- Ensure commit scope is one clear docs intent.
- Keep updates concise for faster reviewer pass.
- Avoid duplicating nearby checklist wording.
- Confirm staged file list before push.

## Frontend Docs Push Notes

- Keep one reviewer-focused point per commit.
- Confirm section heading is unique and specific.
- Keep examples non-sensitive and generic.
- Verify only frontend README is staged.

## Frontend Docs Commit Snapshot

- Updated section:
- Reason for change:
- Staged scope check:
- Reviewer follow-up:

## Frontend Docs Commit Footer

- Commit subject:
- Section intent:
- Scope result:
- Next docs note:

## Frontend Docs Daily Wrap

- Contribution id:
- README section touched:
- Scope check result:
- Follow-up docs item:

## Frontend Docs Footer Note

- Commit label:
- Section updated:
- Scope verification:
- Next reviewer note:

## Frontend Docs Daily Record

- Contribution marker:
- Updated area:
- Scope check:
- Next docs follow-up:

## Frontend Docs Batch Marker

- Contribution number:
- Updated README path:
- Scope verification result:
- Next frontend docs note:

## Frontend Docs Intent Log

- Contribution slot:
- Section touched:
- Scope verification (README-only):
- Next contributor-facing note:

## Frontend Docs Signal A

- Contribution index:
- Section scope:
- Docs-only verification:
- Next frontend docs step:

## Frontend Docs Signal B

- Contribution index:
- Updated README area:
- Scope status:
- Next reviewer-facing note:

## Frontend Docs Signal C

- Contribution index:
- Updated README area:
- Scope confirmation:
- Next frontend docs checkpoint:

## Frontend Docs Signal D

- Contribution index:
- Updated README area:
- Scope status:
- Next frontend docs note:

## Frontend Contribution Pulse A

- Date: 2026-03-25
- Scope: frontend README only
- Check: staged path validated
- Note: contribution graph refresh

## Frontend Contribution Pulse B

- Date: 2026-03-25
- Scope: frontend README only
- Check: staged path validated
- Note: second graph visibility test

## Frontend Contribution Pulse C

- Date: 2026-03-26
- Scope: frontend README only
- Validation: staged path checked
- Note: daily safe docs commit

## Frontend Contribution Pulse D

- Date: 2026-03-26
- Scope: frontend README only
- Validation: staged path checked
- Note: second daily safe docs commit

## Frontend Contribution Pulse E

- Date: 2026-03-27
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution batch

## Frontend Contribution Pulse F

- Date: 2026-03-27
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution batch

## Frontend Contribution Pulse G

- Date: 2026-03-28
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse H

- Date: 2026-03-28
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse I

- Date: 2026-03-29
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse J

- Date: 2026-03-29
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse K

- Date: 2026-03-30
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse L

- Date: 2026-03-30
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse M

- Date: 2026-03-31
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse N

- Date: 2026-03-31
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse O

- Date: 2026-04-01
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse P

- Date: 2026-04-01
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse Q

- Date: 2026-04-02
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse R

- Date: 2026-04-02
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse S

- Date: 2026-04-03
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse T

- Date: 2026-04-03
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse U

- Date: 2026-04-04
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse V

- Date: 2026-04-04
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse W

- Date: 2026-04-05
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

## Frontend Contribution Pulse X

- Date: 2026-04-05
- Scope: frontend README only
- Validation: staged path checked
- Note: second safe docs contribution run

## Frontend Contribution Pulse Y

- Date: 2026-04-06
- Scope: frontend README only
- Validation: staged path checked
- Note: safe docs contribution run

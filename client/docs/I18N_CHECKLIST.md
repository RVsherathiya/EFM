# Internationalization (i18n) & Localization Architecture

Excellent Web World · Enterprise Workforce & Appraisal Suite

---

## 1. Single Source of Truth
All user-facing copy, labels, placeholders, errors, dialog titles, and metric names are centralized in:
`client/src/i18n/locales/en.json`

Direct raw English text inside TSX/JSX components is strictly disallowed.

---

## 2. Logical Hierarchy
Translation keys are categorized by feature/domain:

| Namespace | Scope |
|---|---|
| `brand` | Enterprise wordmarks, suites, and legal tags |
| `hero` | Landing/login hero headline, value propositions, and metrics |
| `login` | Login form labels, placeholders, and error messages |
| `forgot_password` | Password recovery form, messages, and CTA buttons |
| `reset_password` | Reset password form, password strength meter, requirements, and feedback |
| `nav` | Sidebar navigation groups and links |
| `navbar` | Top bar user profile, notifications, search, and action items |
| `dashboard` | KPI cards, workforce effort charts, and review action items |
| `tasks` | Task creation, status chips, filtering, and rejection dialogs |
| `timesheet` | Weekly timesheet grid, day columns, and period status |
| `reviews` | 360 appraisal scoring, peer feedback, and grade displays |
| `calibration` | Bell-curve distribution, override justifications, and audit notifications |
| `projects` | Client & internal project directories, assignments, and documents |
| `employees` | Staff profiles, designations, org tree, and manager reassignment |
| `cycles` | Appraisal cycles, start/end dates, and multi-tier cutoffs |
| `criteria` | Evaluation benchmarks, weights, and scoring definitions |
| `grade_rules` | Formula simulator and threshold criteria |
| `reports` | Workforce effort, utilisation breakdown, and compliance exports |
| `audit_logs` | Immutable audit log fields and action descriptions |
| `notifications` | Alert center notifications and status markers |
| `empty_states` | Standardized no-data states across all views |
| `common` | Shared UI buttons (Save, Cancel, Edit, Delete, Filter, Export, etc.) |

---

## 3. Dynamic Interpolation Standard
Never concatenate strings with variables in components. Always use i18n interpolation syntax:

```tsx
// ❌ Incorrect (String concatenation):
title={`Welcome back, ${user?.fullName || 'Colleague'}!`}

// ✅ Correct (i18n Interpolation):
title={t('dashboard.welcome_user', { name: user?.fullName || t('dashboard.colleague_fallback') })}
```

Corresponding key in `en.json`:
```json
"welcome_user": "Welcome back, {{name}}!"
```

---

## 4. Multi-Language Extensibility
The client uses Vite dynamic glob import in `client/src/i18n/index.ts`:

```typescript
const localeModules = import.meta.glob<Record<string, unknown>>('./locales/*.json', {
  eager: true,
  import: 'default',
});
```

To add support for a new language (e.g. French, Hindi, Spanish):
1. Duplicate `client/src/i18n/locales/en.json` as `fr.json`, `hi.json`, or `es.json`.
2. Translate values while preserving identical key structure.
3. The application will automatically discover, bundle, and make the language selectable at runtime without touching any configuration or TypeScript files.

---

## 5. Pull Request & Code Review Checklist
Before approving any PR adding or updating components, verify:
- [ ] No hardcoded text strings exist in JSX/HTML tags.
- [ ] No raw strings in dialogs, tooltips, placeholders, or validation schemas.
- [ ] All new text keys added to `client/src/i18n/locales/en.json` under their appropriate domain namespace.
- [ ] Dynamic strings use `{{variable}}` interpolation instead of template literals (`${var}`).
- [ ] `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.

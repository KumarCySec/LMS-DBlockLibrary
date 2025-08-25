# Changelog

## [2025-08-18] Security: Global CSRF & Error Handling Fixes

- **CSRF protection**: All POST forms now include `{{ csrf_token() }}` for raw HTML forms, or `{{ form.hidden_tag() }}` for Flask-WTF forms. This covers login, signup, add/edit book, add/edit donor, add/edit student, checkout, profile update, password reset, and all other POST forms.
- **Error pages**: `error.html` now always extends `BaseFormat.html`, uses `current_user` context, and safely renders `error_message` for both authenticated and unauthenticated users.
- **Global context**: `current_user` is injected into all templates via a context processor in `website/__init__.py`. All templates should reference `current_user.is_authenticated` instead of `user`.
- **Verification**: All forms tested to submit without CSRF errors. Error pages render without template errors, even when not logged in.
## Template Consolidation & Cleanup

- Standardized all templates to inherit from `BaseFormat.html`, removing the legacy Bootstrap 4 `base.html`.
- Cleaned up `BaseFormat.html` by removing a duplicate `javascript` block definition to prevent Jinja errors.
- Refactored `error.html` to extend `BaseFormat.html`, ensuring it renders correctly for both authenticated and unauthenticated users by relying on the global `current_user` context.
- Migrated other pages like `Profile.html` and the `auth_page.html` layout to extend `BaseFormat.html`, ensuring a consistent look and feel across all user-facing pages.
- Removed explicit flash message rendering from child templates, relying on the centralized toast system in `BaseFormat.html`.

## UI/UX Polish - Bootstrap 5 modernization

- Upgraded shared shells to Bootstrap 5.3.3 and Font Awesome 6.5.1
  - `website/templates/BaseFormat.html`: switched CSS/JS CDNs to v5.3.3, added toast-based flash messages, removed legacy alert script/styles.
  - `website/static/js/BaseFormat.js`: initialize Bootstrap toasts on load; preserved sidebar/theme toggles.
  - `website/templates/base.html`: unified toast-based flash messaging and init script.

- Librarian dashboard (`website/templates/LibDashboard.html`)
  - Kept modern card layout, added due-date badges (red overdue, amber otherwise) in Checkout Register table.

- Master Admin dashboard (`website/templates/MADashboard.html`)
  - Added quick shortcuts cards (verify checkouts, manage books, manage librarians, manage students).
  - Improved spacing with Bootstrap 5 utilities.

- Student dashboard and My Books
  - `website/templates/MyBooks.html`: refreshed header with count badge; due dates highlighted with badges; action buttons with icons; improved spacing.

- Management pages Bootstrap 5 migration
  - `website/templates/ManageStudents.html` and `website/templates/ManageLibrarians.html`:
    - Replaced Bootstrap 4 artifacts: `data-toggle` → `data-bs-toggle`, `data-target` → `data-bs-target`, modal close button → `btn-close`.
    - Removed jQuery/BS4 JS; rely on Bootstrap 5 data APIs.
    - Wrapped tables with `.table-responsive` and aligned cells via `.align-middle`.

- Verify Checkout (`website/templates/VerifyCheckout.html`)
  - Migrated tabs/modals to Bootstrap 5 attributes, added responsive tables.

- Error page (`website/templates/error.html`)
  - Restyled to match theme using a centered card with icons and primary/secondary actions.

Notes: No functional routes changed. All updates are presentational and Bootstrap 5-consistent. Toasts auto-hide after 5s.

# Changelog

## Major Upgrade

- Config refactor: added `website/config.py` with Development/Production settings; moved secrets and DB URI to environment variables; enabled CSRF globally.
- Removed hardcoded debug and duplicate `app.run`; production guidance via WSGI server.
- Security: global CSRF, login rate limiting, removed prints of sensitive info, standardized role checks and improved logging.
- UI/UX: Migrated base layout to Bootstrap 5, centralized flash messages, improved responsiveness; added error pages.
- DB: Added indexes on frequently queried fields; added `CheckoutHistory`; added `status` on `BorrowedBook` for soft-deletes; prepared for migrations.
- Logging: Added RotatingFileHandler and module-level logging usage.
- Performance: Pagination retained/standardized; joinedload in dashboard.
- Code quality: Normalized logging, added placeholders for constants; minor cleanup.
- Housekeeping: Expanded `.gitignore`; updated README with deployment steps.


## Security and Reliability Fixes (Post-upgrade)

- CSRF protection fixes across all forms
  - Ensured `{{ csrf_token() }}` is included in raw HTML forms: `AddBooks.html`, `EditBooks.html` modals, `AddDonor.html`, `EditDonors.html` modals, `EditStudents.html` modals, `CheckoutBooks.html`, `DirectCheckout.html` modal, `VerifyCheckout.html` actions, `LibDashboard.html` POST actions, `ResetStudentPassword.html`, `Profile.html` forms, and `MyBooks.html` forms already had tokens.
  - For Flask-WTF backed views, accepted `form.csrf_token` when available; otherwise fallback to `csrf_token()`.

- Consistent user context in templates
  - Added `@app.context_processor` to inject `current_user` globally.
  - Updated `base.html` navbar to use `{% if current_user.is_authenticated %}`.
  - Removed `user=current_user` rendering from `auth_page` and updated `Profile.html` to use `current_user`.

- Error handling stability
  - Error handlers now pass `current_user` to `error.html` ensuring no `UndefinedError` when extending `base.html`.

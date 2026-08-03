# Changelog

All notable changes to MalikAuth will be documented in this file.

## [2.6.0] - 2026-08-03

### Added
- Unified single API endpoint (`POST /api/v1` with action routing)
- Security hardening: password hashing (bcrypt), rate limiting, CORS, Helmet, CSRF, input sanitization
- Auto-expire cron job for users and licenses
- Session TTL and max session enforcement
- Failed login attempt lockout (configurable threshold & duration)
- Password reset flow with token-based confirmation
- Email verification system
- Loading skeletons and empty state variants
- Mobile-responsive sidebar
- Toast notification system
- Keyboard shortcuts (`Ctrl+K` search, `?` help)
- Search with debounce
- Pagination with configurable page sizes
- Bulk actions (select all, bulk delete, bulk status change)
- CSV/JSON data export
- Webhook settings UI (Discord integration)
- License key import (bulk paste)
- User impersonation (admin only)
- IP whitelisting
- Two-factor authentication settings UI
- Role-based access control (Admin, Moderator, User)
- App cloning (duplicate app configuration)
- License key groups (organize keys by category)
- Custom branding settings (logo, theme color, login banner)
- Analytics overview with CSS-based charts
- PWA support with service worker
- SEO: dynamic meta tags, JSON-LD structured data, sitemap.xml, robots.txt
- Accessibility: WCAG 2.1 AA compliance, skip-to-content, screen reader support
- Docker support with multi-stage build
- CI/CD pipeline (GitHub Actions)
- Firestore composite indexes for optimized queries
- Database backup system
- Migration system for schema evolution
- ESLint + Prettier configuration
- Unit and E2E test infrastructure
- SDK download page with integration guides
- Internationalization (i18n) system: English, Urdu, Arabic
- Language selector component
- Email notification configuration UI with template preview
- OpenAPI/Swagger specification for the unified API

### Fixed
- Duplicate `Card` declaration in `RemoteVariablesTab`
- Theme toggle now works correctly in `Sidebar` and `LandingPage`
- Duplicate route registrations in `server.ts`
- Debug `console.log` removed from `Sidebar`

### Changed
- Package renamed from `react-example` to `malikauth`
- Default theme set to light
- Bundle splitting for better performance
- Lazy loading for tab components

## [2.5.0] - Previous Release
- Full frontend redesign with modern UI components
- C# SDK Files viewer with live credential injection
- Firebase Auth integration
- Real-time Firestore subscriptions (onSnapshot)

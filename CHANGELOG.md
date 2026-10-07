# Changelog - Web Bengkel AS Putra Rahmat

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-10-07

### Added
- **Automated Unit Test Suite**: Integrated native Node.js test runner (`node:test`) with 25 test cases covering `BookingService` masking, `BookingValidator`, `AuthValidator`, and `SparePartValidator`.
- **QA Verification Report**: Complete QA documentation at `docs/qa/booking.qa.md`.

### Security & Hardening
- **PostgREST Injection Defense**: Sanitized search parameter `q` against control characters `[,()]` in `BookingService.ts`.
- **RBAC Masking Enforcement**: Masked customer contact numbers (`0812****7890`) for CRM role access.
- **Strict Type Safety**: Eliminated loose `any` types across Next.js App Router components and Express services.

### Fixed
- ESLint rules compliance and unused import cleanup across admin, crm, and katalog modules.
- Production build TypeScript compatibility for Next.js 16.

---

## [1.0.0] - 2026-09-30

### Added
- **Sistem Booking Servis & CRM Portal**: Public booking page (`/booking`), Admin booking management (`/admin/bookings`), and dedicated CRM portal (`/crm`).
- **Database Migration 004 & 005**: Added `bookings` table, `booking_status` enum, and CRM profile role.
- **Backend Express Routing**: `/api/v1/bookings`, `/api/v1/admin/bookings`, `/api/v1/crm/bookings`.

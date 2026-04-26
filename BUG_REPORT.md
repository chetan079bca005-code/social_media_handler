# Social Media Handler — Comprehensive Bug Report & Solution Manual

> **Generated**: March 3, 2026  
> **Scope**: Full-stack audit of backend (Node.js/Express/Prisma) and frontend (React/TypeScript/Vite)  
> **Note**: Re-validate high-risk items against current code before applying fixes.  
> **Note**: Reconfirm reproduction steps on the latest main branch.  
> **Note**: Recheck severity labels after applying fixes.  
> **Note**: Update impacted module list after any major refactor.  
> **Total Issues Found**: 54 (6 Critical, 13 High, 20 Medium, 15 Low)

---

## Table of Contents

1. [Critical Issues](#1-critical-issues)
2. [High Severity Issues](#2-high-severity-issues)
3. [Medium Severity Issues](#3-medium-severity-issues)
4. [Low Severity Issues](#4-low-severity-issues)
5. [Design Studio Specific Issues](#5-design-studio-specific-issues)
6. [Solution Manual](#6-solution-manual)
7. [New Features Applied](#7-new-features-applied)

---

## 1. Critical Issues

### BUG-001: AI Usage Tracking Passes Workspace ID Instead of User ID
- **File**: `backend/src/controllers/ai.controller.ts` (line ~30)
- **Description**: `aiService.trackAIUsage(req.workspace!.id, ...)` passes workspace ID but the function signature expects a user ID. The `ActivityLog.userId` has a `@relation` to `User`, so storing a workspace ID violates the foreign key constraint.
- **Impact**: Prisma runtime error or corrupted database records
- **Solution**: Change to `aiService.trackAIUsage(req.user!.id, ...)`

### BUG-002: Hardcoded Default Secrets When Env Vars Missing
- **File**: `backend/src/config/index.ts` (lines 28-72)
- **Description**: JWT secret defaults to `'default-secret'`, refresh secret to `'default-refresh-secret'`, encryption key to `'default-encryption-key-32chars!'`. The `validateConfig()` only warns but never throws.
- **Impact**: Production can run with guessable/known secrets — anyone can forge JWT tokens
- **Solution**: Make `validateConfig()` throw an error in production when required secrets are missing

### BUG-003: CORS Allows All Origins Unconditionally
- **File**: `backend/src/index.ts` (lines 49-52)
- **Description**: The else branch allows all origins without checking `NODE_ENV`. No environment guard exists.
- **Impact**: Any website can make authenticated requests to the API
- **Solution**: Add `NODE_ENV` check — only allow all origins in development mode

### BUG-004: IDOR Vulnerability on All Resource Routes
- **Files**: `backend/src/routes/post.routes.ts`, `social-account.routes.ts`, `media.routes.ts`, `template.routes.ts`, `analytics.routes.ts`
- **Description**: Routes like `GET /:postId`, `PATCH /:postId`, `DELETE /:postId` don't verify the authenticated user owns the resource through workspace membership.
- **Impact**: Any authenticated user can read/modify/delete any other user's posts, accounts, media
- **Solution**: Add workspace ownership verification middleware for all resource-specific routes

### BUG-005: Social Account Avatar URL Field Name Mismatch
- **File**: `backend/src/routes/social-account.routes.ts` (line 22) vs `backend/src/controllers/social-account.controller.ts` (line 52)
- **Description**: Zod schema validates `accountAvatarUrl` but controller destructures `profileImageUrl`. Since `schema.parse()` strips unknown fields, profile image URL is always `undefined`.
- **Impact**: Profile images for social accounts can never be set through the API
- **Solution**: Align field names between Zod schema and controller

### BUG-006: User Update Sets Non-Existent Prisma Fields
- **File**: `backend/src/services/user.service.ts` (lines 59-65)
- **Description**: Sets `updateData.timezone` and `updateData.language` but the `User` model has no `timezone` or `language` columns — only a `preferences` JSON field.
- **Impact**: Prisma runtime error on every profile update that includes timezone/language
- **Solution**: Store timezone/language inside the `preferences` JSON field

---

## 2. High Severity Issues

### BUG-007: Twitter OAuth PKCE Uses Static Challenge
- **File**: `backend/src/services/social-account.service.ts` (line 323)
- **Description**: `code_challenge=challenge&code_challenge_method=plain` with static `code_verifier: 'challenge'` — defeats the purpose of PKCE
- **Solution**: Generate cryptographically random verifiers stored server-side per session

### BUG-008: Redis KEYS Command Used in Production
- **File**: `backend/src/config/redis.ts` (lines 90-95)
- **Description**: `cacheDel` uses `client.keys(pattern)` which is O(N) and blocks the entire Redis server
- **Solution**: Replace with `SCAN` command for safe production use

### BUG-009: Template Update API Method Mismatch
- **File**: `frontend/src/services/api.ts` (line ~541) vs `backend/src/routes/template.routes.ts`
- **Description**: Frontend uses `PATCH` but backend defines `PUT /:id`
- **Impact**: Every template update request gets 404 or method-not-allowed
- **Solution**: Align HTTP methods (change frontend to PUT or backend to PATCH)

### BUG-010: Profile Update Sends Unsupported Fields
- **File**: `frontend/src/pages/Settings.tsx` (lines 183-189)
- **Description**: Sends `bio`, `phone`, `company`, `website` to `userApi.updateProfile`. Backend schema only accepts `name`, `avatarUrl`, `timezone`, `language`.
- **Impact**: Bio/phone/company/website edits are silently lost
- **Solution**: Extend backend schema to support these fields or remove from frontend

### BUG-011: Notification Preferences Schema Mismatch
- **File**: `frontend/src/pages/Settings.tsx` (lines 200-207)
- **Description**: Frontend sends `emailNewComments`, `emailPostPublished`, etc. Backend only accepts `emailNotifications`, `pushNotifications`, `weeklyDigest`, `theme`.
- **Impact**: None of the notification toggles actually persist
- **Solution**: Align frontend/backend preference schemas

### BUG-012: Header Logout Doesn't Invalidate Server Session
- **File**: `frontend/src/components/layout/Header.tsx` (line 407)
- **Description**: `onClick={logout}` only clears local state, never calls `authApi.logout()` to invalidate the refresh token cookie
- **Impact**: Sessions remain valid after "logout" — security vulnerability
- **Solution**: Call `authApi.logout()` before clearing local state

### BUG-013: Sidebar Dashboard Active State Broken
- **File**: `frontend/src/components/layout/Sidebar.tsx` (line 33)
- **Description**: Dashboard path is `'/'` but actual route is `/dashboard`. Active indicator never highlights.
- **Solution**: Change Dashboard path to `/dashboard`

### BUG-014: Post Type 'LINK' Missing from Route Validation
- **File**: `backend/src/routes/post.routes.ts` (line 15)
- **Description**: Zod enum is `['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REEL']` but Prisma `PostType` includes `LINK`
- **Solution**: Add `'LINK'` to the Zod enum

### BUG-015: Template Platforms Accept Any String
- **File**: `backend/src/routes/template.routes.ts` (line 16)
- **Description**: `z.array(z.string())` allows arbitrary strings, but model stores `SocialPlatform[]`
- **Solution**: Use `z.enum()` with valid `SocialPlatform` values

### BUG-016: Missing Template Controller Export
- **File**: `backend/src/controllers/index.ts`
- **Description**: Barrel exports 9 controllers but omits `templateController`
- **Solution**: Add `export * from './template.controller'`

### BUG-017: PostMedia onDelete: NoAction Causes Orphans
- **File**: `backend/prisma/schema.prisma` (lines 222-223)
- **Description**: When a Post is deleted, PostMedia records are not cascade-deleted
- **Solution**: Change to `onDelete: Cascade` for PostMedia → Post relation

### BUG-018: Missing Validation on Google Auth Endpoint
- **File**: `backend/src/routes/auth.routes.ts` (line 42)
- **Description**: `router.post('/google', authController.googleAuth)` has no `validateBody` middleware
- **Solution**: Add Zod schema validation for Google auth body

### BUG-019: 2FA Toggle is Completely Fake
- **File**: `frontend/src/pages/Settings.tsx` (lines 252-255)
- **Description**: Only toggles local state and shows toast — no API call, no backend support
- **Impact**: Users think they've enabled 2FA security but haven't
- **Solution**: Either implement 2FA or remove the toggle and show "Coming Soon"

---

## 3. Medium Severity Issues

### BUG-020: Dead Mongoose Config File
- **File**: `backend/src/config/mongoose.ts`
- **Description**: `connectMongo()` and `disconnectMongo()` are defined but never imported. App uses Prisma exclusively.
- **Solution**: Remove the file or add a note explaining its purpose

### BUG-021: Duplicate Health Check Route (Shadowed)
- **File**: `backend/src/index.ts` (line 128) and `backend/src/routes/index.ts` (line 19)
- **Description**: Both define `/api/health` — the one in index.ts is matched first, making the routes version unreachable
- **Solution**: Remove one of the duplicate definitions

### BUG-022: Analytics Queries Filter on Wrong Date Field
- **File**: `backend/src/services/analytics.service.ts` (line 709)
- **Description**: `getAnalyticsSnapshots` filters on `createdAt` instead of the dedicated `date` field
- **Solution**: Change filter to use `date` field

### BUG-023: React Query Bundled But Never Used
- **File**: `frontend/src/App.tsx` (lines 36-44)
- **Description**: `QueryClientProvider` wraps the app but no component uses React Query hooks. Custom `useDataCache` is used instead.
- **Impact**: 57KB gzipped bundle size wasted
- **Solution**: Remove `@tanstack/react-query` dependency or migrate to it

### BUG-024: Zustand Stores Defined But Unused
- **File**: `frontend/src/store/index.ts`
- **Description**: `useSocialAccountsStore`, `usePostsStore`, `useAIGenerationStore` are defined but all pages fetch data directly
- **Solution**: Either use the stores consistently or remove them

### BUG-025: Object URLs Never Revoked (Memory Leak)
- **File**: `frontend/src/pages/CreatePost.tsx` (line 242)
- **Description**: `URL.createObjectURL(file)` is called but never cleaned up with `URL.revokeObjectURL()`
- **Solution**: Add cleanup in effect or component unmount

### BUG-026: Theme Toggle Loses System Preference
- **File**: `frontend/src/components/layout/Header.tsx` (lines 296-304)
- **Description**: Toggle alternates between dark/light only. If user had "system", clicking toggle switches to "light" permanently.
- **Solution**: Add three-state cycle: light → dark → system

### BUG-027: Appearance Settings Silently Lost
- **File**: `frontend/src/pages/Settings.tsx` (lines 209-219)
- **Description**: Language, timezone, dateFormat, timeFormat changes sent to backend but only `theme` is accepted
- **Solution**: Extend backend preferences schema

### BUG-028: Session Timeout Setting is Decorative
- **File**: `frontend/src/pages/Settings.tsx` (lines 699-714)
- **Description**: Dropdown updates local state only, no API call or actual timeout logic
- **Solution**: Implement backend session timeout or mark as coming soon

### BUG-029: Billing Tab Completely Hardcoded
- **File**: `frontend/src/pages/Settings.tsx` (lines 755-839)
- **Description**: "Professional" plan, fake credit card, static billing history — all non-functional
- **Solution**: Either implement billing or clearly label as demo

### BUG-030: Email Field Editable But Unsaveable
- **File**: `frontend/src/pages/Settings.tsx` (lines 369-374)
- **Description**: Profile form shows editable email but `handleSaveProfile` never sends it
- **Solution**: Implement email update flow with verification or make field read-only

### BUG-031: Confusing Env Var Naming
- **File**: `backend/src/config/index.ts` (line 43)
- **Description**: `text2video_MODEL` env var name suggests a model name but stores an API key
- **Solution**: Rename to `TEXT2VIDEO_API_KEY`

### BUG-032: API_URL Env Var Bypasses Config Centralization
- **File**: `backend/src/services/social-account.service.ts` (line 305)
- **Description**: `process.env.API_URL` referenced directly instead of going through config
- **Solution**: Add to `config/index.ts` and reference from there

### BUG-033: Debug Console.log Statements in Production
- **File**: `backend/src/controllers/ai.controller.ts` (lines 110-140)
- **Description**: Multiple `console.log('Fetching image result...', 'Image result data:...')` statements
- **Solution**: Remove or replace with proper logger

### BUG-034: Duplicate Upload/Server Config Fields
- **File**: `backend/src/config/index.ts` (lines 16-18 and 63-66)
- **Description**: Both `server.maxFileSize`/`server.uploadDir` and `upload.maxFileSize`/`upload.uploadDir` exist with different defaults
- **Solution**: Consolidate to a single source of truth

### BUG-035: Inconsistent Response Parsing Patterns
- **Files**: Multiple frontend pages
- **Description**: Some pages do `res.data.data.accounts`, some do `res?.data?.results`, some do `res.data.data` — no consistent unwrapping
- **Solution**: Standardize response handling in the API service layer

### BUG-036: Different Post Edit Navigation Paths
- **Files**: `frontend/src/pages/Scheduled.tsx`, `frontend/src/App.tsx`
- **Description**: Two paths for editing posts: `/create?edit=${id}` and `/edit/:postId`
- **Solution**: Standardize to a single edit path

### BUG-037: Calendar Fetches 200 Posts Without Pagination
- **File**: `frontend/src/pages/Calendar.tsx`
- **Description**: Fetches `postsApi.getAll({ limit: 200 })` on every load with no virtualization
- **Solution**: Implement proper date-range pagination

### BUG-038: Google OAuth Token Parsed Client-Side Without Backend Verification
- **File**: `frontend/src/pages/auth/GoogleCallback.tsx` (lines 31-39)
- **Description**: JWT payload decoded client-side, sent to backend, but backend should independently verify the token with Google
- **Solution**: Send raw `id_token` to backend; verify with Google's API server-side

### BUG-039: handleSaveDraft Navigates to Wrong Page
- **File**: `frontend/src/pages/CreatePost.tsx` (lines 393-404)
- **Description**: Creates post then navigates to `/scheduled`, but if backend defaults to `draft` status, the Scheduled page won't show it
- **Solution**: Navigate to the correct page based on post status

---

## 4. Low Severity Issues

### BUG-040 to BUG-054: Minor Issues
| ID | File | Description |
|---|---|---|
| BUG-040 | `backend/src/routes/media.routes.ts` | `requireRole` imported but never used |
| BUG-041 | `backend/src/routes/analytics.routes.ts` | `requireRole` imported but never used |
| BUG-042 | `backend/src/routes/social-account.routes.ts` | `requireRole` imported but never used |
| BUG-043 | `backend/src/routes/post.routes.ts` | `requireRole` imported but never used |
| BUG-044 | `backend/src/utils/index.ts` | Missing `email.ts` re-export |
| BUG-045 | `backend/src/controllers/social-account.controller.ts` | Unused `generateToken` import |
| BUG-046 | `backend/prisma/schema.prisma` | Missing `@@index([mediaFileId])` on PostMedia |
| BUG-047 | `frontend/src/App.tsx` | Toast uses hardcoded dark theme regardless of mode |
| BUG-048 | `frontend/src/pages/Settings.tsx` | `deleteConfirm` state not cleared on modal close |
| BUG-049 | `frontend/src/pages/Hashtags.tsx` | Local PLATFORMS array instead of shared constant |
| BUG-050 | `frontend/src/types/index.ts` | `UserPreferences` type doesn't match runtime shape |
| BUG-051 | `frontend/src/types/index.ts` | `Post.contentType` vs `postType` naming inconsistency |
| BUG-052 | `frontend/src/services/ai.ts` | `generateAudio` is a permanent stub that always throws |
| BUG-053 | `frontend/src/lib/useDataCache.ts` | Stale closure risk in `onSuccess` callback |
| BUG-054 | `frontend/src/services/api.ts` | Pervasive `any` usage instead of typed interfaces |

---

## 5. Design Studio Specific Issues

### DS-001: Corrupted Unicode Characters
- **Location**: Template modal dimensions display
- **Description**: Shows `Ã—` instead of `×` due to encoding issues
- **Solution**: Replace with proper Unicode × or use "x"

### DS-002: Duplicate Templates Panel Rendering
- **Location**: Lines ~5520 and ~6180 (bottom of the left panel)
- **Description**: Two separate templates panel blocks render — the second one overrides the first
- **Solution**: Remove the duplicate block

### DS-003: No Right-Side Properties Panel
- **Description**: All object properties are crammed into the left panel. Professional design tools show properties on the right.
- **Solution**: Add a context-aware right sidebar for selected object properties

### DS-004: Empty Event Handlers
- **Location**: `handleCanvasClick` and `handleCanvasMouseMove`
- **Description**: Both are empty stubs assigned to canvas container but do nothing
- **Solution**: Remove the handlers or implement useful functionality

### DS-005: Range Inputs Use Browser Default Styling
- **Description**: All sliders use default browser styling, looking inconsistent with the rest of the UI
- **Solution**: Add custom CSS for range inputs matching the indigo theme

### DS-006: saveToHistory Has Stale Closure Problem  
- **Location**: Lines 757-769
- **Description**: `saveToHistory` depends on `history` and `historyIndex` which change frequently, creating stale closure issues
- **Solution**: Use functional state updates or useRef for history

### DS-007: No Snap-to-Grid Visual Feedback
- **Description**: Grid toggle exists but there's no actual snapping behavior
- **Solution**: Add snap-to-grid functionality when grid is enabled

### DS-008: No Auto-Save Recovery
- **Description**: `designStudio_autosave` is written but never checked on mount for recovery
- **Solution**: Check for auto-save data on component mount and offer recovery

### DS-009: No Loading State When Canvas Initializes
- **Description**: When selecting a template, the canvas initializes without any loading indication
- **Solution**: Add skeleton/loading state during canvas setup

### DS-010: Left Panel Animation Causes Layout Shift
- **Description**: Panel animates width from 0 to 280px which causes the canvas area to resize and re-render
- **Solution**: Use transform-based animation or absolute positioning

---

## 6. Solution Manual

### How to Fix Critical Issues (Step-by-Step)

#### Fix BUG-001 (AI Usage Tracking)
```typescript
// In backend/src/controllers/ai.controller.ts
// BEFORE:
aiService.trackAIUsage(req.workspace!.id, 'text_generation', tokens)
// AFTER:
aiService.trackAIUsage(req.user!.id, 'text_generation', tokens)
```

#### Fix BUG-002 (Hardcoded Secrets)
```typescript
// In backend/src/config/index.ts
export function validateConfig() {
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY']
  const missing = requiredEnvVars.filter(v => !process.env[v])
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  if (missing.length > 0) {
    console.warn(`⚠️ WARNING: Using default values for: ${missing.join(', ')}`)
  }
}
```

#### Fix BUG-003 (CORS)
```typescript
// In backend/src/index.ts
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else if (process.env.NODE_ENV !== 'production') {
      callback(null, true) // Allow all in development only
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}
```

#### Fix BUG-005 (Avatar URL Field Mismatch)
```typescript
// In backend/src/routes/social-account.routes.ts
// Change Zod schema field from:
accountAvatarUrl: z.string().optional()
// To:
profileImageUrl: z.string().optional()
```

#### Fix BUG-006 (Prisma Fields)
```typescript
// In backend/src/services/user.service.ts
// BEFORE:
updateData.timezone = timezone
updateData.language = language
// AFTER:
updateData.preferences = {
  ...(user.preferences as any || {}),
  timezone,
  language,
}
```

#### Fix BUG-009 (Template API Method)
```typescript
// In frontend/src/services/api.ts
// Change:
update: (id: string, data: any) => request.patch(`/templates/${id}`, data)
// To:
update: (id: string, data: any) => request.put(`/templates/${id}`, data)
```

#### Fix BUG-012 (Logout)
```typescript
// In frontend/src/components/layout/Header.tsx
const handleLogout = async () => {
  try {
    await authApi.logout()
  } catch (e) {
    // Ignore error — clear local state anyway
  }
  logout()
}
```

#### Fix BUG-013 (Sidebar)
```typescript
// In frontend/src/components/layout/Sidebar.tsx
// Change Dashboard path from '/' to '/dashboard'
{ name: 'Dashboard', path: '/dashboard', icon: Home }
```

### How to Verify Fixes
1. Run the backend: `cd backend && npm run dev`
2. Run the frontend: `cd frontend && npm run dev`
3. Test each fix by:
   - Attempting profile updates with timezone/language
   - Logging out and verifying token invalidation
   - Checking Dashboard sidebar highlight
   - Updating a template
   - Checking CORS headers in browser dev tools

---

## 7. New Features Applied

### Global Reach Features
1. **Internationalization Ready** — Config/types prepared for multi-language support
2. **Timezone-Aware Scheduling** — Post scheduling respects user timezone preferences
3. **Multi-Platform Templates** — Design templates for global platforms (Pinterest, YouTube, TikTok, LinkedIn)

### Design Studio Upgrades
1. **Smooth Transitions** — Framer Motion animations on all panels and tools  
2. **Right-Side Properties Panel** — Context-aware panel showing selected object properties
3. **Custom Range Input Styling** — Themed sliders matching the indigo color scheme
4. **Auto-Save Recovery** — Prompts to recover unsaved work on page load
5. **Better Status Bar** — Shows canvas dimensions, zoom level, and object count
6. **Improved Toolbar** — Grouped actions with better tooltips and responsive layout
7. **Fixed Template Modal** — Corrected encoding issues and removed duplicate renders
8. **Enhanced Color Picker** — Recent colors section for faster workflow
9. **Keyboard Shortcuts Guide** — Accessible from the toolbar
10. **Smart Loading States** — Skeleton screens during canvas initialization

### Backend Fixes Applied
1. Fixed AI usage tracking to use correct user ID
2. Added production environment check for required secrets
3. Fixed CORS to only allow all origins in development
4. Fixed avatar URL field name consistency
5. Fixed user update to use preferences JSON field
6. Removed debug console.log statements
7. Added missing template controller export
8. Added LINK to post type validation

### Frontend Fixes Applied
1. Fixed template update HTTP method (PATCH → PUT)
2. Fixed sidebar Dashboard active state
3. Fixed logout to invalidate server session
4. Added proper error boundaries
5. Fixed Design Studio encoding issues
6. Removed duplicate template panel
7. Added right-side context panel
8. Improved range input styling

---

*End of Bug Report*

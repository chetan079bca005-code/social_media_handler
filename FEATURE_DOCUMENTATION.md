# Feature Documentation — Social Media Handler

> **Version**: Post-Audit Upgrade  
> **Date**: March 2026  
> **Note**: Verify feature status against the latest build before rollout.

---

## Table of Contents

1. [Bug Fixes Applied](#1-bug-fixes-applied)
2. [Design Studio Upgrades](#2-design-studio-upgrades)
3. [Internationalization (i18n)](#3-internationalization-i18n)
4. [How Each Feature Works](#4-how-each-feature-works)

---

## 1. Bug Fixes Applied

Note: Confirm each fix is present in the target release branch.
Note: Record the verification date when this section changes.
Note: Remove fixes from this list when they are superseded.
Note: Keep the list ordered by user impact, not implementation order.
Note: Update any totals if the list length changes.
Note: Confirm each entry has a user-facing summary.

### Backend (9 fixes)

| Fix | File | What Changed |
|-----|------|-------------|
| **AI Usage Tracking** | `controllers/ai.controller.ts` | All `trackAIUsage()` calls now pass `req.user.id` instead of `req.workspace.id`, preventing foreign key violations on the ActivityLog table |
| **Production Secrets** | `config/index.ts` | `validateConfig()` now throws a fatal error if JWT secrets or encryption keys are defaults in production (`NODE_ENV=production`) |
| **CORS Restriction** | `index.ts` | The else branch now checks `config.nodeEnv !== 'production'` before allowing unknown origins — production only accepts whitelisted origins |
| **Avatar Field Mismatch** | `routes/social-account.routes.ts` | Zod schemas changed from `accountAvatarUrl` to `profileImageUrl` to match what the controller destructures |
| **User Preferences** | `services/user.service.ts` | `timezone` and `language` are now stored inside the `preferences` JSON field instead of non-existent Prisma columns |
| **LINK Post Type** | `routes/post.routes.ts` | Added `'LINK'` to both create and update PostType Zod enums to match the Prisma schema |
| **Platform Validation** | `routes/template.routes.ts` | Template `platforms` field now validates against `SocialPlatform` enum instead of accepting any string |
| **Controller Export** | `controllers/index.ts` | Added missing `export * as templateController from './template.controller'` |
| **Debug Logs** | `controllers/ai.controller.ts` | Removed 6 `console.log`/`console.error` debug statements from the image result handler |

### Frontend (5 fixes)

| Fix | File | What Changed |
|-----|------|-------------|
| **Template Update** | `services/api.ts` | `templatesApi.update()` changed from `PATCH` to `PUT` to match backend route definition |
| **Dashboard Path** | `components/layout/Sidebar.tsx` | Dashboard nav item path changed from `'/'` to `'/dashboard'` so the active indicator highlights correctly |
| **Logout Security** | `components/layout/Header.tsx` | Logout now calls the backend logout endpoint via `fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })` to invalidate the refresh token before clearing local state |
| **Unicode Encoding** | `pages/DesignStudio.tsx` | Replaced garbled `Ã—` with proper `×` character in template dimension display |
| **CSS Typo** | `pages/DesignStudio.tsx` | Fixed video editor class `max-h-90ct-contain` to `max-h-[360px] object-contain` |

---

## 2. Design Studio Upgrades

### 2.1 Right-Side Properties Panel

**What it does**: When you select any object on the canvas, a properties panel slides in on the right side (hidden on screens smaller than `lg` breakpoint).

**How it works**:
- **Position & Size**: Edit X, Y, Width, Height directly via number inputs. Changes apply in real-time.
- **Rotation**: Drag the slider (0-360°) to rotate the selected object. The current angle is shown on the right.
- **Opacity**: Slider from 0-100% controls object transparency.
- **Fill & Stroke** (shapes only): Color pickers for fill and stroke, plus a stroke width slider.
- **Typography** (text objects only): Font family dropdown, font size input, Bold/Italic/Underline toggle buttons, and text color picker.
- **Quick Actions**: 8-button grid for Duplicate, Delete, Bring to Front, Send to Back, Flip Horizontal, Flip Vertical, Lock/Unlock, and Center.

**To use**: Click any object on the canvas → the panel appears automatically on the right.

### 2.2 Bottom Status Bar

**What it does**: Displays contextual information below the canvas area.

**Shows**: Canvas dimensions (e.g., "1080 × 1080px"), zoom level, number of objects, current page, and the type of selected object (if any).

### 2.3 Custom Range Input Styling

**What it does**: All slider inputs (`<input type="range">`) throughout the Design Studio now use custom indigo-themed styling instead of browser defaults.

**How it works**: CSS in `index.css` targets all range inputs within `.design-studio`. Features:
- 6px-tall track with rounded corners
- 14px indigo dot thumb with shadow
- Hover effect: thumb scales up with a soft glow ring
- Dark mode compatible

### 2.4 Panel Transitions

**What it does**: Left sidebar tool panels now animate smoothly with a 200ms ease-out transition and a subtle fade-in from the left.

**Technical**: Uses `@keyframes panelFadeIn` for content and Framer Motion for the panel container width.

### 2.5 Auto-Save Recovery

**What it does**: If you had unsaved work from a previous session (within 24 hours), the Design Studio will prompt you to recover it on page load.

**How it works**:
1. On mount, checks `localStorage` for `designStudio_autosave`
2. If data exists and was saved within 24 hours, shows a `window.confirm()` dialog
3. If confirmed, restores the canvas JSON, dimensions, and design name
4. Shows a toast notification on successful recovery

### 2.6 Duplicate Templates Panel Fix

**What it does**: Removed a duplicate `{activePanel === 'templates' && ...}` block that was rendering a second, simpler templates panel below the keyboard shortcuts section.

### 2.7 History Stale Closure Fix

**What it does**: Fixed `saveToHistory` which previously depended on `history` state in its dependency array, causing stale closure issues. Now uses functional state update `setHistory(prev => ...)` to always work with the latest state.

---

## 3. Internationalization (i18n)

### Overview

The application now includes a full internationalization system supporting **10 languages**:

| Language | Code | Direction |
|----------|------|-----------|
| English | `en` | LTR |
| Spanish (Español) | `es` | LTR |
| French (Français) | `fr` | LTR |
| German (Deutsch) | `de` | LTR |
| Portuguese (Português) | `pt` | LTR |
| Japanese (日本語) | `ja` | LTR |
| Korean (한국어) | `ko` | LTR |
| Chinese (中文) | `zh` | LTR |
| Arabic (العربية) | `ar` | **RTL** |
| Hindi (हिन्दी) | `hi` | LTR |

### How It Works

1. **Provider**: `I18nProvider` wraps the entire app in `App.tsx`
2. **Auto-detection**: On first load, detects the browser's language (`navigator.language`). If it matches a supported language, it's used automatically.
3. **Persistence**: Language preference is saved to `localStorage` under `app_language`
4. **RTL Support**: When Arabic is selected, `document.documentElement.dir` is set to `'rtl'`, enabling right-to-left layout
5. **Usage in components**: Import `useI18n` hook, then call `t('key')` to get the translated string

### Translation Keys Available

- **Navigation**: `nav.dashboard`, `nav.calendar`, `nav.createPost`, `nav.designStudio`, etc.
- **Common Actions**: `common.save`, `common.cancel`, `common.delete`, `common.search`, etc.
- **Auth**: `auth.login`, `auth.register`, `auth.logout`, `auth.email`, etc.
- **Dashboard**: `dashboard.title`, `dashboard.welcome`, `dashboard.totalPosts`, etc.
- **Posts**: `posts.create`, `posts.schedule`, `posts.publish`, `posts.draft`, etc.
- **Settings**: `settings.title`, `settings.profile`, `settings.language`, `settings.timezone`, etc.
- **Design Studio**: `design.title`, `design.templates`, `design.elements`, `design.text`, etc.

### Adding a New Language

1. Open `frontend/src/lib/i18n.tsx`
2. Add the language to `SUPPORTED_LANGUAGES` array
3. Add a new key to the `translations` object with all translation keys filled in

### Using in Components

```tsx
import { useI18n } from '../lib/i18n'

function MyComponent() {
  const { t, language, setLanguage } = useI18n()
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome')}</p>
      
      {/* Language selector */}
      <select value={language} onChange={e => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        {/* ... */}
      </select>
    </div>
  )
}
```

---

## 4. How Each Feature Works

### Security Improvements

| Feature | Behavior |
|---------|----------|
| **Production Secret Check** | On server startup in production, if `JWT_SECRET`, `JWT_REFRESH_SECRET`, or `ENCRYPTION_KEY` are defaults, the server throws immediately and does not start |
| **CORS Lockdown** | In production, only origins in the `allowedOrigins` whitelist are accepted. In development, all origins pass through |
| **Server-Side Logout** | The frontend now sends a `POST /api/auth/logout` request with credentials before clearing local state, ensuring the refresh token cookie is invalidated server-side |
| **AI Usage Tracking** | Uses `req.user.id` (authenticated user) instead of `req.workspace.id`, preventing Prisma foreign key constraint violations on the `ActivityLog.userId → User.id` relation |

### Data Integrity Fixes

| Feature | Behavior |
|---------|----------|
| **User Preferences** | `timezone` and `language` are stored as nested properties inside the `preferences` JSON field on the User model, avoiding Prisma "unknown field" errors |
| **Avatar URLs** | Social account Zod schemas now use `profileImageUrl` matching the controller's destructuring — avatar URLs are no longer silently dropped |
| **Post Types** | The `LINK` post type is now accepted by route validation, matching what the Prisma schema defines |
| **Template Platforms** | Template platforms are validated against the `SocialPlatform` enum instead of accepting arbitrary strings |

### Design Studio UX Flow

1. **Open Design Studio** → Auto-save recovery prompt if previous work exists
2. **Choose Template** → Template modal shows preset sizes for all social platforms
3. **Design** → Use left panel tools (18 categories) to add elements, text, shapes, etc.
4. **Select Object** → Right properties panel slides in with position, size, styling controls
5. **Edit Properties** → All changes apply in real-time to the canvas
6. **Status Bar** → Bottom bar always shows canvas dimensions, zoom, object count, page number
7. **Export** → Download as PNG, JPEG, SVG, PDF, or JSON project file
8. **Share** → Post directly to connected social media accounts

---

*End of Feature Documentation*

# CLAUDE.md — TutorConnect Frontend

## Project Overview

**TutorConnect** is an on-demand tutoring marketplace that connects learners with verified
tutors across academic subjects and practical skills (languages, cooking, mechanics, etc.).
The platform is commission-based: TutorConnect retains a percentage of each completed and
paid session. Core differentiators are AI-powered tutor matching and real-time
bidirectional chat.

This file is the authoritative guide for every code-generation, refactoring, and review
task performed by Claude Code on the frontend codebase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (managed workflow) |
| Package manager | npm |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| State management | Zustand (global) + React Query (server state) |
| Authentication | Clerk Expo SDK (`@clerk/clerk-expo`) |
| Real-time | Socket.io client (WebSocket chat) |
| Push notifications | Firebase Cloud Messaging via Expo Notifications (future) |
| Payments | Stripe React Native SDK (simulated flow) |
| Video calls | External provider deep-link / WebView token handoff |
| Styling | NativeWind (Tailwind CSS for React Native) |
| Forms | React Hook Form + Zod validation |
| HTTP client | Axios with interceptors |
| Icons | `@expo/vector-icons` |
| Calendar | `react-native-calendars` |
| Linting | ESLint + Prettier |

---

## Screen & Module Mapping

Each screen group maps to a backend module. Maintain this mapping when creating new files.

| Screen group | Backend module | Expo Router path |
|---|---|---|
| Onboarding / Auth | MOD-AUT-001 | `app/(auth)/` |
| Learner dashboard | MOD-USR-002 | `app/(learner)/dashboard` |
| Tutor dashboard | MOD-USR-002 | `app/(tutor)/dashboard` |
| Search & AI chatbot | MOD-BUS-003 | `app/(learner)/search` |
| Tutor profile | MOD-USR-002 | `app/(learner)/tutor/[id]` |
| Booking flow | MOD-RES-004 | `app/(learner)/booking/` |
| Calendar | MOD-RES-004 | `app/(shared)/calendar` |
| Messaging / Chat | MOD-MSG-005 | `app/(shared)/chat/` |
| Reviews | MOD-REV-006 | `app/(shared)/review/` |
| KPI dashboard | MOD-REV-006 | `app/(admin)/kpis` |
| Payment | MOD-RES-004 | `app/(learner)/payment/` |
| Audit logs | MOD-LOG-007 | `app/(admin)/audit` |
| Settings / Profile | MOD-USR-002 | `app/(shared)/settings` |

---

## Code Standards

### Language

**All code, comments, JSDoc, console messages, and commit messages must be written in
formal English.** The UI copy and user-facing strings are in Spanish, but the codebase
is English-only without exception.

### TypeScript

- `strict: true` in `tsconfig.json` — no implicit `any`, no non-null assertion abuse.
- Never use `any`. Use `unknown` with type guards where the type is genuinely uncertain.
- Use `type` for unions/intersections; use `interface` for component props and API
  response shapes.
- All API response types must be defined in `src/types/api/` and shared across screens.

### Formatting & style

- 2-space indentation.
- Single quotes for strings.
- Trailing commas in multi-line structures.
- Max line length: 100 characters.
- ESLint + Prettier configured at the repository root — all generated code must pass
  linting without modifications.

### Documentation

- Every exported component, hook, and utility function must have a JSDoc block.
- Use `@param`, `@returns`, and `@example` where relevant.
- Include `@author TutorConnect Team` on new files.
- Complex UI logic (e.g. optimistic updates, WebSocket reconnection) must be explained
  inline.

---

## Design Principles (non-negotiable)

| Principle | Application |
|---|---|
| **SOLID** | One responsibility per component; depend on custom hooks and context, not concrete API calls; open for extension via composition |
| **DRY** | Extract repeated UI patterns into shared components; never duplicate form validation schemas or API call logic |
| **KISS** | Prefer the simplest component structure that satisfies requirements; no over-engineered abstractions |
| **YAGNI** | Do not create components, hooks, or utilities not required by the current task |

---

## Component Architecture

### Folder structure (expected)

```
apps/
  frontend/
    app/                   # Expo Router — screens and layouts
      (auth)/
      (learner)/
      (tutor)/
      (admin)/
      (shared)/
    src/
      components/
        ui/                # Primitive: Button, Input, Card, Badge, Avatar
        layout/            # Screen wrappers, headers, tab bars
        features/          # Domain-specific composite components
          booking/
          chat/
          search/
          payment/
          calendar/
          review/
      hooks/               # Custom React hooks (one concern per hook)
      stores/              # Zustand stores (one file per domain)
      services/            # Axios API service layer (one file per module)
      types/
        api/               # API response/request types
        navigation/        # Route params
      utils/               # Pure functions (formatting, validation helpers)
      constants/           # App-wide constants (routes, config keys)
      i18n/                # Spanish UI strings (react-i18next)
    assets/
    .env.example
```

### Rules

- **Screens** are thin: they compose feature components and call hooks. No business logic
  in screen files.
- **Feature components** handle domain UI and call custom hooks for data.
- **Custom hooks** encapsulate all server-state logic (React Query) and local state.
- **Service files** contain only Axios calls — no state, no side-effects.
- **Zustand stores** manage global client-side state (auth session, active chat, theme).
  Server state lives exclusively in React Query cache.

---

## Design Patterns

### Creational
- **Factory**: component factory for role-based dashboard rendering
  (`LearnerDashboard` vs `TutorDashboard` resolved by `user.role`).

### Structural
- **Adapter**: all API service calls are wrapped in typed adapter functions — screens
  never call Axios directly.
- **Composite**: complex screens are built from smaller, independently testable feature
  components.
- **HOC / Decorator**: role-based route guards implemented as higher-order components
  wrapping Expo Router layouts.

### Behavioural
- **Observer**: React Query's `onSuccess` / `onError` callbacks for side-effects;
  Socket.io event listeners in the chat hook.
- **Strategy**: theming and role-based UI variations resolved at runtime without
  conditionals scattered across components.
- **Command**: form submission handlers encapsulate all validation + mutation logic.

---

## Authentication (Clerk)

- Use `@clerk/clerk-expo` exclusively. Never implement custom JWT parsing.
- Protected routes are wrapped with a `<ClerkAuthGuard>` layout component that redirects
  unauthenticated users to `/(auth)/sign-in`.
- The Clerk session token is attached to every Axios request via a request interceptor in
  `src/services/http.ts`.
- Supported providers: Google, Microsoft, GitHub (configured in the Clerk dashboard).
- Role (`TUTOR` | `LEARNER`) is stored in Clerk's `publicMetadata` and read client-side
  to determine which dashboard layout to render.

---

## Real-Time Chat (MOD-MSG-005)

- Socket.io client connects on app mount for authenticated users.
- The connection URL and auth token are managed in `src/hooks/useChat.ts`.
- **Only learners may initiate a new chat channel.** Enforce this by hiding the
  "Start conversation" CTA for tutor-role users at the component level.
- Incoming messages trigger a Zustand store update and a React Query cache invalidation
  for the message history query.
- Optimistic message sending: display the message immediately with a `SENDING` status;
  update to `SENT` or `FAILED` on server acknowledgement.
- Unread message count is displayed as a badge on the tab bar icon.

---

## Payments (Simulated)

- The payment flow is simulated — no real card processing.
- Use Stripe React Native SDK in test mode exclusively (`pk_test_...`).
- The payment screen displays a mock card form, submits a test token to the backend, and
  renders a confirmation screen.
- Never display or log real card numbers. Stripe test card `4242 4242 4242 4242` is the
  only accepted test input.
- Commission breakdown (tutor amount + platform fee) must be displayed to the learner
  before confirmation.

---

## Bookings & Calendar

- Calendar view uses `react-native-calendars` with marked dates for:
    - `CONFIRMED` bookings (teal dot),
    - `PENDING_CONFIRMATION` bookings (amber dot),
    - `COMPLETED` bookings (gray dot).
- Booking creation follows a multi-step flow:
    1. Select tutor → 2. Select slot → 3. Confirm & pay → 4. Confirmation screen.
- Cancellation triggers a confirmation modal before calling the API.

---

## AI Search (MOD-BUS-003)

- The AI chatbot screen (`app/(learner)/search`) connects to the backend's
  `/search/chat` endpoint via HTTP streaming (Server-Sent Events).
- Stream tokens are appended to the chat bubble in real time using a `useState` buffer.
- Personalised recommendations are fetched with React Query on dashboard mount and
  displayed in a horizontal scroll list.

---

## Quality Attributes

| Attribute | Expectation |
|---|---|
| **Performance** | FlatList / FlashList for all list screens; memoised components with `React.memo` and `useCallback` where profiling justifies it; no unnecessary re-renders |
| **Security** | No secrets in client bundle; Clerk JWT on every API call; input sanitisation on all user-generated content before display |
| **Observability** | Sentry (or equivalent) for crash reporting; meaningful breadcrumb labels per user action |
| **Maintainability** | One component per file; max 250 lines per component file; extract logic to hooks before the file grows beyond that |
| **Accessibility** | Every interactive element has an `accessibilityLabel`; minimum tap target 44×44 pt; sufficient colour contrast |
| **Portability** | Expo managed workflow — targets iOS and Android from a single codebase; no native modules unless unavoidable |

---

## UI / UX Conventions

- Primary brand colour: `#1a3c5e` (deep navy). Accent: `#4361ee` (electric blue).
  Secondary accent: `#f8c537` (golden yellow).
- Dark mode support via NativeWind `dark:` variants.
- All monetary values are displayed in **COP** (Colombian Peso) with
  `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`.
- Dates and times are formatted with `date-fns` using the `es` locale.
- Loading states use skeleton screens — never a full-screen spinner.
- Empty states always include an illustration, a descriptive message, and a CTA.
- Error states always include a retry button and a human-readable message in Spanish.

---

## Environment Variables

Never hardcode secrets. Read from `process.env` / `Constants.expoConfig.extra`.
Provide a fully documented `.env.example`.

Required variables include (non-exhaustive):

```
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_SOCKET_URL
```

---

## Testing

- **Unit tests**: Jest + React Native Testing Library. Every custom hook and utility
  function must have a `.test.ts` / `.test.tsx` file.
- **Component tests**: test behaviour, not implementation details. Query by
  `accessibilityLabel` or `testID`.
- **Test rule (absolute)**: test files are never modified to make tests pass. Only
  implementation code is adjusted.
- Mock all network calls with `msw` (Mock Service Worker) or Jest manual mocks.
- Mock Clerk with `@clerk/clerk-expo/jest-mock`.

---

## Git & Branching

- Branch naming: `feature/<module-code>-<short-description>` (e.g.
  `feature/MOD-MSG-005-chat-screen`).
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`,
  `chore:`, `docs:`.
- Pull requests require passing CI (lint + tests) before merge.

---

## What Claude Code Must Never Do

- Modify existing test files.
- Hardcode API URLs, secrets, or tokens in source files.
- Call Axios (or `fetch`) directly from a screen component — always go through a service
  function.
- Add `any` type assertions to silence TypeScript errors.
- Implement UI features not requested in the current task (YAGNI).
- Use `StyleSheet.create` for new components — use NativeWind classes exclusively.
- Create components longer than 250 lines without extracting sub-components or hooks.
- Display raw API error objects to the user — always map to a Spanish-language
  user-friendly message.
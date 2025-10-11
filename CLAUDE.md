# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GOGOCAE_R1** is a cloud-based SaaS web service for managing CAE (Computer-Aided Engineering) workflow between designers and analysts. The system allows designers to create analysis requests, analysts to manage and execute those requests, and both parties to track progress through calendar and kanban views.

### Tech Stack

- **Framework**: Next.js 15.1.0 with App Router (TypeScript)
- **UI**: React 19, Tailwind CSS, Shadcn UI components, Radix UI primitives
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password)
- **File Storage**: Supabase Storage
- **Deployment**: Vercel
- **State Management**: React Query (for server state), React Context + useReducer (for shared state), React hooks (for local state)
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack React Query
- **Drag & Drop**: @hello-pangea/dnd (for kanban board)
- **Calendar**: React Big Calendar (with date-fns and moment for date utilities)
- **Pattern Matching**: ts-pattern for type-safe pattern matching
- **Utilities**: es-toolkit (modern lodash alternative), react-use (useful hooks)

## Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack on http://localhost:3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint (warnings ignored during builds)

# EasyNext CLI commands (global installation required)
easynext lang ko         # Switch to Korean version
easynext supabase        # Setup Supabase
easynext auth            # Setup authentication
easynext gtag            # Setup Google Analytics
easynext clarity         # Setup Microsoft Clarity
easynext channelio       # Setup ChannelIO
easynext sentry          # Setup Sentry
easynext adsense         # Setup Google Adsense
```

## Code Architecture

### Directory Structure

The project follows **Domain-Driven Design** principles with strict separation of concerns:

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route group: unauthenticated pages (DEPRECATED - see below)
│   ├── (main)/             # Route group: authenticated pages (DEPRECATED - see below)
│   ├── auth/               # Auth pages (login, signup) - NOT in route groups
│   ├── dashboard/          # Dashboard page
│   ├── requests/           # Request management pages
│   ├── calendar/           # Calendar view page
│   ├── kanban/             # Kanban board page
│   ├── admin/              # Admin pages
│   ├── settings/           # User settings page
│   ├── api/                # Server-side API routes
│   │   ├── auth/           # Auth API endpoints (signup, login, logout)
│   │   ├── requests/       # Request CRUD operations
│   │   ├── dashboard/      # Dashboard stats & activities
│   │   ├── notifications/  # Notification endpoints
│   │   ├── admin/          # Admin-specific endpoints
│   │   └── user/           # User profile endpoints
│   ├── page.tsx            # Landing page (public)
│   ├── layout.tsx          # Root layout
│   ├── providers.tsx       # Global providers (Theme, React Query)
│   └── globals.css         # Global styles
│
├── components/             # Global, reusable UI components
│   ├── ui/                 # Shadcn UI components (Button, Input, Dialog, etc.)
│   ├── layout/             # Layout components (Header, Sidebar, etc.)
│   ├── auth/               # Auth-related UI components
│   ├── calendar/           # Calendar view components
│   ├── kanban/             # Kanban board components
│   ├── file-upload/        # File upload components
│   ├── report-upload/      # Report upload components
│   └── notification/       # Notification components
│
├── domains/                # Business domain logic (CORE)
│   ├── auth/
│   │   ├── hooks/          # useAuth, useUserRole, etc.
│   │   ├── services/       # authService (API calls)
│   │   ├── types.ts        # UserRole enum, Zod schemas
│   │   └── constants.ts    # Auth-related constants
│   │
│   └── request/            # CAE request domain
│       ├── hooks/          # useRequests, useCreateRequest, etc.
│       ├── services/       # requestService (API calls)
│       └── types.ts        # RequestStatus, RequestPriority, Zod schemas
│
├── lib/                    # Third-party library configs
│   ├── supabase/
│   │   ├── client.ts       # Browser client (read-only, public data)
│   │   ├── server.ts       # Server client (for API routes)
│   │   └── middleware.ts   # Middleware client (for auth checks)
│   ├── utils.ts            # Common utility functions (cn, etc.)
│   └── file-upload.ts      # File upload utilities
│
├── hooks/                  # Global custom hooks
│   ├── use-toast.ts        # Toast notification hook
│   └── useUserRole.ts      # User role checking hook
│
├── services/               # Global API services
└── middleware.ts           # Route protection & auth (runs on Node.js runtime)
```

**Important**: Route groups `(auth)` and `(main)` are NOT used in this project. All pages are directly under `/app` with clear paths (e.g., `/app/auth/login/page.tsx`, `/app/dashboard/page.tsx`, `/app/requests/page.tsx`). Do NOT create route groups with parentheses.

### Key Architectural Patterns

1. **Server-First Security**: All Supabase operations MUST happen in API Routes (`/app/api`), never in client components
2. **Unidirectional Data Flow** (CRITICAL - This is the core pattern):
   ```
   User Action → Component Event Handler → Custom Hook → Service Function → API Route → Supabase
                                                                                          ↓
   User sees result ← Component re-renders ← Hook updates state ← API returns ← Database operation
   ```
   - **Components** trigger actions via custom hooks
   - **Custom Hooks** (`/domains/*/hooks/`) manage state and call service functions
   - **Service Functions** (`/domains/*/services/`) make fetch calls to API Routes
   - **API Routes** (`/app/api/`) are the ONLY layer that interacts with Supabase
   - This pattern ensures security, maintainability, and clear separation of concerns
3. **Role-Based Access Control (RBAC)**: Three roles defined in `UserRole` enum:
   - `designer`: Creates analysis requests
   - `analyst`: Executes analysis work, uploads reports
   - `admin`: Full access to all features
4. **Domain Separation**: Business logic is isolated by domain (auth, request) with clear boundaries

### Authentication & Authorization

- **Middleware** (`src/middleware.ts`): Protects routes (`/dashboard`, `/requests`, `/admin`)
- **Session Management**: Handled by Supabase Auth with cookie-based sessions
- **Protected Routes**: Unauthenticated users redirected to `/auth/login`
- **Role Restrictions**: Enforced in middleware and API routes

### Request Lifecycle

Requests follow this status flow:
```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
                  ↘ CANCELLED
```

Each request can have:
- **Request Files**: Initial models/documents uploaded by designer
- **Report Files**: Analysis results uploaded by analyst

## Critical Implementation Rules

### TypeScript Standards

1. **No `any` type** - Use specific types or `unknown`
2. **Explicit typing** - All function parameters and returns must be typed
3. **Use interfaces** for object shapes
4. **Named exports** for everything except Next.js pages/layouts/routes
5. **Import order**:
   ```typescript
   // 1. React/Next.js
   import { useState } from 'react';
   import { useRouter } from 'next/navigation';

   // 2. External libraries
   import { zodResolver } from '@hookform/resolvers/zod';

   // 3. Internal absolute paths
   import { Button } from '@/components/ui/button';
   import { useRequests } from '@/domains/request/hooks/useRequests';

   // 4. Relative paths
   import { FormInput } from './FormInput';
   ```

### Component Standards

- **ALL components MUST be Client Components** - Add `'use client'` directive at the top
- **Arrow functions** for all components (for consistency)
- **Max 200 lines** per component file (split larger components)
- **Constants** for magic strings/numbers (defined in domain `constants.ts` or `types.ts`)
- **Error handling**: All API routes wrapped in try/catch with standardized error responses
- **Responsive errors**: Custom hooks must expose error state
- **Page params**: In Next.js 15 App Router, page params props are Promise types - must be awaited
- **Placeholder images**: Use picsum.photos for placeholder images

### API Route Pattern

**CRITICAL**: All API routes that use Supabase MUST set runtime to Node.js (not Edge):

```typescript
// /app/api/requests/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// REQUIRED: Set Node.js runtime for Supabase compatibility
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    // Validate with Zod schema before processing
    // Implement business logic
    // Perform DB operations

    return NextResponse.json(
      { data: { id: 'result' } },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

**Standardized Response Format**:
- Success: `{ data: { ...result } }`
- Error: `{ error: { message: 'Error description' } }`

### Supabase Usage

- **Client-side** (`src/lib/supabase/client.ts`): Only for reading public data, NEVER for mutations or authenticated operations
- **Server-side** (`src/lib/supabase/server.ts`): Use `createServerSupabaseClient()` in API routes for all database operations and mutations
- **Middleware** (`src/lib/supabase/middleware.ts`): Use `createClient(request)` for auth checks in middleware only

**Important**: The server client in Next.js 15 requires awaiting the `cookies()` function, which is already handled in `createServerSupabaseClient()`.

### File Management

- **Max file size**: 50MB (Supabase free tier limit)
- **Allowed types**: CAD files (STEP, IGES), documents (PDF, Word, Excel, PowerPoint), images
- **File categories**: `request` (input files) or `report` (analysis results)
- **Upload flow**: Client → API Route → Get signed URL → Direct upload to Supabase Storage

## Database Schema (Key Tables)

### `profiles`
- User profile info linked to Supabase Auth
- Stores `role` (designer/analyst/admin), `full_name`, `email`
- Has Row Level Security (RLS) policies for access control

### `requests`
- CAE analysis requests
- Foreign keys: `requester_id` (references profiles), `assignee_id` (nullable, references profiles)
- Fields: `title`, `description`, `car_model`, `analysis_type`, `priority`, `status`, `requested_deadline`
- Status values: pending, assigned, in_progress, completed, cancelled
- Priority values: low, medium, high, urgent

### `request_files`
- Files attached to requests
- Foreign key: `request_id` (references requests)
- Fields: `file_name`, `file_path`, `file_size`, `file_type`, `content_type`, `file_category`, `uploaded_by`, `metadata`
- `file_category`: 'request' (input files from designer) or 'report' (analysis results from analyst)
- Metadata is stored as JSONB for flexible additional information

### `notifications`
- User notifications
- Fields: `user_id`, `type`, `title`, `message`, `related_request_id`, `is_read`
- Types: request_created, request_assigned, request_status_changed, request_completed

**Note**: All tables have Row Level Security (RLS) enabled with policies based on user roles.

## Environment Variables

Required variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon/public key
```

## Key Features & Pages

- **Landing Page** (`/`): Public marketing page with hero section and feature highlights
- **Auth Pages** (`/auth/login`, `/auth/signup`): Email/password authentication with role selection
- **Dashboard** (`/dashboard`): Stats cards (total requests, in progress, completed, pending), recent activity feed
- **Requests** (`/requests`):
  - List view with filters (status, priority, assignee)
  - Create/edit forms with file upload
  - Detail view with file management and status updates
- **Calendar** (`/calendar`): Timeline view using React Big Calendar showing requests by deadline
- **Kanban** (`/kanban`): Drag-and-drop board using @hello-pangea/dnd for status management (columns: pending, assigned, in_progress, completed)
- **Admin Pages** (`/admin`): User management, system settings (admin role only)
- **Settings** (`/settings`): User profile and preferences

## Common Tasks

### Adding a New Domain

1. Create `src/domains/[domain-name]/` directory
2. Add subdirectories: `components/`, `hooks/`, `services/`
3. Define types in `types.ts` with Zod schemas
4. Create service functions for API calls
5. Implement custom hooks for state management
6. Build domain-specific components

### Adding a New API Route

1. Create route file: `src/app/api/[resource]/route.ts`
2. **Add `export const runtime = 'nodejs';`** at the top (REQUIRED for Supabase)
3. Import `createServerSupabaseClient` from `@/lib/supabase/server`
4. Add authentication check using `supabase.auth.getUser()`
5. Validate request body with Zod schema
6. Implement business logic with proper error handling
7. Return standardized response: `{ data: {...} }` or `{ error: { message: '...' } }`

### Adding a New Protected Page

1. Create page directly under `/app` (e.g., `/app/my-feature/page.tsx`) - do NOT use route groups
2. Add `'use client'` directive at the top (all pages must be client components)
3. If the route needs protection, add it to the `protectedRoutes` array in `src/middleware.ts`
4. For role-based access, add the route to `roleRestrictedRoutes` object in middleware
5. Use `useAuth` hook from `@/domains/auth/hooks/useAuth` to access user data in the component
6. Handle params as Promise types in Next.js 15: `const params = await props.params;`

## Important Constraints

- **All components must be Client Components** - Add `'use client'` directive
- **No default exports** except for Next.js special files (page.tsx, layout.tsx, route.ts)
- **State management**:
  - Use useState for local component state
  - Use React Context + useReducer for shared state between nested components
  - Use React Query for server state (preferred for API data)
  - **DO NOT** introduce Zustand or other global state libraries for MVP - the combination of custom hooks and context is sufficient
- **Server-side validation** - Always validate with Zod schemas in API routes
- **TypeScript configuration**:
  - `strict: true`
  - `strictNullChecks: false`
  - `noImplicitAny: false`
  - Target: ES2017
- **ESLint ignored during builds** - Fix linting issues manually, warnings don't block builds
- **Runtime specification** - All API routes using Supabase MUST set `export const runtime = 'nodejs';`

## Korean Language

This project is primarily in Korean:
- UI text and labels are in Korean
- Comments can be in Korean or English
- Error messages should be in Korean for end users
- Code identifiers (variables, functions) must be in English

## Performance Considerations

- Use Next.js Image component for all images
- Implement code splitting for large components
- Leverage React Query for caching and background refetching
- Use Vercel Edge Network (CDN) for static assets
- Consider SSR for initial page loads, CSR for dynamic updates

## Common Patterns & Best Practices

### Data Flow Pattern (Complete Example)

```typescript
// Example: Creating a new CAE request - Shows the complete data flow

// 1. UI COMPONENT: User interaction triggers hook function
// /src/domains/request/components/CreateRequestButton.tsx
'use client';
import { useCreateRequest } from '@/domains/request/hooks/useCreateRequest';

export const CreateRequestButton = () => {
  const { create, isLoading } = useCreateRequest();

  const handleClick = () => {
    create({
      title: 'New Analysis',
      description: 'Analysis details',
      analysis_type: 'structural'
    });
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      Create Request
    </button>
  );
};

// 2. CUSTOM HOOK: Manages state and calls service function
// /src/domains/request/hooks/useCreateRequest.ts
import { useState } from 'react';
import { createRequest as createRequestService } from '@/domains/request/services/requestService';

export const useCreateRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (data) => {
    setIsLoading(true);
    try {
      const result = await createRequestService(data);
      // Handle success (e.g., invalidate cache, show toast)
      return result;
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { create, isLoading, error };
};

// 3. SERVICE FUNCTION: Makes fetch call to API Route
// /src/domains/request/services/requestService.ts
export const createRequest = async (data) => {
  const response = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create request');
  }

  return response.json();
};

// 4. API ROUTE: ONLY layer that interacts with Supabase
// /src/app/api/requests/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // REQUIRED for Supabase

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    // Validate with Zod schema here...

    // Perform database operation
    const { data, error } = await supabase
      .from('requests')
      .insert({
        ...body,
        requester_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

**Key Takeaway**: NEVER call Supabase from components or hooks. ALWAYS go through API Routes.

### File Upload Pattern
1. User selects files in UI (using react-dropzone)
2. Client-side validation (file size, type)
3. Call API endpoint to get signed upload URL
4. Upload file directly to Supabase Storage using signed URL
5. Save file metadata to `request_files` table via API
6. Update UI to show uploaded files

### Authentication Flow
1. User submits login/signup form
2. Form validated with Zod schema (client-side)
3. API route validates again (server-side) and calls Supabase Auth
4. On success, Supabase sets auth cookies automatically
5. Middleware checks auth status on subsequent requests
6. Protected routes redirect to login if no valid session

### Role-Based UI Rendering
```typescript
const { user } = useAuth();
const { isDesigner, isAnalyst, isAdmin } = useUserRole();

// Show different UI based on role
{isDesigner && <CreateRequestButton />}
{isAnalyst && <AssignRequestButton />}
{isAdmin && <AdminPanel />}
```

## Troubleshooting Common Issues

### "Edge Runtime" Warning with Supabase
**Problem**: Vercel Edge Runtime doesn't support all Node.js APIs needed by Supabase.
**Solution**: Add `export const runtime = 'nodejs';` to all API routes that use Supabase.

### Type Error with Page Params
**Problem**: In Next.js 15, page params are Promise types.
**Solution**: Await params before using: `const params = await props.params;`

### Import Path Error with useToast
**Problem**: Old projects may have wrong import path for toast hook.
**Solution**: Use `import { useToast } from '@/hooks/use-toast';`

### Authentication Not Persisting
**Problem**: User gets logged out on page refresh.
**Solution**: Ensure middleware is properly configured and cookies are being set. Check that `createServerSupabaseClient()` is used in API routes, not client-side Supabase.

# GOGOCAE_R1 Code Guideline

This document provides the official coding standards and architectural patterns for the GOGOCAE_R1 project. Adherence to these guidelines is mandatory to ensure code quality, maintainability, and consistency.

## 1. Project Overview

GOGOCAE_R1 is a cloud-native SaaS web service for managing Computer-Aided Engineering (CAE) workflows.

### Technical Context & Architecture
- **Tech Stack**: The project is a full-stack TypeScript application built with Next.js. The backend is implemented as serverless API Routes within the same Next.js application.
- **Backend as a Service (BaaS)**: Supabase provides the core backend infrastructure, including the PostgreSQL database, user authentication (Supabase Auth), and file management (Supabase Storage).
- **Deployment**: The application is deployed and hosted on Vercel, which is optimized for the Next.js framework.
- **Architectural Approach**: We employ a **Domain-Driven code organization**. Logic is separated by business domains (e.g., `auth`, `request`), and business-critical operations are handled exclusively on the server-side (API Routes) to ensure security and data integrity.

## 2. Core Principles

- **Domain-Driven Structure is Mandatory**: All code must be organized by business domain to ensure high cohesion and low coupling.
- **Type Safety is Non-Negotiable**: Leverage TypeScript to its full potential; avoid `any` to prevent runtime errors and improve maintainability.
- **Server-Side Logic First**: Complex business logic, data validation, and all Supabase interactions MUST reside in Next.js API Routes, not the client.
- **Clarity Over Premature Optimization**: Write simple, readable code first. Optimize only when a measured performance bottleneck is identified.

## 3. Language-Specific Guidelines (TypeScript/Next.js)

### File Organization and Directory Structure

The project MUST follow the structure defined in the TRD. This organizes code by feature and domain, separating concerns effectively.

```
/src/
├── app/                 # Next.js App Router: Pages, Layouts, API Routes
│   ├── (auth)/          # Route group for authentication pages
│   ├── (main)/          # Route group for authenticated app pages
│   ├── api/             # All server-side API endpoints
│   └── page.tsx         # Public landing page
├── components/          # Global, reusable, stateless UI components (e.g., Button, Input)
├── domains/             # CORE: Business domain logic and components
│   ├── request/         # Example: "CAE Request" domain
│   │   ├── components/  # Components specific to the 'request' domain
│   │   ├── hooks/       # Custom hooks for 'request' domain logic
│   │   ├── services/    # Client-side functions for calling 'request' APIs
│   │   └── types.ts     # TypeScript types/interfaces for the 'request' domain
│   └── ...              # Other domains (auth, dashboard)
├── lib/                 # Third-party library initializations (e.g., Supabase client)
└── styles/              # Global CSS files
```

### Import/Dependency Management

- **MUST** use absolute paths for imports, configured in `tsconfig.json`. This improves refactoring and readability.
- **MUST** order imports in the following sequence:
    1.  React and Next.js imports
    2.  External library imports
    3.  Internal absolute path imports (`@/components`, `@/domains`)
    4.  Relative path imports (`./`, `../`)

```typescript
// MUST: Follow this import order
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useCreateRequest } from '@/domains/request/hooks/useCreateRequest';
import { RequestFormSchema, RequestFormData } from '@/domains/request/types';

import { FormInput } from './FormInput';
```

### Error Handling Patterns

- **API Routes**: All API route handlers **MUST** be wrapped in a `try...catch` block to handle unexpected errors gracefully and return a standardized error response.

```typescript
// MUST: Standard API route error handling in /app/api/**/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {  
  try {
    const body = await request.json();
    // ... business logic
    return NextResponse.json({ data: { id: 'new-id' } }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { message: 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}
```

- **Client-Side Data Fetching**: Custom hooks for data fetching **MUST** return an `error` state. UI components must handle this state to provide user feedback.

```typescript
// MUST: Expose error state from custom hooks
function useRequests() {
  const [data, setData] = useState(null);
  const [error, setError] = useState<Error | null>(null);
  // ... fetching logic that sets data or error
  return { data, error, isLoading };
}
```

## 4. Code Style Rules

### MUST Follow

1.  **Naming Conventions**:
    -   Components and Type/Interface names: `PascalCase` (e.g., `RequestForm`, `interface UserProfile`).
    -   Variables, functions, and non-component files: `camelCase` (e.g., `currentUser`, `getRequestById.ts`).
    -   Custom Hooks: Prefixed with `use` (`useUserData`).

2.  **Function Components**:
    -   **MUST** use arrow functions for declaring components. This ensures consistency.

    ```typescript
    // MUST: Use arrow functions for components
    import React from 'react';

    interface MyButtonProps {
      label: string;
    }

    export const MyButton = ({ label }: MyButtonProps) => {
      return <button>{label}</button>;
    };
    ```

3.  **Explicit Typing**:
    -   **MUST** provide explicit types for all function parameters and return values.
    -   **MUST** use TypeScript `interface` for defining the shape of objects.

4.  **Environment Variables**:
    -   Client-side (browser-accessible) variables **MUST** be prefixed with `NEXT_PUBLIC_`.
    -   Server-side-only variables **MUST NOT** have this prefix.

### MUST NOT Do

1.  **The `any` Type**:
    -   **MUST NOT** use `any`. It defeats the purpose of TypeScript. Use `unknown` for safer type checking or define a specific type.

    ```typescript
    // MUST NOT: Use of 'any' is forbidden
    function processData(data: any) { // Wrong
      console.log(data.name); // Unsafe
    }

    // MUST: Define a type or use 'unknown'
    interface Processable {
      name: string;
    }
    function processData(data: Processable) { // Correct
      console.log(data.name);
    }
    ```

2.  **Default Exports**:
    -   **MUST NOT** use `export default` for anything other than Next.js pages, layouts, and route handlers. Use named exports to avoid naming conflicts and improve discoverability.

    ```typescript
    // MUST NOT: Avoid default exports in components/utils
    // utils.ts
    export default function someUtil() { /* ... */ } // Wrong

    // MUST: Use named exports
    // utils.ts
    export const someUtil = () => { /* ... */ }; // Correct
    ```

3.  **Large, Monolithic Components**:
    -   A single component file **MUST NOT** exceed 200 lines of code.
    -   Break down complex components into smaller, single-responsibility components.

4.  **Magic Strings and Numbers**:
    -   **MUST NOT** use hardcoded strings or numbers for values that are used in multiple places (e.g., status types, roles, API keys). Define them as constants in a central file.

    ```typescript
    // MUST NOT: Using magic strings
    if (request.status === 'In Progress') { /* ... */ }

    // MUST: Use constants
    import { REQUEST_STATUS } from '@/domains/request/constants';
    if (request.status === REQUEST_STATUS.IN_PROGRESS) { /* ... */ }
    ```

## 5. Architecture Patterns

### Component/Module Structure

-   **Global Components (`/src/components`)**: These are pure, stateless UI components used across multiple domains (e.g., `Button`, `Card`, `Input`). They should not contain any business logic.
-   **Domain Components (`/src/domains/[domain]/components`)**: These components belong to a specific business domain. They compose global components and implement UI logic relevant to their domain (e.g., `RequestForm`, `DashboardCalendar`).
-   **Custom Hooks (`/src/domains/[domain]/hooks`)**: Contain state management, data fetching, and side effects related to a domain. They are the primary way components interact with services.

### Data Flow Pattern

The data flow is unidirectional and server-centric to maintain security and integrity.

1.  **UI Component**: A user interaction triggers a function call from a custom hook.
2.  **Custom Hook**: The hook executes a `service` function.
3.  **Service Function**: A client-side service calls our internal Next.js API Route using `fetch`.
4.  **API Route**: This is the **only** layer that interacts with the Supabase client (`supabase-js` SDK). It contains all business logic, validation, and data transformation.
5.  **Supabase**: Executes the database query, authentication, or file operation.

```typescript
// Example: Creating a new CAE request

// 1. /src/domains/request/components/CreateRequestButton.tsx
import { useCreateRequest } from '@/domains/request/hooks/useCreateRequest';
export const CreateRequestButton = () => {
  const { create, isLoading } = useCreateRequest();
  return <button onClick={() => create({ title: 'New Analysis' })} disabled={isLoading}>Create</button>;
};

// 2. & 3. /src/domains/request/hooks/useCreateRequest.ts (includes service call)
import { createRequest as createRequestService } from '@/domains/request/services/requestService';
export const useCreateRequest = () => {
  // ... state logic
  const create = async (data) => {
    const result = await createRequestService(data);
    // ... handle result
  };
  return { create, isLoading };
};

// /src/domains/request/services/requestService.ts
export const createRequest = async (data) => {
  const response = await fetch('/api/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

// 4. /src/app/api/requests/route.ts (Server-side logic)
import { createServerClient } from '@/lib/supabase/server';
export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  // ... validation logic ...
  const { data, error } = await supabase.from('requests').insert({ ...body, user_id: user.id });
  // ... return NextResponse ...
}
```

### State Management

-   **Local State**: **MUST** use `useState` for state that is confined to a single component.
-   **Shared State**: For state shared between a few nested components, **MUST** use `useContext` paired with `useReducer`. This avoids prop drilling without adding external dependencies.
-   **Global State**: **MUST NOT** introduce a global state management library (e.g., Redux, Zustand, Jotai) for the MVP. The combination of custom hooks and context is sufficient.

### API Design Standards

-   **Endpoint Naming**: Use RESTful, resource-based naming conventions for API Routes (e.g., `/api/requests`, `/api/requests/[id]`).
-   **HTTP Methods**: Use appropriate HTTP verbs:
    -   `GET`: Retrieve resources.
    -   `POST`: Create new resources.
    -   `PUT`/`PATCH`: Update existing resources.
    -   `DELETE`: Remove resources.
-   **Response Structure**: API responses **MUST** follow a consistent JSON structure.

```json
// MUST: Standard success response
{
  "data": {
    "id": "123",
    "title": "My CAE Request"
  }
}

// MUST: Standard error response
{
  "error": {
    "message": "You do not have permission to access this resource."
  }
}
```
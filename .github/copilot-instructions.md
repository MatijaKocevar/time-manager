# GitHub Copilot Instructions

## Code Quality Standards

### TypeScript Requirements

- Never use `any` types - always provide explicit, strict typing
- Use proper TypeScript interfaces and type definitions
- Prefer `unknown` over `any` when type is uncertain
- Use generic types and constraints where appropriate

### Code Style

- No comments in code - write self-documenting, clear code
- Use descriptive variable and function names
- Prefer functional programming patterns where applicable
- Use modern ES6+ syntax and React patterns

### Error Handling

- Never leave TypeScript errors or warnings
- Handle all possible error states explicitly
- Use proper error boundaries in React components
- Validate all external data with Zod schemas

## Architecture Patterns

### Next.js App Router

- Use Server Components for data loading by default
- Client Components only when interactivity is required
- Prefer Server Actions for mutations over API routes
- Use proper async/await patterns in Server Components

### State Management

- TanStack Query for server state management
- Zustand for client-side UI state only
- No custom hooks - use direct store access and queries
- Feature-based folder organization

### Database and API

- Use Prisma for all database operations
- Server Actions for data mutations
- Proper error handling and validation
- Type-safe database queries

## File Organization

### Feature-Based Structure

- Keep related files together in feature folders
- Each feature should contain: components/, actions/, stores/, types/, query-keys.ts
- Avoid scattered files across different directories
- Co-locate tests with their corresponding files

### Type and Schema Organization

- Use Zod schemas instead of TypeScript interfaces for validation + types
- Feature-specific types/schemas go in feature folders (app/tasks/types/)
- Only general/shared types go in src/types/
- Derive TypeScript types from Zod schemas using z.infer
- Each feature manages its own query keys in query-keys.ts

### Naming Conventions

- PascalCase for React components
- camelCase for functions and variables
- kebab-case for file names
- Descriptive, intention-revealing names

## React Patterns

### Component Design

- Prefer composition over inheritance
- Use proper prop typing with interfaces
- Implement proper loading and error states
- Use Suspense boundaries where appropriate

### Performance

- Use React Compiler optimizations
- Proper key props for list items
- Avoid unnecessary re-renders
- Use proper memoization patterns

## Security and Validation

### Input Validation

- Use Zod for all form validation
- Validate server action inputs
- Sanitize user inputs properly
- Use proper authentication checks

### Data Access

- Always verify user permissions
- Use proper session management
- Implement proper CSRF protection
- Follow principle of least privilege

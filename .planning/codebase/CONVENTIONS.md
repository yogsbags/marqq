# Coding Conventions

**Analysis Date:** 2025-01-17

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `DashboardContent.tsx`, `ChatToggle.tsx`)
- Services: camelCase with suffix (e.g., `agentService.ts`, `groqService.ts`)
- Types: camelCase (e.g., `agent.ts`, `auth.ts`)
- Hooks: camelCase with `use-` prefix (e.g., `use-toast.ts`)
- Utilities: camelCase (e.g., `utils.ts`)

**Functions:**
- camelCase (e.g., `createAgent`, `initializeAgents`)
- Event handlers: `handle` prefix (e.g., `handleSubmit`, `handleClick`)
- Boolean getters: `is` prefix (e.g., `isLoading`, `isAuthenticated`)

**Variables:**
- camelCase for regular variables
- UPPER_SNAKE_CASE for constants
- Private class members: no underscore prefix

**Types:**
- PascalCase for interfaces and types (e.g., `Agent`, `AgentTask`, `ChatMessage`)
- Suffix with purpose: `Props`, `Config`, `Options` (e.g., `AgentProps`)

## Code Style

**Formatting:**
- No dedicated Prettier config (using ESLint defaults)
- 2-space indentation (inferred)
- Single quotes for strings
- Semicolons required

**Linting:**
- Tool: ESLint 9.x with TypeScript-ESLint
- Config: `eslint.config.js`
- Key rules:
  - React Hooks rules (recommended)
  - React Refresh (warn on non-component exports)
  - TypeScript recommended rules

## Import Organization

**Order:**
1. External packages (react, third-party)
2. Internal aliases (`@/types/`, `@/components/`)
3. Relative imports (`./`, `../`)

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)

**Examples:**
```typescript
import { v4 as uuidv4 } from 'uuid';
import { GroqService, ChatMessage } from './groqService';
import { Agent, AgentTask } from '@/types/agent';
```

## Error Handling

**Patterns:**
- Try-catch for async operations
- Generic error messages (improvement needed)
- Console.error for logging (no structured logging)

**Current State:**
```typescript
try {
  // operation
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

## Logging

**Framework:** Console (native)

**Patterns:**
- `console.log` for debugging (should be removed in production)
- `console.error` for errors
- No structured logging framework

## Comments

**When to Comment:**
- Method signatures have minimal comments
- Complex business logic lacks documentation
- No JSDoc/TSDoc standard enforced

**Current State:**
- Single-line comments for section headers
- Example: `// Initialize default marketing agents`

## Function Design

**Size:** No strict guidelines (some functions exceed 100 lines)

**Parameters:**
- Object destructuring for multiple params
- Optional params with defaults
- Type annotations required

**Return Values:**
- Explicit return types preferred
- Promise<T> for async functions
- Void for side-effect functions

## Module Design

**Exports:**
- Named exports preferred
- Default exports for React components
- Re-exports via index.ts (barrel files)

**Barrel Files:**
- `src/types/index.ts` - Type re-exports
- `src/components/ui/` - Component library

## Class Patterns

**Static Classes:**
- Used for services (e.g., `AgentService`)
- Static methods and properties
- No instantiation required

```typescript
export class AgentService {
  private static agents: Map<string, Agent> = new Map();

  static initializeAgents(): void { ... }
  private static createAgent(config: {...}): Agent { ... }
}
```

## React Patterns

**Components:**
- Functional components with hooks
- Props interfaces defined inline or imported
- Context for global state (`ThemeContext`, `AuthContext`)

**State Management:**
- React Context for auth, theme
- Local state with useState
- No Redux or external state library

**UI Library:**
- Radix UI primitives
- Tailwind CSS for styling
- shadcn/ui component patterns

## TypeScript Patterns

**Strict Mode:** Not explicitly enabled (improvement needed)

**Type Inference:**
- Explicit types for function signatures
- Inferred types for local variables
- `any` used in some places (tech debt)

**Generics:**
- Used in Map<K, V> patterns
- Tool response types

---

*Convention analysis: 2025-01-17*

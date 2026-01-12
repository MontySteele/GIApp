# Contributing Guidelines

## Development Workflow

### Test-Driven Development (TDD)

**Write tests first** for new features:

1. Define expected behavior in a test file
2. Run test - verify it fails
3. Implement minimum code to pass
4. Refactor while keeping tests green
5. Add edge case tests

### Running Tests

```bash
# Single run (CI mode)
npm run test:run

# Watch mode for development
npm run test

# Generate coverage report
npm run test:coverage

# Run specific test file
npx vitest run src/features/planner/domain/ascensionCalculator.test.ts
```

### Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

See `TEST_COVERAGE_PLAN.md` for detailed test strategy.

---

## TypeScript Guidelines

- **Eliminate `any` types** - use proper interfaces
- **Define payload types** for all component props
- **Use discriminated unions** for complex state
- **Export types** alongside implementations

---

## Architecture Principles

- **Feature-based organization** (domain, repo, hooks, components, pages)
- **Repository pattern** for all database access
- **Shared services** in `/lib/services` for cross-feature logic
- **Clear ownership boundaries** between features
- **No circular dependencies** between features

---

## Coding Standards

### React Components

```typescript
// Use functional components with typed props
interface MyComponentProps {
  value: string;
  onChange: (value: string) => void;
}

export function MyComponent({ value, onChange }: MyComponentProps) {
  // ...
}
```

### Hooks

- Use `useLiveQuery` for database reactivity (not useEffect + useState)
- Extract complex logic into custom hooks
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations

### Repository Pattern

```typescript
// All database access through repositories
export const myRepo = {
  getById: async (id: string) => db.myTable.get(id),
  create: async (data: CreateInput) => db.myTable.add({ ...data, id: uuid() }),
  update: async (id: string, data: Partial<Data>) => db.myTable.update(id, data),
  delete: async (id: string) => db.myTable.delete(id),
};
```

---

## Test File Naming

```
src/
├── features/
│   └── [feature]/
│       ├── domain/
│       │   └── [module].test.ts      # Domain logic tests
│       ├── components/
│       │   └── [Component].test.tsx  # Component tests
│       ├── hooks/
│       │   └── [useHook].test.ts     # Hook tests
│       └── repo/
│           └── [repo].test.ts        # Repository tests
├── lib/
│   ├── services/
│   │   └── [service].test.ts         # Service tests
│   └── utils/
│       └── [util].test.ts            # Utility tests
└── components/
    └── ui/
        └── [Component].test.tsx      # UI component tests
```

---

## Commit Messages

Use clear, descriptive commit messages:

```
type: Short description

Longer description if needed.

- Bullet points for multiple changes
- Reference issues with #123
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`

---

## Pull Request Guidelines

1. Create feature branch from main
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass: `npm run test:run`
5. Check for type errors: `npm run build`
6. Submit PR with clear description

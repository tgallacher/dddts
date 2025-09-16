# AGENTS.md - DDD TypeScript Project Guidelines

## Build/Test Commands
- `npm run build` - Build the project with Vite
- `npm run test` - Run tests with Vitest (watch mode)
- `npm run test:run` - Run tests once
- `npm test -- --testNamePattern="TestName"` - Run single test
- `npm run typecheck` - Run TypeScript compiler check
- `npm run dev` - Build in watch mode

## Code Style Guidelines

### Imports
- Use absolute imports from `src/` root
- Group imports: external libs, internal modules, types
- Prefer named exports over default exports

### Naming Conventions
- Classes: PascalCase (e.g., `UserRepository`)
- Files: kebab-case (e.g., `user-repository.ts`)
- Interfaces: PascalCase with descriptive names (e.g., `UserRepositoryInterface`)
- Types: PascalCase ending in `Type` (e.g., `UserIdType`)
- Constants: SCREAMING_SNAKE_CASE

### DDD Patterns
- Aggregate roots in `domain/aggregates/`
- Value objects in `domain/value-objects/`
- Domain services in `domain/services/`
- Application services in `application/`
- Infrastructure in `infrastructure/`

### Error Handling
- Use Result pattern for domain operations
- Custom domain exceptions extend `DomainError`
- Never throw in value objects, return Result instead
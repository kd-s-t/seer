# Module Pattern

This document describes the standard pattern for organizing page modules in the `modules/` directory.

## Folder Structure

```
modules/
└── [page-name]/
    ├── components/          # React components specific to this module
    │   ├── [ComponentName].tsx
    │   └── ...
    ├── types.ts            # TypeScript type definitions
    ├── const.ts            # Constants and configuration
    ├── hooks.ts            # Custom React hooks
    ├── utils.ts            # Utility functions
    └── index.ts            # Public exports
```

## File Responsibilities

### `types.ts`
- Contains all TypeScript interfaces and types used by the module
- Example: `NewsItem`, `StakeData`, etc.

### `const.ts`
- Contains constants, configuration values, and static data
- Examples: cache keys, TTL values, API endpoints, default values

### `hooks.ts`
- Contains custom React hooks for data fetching and state management
- Examples: `useNews()`, `useStakes()`, etc.
- Should handle loading states, errors, caching, and data fetching

### `utils.ts`
- Contains pure utility functions (no React hooks)
- Examples: formatters, validators, calculations, helpers
- Should be easily testable and reusable

### `components/`
- Contains React components specific to this module
- Each component should be focused and reusable within the module
- Components can import from `types.ts`, `const.ts`, `hooks.ts`, and `utils.ts`

### `index.ts`
- Exports all public APIs from the module
- Should export components, hooks, types, and utilities that other modules/pages might need
- Example:
  ```typescript
  export { default as NewsFeed } from './components/NewsFeed'
  export { default as NewsCard } from './components/NewsCard'
  export { useNews } from './hooks'
  export type { NewsItem } from './types'
  export * from './const'
  export * from './utils'
  ```

## Usage in Pages

Pages should import from the module's `index.ts`:

```typescript
import { NewsFeed, useNews, NewsItem } from '@/modules/news'
```

## Benefits

1. **Separation of Concerns**: Logic is separated from UI components
2. **Reusability**: Hooks and utilities can be reused across components
3. **Testability**: Pure functions in `utils.ts` are easy to test
4. **Maintainability**: Clear structure makes it easy to find and update code
5. **Type Safety**: Centralized types ensure consistency


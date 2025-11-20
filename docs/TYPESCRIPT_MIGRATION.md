# TypeScript Migration Task List

This document outlines the step-by-step plan for converting the RFQ system from JavaScript to TypeScript.

## Overview

**Goal:** Convert the entire RFQ system to TypeScript while maintaining 100% functionality and test coverage.

**Benefits of TypeScript:**
- Type safety prevents runtime errors
- Better IDE autocomplete and IntelliSense
- Self-documenting code through type definitions
- Easier refactoring and maintenance
- Catches bugs at compile time

---

## Phase 1: Setup & Configuration

### Task 1.1: Install TypeScript Dependencies
- [ ] Install TypeScript: `npm install --save-dev typescript`
- [ ] Install Node.js types: `npm install --save-dev @types/node`
- [ ] Install Jest TypeScript support: `npm install --save-dev ts-jest @types/jest`
- [ ] Verify versions are compatible

**Commands:**
```bash
npm install --save-dev typescript@^5.3.0
npm install --save-dev @types/node@^20.0.0
npm install --save-dev ts-jest@^29.1.0 @types/jest@^29.5.0
```

**Estimated Time:** 15 minutes

---

### Task 1.2: Create TypeScript Configuration
- [ ] Create `tsconfig.json` in project root
- [ ] Configure compiler options (target, module, strict mode)
- [ ] Set up source/output directories
- [ ] Enable strict type checking
- [ ] Configure module resolution

**tsconfig.json template:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "dist"]
}
```

**Estimated Time:** 20 minutes

---

### Task 1.3: Configure Jest for TypeScript
- [ ] Update `jest.config.js` to use `ts-jest`
- [ ] Configure test file patterns for `.ts` files
- [ ] Set up TypeScript compilation for tests
- [ ] Test the configuration with a simple test

**Updated jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
```

**Estimated Time:** 15 minutes

---

### Task 1.4: Update package.json Scripts
- [ ] Add TypeScript build script
- [ ] Add type checking script
- [ ] Update test scripts to work with TypeScript
- [ ] Add watch mode for development
- [ ] Add clean script for build artifacts

**package.json updates:**
```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "clean": "rm -rf dist coverage",
    "prepublishOnly": "npm run clean && npm run build"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

**Estimated Time:** 10 minutes

---

## Phase 2: Type Definitions

### Task 2.1: Create Core Type Definitions
- [ ] Create `src/types.ts` file
- [ ] Define RFQ status enum
- [ ] Define direction type
- [ ] Define core interfaces for RFQ data
- [ ] Define core interfaces for Quote data
- [ ] Add JSDoc comments for documentation

**src/types.ts template:**
```typescript
/**
 * Status of an RFQ
 */
export enum RFQStatus {
  OPEN = 'open',
  FILLED = 'filled',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

/**
 * Direction of trade
 */
export type Direction = 'buy' | 'sell';

/**
 * RFQ data structure
 */
export interface IRFQData {
  id: string;
  market: string;
  direction: Direction;
  amount: number;
  expiration: number;
  status: RFQStatus;
  createdAt: number;
  selectedQuoteId: string | null;
}

/**
 * Quote data structure
 */
export interface IQuoteData {
  id: string;
  rfqId: string;
  makerId: string;
  pricePerToken: number;
  createdAt: number;
}

/**
 * Statistics for RFQ system
 */
export interface IRFQStats {
  totalRFQs: number;
  totalQuotes: number;
  rfqsByStatus: {
    [key in RFQStatus]: number;
  };
}

/**
 * RFQ details with quotes
 */
export interface IRFQDetails {
  rfq: IRFQData;
  quotes: IQuoteData[];
}

/**
 * Result of selecting a quote
 */
export interface ISelectQuoteResult {
  rfq: IRFQ;
  quote: IQuote;
}

/**
 * RFQ interface (class methods)
 */
export interface IRFQ {
  readonly id: string;
  readonly market: string;
  readonly direction: Direction;
  readonly amount: number;
  readonly expiration: number;
  status: RFQStatus;
  readonly createdAt: number;
  selectedQuoteId: string | null;
  
  isExpired(): boolean;
  isOpen(): boolean;
  fill(quoteId: string): void;
  expire(): void;
  cancel(): void;
  toJSON(): IRFQData;
}

/**
 * Quote interface (class methods)
 */
export interface IQuote {
  readonly id: string;
  readonly rfqId: string;
  readonly makerId: string;
  readonly pricePerToken: number;
  readonly createdAt: number;
  
  toJSON(): IQuoteData;
}
```

**Estimated Time:** 30 minutes

---

## Phase 3: Convert Core Classes

### Task 3.1: Convert RFQ Class to TypeScript
- [ ] Rename `src/RFQ.js` to `src/RFQ.ts`
- [ ] Add type annotations to constructor parameters
- [ ] Add return type annotations to methods
- [ ] Implement the `IRFQ` interface
- [ ] Replace string status with enum
- [ ] Add private/readonly modifiers where appropriate
- [ ] Update validation methods with type guards

**Key Changes:**
- Add `implements IRFQ`
- Use `RFQStatus` enum instead of string literals
- Make fields readonly where they shouldn't change
- Add proper type annotations for all parameters and returns

**Estimated Time:** 45 minutes

---

### Task 3.2: Convert RFQ Tests to TypeScript
- [ ] Rename `src/RFQ.test.js` to `src/RFQ.test.ts`
- [ ] Add type annotations to test variables
- [ ] Update status checks to use enum
- [ ] Fix any type errors
- [ ] Run tests to verify they pass

**Estimated Time:** 30 minutes

---

### Task 3.3: Convert Quote Class to TypeScript
- [ ] Rename `src/Quote.js` to `src/Quote.ts`
- [ ] Add type annotations to constructor parameters
- [ ] Add return type annotations to methods
- [ ] Implement the `IQuote` interface
- [ ] Make fields readonly
- [ ] Update validation methods with type guards

**Estimated Time:** 30 minutes

---

### Task 3.4: Convert Quote Tests to TypeScript
- [ ] Rename `src/Quote.test.js` to `src/Quote.test.ts`
- [ ] Add type annotations to test variables
- [ ] Fix any type errors
- [ ] Run tests to verify they pass

**Estimated Time:** 20 minutes

---

## Phase 4: Convert Queue and Manager

### Task 4.1: Convert RFQQueue Class to TypeScript
- [ ] Rename `src/RFQQueue.js` to `src/RFQQueue.ts`
- [ ] Add generic types to Map structures
- [ ] Type the method parameters and returns
- [ ] Use interfaces for complex return types
- [ ] Update error handling with proper types
- [ ] Consider using readonly for maps (with caution)

**Key Changes:**
```typescript
private rfqs: Map<string, IRFQ>;
private quotes: Map<string, IQuote>;
private rfqQuotes: Map<string, Set<string>>;
```

**Estimated Time:** 45 minutes

---

### Task 4.2: Convert RFQQueue Tests to TypeScript
- [ ] Rename `src/RFQQueue.test.js` to `src/RFQQueue.test.ts`
- [ ] Add type annotations
- [ ] Fix any type errors
- [ ] Run tests to verify they pass

**Estimated Time:** 30 minutes

---

### Task 4.3: Convert RFQManager Class to TypeScript
- [ ] Rename `src/RFQManager.js` to `src/RFQManager.ts`
- [ ] Type the queue property
- [ ] Type all method parameters and returns
- [ ] Use proper interfaces for return types
- [ ] Consider making helper methods private

**Key Changes:**
```typescript
private queue: RFQQueue;
private idCounter: number;

public createRFQ(
  market: string,
  direction: Direction,
  amount: number,
  expirationMs: number
): IRFQ { ... }
```

**Estimated Time:** 45 minutes

---

### Task 4.4: Convert RFQManager Tests to TypeScript
- [ ] Rename `src/RFQManager.test.js` to `src/RFQManager.test.ts`
- [ ] Add type annotations
- [ ] Fix any type errors
- [ ] Run tests to verify they pass

**Estimated Time:** 30 minutes

---

## Phase 5: Update Entry Points and Examples

### Task 5.1: Convert index.ts
- [ ] Rename `src/index.js` to `src/index.ts`
- [ ] Export all types from types.ts
- [ ] Export all classes
- [ ] Ensure proper type exports

**src/index.ts:**
```typescript
export { RFQ } from './RFQ';
export { Quote } from './Quote';
export { RFQQueue } from './RFQQueue';
export { RFQManager } from './RFQManager';
export * from './types';
```

**Estimated Time:** 10 minutes

---

### Task 5.2: Convert Integration Tests
- [ ] Rename `src/integration.test.js` to `src/integration.test.ts`
- [ ] Add proper types to all variables
- [ ] Update imports to use TypeScript modules
- [ ] Fix any type errors
- [ ] Run integration tests

**Estimated Time:** 30 minutes

---

### Task 5.3: Convert Example Script
- [ ] Rename `example.js` to `example.ts`
- [ ] Add type annotations
- [ ] Create a compiled version or update to use ts-node
- [ ] Update README with new run instructions

**Run options:**
1. Use ts-node: `npx ts-node example.ts`
2. Or compile first: `npm run build && node dist/example.js`

**Estimated Time:** 20 minutes

---

## Phase 6: Advanced TypeScript Features

### Task 6.1: Add Validation Type Guards
- [ ] Create type guard functions for runtime checks
- [ ] Add `isValidMarket()`, `isValidAmount()`, etc.
- [ ] Use these in validation methods
- [ ] Improve type narrowing in code

**Example:**
```typescript
function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
```

**Estimated Time:** 30 minutes

---

### Task 6.2: Improve Type Safety with Branded Types
- [ ] Create branded types for IDs to prevent mixing
- [ ] Add RFQId, QuoteId, MakerId types
- [ ] Update all ID usages
- [ ] Ensure compile-time safety

**Example:**
```typescript
type RFQId = string & { readonly __brand: 'RFQId' };
type QuoteId = string & { readonly __brand: 'QuoteId' };
type MakerId = string & { readonly __brand: 'MakerId' };
```

**Estimated Time:** 45 minutes

---

### Task 6.3: Add Generic Utility Types
- [ ] Create Result<T, E> type for error handling
- [ ] Create Option<T> type for nullable values
- [ ] Consider replacing null with Option pattern
- [ ] Update methods to use these types

**Example:**
```typescript
type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };
```

**Estimated Time:** 60 minutes (optional, advanced)

---

## Phase 7: Build and Verification

### Task 7.1: Build TypeScript Project
- [ ] Run `npm run build`
- [ ] Fix any compilation errors
- [ ] Verify all .d.ts files are generated
- [ ] Check dist/ folder structure
- [ ] Ensure no type errors

**Estimated Time:** 30 minutes

---

### Task 7.2: Run Full Test Suite
- [ ] Run all tests with `npm test`
- [ ] Ensure 100% test passage
- [ ] Check test coverage
- [ ] Verify coverage is maintained or improved
- [ ] Run integration tests specifically

**Estimated Time:** 20 minutes

---

### Task 7.3: Test Compiled JavaScript
- [ ] Run example using compiled code
- [ ] Test import/export from dist/
- [ ] Verify .d.ts files work for consumers
- [ ] Check that sourcemaps work for debugging

**Estimated Time:** 20 minutes

---

### Task 7.4: Update Documentation
- [ ] Update README.md with TypeScript info
- [ ] Document new npm scripts
- [ ] Add TypeScript examples to README
- [ ] Update DESIGN.md with type information
- [ ] Add note about types for consumers

**Estimated Time:** 30 minutes

---

## Phase 8: Enhanced TypeScript Features (Optional)

### Task 8.1: Add Strict Configuration Options
- [ ] Enable `noUncheckedIndexedAccess`
- [ ] Enable `noPropertyAccessFromIndexSignature`
- [ ] Fix any new errors from strict settings
- [ ] Update code to handle undefined properly

**Estimated Time:** 45 minutes

---

### Task 8.2: Add Decorators (Optional)
- [ ] Enable experimental decorators
- [ ] Add @readonly decorator for fields
- [ ] Add @validate decorator for methods
- [ ] Create custom decorators for logging

**Estimated Time:** 60 minutes

---

### Task 8.3: Consider Class-Validator (Optional)
- [ ] Install class-validator
- [ ] Add decorators to classes for validation
- [ ] Replace manual validation with decorators
- [ ] Update tests

**Estimated Time:** 90 minutes

---

## Phase 9: Linting and Code Quality

### Task 9.1: Setup ESLint for TypeScript
- [ ] Install @typescript-eslint/parser
- [ ] Install @typescript-eslint/eslint-plugin
- [ ] Create .eslintrc.js configuration
- [ ] Add lint script to package.json
- [ ] Fix all linting errors

**Estimated Time:** 30 minutes

---

### Task 9.2: Setup Prettier with TypeScript
- [ ] Install prettier
- [ ] Create .prettierrc configuration
- [ ] Add format script to package.json
- [ ] Format all TypeScript files
- [ ] Add pre-commit hook (optional)

**Estimated Time:** 20 minutes

---

## Summary

### Total Estimated Time
**Core Migration (Phases 1-7):** ~10-12 hours
**Advanced Features (Phase 8):** +3-4 hours (optional)
**Linting & Quality (Phase 9):** +1 hour

### Recommended Order
1. Complete Phases 1-5 in order (setup and conversion)
2. Run full test suite after each class conversion
3. Complete Phase 6 (type guards and safety)
4. Complete Phase 7 (verification)
5. Optional: Add phases 8-9 for enhanced features

### Key Benefits After Migration
✅ Type safety prevents entire classes of bugs
✅ Better IDE support and autocomplete
✅ Self-documenting code with interfaces
✅ Easier to refactor with confidence
✅ More maintainable for large teams
✅ Professional-grade codebase

### Migration Strategy
- **Incremental:** Convert one file at a time
- **Test-driven:** Run tests after each conversion
- **Type-first:** Define types before converting classes
- **Strict mode:** Use strict TypeScript from the start

---

## Checklist for Each File Conversion

When converting a file from JS to TS:
- [ ] Rename .js to .ts
- [ ] Add import statements for types
- [ ] Add type annotations to all parameters
- [ ] Add return type annotations to all functions
- [ ] Replace any with specific types
- [ ] Make fields readonly where appropriate
- [ ] Use const assertions for literals
- [ ] Add JSDoc comments with type info
- [ ] Run type checker: `npm run type-check`
- [ ] Run tests: `npm test`
- [ ] Fix all errors before moving to next file

---

## Common Pitfalls to Avoid

1. **Don't use `any` type** - Defeats the purpose of TypeScript
2. **Don't disable strict mode** - Use it from the start
3. **Don't ignore type errors** - Fix them properly
4. **Don't over-engineer types** - Keep it simple initially
5. **Don't forget to export types** - Consumers need them
6. **Don't skip tests** - Update them as you convert
7. **Don't mix JS and TS** - Complete migration incrementally

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)
- [TypeScript Cheatsheet](https://www.typescriptlang.org/cheatsheets)

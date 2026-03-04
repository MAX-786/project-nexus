---
name: nexus-code-quality
description: Rules for ESLint, Prettier, and TypeScript strictness. Use this skill when writing new files, refactoring code, or debugging build failures caused by type errors.
---

# Project Nexus: Code Quality & Linting Protocol

## 1. TypeScript Strictness (Zero Tolerance)
- **No `any`:** You are strictly forbidden from using the `any` type. If a type is unknown, use `unknown` and narrow it down, or define a proper interface matching the Supabase database schema.
- **Strict Null Checks:** Always handle `null` or `undefined` returns from Supabase queries or LLM API calls before operating on the data.
- **Type Imports:** Use `import type { ... }` when importing interfaces or types to optimize the build process.

## 2. ESLint & Next.js Core Web Vitals
- **Next.js Rules:** Strictly adhere to `eslint-config-next`. Do not disable rules like `@next/next/no-img-element` (use `<Image />` instead) or `@next/next/no-html-link-for-pages` (use `<Link />` instead).
- **React Hooks:** Never violate the rules of hooks. Do not wrap hooks in conditional statements.
- **Disable Comments:** Do not use `// eslint-disable-next-line` unless absolutely necessary, and if you do, you MUST add a comment explaining exactly why it is unavoidable.

## 3. Prettier Formatting
- **Standardization:** All code must be formatted according to the project's `.prettierrc`.
- **Tailwind Sorting:** Ensure the `prettier-plugin-tailwindcss` is active so that Tailwind utility classes are automatically sorted in a consistent, readable order.

## 4. Pre-commit & Build Checks
- Before finalizing a task, ensure the code will pass `tsc --noEmit` (TypeScript compiler check) and `npm run lint`. If it fails, fix the errors before presenting the code to the user.
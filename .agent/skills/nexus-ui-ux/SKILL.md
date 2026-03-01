---
name: nexus-ui-ux
description: UI/UX development guidelines using TailwindCSS, Shadcn UI, and Lucide icons. Use this skill when designing interfaces, fixing layout bugs, implementing dark mode, or handling extension-specific UI injection.
---

# Project Nexus: UI & UX Engineering Protocol

## 1. Component Library (Shadcn UI)
- **Rule of Thumb:** Never build a base component from scratch if a Shadcn UI equivalent exists (e.g., Button, Input, Card, Dialog, Popover, Sheet, Skeleton).
- **Class Merging:** Always use the `cn()` utility function (combining `clsx` and `tailwind-merge`, typically located in `lib/utils.ts`) when applying dynamic Tailwind classes. This prevents CSS specificity conflicts.

## 2. Styling & Theming (TailwindCSS)
- **Semantic Colors:** Strictly use the CSS variables defined in the `globals.css` theme (e.g., `bg-background`, `text-primary`, `border-border`, `bg-muted`). **Do not** use hardcoded color scales (like `bg-blue-500` or `text-gray-700`) unless it is a specific, unthemed accent.
- **Dark Mode Support:** The entire application must support dark mode seamlessly. Rely on semantic variables so colors flip automatically. If explicit overrides are needed, use the `dark:` variant.
- **Responsive Design:** Build mobile-first. Default classes apply to mobile screens. Use `md:`, `lg:`, and `xl:` for desktop layouts. Ensure the Web Dashboard's split-screen (List Feed + Visual Graph) collapses gracefully into a tabbed view or drawer on mobile devices.

## 3. Browser Extension UI Specifics (Plasmo)
- **Style Isolation (Shadow DOM):** Extension UI injected into host web pages (Content Scripts) MUST be rendered inside a Shadow DOM. This is critical. It prevents the host website's CSS from bleeding into our widget, and prevents our Tailwind classes from breaking the host site.
- **Z-Index Management:** For the floating "Capture" widget or slide-out summary drawer, use an extreme z-index (e.g., `z-[999999]`) so it never gets hidden behind the host website's sticky headers or modals.

## 4. Animations & Interactions
- **Spaced Repetition UI:** The flashcard review interface should feel tactile. Use CSS transforms (`group-hover`, `scale`) or `framer-motion` for smooth card flipping and swiping interactions.
- **State Feedback:** Every interactive element must have defined `hover:`, `focus:`, and `disabled:` states. Disabled buttons should explicitly use `opacity-50 cursor-not-allowed`.

## 5. UI Debugging Protocol
- **Symptom:** A newly added Tailwind class isn't applying at all.
  - **Action:** Verify the file's path is included in the `content` array of `tailwind.config.ts`.
- **Symptom:** The extension UI looks completely broken on certain websites (like Twitter or YouTube).
  - **Action:** Confirm that Plasmo is configured to inject the compiled Tailwind CSS file directly into the Shadow Root of the content script, not the global `document.head`.
- **Symptom:** Shadcn components look unstyled.
  - **Action:** Ensure `globals.css` is imported at the highest level (`layout.tsx` for Next.js, or the root Plasmo component).
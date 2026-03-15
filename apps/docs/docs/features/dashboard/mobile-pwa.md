---
sidebar_position: 7
---

# Mobile Optimization & PWA

Project Nexus includes a fully-optimized mobile experience and Progressive Web App (PWA) support, allowing you to install the dashboard directly onto your mobile device.

## Progressive Web App (PWA)

You can install Project Nexus as a standalone app on iOS and Android devices:
- **Manifest:** Includes full `manifest.webmanifest` support with configured app icons.
- **Safe Area:** Viewport meta tags are set with `viewport-fit=cover` to ensure the layout respects device safe-areas (e.g., notches or gesture bars).

## Mobile-First Navigation

On mobile screens, the dashboard layout adapts to maximize screen real estate and improve usability:
- **Bottom Navigation:** The desktop sidebar and hamburger menu are replaced by a fixed `MobileBottomNav` that docks at the bottom of the screen.
- **Haptic Feedback:** The Vibration API is utilized for subtle haptic feedback on tab changes, creating a native app feel.
- **Command Search:** The main search bar transforms into an icon-only button on mobile to save space.

## Gesture & Interaction Enhancements

Navigating the dashboard on mobile introduces several touch-optimized interactions:
- **Pull-to-Refresh:** You can swipe down on the feed (touch gesture) to trigger a data refresh, seamlessly refetching the newest nodes without reloading the underlying PWA.
- **Horizontal Scrolling:** The Dashboard Stats section becomes horizontally scrollable, preventing UI clutter.
- **Full-Screen Modals:** Node details panels (implemented via Shadcn Sheets) slide out to occupy the full screen on mobile, optimizing reading space and interactions.

## Overflow Handling

Extraneous horizontal scrolling is disabled (`overflow-x: hidden`) globally on mobile to prevent accidental layout shifts and ensure navigation feels robust.

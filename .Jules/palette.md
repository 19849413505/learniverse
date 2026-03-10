## 2024-03-10 - Keyboard Navigation in Spaced Repetition (FSRS)
**Learning:** Adding global keyboard listeners (e.g., Space/Enter to flip, 1-4 to rate) significantly improves the immersion and flow of spaced repetition study sessions. However, it requires careful state management to ensure listeners do not fire when typing in modal inputs (like the Socratic Tutor chat). Additionally, visual hints (e.g., `[Space]`, `[1]`) are crucial for discoverability.
**Action:** When adding global keyboard shortcuts to study or interactive views, always verify context (is a modal or text input active?) before intercepting keystrokes. Add clear visual hints and ARIA labels to ensure accessibility is maintained alongside efficiency.

## 2024-03-10 - Visualizing Progress in Multi-step Modals
**Learning:** Adding a smooth, animated progress bar (via Framer Motion) to a multi-step modal (like a diagnostic test) dramatically reduces perceived friction. Coupled with keyboard shortcuts (Arrow keys for binary choices), it transforms a tedious form into a fast, fluid, gamified interaction.
**Action:** When designing wizards or multi-step questions, always include a visual progress indicator and map binary/multiple-choice actions to intuitive keyboard keys (arrows, 1-4) with clear on-screen hints.

## 2024-03-10 - Animating Primary Action Calls
**Learning:** Adding subtle breathing animations (`y: [0, -8, 0]`) to floating action buttons (like "Ask Tutor") effectively draws the user's eye without being obtrusive. Pairing this with `Enter` key support for primary form/step progression reduces friction. However, extreme care must be taken in React to avoid violating hook rules when adding these listeners.
**Action:** When adding global event listeners via `useEffect`, ensure they are placed *above* any early returns that wait for data loading.

## 2024-03-10 - Global Layout Fluidity & Gamification A11y
**Learning:** Hard-coded gamification stats (like XP, Streak) without native `title` attributes or `tabIndex={0}` are invisible to screen readers and confusing to new users. Furthermore, instantly snapping active states in global navigation bars feels rigid.
**Action:** Always wrap visual gamification badges with proper `aria-label`, `title`, and `focus-visible` outlines. When dealing with global layout components like sidebars, prefer using Framer Motion`'`s `layoutId` to create a continuous, fluid spatial context when switching tabs.

## 2024-03-10 - Form State Feedback & Input Visibility
**Learning:** Users often hesitate to hit "Save" when configuring complex technical settings (like API keys) if there is no clear indicator of unsaved changes. Furthermore, missing `htmlFor` attributes on labels severely degrades form accessibility and click targets.
**Action:** Always link labels to inputs with `htmlFor`/`id`. Provide clear, animated "Unsaved Changes" indicators by diffing local state with global store state. Add inline actions (like Eye icons) for sensitive fields to prevent copy-paste anxiety.

## 2024-03-10 - Gamified Visual Hierarchy in Leaderboards
**Learning:** A standard list format for leaderboards fails to convey the excitement of competition. Small visual cues (like glowing borders for the top 3, clear lines for promotion/demotion zones, and a pulsing highlight for the current user's row) instantly transform a data table into a gamified experience. Adding `tabIndex` to rows makes them navigable, but without visual boundaries, the structure is flat.
**Action:** When displaying competitive data, use color, icons (medals), and borders to establish a visual hierarchy that highlights key zones (top performers, user position, and critical thresholds) while ensuring rows remain keyboard accessible.

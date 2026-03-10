## 2026-03-10 - [O(N^2) Anti-Pattern in Graph Iteration]
**Learning:** Found a recurring codebase-specific performance anti-pattern where graph operations (like traversing skill trees) were using `Array.prototype.find()` or `Array.prototype.some()` inside loops/recursions, leading to O(N^2) complexity. This happens on both the Next.js frontend during render and the NestJS backend during diagnostic processing.
**Action:** When working with graph nodes (like `KnowledgeNode`), always initialize a `Map` to cache nodes by ID (`new Map(nodes.map(n => [n.id, n]))`) before traversing edges or prerequisites. This guarantees O(1) lookups and prevents exponential scaling issues as the skill trees grow.

## 2026-03-10 - [N+1 Database Insertions in Bulk Operations]
**Learning:** Found a common backend anti-pattern where lists of AI-generated content (like flashcards) were being inserted into the database individually inside a `for...of` loop, leading to N+1 database queries and significant overhead.
**Action:** When saving an array of new entities (e.g., generated cards or micro-lessons), always utilize Prisma's `createMany` API to perform a single batch insertion. Since `createMany` doesn't return the full objects, map the payload and retrieve them using `findMany` with an `in` clause if the generated objects and their specific IDs are needed downstream.

## 2026-03-10 - [Zustand Store React Re-render Bottleneck]
**Learning:** Destructuring directly from the `useStore()` hook (e.g., `const { a, b } = useUserStore()`) subscribes the component to the ENTIRE store. In complex pages with frequent updates (like `StudyPage` where `xp` and `streak` update often, or `lastActiveDate` updates silently in the background), this causes major, unnecessary component-wide re-renders.
**Action:** Always use `zustand/react/shallow` (`useShallow`) when extracting multiple properties from a Zustand store, like this: `useUserStore(useShallow(state => ({ a: state.a })))`. If only extracting one property, use an atomic selector: `useUserStore(state => state.a)`.

## 2026-03-10 - [Initial Payload Bloat via Hidden Components]
**Learning:** Found an anti-pattern where heavy, conditionally rendered components (like `react-confetti` or the `SocraticTutor` chat modal) were statically imported in `StudyPage`. This forced the user to download and parse large chunks of JS required for features they might never even open or reach.
**Action:** Use Next.js Code Splitting (`next/dynamic`) to dynamically import these components (e.g., `const Confetti = dynamic(() => import('react-confetti'), { ssr: false });`). This keeps the initial page payload thin and defers the network request for the heavy component until it is actually needed.

## 2026-03-10 - [Missing Indexes in Prisma FSRS Model]
**Learning:** For FSRS applications, querying a user's due cards (`where userId = ? and due <= NOW() order by due asc`) is the most frequent and critical database operation. Missing a compound index on `[userId, due]` will eventually cause severe performance degradation (Full Table Scans and File Sorts) as user review history grows. Similarly, `KnowledgeNode` querying via `deckId` requires an index.
**Action:** Always map your high-frequency backend Prisma queries to explicit `@@index` annotations in `schema.prisma`. For queries combining equality (`userId`) and range/sort (`due`), a compound index matching that order is required.

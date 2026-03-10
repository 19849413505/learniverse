## 2026-03-10 - [O(N^2) Anti-Pattern in Graph Iteration]
**Learning:** Found a recurring codebase-specific performance anti-pattern where graph operations (like traversing skill trees) were using `Array.prototype.find()` or `Array.prototype.some()` inside loops/recursions, leading to O(N^2) complexity. This happens on both the Next.js frontend during render and the NestJS backend during diagnostic processing.
**Action:** When working with graph nodes (like `KnowledgeNode`), always initialize a `Map` to cache nodes by ID (`new Map(nodes.map(n => [n.id, n]))`) before traversing edges or prerequisites. This guarantees O(1) lookups and prevents exponential scaling issues as the skill trees grow.

## 2026-03-10 - [N+1 Database Insertions in Bulk Operations]
**Learning:** Found a common backend anti-pattern where lists of AI-generated content (like flashcards) were being inserted into the database individually inside a `for...of` loop, leading to N+1 database queries and significant overhead.
**Action:** When saving an array of new entities (e.g., generated cards or micro-lessons), always utilize Prisma's `createMany` API to perform a single batch insertion. Since `createMany` doesn't return the full objects, map the payload and retrieve them using `findMany` with an `in` clause if the generated objects and their specific IDs are needed downstream.

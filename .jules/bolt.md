## 2026-03-10 - [O(N^2) Anti-Pattern in Graph Iteration]
**Learning:** Found a recurring codebase-specific performance anti-pattern where graph operations (like traversing skill trees) were using `Array.prototype.find()` or `Array.prototype.some()` inside loops/recursions, leading to O(N^2) complexity. This happens on both the Next.js frontend during render and the NestJS backend during diagnostic processing.
**Action:** When working with graph nodes (like `KnowledgeNode`), always initialize a `Map` to cache nodes by ID (`new Map(nodes.map(n => [n.id, n]))`) before traversing edges or prerequisites. This guarantees O(1) lookups and prevents exponential scaling issues as the skill trees grow.


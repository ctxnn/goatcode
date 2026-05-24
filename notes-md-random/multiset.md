# when to use multiset and other stl structures 

**if you see this somewhere "find largest ≤ value"** -> use multiset or balanced bst 



#  cpp STL data structures cheat table

| Data Structure | Allows Duplicates | Ordered | Average Time (Insert / Erase / Find) | Typical Use-Case | Notes |
|----------------|------------------|----------|--------------------------------------|------------------|-------|
| **`vector`** | ✅ Yes | ❌ No (unless you sort) | O(1) / O(N) / O(N) | When you just need a **dynamic array** (like Python list). | Great for indexed access, random access O(1). Binary search possible **only if sorted**. |
| **`set`** | ❌ No | ✅ Yes (ascending by default) | O(log N) / O(log N) / O(log N) | When you need **unique sorted elements**. | Uses balanced BST (usually Red-Black Tree). |
| **`multiset`** | ✅ Yes | ✅ Yes | O(log N) / O(log N) / O(log N) | When you need **sorted elements with duplicates allowed**. | Perfect for problems like *tickets, frequencies, sliding windows with duplicates*. |
| **`unordered_set`** | ❌ No | ❌ No | O(1) avg / O(N) worst | When you need **unique elements but order doesn’t matter**. | Backed by hash table. Very fast but no ordering (can’t use lower_bound). |
| **`map`** | ❌ (unique keys) | ✅ Yes (by key) | O(log N) / O(log N) / O(log N) | Key → Value mapping **with order**. | Like Python `dict` but ordered by key. |
| **`multimap`** | ✅ (duplicate keys) | ✅ Yes | O(log N) / O(log N) / O(log N) | When you want multiple values per key in sorted order. | Similar to multiset but key-value pairs. |
| **`unordered_map`** | ❌ (unique keys) | ❌ No | O(1) avg / O(N) worst | Fast **key → value lookup** without needing order. | Like Python `dict`. |
| **`priority_queue`** | ✅ Yes | ✅ Heap order (max by default) | O(log N) push / O(log N) pop / O(1) top | When you need the **largest (or smallest)** element quickly. | No random access. Use min-heap via `greater<>`. |
| **`deque`** | ✅ Yes | ❌ No | O(1) push/pop front/back | Sliding window, queues with fast front access. | Better than vector if you need both ends. |
| **`queue`** | ✅ Yes | ❌ No | O(1) push / O(1) pop | FIFO behavior. | Simple wrapper over deque. |
| **`stack`** | ✅ Yes | ❌ No | O(1) push / O(1) pop | LIFO behavior. | Wrapper over deque/vector. |


---

## when to pick what

| Scenario | Best STL Choice | Why |
|-----------|----------------|-----|
| Need to **store sorted numbers (may repeat)** | `multiset` | Auto-sorted, duplicates allowed, can find/remove easily |
| Need to **find largest ≤ X or smallest ≥ X** | `set` / `multiset` | Has `upper_bound` and `lower_bound` |
| Need **fast lookup by key** (no order) | `unordered_map` / `unordered_set` | O(1) average time |
| Need **priority processing** (like max or min element repeatedly) | `priority_queue` | Efficient heap |
| Need **simple array or list** | `vector` | Fast, simple, cache-friendly |
| Need **queue/stack behavior** | `queue` / `stack` | Specialized for that pattern |
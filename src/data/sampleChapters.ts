import { Chapter } from '../types';

export const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'ch-1',
    title: 'Data Structures: Master Trees & Graphs',
    extension: 'md',
    order: 1,
    metadata: {
      sourceFileName: '01_Data_Structures_Trees.md',
      language: 'Python',
      author: 'KayBiT Study Engine',
      courseCode: 'CS201',
      dateCreated: '2026-07-27',
      wordCount: 520,
      readingTimeMinutes: 3,
      tags: ['Algorithms', 'Trees', 'Python', 'CS201']
    },
    aiSummary: 'Comprehensive overview of Binary Search Trees (BST), AVL balance conditions, and Depth-First Search (DFS) traversals in Python.',
    keyTakeaways: [
      'BST Search average time complexity is O(log N), worst case O(N) when degenerate.',
      'In-Order Traversal on a valid BST always yields values in strictly sorted order.',
      'Rotations in AVL trees restore height balance when balance factor exceeds |1|.'
    ],
    content: `# Chapter 1: Binary Search Trees & Traversal Algorithms

Welcome to **CS201 Advanced Data Structures**. This study guide breaks down binary trees, memory layouts, and asymptotic complexity.

:::summary[AI Chapter Executive Summary]
Binary Search Trees maintain ordered elements. Left child $< $ Parent $< $ Right child. Always keep trees balanced to prevent degradation into linear linked lists!
:::

## 1.1 Binary Search Tree Implementation

Below is a robust, production-ready Python class implementing a BST node and insertion logic.

\`\`\`python
# BST Node Definition with Recursive Insert
class TreeNode:
    def __init__(self, val: int):
        self.val = val
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, val: int) -> None:
        if not self.root:
            self.root = TreeNode(val)
        else:
            self._insert_recursive(self.root, val)

    def _insert_recursive(self, node: TreeNode, val: int) -> None:
        if val < node.val:
            if node.left is None:
                node.left = TreeNode(val)
            else:
                self._insert_recursive(node.left, val)
        elif val > node.val:
            if node.right is None:
                node.right = TreeNode(val)
            else:
                self._insert_recursive(node.right, val)

# Example Usage
bst = BinarySearchTree()
for num in [50, 30, 70, 20, 40, 60, 80]:
    bst.insert(num)
print("BST populated successfully.")
\`\`\`

:::warning[Common Exam Trap]
Insertion into a BST with pre-sorted elements (e.g. \`[1, 2, 3, 4, 5]\`) creates a **skewed line tree** of height $N$. This degrades operations to **O(N)** time complexity! Use **AVL** or **Red-Black** self-balancing trees to guarantee $O(\\log N)$.
:::

## 1.2 In-Order Traversal (DFS)

In-order traversal visits nodes in **Left -> Root -> Right** sequence.

\`\`\`python
def inorder_traversal(root: TreeNode) -> list[int]:
    result = []
    def traverse(node):
        if not node:
            return
        traverse(node.left)
        result.append(node.val)
        traverse(node.right)
    
    traverse(root)
    return result

# Yields: [20, 30, 40, 50, 60, 70, 80]
\`\`\`

:::tip[Exam High-Yield Tip]
Whenever an exam question asks: *"Which traversal produces sorted output from a BST?"*, the answer is **In-Order Traversal**!
:::`
  },
  {
    id: 'ch-2',
    title: 'React 19 & Async State Patterns',
    extension: 'mdx',
    order: 2,
    metadata: {
      sourceFileName: '02_React19_State_Management.mdx',
      language: 'TypeScript',
      author: 'Alex Kay',
      courseCode: 'CS305',
      dateCreated: '2026-07-27',
      wordCount: 480,
      readingTimeMinutes: 3,
      tags: ['Frontend', 'React', 'TypeScript', 'WebDev']
    },
    aiSummary: 'Deep dive into React 19 state architecture, useActionState, and optimistic UI updates for concurrent rendering.',
    keyTakeaways: [
      'React 19 Server Actions simplify form state handling without manual loading states.',
      'useOptimistic provides instant UI feedback before backend response resolves.',
      'Never mutate state directly or place raw functions in useEffect dependencies.'
    ],
    content: `# Chapter 2: React 19 Concurrent Rendering & Actions

Modern React state management emphasizes optimistic updates and server action synchronization.

<Summary title="Key React 19 Paradigm Shift">
React 19 replaces verbose \`useState\` / \`useEffect\` fetch patterns with native \`useActionState\` hooks and action directives for seamless UX.
</Summary>

## 2.1 Optimistic UI Updates with \`useOptimistic\`

\`\`\`tsx
import React, { useOptimistic, useState, useTransition } from 'react';

interface Todo {
  id: string;
  text: string;
  pending?: boolean;
}

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [isPending, startTransition] = useTransition();

  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newText: string) => [
      ...state,
      { id: 'temp-' + Date.now(), text: newText, pending: true }
    ]
  );

  async function handleSubmit(formData: FormData) {
    const text = formData.get('todo') as string;
    if (!text) return;

    startTransition(async () => {
      addOptimisticTodo(text);
      // Simulate API call to backend
      const res = await fetch('/api/todos', { method: 'POST', body: JSON.stringify({ text }) });
      const savedTodo = await res.json();
      setTodos((prev) => [...prev, savedTodo]);
    });
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900 text-white">
      <form action={handleSubmit} className="flex gap-2 mb-4">
        <input name="todo" className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700" placeholder="New task..." />
        <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-indigo-600 rounded">
          Add Task
        </button>
      </form>
      <ul className="space-y-1">
        {optimisticTodos.map((item) => (
          <li key={item.id} className={\`p-2 rounded \${item.pending ? 'opacity-50 italic bg-amber-900/30' : 'bg-slate-800'}\`}>
            {item.text} {item.pending && '(syncing...)'}
          </li>
        ))}
      </ul>
    </div>
  );
}
\`\`\`

<Warning title="Crucial Hook Rules">
Never wrap custom hooks in conditional statements (\`if\` conditions). React relies on exact hook call order between renders!
</Warning>`
  },
  {
    id: 'ch-3',
    title: 'C++ Systems & Memory Management',
    extension: 'html',
    order: 3,
    metadata: {
      sourceFileName: '03_Cpp_Memory_Pointers.html',
      language: 'C++',
      author: 'Prof. Miller',
      courseCode: 'CS102',
      dateCreated: '2026-07-27',
      wordCount: 410,
      readingTimeMinutes: 2,
      tags: ['C++', 'Memory', 'Pointers', 'Systems']
    },
    aiSummary: 'Guide to heap allocation, stack allocation, smart pointers (std::unique_ptr, std::shared_ptr), and memory leak prevention in C++20.',
    keyTakeaways: [
      'Stack allocation is fast and auto-managed; Heap allocation requires explicit lifecycle management.',
      'Prefer std::make_unique and std::make_shared over raw new/delete.',
      'Dangling pointers occur when referencing deallocated heap memory.'
    ],
    content: `<h1>Chapter 3: C++ Memory Layout & Smart Pointers</h1>

<p>Understanding memory management is essential for building high-performance systems and passing technical C++ interviews.</p>

<div class="note-callout note-callout-summary my-4 p-4 rounded-xl border-l-4 border-purple-600 bg-purple-50/80 dark:bg-purple-950/40">
  <div class="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300 mb-1.5 text-sm uppercase">
    <span>🧠</span>
    <span>Modern C++ Memory Rule</span>
  </div>
  <div class="text-sm">
    Avoid raw pointers for resource ownership! Use <code>std::unique_ptr</code> for single ownership and <code>std::shared_ptr</code> for reference-counted shared ownership.
  </div>
</div>

<h2>3.1 Stack vs Heap Allocation</h2>

<pre><code class="language-cpp">#include &lt;iostream&gt;
#include &lt;memory&gt;

class SensorData {
public:
    int id;
    double reading;
    
    SensorData(int i, double r) : id(i), reading(r) {
        std::cout &lt;&lt; "Sensor " &lt;&lt; id &lt;&lt; " initialized." &lt;&lt; std::endl;
    }
    ~SensorData() {
        std::cout &lt;&lt; "Sensor " &lt;&lt; id &lt;&lt; " destroyed." &lt;&lt; std::endl;
    }
};

int main() {
    // 1. Stack Allocation (Destroyed when scope ends)
    {
        SensorData stackSensor(101, 98.6);
    } // ~SensorData() called here!

    // 2. Heap Allocation using Modern Smart Pointer
    auto heapSensor = std::make_unique&lt;SensorData&gt;(202, 102.4);
    std::cout &lt;&lt; "Reading: " &lt;&lt; heapSensor-&gt;reading &lt;&lt; std::endl;

    return 0; // Heap memory automatically freed! No delete needed!
}
</code></pre>

<div class="note-callout note-callout-warning my-4 p-4 rounded-xl border-l-4 border-rose-600 bg-rose-50/80 dark:bg-rose-950/40">
  <div class="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 mb-1.5 text-sm uppercase">
    <span>⚠️</span>
    <span>Memory Leak Warning</span>
  </div>
  <div class="text-sm">
    If you allocate memory using <code>new SensorData()</code> without an accompanying <code>delete</code> or smart pointer wrapper, that memory remains un-reclaimed until process exit!
  </div>
</div>`
  }
];

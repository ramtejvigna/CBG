/**
 * Per-challenge, per-language starter code.
 *
 * Each template already reads the test case from stdin in the exact shape the
 * seeded testCases use, and prints the answer in the exact format the seeded
 * `output` strings expect (including their idiosyncratic spacing, since the
 * judge compares output with strict equality). Only the solution body is left
 * for the user to fill in - everything else is "do not edit" plumbing.
 *
 * Keyed by challenge title so `seed.ts` can look a template set up while it
 * builds each challenge, and by language name (lowercase) to match how
 * dockerExecutor.ts looks up LANGUAGES[language.toLowerCase()].
 */

type StarterCodeSet = Record<string, string>;

/** The full, already-verified templates. Each is split below into the part the
 *  user may edit and the part they may not, at the "Do not edit" marker comment.
 *  Keeping the whole template in one string here (rather than hand-splitting it)
 *  means the split can never introduce a typo into code that was already tested
 *  end-to-end against the Docker sandbox. */
const RAW_STARTER_CODE: Record<string, StarterCodeSet> = {
    'Two Sum': {
        javascript: `// Two Sum
// Implement twoSum(nums, target). Return the indices of the two numbers
// that add up to target, as an array like [i, j].

function twoSum(nums, target) {
  // Your code here
}

// --- Do not edit below: reads the test case and prints your answer ---
const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1], 10);
console.log(JSON.stringify(twoSum(nums, target)));
`,
        python: `import sys, json

def two_sum(nums, target):
    # Your code here
    pass

# --- Do not edit below: reads the test case and prints your answer ---
if __name__ == '__main__':
    lines = sys.stdin.read().split('\\n')
    nums = json.loads(lines[0])
    target = int(lines[1])
    print(json.dumps(two_sum(nums, target), separators=(',', ':')))
`,
        java: `import java.io.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[0];
    }

    // --- Do not edit below: reads the test case and prints your answer ---
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int[] nums = parseIntArray(br.readLine());
        int target = Integer.parseInt(br.readLine().trim());
        System.out.println(formatIntArray(twoSum(nums, target)));
    }

    private static int[] parseIntArray(String s) {
        s = s.trim();
        s = s.substring(1, s.length() - 1);
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }

    private static String formatIntArray(int[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(arr[i]);
        }
        return sb.append("]").toString();
    }
}
`,
    },

    'Binary Search': {
        javascript: `// Binary Search
// Implement search(nums, target). nums is sorted ascending. Return the
// index of target in nums, or -1 if it isn't present.

function search(nums, target) {
  // Your code here
}

// --- Do not edit below: reads the test case and prints your answer ---
const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1], 10);
console.log(search(nums, target));
`,
        python: `import sys, json

def search(nums, target):
    # Your code here
    pass

# --- Do not edit below: reads the test case and prints your answer ---
if __name__ == '__main__':
    lines = sys.stdin.read().split('\\n')
    nums = json.loads(lines[0])
    target = int(lines[1])
    print(search(nums, target))
`,
        java: `import java.io.*;

public class Solution {
    public static int search(int[] nums, int target) {
        // Your code here
        return -1;
    }

    // --- Do not edit below: reads the test case and prints your answer ---
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int[] nums = parseIntArray(br.readLine());
        int target = Integer.parseInt(br.readLine().trim());
        System.out.println(search(nums, target));
    }

    private static int[] parseIntArray(String s) {
        s = s.trim();
        s = s.substring(1, s.length() - 1);
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }
}
`,
    },

    'Merge Intervals': {
        javascript: `// Merge Intervals
// Implement mergeIntervals(intervals). Merge every pair of overlapping
// intervals and return the result, e.g. [[1,3],[2,6]] -> [[1,6]].

function mergeIntervals(intervals) {
  // Your code here
}

// --- Do not edit below: reads the test case and prints your answer ---
const line = require('fs').readFileSync(0, 'utf8').trim();
const intervals = JSON.parse(line);
console.log(JSON.stringify(mergeIntervals(intervals)));
`,
        python: `import sys, json

def merge_intervals(intervals):
    # Your code here
    pass

# --- Do not edit below: reads the test case and prints your answer ---
if __name__ == '__main__':
    intervals = json.loads(sys.stdin.read().strip())
    print(json.dumps(merge_intervals(intervals), separators=(',', ':')))
`,
        java: `import java.io.*;
import java.util.*;

public class Solution {
    public static int[][] mergeIntervals(int[][] intervals) {
        // Your code here
        return intervals;
    }

    // --- Do not edit below: reads the test case and prints your answer ---
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int[][] intervals = parseIntMatrix(br.readLine().trim());
        System.out.println(formatIntMatrix(mergeIntervals(intervals)));
    }

    private static int[][] parseIntMatrix(String s) {
        s = s.substring(1, s.length() - 1);
        if (s.isEmpty()) return new int[0][];
        List<int[]> rows = new ArrayList<>();
        int depth = 0, start = -1;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '[') { if (depth == 0) start = i + 1; depth++; }
            else if (c == ']') { depth--; if (depth == 0) rows.add(parseIntArray(s.substring(start, i))); }
        }
        return rows.toArray(new int[0][]);
    }

    private static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }

    private static String formatIntMatrix(int[][] m) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < m.length; i++) {
            if (i > 0) sb.append(",");
            sb.append("[");
            for (int j = 0; j < m[i].length; j++) {
                if (j > 0) sb.append(",");
                sb.append(m[i][j]);
            }
            sb.append("]");
        }
        return sb.append("]").toString();
    }
}
`,
    },

    'Valid Parentheses': {
        javascript: `// Valid Parentheses
// Implement isValid(s). Return true if every bracket in s is opened and
// closed in the right order, false otherwise.

function isValid(s) {
  // Your code here
}

// --- Do not edit below: reads the test case and prints your answer ---
const line = require('fs').readFileSync(0, 'utf8').trim();
const s = JSON.parse(line); // the test case wraps the string in quotes, e.g. "()"
console.log(isValid(s));
`,
        python: `import sys, json

def is_valid(s):
    # Your code here
    pass

# --- Do not edit below: reads the test case and prints your answer ---
if __name__ == '__main__':
    s = json.loads(sys.stdin.read().strip())
    print('true' if is_valid(s) else 'false')
`,
        java: `import java.io.*;

public class Solution {
    public static boolean isValid(String s) {
        // Your code here
        return false;
    }

    // --- Do not edit below: reads the test case and prints your answer ---
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine().trim();
        String s = line.substring(1, line.length() - 1); // strip surrounding quotes
        System.out.println(isValid(s));
    }
}
`,
    },

    'Binary Tree Maximum Depth': {
        javascript: `// Binary Tree Maximum Depth
// Implement maxDepth(root). root is the root TreeNode, or null for an
// empty tree. TreeNode has properties: val, left, right.

function maxDepth(root) {
  // Your code here
}

// --- Do not edit below: builds the tree from the test case and prints your answer ---
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

function buildTree(values) {
  if (values.length === 0 || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift();
    if (i < values.length) {
      const leftVal = values[i++];
      if (leftVal !== null) { node.left = new TreeNode(leftVal); queue.push(node.left); }
    }
    if (i < values.length) {
      const rightVal = values[i++];
      if (rightVal !== null) { node.right = new TreeNode(rightVal); queue.push(node.right); }
    }
  }
  return root;
}

const values = JSON.parse(require('fs').readFileSync(0, 'utf8').trim());
console.log(maxDepth(buildTree(values)));
`,
        python: `import sys, json

class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def max_depth(root):
    # Your code here
    pass

# --- Do not edit below: builds the tree from the test case and prints your answer ---
def build_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = [root]
    i = 1
    while queue and i < len(values):
        node = queue.pop(0)
        if i < len(values):
            left_val = values[i]; i += 1
            if left_val is not None:
                node.left = TreeNode(left_val)
                queue.append(node.left)
        if i < len(values):
            right_val = values[i]; i += 1
            if right_val is not None:
                node.right = TreeNode(right_val)
                queue.append(node.right)
    return root

if __name__ == '__main__':
    values = json.loads(sys.stdin.read().strip())
    print(max_depth(build_tree(values)))
`,
        java: `import java.io.*;
import java.util.*;

public class Solution {
    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;
        TreeNode(int val) { this.val = val; }
    }

    public static int maxDepth(TreeNode root) {
        // Your code here
        return 0;
    }

    // --- Do not edit below: builds the tree from the test case and prints your answer ---
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Integer[] values = parseNullableIntArray(br.readLine().trim());
        System.out.println(maxDepth(buildTree(values)));
    }

    private static Integer[] parseNullableIntArray(String s) {
        s = s.substring(1, s.length() - 1).trim();
        if (s.isEmpty()) return new Integer[0];
        String[] parts = s.split(",");
        Integer[] arr = new Integer[parts.length];
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i].trim();
            arr[i] = p.equals("null") ? null : Integer.parseInt(p);
        }
        return arr;
    }

    private static TreeNode buildTree(Integer[] values) {
        if (values.length == 0 || values[0] == null) return null;
        TreeNode root = new TreeNode(values[0]);
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        int i = 1;
        while (!queue.isEmpty() && i < values.length) {
            TreeNode node = queue.poll();
            if (i < values.length) {
                Integer leftVal = values[i++];
                if (leftVal != null) { node.left = new TreeNode(leftVal); queue.add(node.left); }
            }
            if (i < values.length) {
                Integer rightVal = values[i++];
                if (rightVal != null) { node.right = new TreeNode(rightVal); queue.add(node.right); }
            }
        }
        return root;
    }
}
`,
    },

    'LRU Cache': {
        javascript: `// LRU Cache
// Implement the LRUCache class:
//   new LRUCache(capacity)
//   get(key)          -> the value, or -1 if the key isn't present
//   put(key, value)   -> stores the value, evicting the least recently
//                        used entry first if the cache is over capacity

class LRUCache {
  constructor(capacity) {
    // Your code here
  }

  get(key) {
    // Your code here
    return -1;
  }

  put(key, value) {
    // Your code here
  }
}

// --- Do not edit below: replays the operations and prints the results ---
const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const ops = JSON.parse(lines[0]);
const argsList = JSON.parse(lines[1]);
const results = [];
let cache = null;
for (let i = 0; i < ops.length; i++) {
  if (ops[i] === 'LRUCache') { cache = new LRUCache(argsList[i][0]); results.push(null); }
  else if (ops[i] === 'get') { results.push(cache.get(argsList[i][0])); }
  else if (ops[i] === 'put') { cache.put(argsList[i][0], argsList[i][1]); results.push(null); }
}
console.log('[' + results.map(v => v === null ? 'null' : String(v)).join(', ') + ']');
`,
        python: `import sys, json

class LRUCache:
    def __init__(self, capacity):
        # Your code here
        pass

    def get(self, key):
        # Your code here
        return -1

    def put(self, key, value):
        # Your code here
        pass

# --- Do not edit below: replays the operations and prints the results ---
if __name__ == '__main__':
    lines = sys.stdin.read().split('\\n')
    ops = json.loads(lines[0])
    args_list = json.loads(lines[1])
    results = []
    cache = None
    for op, arg in zip(ops, args_list):
        if op == 'LRUCache':
            cache = LRUCache(arg[0])
            results.append(None)
        elif op == 'get':
            results.append(cache.get(arg[0]))
        elif op == 'put':
            cache.put(arg[0], arg[1])
            results.append(None)
    print('[' + ', '.join('null' if v is None else str(v) for v in results) + ']')
`,
        java: `import java.io.*;
import java.util.*;

public class Solution {
    static class LRUCache {
        LRUCache(int capacity) {
            // Your code here
        }

        int get(int key) {
            // Your code here
            return -1;
        }

        void put(int key, int value) {
            // Your code here
        }
    }

    // --- Do not edit below: replays the operations and prints the results ---
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] ops = parseStringArray(br.readLine());
        int[][] argValues = parseIntMatrix(br.readLine());

        List<String> results = new ArrayList<>();
        LRUCache cache = null;
        for (int i = 0; i < ops.length; i++) {
            switch (ops[i]) {
                case "LRUCache":
                    cache = new LRUCache(argValues[i][0]);
                    results.add("null");
                    break;
                case "get":
                    results.add(String.valueOf(cache.get(argValues[i][0])));
                    break;
                case "put":
                    cache.put(argValues[i][0], argValues[i][1]);
                    results.add("null");
                    break;
            }
        }
        System.out.println("[" + String.join(", ", results) + "]");
    }

    private static String[] parseStringArray(String s) {
        s = s.trim();
        s = s.substring(1, s.length() - 1);
        String[] parts = s.split(",");
        String[] arr = new String[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = parts[i].trim().replaceAll("^\\"|\\"$", "");
        return arr;
    }

    private static int[][] parseIntMatrix(String s) {
        s = s.trim();
        s = s.substring(1, s.length() - 1);
        if (s.isEmpty()) return new int[0][];
        List<int[]> rows = new ArrayList<>();
        int depth = 0, start = -1;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '[') { if (depth == 0) start = i + 1; depth++; }
            else if (c == ']') { depth--; if (depth == 0) rows.add(parseIntArray(s.substring(start, i))); }
        }
        return rows.toArray(new int[0][]);
    }

    private static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }
}
`,
    },
};

export interface StarterCodeTemplate {
    /** Shown to the user, pre-filled with a stub they complete. Fully editable. */
    editable: string;
    /** Parses the test case's stdin and prints the answer in the exact format the
     *  test case expects. Shown read-only in the editor so it can't be broken by
     *  an accidental edit; sent to the judge unchanged, appended after `editable`. */
    locked: string;
}

// Everything from the blank line before "// --- Do not edit below:" (or the
// Python "# ---" spelling) to the end of the file is locked; everything above it
// is the editable stub.
const DO_NOT_EDIT_MARKER = /\n\n(?=[ \t]*(?:\/\/|#) --- Do not edit below:)/;

function splitTemplate(template: string): StarterCodeTemplate {
    const markerIndex = template.search(DO_NOT_EDIT_MARKER);
    if (markerIndex === -1) {
        throw new Error('Starter code template is missing the "Do not edit below" marker');
    }
    return {
        editable: template.slice(0, markerIndex),
        locked: template.slice(markerIndex),
    };
}

export const STARTER_CODE: Record<string, Record<string, StarterCodeTemplate>> = Object.fromEntries(
    Object.entries(RAW_STARTER_CODE).map(([title, byLanguage]) => [
        title,
        Object.fromEntries(
            Object.entries(byLanguage).map(([language, template]) => [language, splitTemplate(template)])
        ),
    ])
);

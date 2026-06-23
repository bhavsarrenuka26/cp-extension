
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape_problem") {
        const bodyText = document.body.innerText || "";
        const titleRaw = document.title || "";

        // platform suffixes from title for cleaner output
        const title = titleRaw
            .replace(/\s*[-|–]\s*(LeetCode|Codeforces|CodeChef).*/i, "")
            .trim();

        // Scrape constraints block (works on Codeforces & LeetCode)
        let constraints = "";
        const constraintEl =
            document.querySelector(".constraints") ||           // LeetCode
            document.querySelector(".time-limit") ||            // Codeforces
            document.querySelector("[class*='constraint']");
        if (constraintEl) {
            constraints = constraintEl.innerText.trim().slice(0, 300);
        }

        // Auto-detection keyword hints
        const data = {
            title,
            constraints,

            hasGraph:        /\b(graph|tree|edge|node|adjacen|path|bfs|dfs|spanning|connected component)\b/i.test(bodyText),
            hasDP:           /\b(dp|dynamic programming|subsequence|subarray|memoiz|knapsack|longest common|longest increasing)\b/i.test(bodyText),
            hasBinarySearch: /\b(binary search|sorted array|minimize the maximum|maximize the minimum|search in)\b/i.test(bodyText),
            hasSegTree:      /\b(segment tree|range (sum|min|max|query)|fenwick|BIT|binary indexed)\b/i.test(bodyText),
            hasHash:         /\b(hashing|rolling hash|substring match|anagram|palindrome check)\b/i.test(bodyText),
            hasTrie:         /\b(trie|prefix tree|autocomplete|dictionary of words)\b/i.test(bodyText),
            hasDSU:          /\b(union.find|disjoint set|connected components|kruskal|number of islands)\b/i.test(bodyText),
            hasDijkstra:     /\b(shortest path|dijkstra|weighted graph|minimum distance)\b/i.test(bodyText),
            hasMath:         /\b(prime|modular|gcd|lcm|factorial|fibonacci|number theory|combinatorics|mod 10\^9)\b/i.test(bodyText),
            hasTwoPtr:       /\b(two pointer|sliding window|subarray (sum|length)|longest substring)\b/i.test(bodyText),
            hasPrefix:       /\b(prefix sum|range sum query|cumulative|2d prefix)\b/i.test(bodyText),
            hasBacktrack:    /\b(backtrack|permutation|combination|n-queen|sudoku|generate all)\b/i.test(bodyText),
            hasGreedy:       /\b(greedy|interval scheduling|activity selection|minimum cost|earliest deadline)\b/i.test(bodyText),
            isMultiTest:     /\b(t test cases|t queries|for each test case|q queries)\b/i.test(bodyText),
        };

        sendResponse(data);
    }

    return true;
});
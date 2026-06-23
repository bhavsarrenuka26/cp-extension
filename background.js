
//  Template generators

function buildTemplate(type, title, customSnippets) {
    // Check if this is a custom snippet first
    if (customSnippets && customSnippets[type]) {
        return `// Problem: ${title}\n` + customSnippets[type];
    }

    const header =
        `// Problem: ${title}\n` +
        `#include <bits/stdc++.h>\n` +
        `using namespace std;\n\n`;

    const mainFooter = (body) =>
        `void solve() {\n${body}\n}\n\n` +
        `int main() {\n` +
        `    ios_base::sync_with_stdio(false);\n` +
        `    cin.tie(NULL);\n` +
        `    int t = 1;\n` +
        `    cin >> t; // Remove if only 1 test case\n` +
        `    while (t--) {\n` +
        `        solve();\n` +
        `    }\n` +
        `    return 0;\n` +
        `}\n`;

    const templates = {

        standard: mainFooter(`    // TODO: write your logic here`),

        dp: mainFooter(
            `    int n;\n` +
            `    cin >> n;\n\n` +
            `    // 1D DP — change to vector<vector<long long>> for 2D\n` +
            `    vector<long long> dp(n + 1, 0);\n` +
            `    // dp[0] = base case;\n\n` +
            `    for (int i = 1; i <= n; ++i) {\n` +
            `        // dp[i] = ...;\n` +
            `    }\n\n` +
            `    cout << dp[n] << "\\n";`
        ),

        graph: mainFooter(
            `    int n, m;\n` +
            `    cin >> n >> m;\n` +
            `    vector<vector<int>> adj(n + 1);\n` +
            `    for (int i = 0; i < m; ++i) {\n` +
            `        int u, v;\n` +
            `        cin >> u >> v;\n` +
            `        adj[u].push_back(v);\n` +
            `        adj[v].push_back(u); // Remove for directed graph\n` +
            `    }\n\n` +
            `    // BFS template\n` +
            `    vector<int> dist(n + 1, -1);\n` +
            `    queue<int> q;\n` +
            `    dist[1] = 0; q.push(1);\n` +
            `    while (!q.empty()) {\n` +
            `        int u = q.front(); q.pop();\n` +
            `        for (int v : adj[u]) {\n` +
            `            if (dist[v] == -1) {\n` +
            `                dist[v] = dist[u] + 1;\n` +
            `                q.push(v);\n` +
            `            }\n` +
            `        }\n` +
            `    }`
        ),

        binary_search: mainFooter(
            `    int n;\n` +
            `    cin >> n;\n` +
            `    vector<int> a(n);\n` +
            `    for (auto& x : a) cin >> x;\n\n` +
            `    // Binary search on answer\n` +
            `    long long lo = 0, hi = 1e9;\n` +
            `    while (lo < hi) {\n` +
            `        long long mid = lo + (hi - lo) / 2;\n` +
            `        if (/* feasible(mid) */ false) {\n` +
            `            hi = mid;\n` +
            `        } else {\n` +
            `            lo = mid + 1;\n` +
            `        }\n` +
            `    }\n` +
            `    cout << lo << "\\n";`
        ),

        segment_tree:
            `// Segment Tree (range sum, point update)\n` +
            `// Change merge() for other operations (min, max, gcd...)\n` +
            `struct SegTree {\n` +
            `    int n;\n` +
            `    vector<long long> tree;\n` +
            `    SegTree(int n) : n(n), tree(4 * n, 0) {}\n\n` +
            `    void update(int node, int l, int r, int idx, long long val) {\n` +
            `        if (l == r) { tree[node] = val; return; }\n` +
            `        int mid = (l + r) / 2;\n` +
            `        if (idx <= mid) update(2*node, l, mid, idx, val);\n` +
            `        else            update(2*node+1, mid+1, r, idx, val);\n` +
            `        tree[node] = tree[2*node] + tree[2*node+1];\n` +
            `    }\n\n` +
            `    long long query(int node, int l, int r, int ql, int qr) {\n` +
            `        if (qr < l || r < ql) return 0;\n` +
            `        if (ql <= l && r <= qr) return tree[node];\n` +
            `        int mid = (l + r) / 2;\n` +
            `        return query(2*node, l, mid, ql, qr)\n` +
            `             + query(2*node+1, mid+1, r, ql, qr);\n` +
            `    }\n\n` +
            `    void update(int idx, long long val) { update(1, 0, n-1, idx, val); }\n` +
            `    long long query(int l, int r)        { return query(1, 0, n-1, l, r); }\n` +
            `};\n\n` +
            mainFooter(
                `    int n;\n` +
                `    cin >> n;\n` +
                `    SegTree st(n);\n` +
                `    // st.update(i, val);\n` +
                `    // st.query(l, r);`
            ),

        string_hashing:
            `// Polynomial rolling hash — double hashing for collision resistance\n` +
            `const long long MOD1 = 1e9 + 7, BASE1 = 131;\n` +
            `const long long MOD2 = 1e9 + 9, BASE2 = 137;\n\n` +
            `struct Hash {\n` +
            `    int n;\n` +
            `    vector<long long> h1, h2, p1, p2;\n` +
            `    Hash(const string& s) : n(s.size()),\n` +
            `        h1(n+1,0), h2(n+1,0), p1(n+1,1), p2(n+1,1) {\n` +
            `        for (int i = 0; i < n; ++i) {\n` +
            `            h1[i+1] = (h1[i] * BASE1 + s[i]) % MOD1;\n` +
            `            h2[i+1] = (h2[i] * BASE2 + s[i]) % MOD2;\n` +
            `            p1[i+1] = p1[i] * BASE1 % MOD1;\n` +
            `            p2[i+1] = p2[i] * BASE2 % MOD2;\n` +
            `        }\n` +
            `    }\n` +
            `    pair<long long,long long> get(int l, int r) {\n` +
            `        long long v1 = (h1[r+1] - h1[l] * p1[r-l+1] % MOD1 + MOD1*2) % MOD1;\n` +
            `        long long v2 = (h2[r+1] - h2[l] * p2[r-l+1] % MOD2 + MOD2*2) % MOD2;\n` +
            `        return {v1, v2};\n` +
            `    }\n` +
            `};\n\n` +
            mainFooter(
                `    string s;\n` +
                `    cin >> s;\n` +
                `    Hash hs(s);\n` +
                `    // hs.get(l, r) — O(1) substring hash comparison`
            ),

        backtracking: mainFooter(
            `    int n;\n` +
            `    cin >> n;\n\n` +
            `    vector<int> current;\n` +
            `    vector<vector<int>> results;\n\n` +
            `    function<void()> backtrack = [&]() {\n` +
            `        if ((int)current.size() == n) {\n` +
            `            results.push_back(current);\n` +
            `            return;\n` +
            `        }\n` +
            `        for (int choice = 1; choice <= n; ++choice) {\n` +
            `            // if (!isValid(choice)) continue;\n` +
            `            current.push_back(choice);\n` +
            `            backtrack();\n` +
            `            current.pop_back();\n` +
            `        }\n` +
            `    };\n\n` +
            `    backtrack();\n` +
            `    cout << results.size() << "\\n";`
        ),

        greedy: mainFooter(
            `    int n;\n` +
            `    cin >> n;\n` +
            `    vector<pair<int,int>> items(n);\n` +
            `    for (auto& [a, b] : items) cin >> a >> b;\n\n` +
            `    sort(items.begin(), items.end(), [](auto& x, auto& y) {\n` +
            `        return x.first < y.first; // change comparator\n` +
            `    });\n\n` +
            `    long long ans = 0;\n` +
            `    for (auto& [a, b] : items) {\n` +
            `        // TODO: greedy pick\n` +
            `    }\n` +
            `    cout << ans << "\\n";`
        ),

        two_pointers: mainFooter(
            `    int n;\n` +
            `    cin >> n;\n` +
            `    vector<int> a(n);\n` +
            `    for (auto& x : a) cin >> x;\n\n` +
            `    int l = 0, r = 0;\n` +
            `    long long windowSum = 0, ans = 0;\n` +
            `    while (r < n) {\n` +
            `        windowSum += a[r];\n` +
            `        while (/* !valid() */ false) {\n` +
            `            windowSum -= a[l++];\n` +
            `        }\n` +
            `        ans = max(ans, (long long)(r - l + 1));\n` +
            `        ++r;\n` +
            `    }\n` +
            `    cout << ans << "\\n";`
        ),

        math:
            `//  Math utilities \n` +
            `const long long MOD = 1e9 + 7;\n\n` +
            `long long power(long long base, long long exp, long long mod) {\n` +
            `    long long result = 1; base %= mod;\n` +
            `    for (; exp > 0; exp >>= 1) {\n` +
            `        if (exp & 1) result = result * base % mod;\n` +
            `        base = base * base % mod;\n` +
            `    }\n` +
            `    return result;\n` +
            `}\n\n` +
            `long long modInverse(long long a, long long mod) {\n` +
            `    return power(a, mod - 2, mod); // mod must be prime\n` +
            `}\n\n` +
            `vector<bool> sieve(int n) {\n` +
            `    vector<bool> is_prime(n + 1, true);\n` +
            `    is_prime[0] = is_prime[1] = false;\n` +
            `    for (int i = 2; i * i <= n; ++i)\n` +
            `        if (is_prime[i])\n` +
            `            for (int j = i*i; j <= n; j += i)\n` +
            `                is_prime[j] = false;\n` +
            `    return is_prime;\n` +
            `}\n\n` +
            mainFooter(
                `    long long n;\n` +
                `    cin >> n;\n` +
                `    // power(base, exp, MOD)\n` +
                `    // modInverse(a, MOD)\n` +
                `    // auto primes = sieve(n);`
            ),

        trie:
            `// Trie (insert + search + startsWith)\n` +
            `struct Trie {\n` +
            `    struct Node {\n` +
            `        int ch[26];\n` +
            `        bool end;\n` +
            `        Node() : end(false) { fill(ch, ch+26, -1); }\n` +
            `    };\n` +
            `    vector<Node> nodes;\n` +
            `    Trie() { nodes.emplace_back(); }\n\n` +
            `    void insert(const string& s) {\n` +
            `        int cur = 0;\n` +
            `        for (char c : s) {\n` +
            `            int idx = c - 'a';\n` +
            `            if (nodes[cur].ch[idx] == -1) {\n` +
            `                nodes[cur].ch[idx] = nodes.size();\n` +
            `                nodes.emplace_back();\n` +
            `            }\n` +
            `            cur = nodes[cur].ch[idx];\n` +
            `        }\n` +
            `        nodes[cur].end = true;\n` +
            `    }\n` +
            `    bool search(const string& s) {\n` +
            `        int cur = 0;\n` +
            `        for (char c : s) {\n` +
            `            int idx = c - 'a';\n` +
            `            if (nodes[cur].ch[idx] == -1) return false;\n` +
            `            cur = nodes[cur].ch[idx];\n` +
            `        }\n` +
            `        return nodes[cur].end;\n` +
            `    }\n` +
            `    bool startsWith(const string& prefix) {\n` +
            `        int cur = 0;\n` +
            `        for (char c : prefix) {\n` +
            `            int idx = c - 'a';\n` +
            `            if (nodes[cur].ch[idx] == -1) return false;\n` +
            `            cur = nodes[cur].ch[idx];\n` +
            `        }\n` +
            `        return true;\n` +
            `    }\n` +
            `};\n\n` +
            mainFooter(
                `    int n;\n` +
                `    cin >> n;\n` +
                `    Trie trie;\n` +
                `    while (n--) {\n` +
                `        string op, s; cin >> op >> s;\n` +
                `        if (op == "insert")      trie.insert(s);\n` +
                `        else if (op == "search") cout << trie.search(s) << "\\n";\n` +
                `        else                     cout << trie.startsWith(s) << "\\n";\n` +
                `    }`
            ),

        dsu:
            `// Disjoint Set Union (Union-Find) with path compression + rank\n` +
            `struct DSU {\n` +
            `    vector<int> parent, rank_;\n` +
            `    DSU(int n) : parent(n), rank_(n, 0) {\n` +
            `        iota(parent.begin(), parent.end(), 0);\n` +
            `    }\n` +
            `    int find(int x) {\n` +
            `        return parent[x] == x ? x : parent[x] = find(parent[x]);\n` +
            `    }\n` +
            `    bool unite(int x, int y) {\n` +
            `        x = find(x); y = find(y);\n` +
            `        if (x == y) return false;\n` +
            `        if (rank_[x] < rank_[y]) swap(x, y);\n` +
            `        parent[y] = x;\n` +
            `        if (rank_[x] == rank_[y]) rank_[x]++;\n` +
            `        return true;\n` +
            `    }\n` +
            `    bool connected(int x, int y) { return find(x) == find(y); }\n` +
            `};\n\n` +
            mainFooter(
                `    int n, m;\n` +
                `    cin >> n >> m;\n` +
                `    DSU dsu(n + 1);\n` +
                `    for (int i = 0; i < m; ++i) {\n` +
                `        int u, v; cin >> u >> v;\n` +
                `        dsu.unite(u, v);\n` +
                `    }\n` +
                `    // dsu.connected(u, v) — check if same component`
            ),

        shortest_path:
            `// Dijkstra's shortest path (weighted graph)\n` +
            `using pii = pair<int,int>;\n\n` +
            mainFooter(
                `    int n, m;\n` +
                `    cin >> n >> m;\n` +
                `    vector<vector<pii>> adj(n + 1);\n` +
                `    for (int i = 0; i < m; ++i) {\n` +
                `        int u, v, w; cin >> u >> v >> w;\n` +
                `        adj[u].push_back({v, w});\n` +
                `        adj[v].push_back({u, w}); // Remove for directed\n` +
                `    }\n\n` +
                `    // Dijkstra from source = 1\n` +
                `    const int INF = 1e9;\n` +
                `    vector<int> dist(n + 1, INF);\n` +
                `    priority_queue<pii, vector<pii>, greater<pii>> pq;\n` +
                `    dist[1] = 0; pq.push({0, 1});\n` +
                `    while (!pq.empty()) {\n` +
                `        auto [d, u] = pq.top(); pq.pop();\n` +
                `        if (d > dist[u]) continue;\n` +
                `        for (auto [v, w] : adj[u]) {\n` +
                `            if (dist[u] + w < dist[v]) {\n` +
                `                dist[v] = dist[u] + w;\n` +
                `                pq.push({dist[v], v});\n` +
                `            }\n` +
                `        }\n` +
                `    }\n` +
                `    // dist[x] = shortest distance from 1 to x`
            ),

        prefix_sum: mainFooter(
            `    int n;\n` +
            `    cin >> n;\n` +
            `    vector<long long> a(n+1), pre(n+1, 0);\n` +
            `    for (int i = 1; i <= n; ++i) {\n` +
            `        cin >> a[i];\n` +
            `        pre[i] = pre[i-1] + a[i];\n` +
            `    }\n\n` +
            `    // Range sum query [l, r] (1-indexed)\n` +
            `    // long long rangeSum = pre[r] - pre[l-1];\n\n` +
            `    // 2D prefix sum setup:\n` +
            `    // vector<vector<long long>> pre2(n+1, vector<long long>(n+1, 0));\n` +
            `    // pre2[i][j] = pre2[i-1][j] + pre2[i][j-1] - pre2[i-1][j-1] + grid[i][j];`
        ),
    };

    return header + (templates[type] || templates["standard"]);
}

//  Auto-detect best template type from page hints

function detectType(hints) {
    if (hints.hasTrie)         return "trie";
    if (hints.hasDSU)          return "dsu";
    if (hints.hasSegTree)      return "segment_tree";
    if (hints.hasHash)         return "string_hashing";
    if (hints.hasDijkstra)     return "shortest_path";
    if (hints.hasBinarySearch) return "binary_search";
    if (hints.hasGraph)        return "graph";
    if (hints.hasDP)           return "dp";
    if (hints.hasMath)         return "math";
    if (hints.hasTwoPtr)       return "two_pointers";
    if (hints.hasPrefix)       return "prefix_sum";
    if (hints.hasBacktrack)    return "backtracking";
    if (hints.hasGreedy)       return "greedy";
    return "standard";
}

//  History 
function addToHistory(entry) {
    chrome.storage.local.get(["history"], (result) => {
        let history = result.history || [];
        history.unshift(entry);
        if (history.length > 5) history = history.slice(0, 5);
        chrome.storage.local.set({ history });
    });
}

// message handler 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "generate_template") {
        const data = request.data || {};
        const title = data.title || "Unknown Problem";
        const userType = request.type;

        // Load custom snippets 
        chrome.storage.local.get(["customSnippets"], (result) => {
            const customSnippets = result.customSnippets || {};
            const resolvedType = (userType === "auto")
                ? detectType(data)
                : userType;

            const code = buildTemplate(resolvedType, title, customSnippets);

            // Save to history
            addToHistory({
                title,
                type: resolvedType,
                code,
                timestamp: Date.now(),
            });

            sendResponse({ code, detectedType: resolvedType });
        });

        return true; // async
    }

    if (request.action === "get_history") {
        chrome.storage.local.get(["history"], (result) => {
            sendResponse({ history: result.history || [] });
        });
        return true;
    }

    if (request.action === "get_snippets") {
        chrome.storage.local.get(["customSnippets"], (result) => {
            sendResponse({ snippets: result.customSnippets || {} });
        });
        return true;
    }

    if (request.action === "save_snippet") {
        chrome.storage.local.get(["customSnippets"], (result) => {
            const snippets = result.customSnippets || {};
            snippets[request.key] = request.code;
            chrome.storage.local.set({ customSnippets: snippets }, () => {
                sendResponse({ ok: true });
            });
        });
        return true;
    }

    if (request.action === "delete_snippet") {
        chrome.storage.local.get(["customSnippets"], (result) => {
            const snippets = result.customSnippets || {};
            delete snippets[request.key];
            chrome.storage.local.set({ customSnippets: snippets }, () => {
                sendResponse({ ok: true });
            });
        });
        return true;
    }

    return true;
});
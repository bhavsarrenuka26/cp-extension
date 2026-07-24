

let _model = null;

async function loadModel() {
    if (_model) return _model;
    const url  = chrome.runtime.getURL("model/model.json");
    const resp = await fetch(url);
    _model = await resp.json();
    // Build reverse vocab 
    _model._rev = {};
    for (const [idx, tok] of Object.entries(_model.vocab)) {
        _model._rev[tok] = idx;
    }
    return _model;
}


const STOPS = new Set([
    "the","and","for","with","you","are","can","have","that","this",
    "from","will","not","but","also","each","then","they","more","was",
    "has","its","all","per","one","two","three","four","five","any",
    "given","find","output","input","print","integer","integers","array",
    "elements","element","number","numbers","problem","solution","answer",
    "first","last","line","lines","space","spaces","case","cases","test",
    "contains","consist","note","example","return","value","values",
    "where","such","which","when","into","over","than","your","their",
    "between","among","within","without","there","should","must","least",
    "most","next","previous","current","following","above","below",
]);

const PHRASES = [
    [/dynamic\s+programming/gi,          "FEAT_DP"],
    [/\bdp\b/gi,                          "FEAT_DP"],
    [/memoiz/gi,                          "FEAT_DP"],
    [/knapsack/gi,                        "FEAT_DP"],
    [/longest\s+common\s+subsequence/gi,  "FEAT_DP"],
    [/longest\s+increasing/gi,            "FEAT_DP"],
    [/number\s+of\s+ways/gi,             "FEAT_DP"],
    [/binary\s+search/gi,                 "FEAT_BSEARCH"],
    [/minimize\s+the\s+maximum/gi,        "FEAT_BSEARCH"],
    [/maximize\s+the\s+minimum/gi,        "FEAT_BSEARCH"],
    [/two\s+pointer/gi,                   "FEAT_TWOPTR"],
    [/sliding\s+window/gi,                "FEAT_TWOPTR"],
    [/segment\s+tree/gi,                  "FEAT_SEGTREE"],
    [/fenwick/gi,                         "FEAT_SEGTREE"],
    [/binary\s+indexed\s+tree/gi,         "FEAT_SEGTREE"],
    [/range\s+(sum|min|max|query)/gi,     "FEAT_SEGTREE"],
    [/union.?find/gi,                     "FEAT_DSU"],
    [/disjoint\s+set/gi,                  "FEAT_DSU"],
    [/connected\s+component/gi,           "FEAT_DSU"],
    [/shortest\s+path/gi,                 "FEAT_DIJKSTRA"],
    [/dijkstra/gi,                        "FEAT_DIJKSTRA"],
    [/prefix\s+sum/gi,                    "FEAT_PREFIX"],
    [/backtrack/gi,                       "FEAT_BACKTRACK"],
    [/\btrie\b/gi,                        "FEAT_TRIE"],
    [/prefix\s+tree/gi,                   "FEAT_TRIE"],
    [/breadth.first/gi,                   "FEAT_GRAPH"],
    [/depth.first/gi,                     "FEAT_GRAPH"],
    [/adjacen/gi,                         "FEAT_GRAPH"],
    [/number\s+theory/gi,                 "FEAT_MATH"],
    [/modular\s+arithmetic/gi,            "FEAT_MATH"],
    [/\bgcd\b|\blcm\b/gi,                 "FEAT_MATH"],
    [/\bgreedy\b/gi,                      "FEAT_GREEDY"],
    [/rolling\s+hash/gi,                  "FEAT_STRHASH"],
    [/\bpalindrome/gi,                    "FEAT_STRHASH"],
    [/\banagram/gi,                       "FEAT_STRHASH"],
];

function preprocess(text) {
    text = text.toLowerCase();
    // Inject phrase features 
    for (const [pattern, feat] of PHRASES) {
        if (pattern.test(text)) {
            text = text + ` ${feat} ${feat} ${feat}`;
        }
        pattern.lastIndex = 0;
    }
    text = text.replace(/<[^>]+>/g, " ")
               .replace(/&[a-z]+;/g, " ")
               .replace(/\d+/g, " NUM ")
               .replace(/[^a-z_ ]/g, " ");
    return text.split(/\s+/).filter(t => t.length >= 3 && !STOPS.has(t));
}

function tfidfVec(tokens, model) {
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const total = tokens.length || 1;
    const vec = {};
    let norm = 0;
    for (const [tok, cnt] of Object.entries(tf)) {
        const idx = model._rev[tok];
        if (idx === undefined) continue;
        const idf = model.idf[tok] || 1;
        const w   = (cnt / total) * idf;
        vec[idx]  = w;
        norm     += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const idx in vec) vec[idx] /= norm;
    return vec;
}

function softmax(obj) {
    const vals = Object.values(obj);
    const mx   = Math.max(...vals);
    const exps = vals.map(v => Math.exp(v - mx));
    const sum  = exps.reduce((a, b) => a + b, 0);
    const res  = {};
    Object.keys(obj).forEach((k, i) => { res[k] = exps[i] / sum; });
    return res;
}

async function classifyProblem(text) {
    const model  = await loadModel();
    const tokens = preprocess(text);
    const vec    = tfidfVec(tokens, model);
    const raw    = {};

    for (const cls of model.classes) {
        let score = model.log_prior[cls] || 0;
        const lp  = model.log_probs[cls] || {};
        for (const [idx, w] of Object.entries(vec)) {
            const v = lp[idx];
            if (v !== undefined) score += w * v;
        }
        raw[cls] = score;
    }

    const probs  = softmax(raw);
    const ranked = Object.entries(probs).sort((a, b) => b[1] - a[1]);

    return {
        label:      ranked[0][0],
        confidence: ranked[0][1],
        second:     ranked[1]?.[0] || null,
        secondConf: ranked[1]?.[1] || 0,
        scores:     probs,
        modelType:  model.model_name,
        cvAccuracy: model.cv_accuracy,
    };
}
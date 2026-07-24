

import json, os, re, random, math, sys, io
from collections import defaultdict, Counter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

os.makedirs("model", exist_ok=True)
random.seed(42)

#  Load data 
with open("data/labelled_problems.json", encoding="utf-8") as f:
    dataset = json.load(f)

print(f"Loaded {len(dataset)} samples")
by_class = defaultdict(list)
for item in dataset:
    by_class[item["label"]].append(item)

print("\nClass distribution:")
for cat, items in sorted(by_class.items()):
    print(f"  {cat:20s}: {len(items)}")

#  Algorithmic phrase  

PHRASES = [
    # DP
    (r"dynamic\s+programming",          "FEAT_DP",       5),
    (r"\bdp\b",                          "FEAT_DP",       4),
    (r"memoiz",                          "FEAT_DP",       4),
    (r"knapsack",                        "FEAT_DP",       5),
    (r"longest\s+common\s+subsequence",  "FEAT_DP",       5),
    (r"longest\s+increasing\s+subsequence","FEAT_DP",     5),
    (r"number\s+of\s+ways",              "FEAT_DP",       3),
    (r"count\s+(the\s+)?ways",           "FEAT_DP",       3),
    (r"minimum\s+cost",                  "FEAT_DP",       2),
    (r"subsequence",                     "FEAT_DP",       3),
    # Binary Search
    (r"binary\s+search",                 "FEAT_BSEARCH",  5),
    (r"minimize\s+the\s+maximum",        "FEAT_BSEARCH",  5),
    (r"maximize\s+the\s+minimum",        "FEAT_BSEARCH",  5),
    (r"sorted\s+array",                  "FEAT_BSEARCH",  3),
    (r"monoton",                         "FEAT_BSEARCH",  2),
    # Two Pointers
    (r"two\s+pointer",                   "FEAT_TWOPTR",   5),
    (r"sliding\s+window",                "FEAT_TWOPTR",   5),
    (r"subarray\s+sum",                  "FEAT_TWOPTR",   4),
    (r"longest\s+subarray",              "FEAT_TWOPTR",   4),
    (r"contiguous\s+subarray",           "FEAT_TWOPTR",   4),
    # Segment Tree
    (r"segment\s+tree",                  "FEAT_SEGTREE",  5),
    (r"fenwick",                         "FEAT_SEGTREE",  5),
    (r"binary\s+indexed\s+tree",         "FEAT_SEGTREE",  5),
    (r"range\s+(sum|min|max|update|query)","FEAT_SEGTREE",5),
    (r"point\s+update",                  "FEAT_SEGTREE",  4),
    # DSU
    (r"union.?find",                     "FEAT_DSU",      5),
    (r"disjoint\s+set",                  "FEAT_DSU",      5),
    (r"connected\s+component",           "FEAT_DSU",      4),
    (r"kruskal",                         "FEAT_DSU",      5),
    (r"number\s+of\s+component",         "FEAT_DSU",      4),
    # Shortest Path
    (r"shortest\s+path",                 "FEAT_DIJKSTRA", 5),
    (r"dijkstra",                        "FEAT_DIJKSTRA", 5),
    (r"bellman.?ford",                   "FEAT_DIJKSTRA", 5),
    (r"minimum\s+distance",              "FEAT_DIJKSTRA", 4),
    (r"weighted\s+(graph|edge)",         "FEAT_DIJKSTRA", 4),
    # Graph
    (r"breadth.first",                   "FEAT_GRAPH",    4),
    (r"depth.first",                     "FEAT_GRAPH",    4),
    (r"adjacen",                         "FEAT_GRAPH",    3),
    (r"spanning\s+tree",                 "FEAT_GRAPH",    4),
    (r"\bbfs\b",                         "FEAT_GRAPH",    4),
    (r"\bdfs\b",                         "FEAT_GRAPH",    4),
    (r"topological",                     "FEAT_GRAPH",    4),
    (r"bipartite",                       "FEAT_GRAPH",    4),
    (r"directed\s+(graph|edge)",         "FEAT_GRAPH",    4),
    # Prefix Sum
    (r"prefix\s+sum",                    "FEAT_PREFIX",   5),
    (r"cumulative\s+sum",                "FEAT_PREFIX",   5),
    (r"range\s+sum\s+query",             "FEAT_PREFIX",   5),
    # Trie
    (r"\btrie\b",                        "FEAT_TRIE",     5),
    (r"prefix\s+tree",                   "FEAT_TRIE",     5),
    (r"autocomplete",                    "FEAT_TRIE",     5),
    # Backtracking
    (r"backtrack",                       "FEAT_BACKTRACK",5),
    (r"generate\s+all",                  "FEAT_BACKTRACK",4),
    (r"all\s+permutation",               "FEAT_BACKTRACK",4),
    # Math
    (r"number\s+theory",                 "FEAT_MATH",     5),
    (r"modular\s+arithmetic",            "FEAT_MATH",     5),
    (r"prime\s+(number|factori)",        "FEAT_MATH",     5),
    (r"\bgcd\b|\blcm\b",                 "FEAT_MATH",     4),
    (r"modulo\s+\d",                     "FEAT_MATH",     4),
    (r"10\^9\s*\+\s*7",                  "FEAT_MATH",     4),
    (r"combinatorics",                   "FEAT_MATH",     5),
    (r"factorial",                       "FEAT_MATH",     4),
    # Greedy
    (r"\bgreedy\b",                      "FEAT_GREEDY",   5),
    (r"interval\s+scheduling",           "FEAT_GREEDY",   5),
    (r"activity\s+selection",            "FEAT_GREEDY",   5),
    (r"earliest\s+deadline",             "FEAT_GREEDY",   4),
    # String Hashing
    (r"rolling\s+hash",                  "FEAT_STRHASH",  5),
    (r"string\s+hashing",                "FEAT_STRHASH",  5),
    (r"\bpalindrome",                    "FEAT_STRHASH",  4),
    (r"\banagram",                       "FEAT_STRHASH",  4),
    (r"lexicographi",                    "FEAT_STRHASH",  3),
    (r"substring",                       "FEAT_STRHASH",  3),
]

# Stopwords: generic CP words 

CP_STOPS = {
    
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
    "second","third","total","every","some","same","other","another",
    "like","just","even","only","more","also","well","here","there",
    # Story narrative words 
    "named","called","friend","friends","town","city","village","world",
    "help","want","wants","need","needs","ask","asked","tell","says",
    "know","thinks","decided","decided","time","day","night","year",
    "boy","girl","man","woman","people","person","everyone","nobody",
    "happy","sad","good","bad","great","little","big","small","long",
    "new","old","young","white","black","red","blue","green","left",
    "right","went","came","got","put","set","let","get","take",
    "way","used","made","make","back","home","place","thing","things",
}

# Regex to detect proper nouns (Title Case isolated words)
# These are character names like "Iroh", "Zuko", "Limak", "Anton"
PROPER_NOUN_RE = re.compile(r"\b[A-Z][a-z]{2,}\b")

def preprocess(text):
    # 1. Inject FEAT_ tokens
    injected_feats = []
    text_lower = text.lower()
    for pattern, feat, repeat in PHRASES:
        if re.search(pattern, text_lower):
            injected_feats.extend([feat] * repeat)

    # 2. Remove proper nouns 
    text = PROPER_NOUN_RE.sub(" ", text)

    # 3. Normalise
    text = text.lower()
    text = re.sub(r"<[^>]+>",  " ", text)   # strip HTML
    text = re.sub(r"&[a-z]+;", " ", text)   # strip entities
    text = re.sub(r"\$+[^$]*\$+", " MATH_EXPR ", text)  # MATH_EXPR token
    text = re.sub(r"\d{6,}",   " LARGE_NUM ", text)  # large numbers token
    text = re.sub(r"\d+",      " NUM ", text)
    text = re.sub(r"[^a-z_ ]", " ", text)

    tokens = [t for t in text.split()
              if t and t not in CP_STOPS and len(t) >= 3]

    # 4. Bigrams from clean tokens
    bigrams = [f"{tokens[i]}_{tokens[i+1]}"
               for i in range(len(tokens)-1)
               if tokens[i] not in CP_STOPS and tokens[i+1] not in CP_STOPS]

    return " ".join(injected_feats + tokens + bigrams)

#  Oversample minority classes 
MIN_SAMPLES = 40
balanced = []
for cat, items in by_class.items():
    if len(items) < MIN_SAMPLES:
        factor     = math.ceil(MIN_SAMPLES / len(items))
        oversampled = (items * factor)[:MIN_SAMPLES]
        print(f"  Oversampled {cat}: {len(items)} -> {len(oversampled)}")
        balanced.extend(oversampled)
    else:
        balanced.extend(items)

random.shuffle(balanced)
texts  = [preprocess(d["text"]) for d in balanced]
labels = [d["label"] for d in balanced]

# show top tokens per class after preprocessing
print("\nTop 5 tokens per class after preprocessing ( FEAT_ tokens):")
from collections import Counter as C
by_cls_tok = defaultdict(list)
for text, label in zip(texts, labels):
    by_cls_tok[label].extend(text.split())
for cls in sorted(by_cls_tok.keys()):
    top = [t for t, _ in C(by_cls_tok[cls]).most_common(8)
           if t.startswith("FEAT_")][:5]
    print(f"  {cls:20s}: {', '.join(top) if top else '(no FEAT_ tokens!)'}")

#  Train 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import ComplementNB
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import classification_report, accuracy_score
import numpy as np

X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, random_state=42, stratify=labels
)
print(f"\nTrain: {len(X_train)}  Test: {len(X_test)}")

# Token pattern keeps FEAT_ tokens and normal words
TOKEN_PATTERN = r"FEAT_[A-Z_]+|[a-z][a-z_]{2,}"

nb_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=20000,
        min_df=1,
        max_df=0.85,
        sublinear_tf=True,
        token_pattern=TOKEN_PATTERN,
    )),
    ("clf", ComplementNB(alpha=0.05)),
])

lr_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=20000,
        min_df=1,
        max_df=0.85,
        sublinear_tf=True,
        token_pattern=TOKEN_PATTERN,
    )),
    ("clf", LogisticRegression(
        max_iter=2000,
        C=3.0,
        class_weight="balanced",
        solver="lbfgs",
       
    )),
])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
print("\n5-fold CV:")
nb_scores = cross_val_score(nb_pipeline, texts, labels, cv=cv, scoring="accuracy")
print(f"  ComplementNB       : {nb_scores.mean():.1%} +/- {nb_scores.std():.1%}")
lr_scores = cross_val_score(lr_pipeline, texts, labels, cv=cv, scoring="accuracy")
print(f"  LogisticRegression : {lr_scores.mean():.1%} +/- {lr_scores.std():.1%}")

best = lr_pipeline if lr_scores.mean() >= nb_scores.mean() else nb_pipeline
best_name = "LogisticRegression" if lr_scores.mean() >= nb_scores.mean() else "ComplementNB"
best_cv = max(lr_scores.mean(), nb_scores.mean())

print(f"\n  -> Using {best_name}")
best.fit(X_train, y_train)
y_pred   = best.predict(X_test)
test_acc = accuracy_score(y_test, y_pred)

print(f"\nTest accuracy: {test_acc:.1%}")
print(classification_report(y_test, y_pred))

#  Export model.json 
tfidf   = best.named_steps["tfidf"]
clf     = best.named_steps["clf"]
classes = list(clf.classes_)
vocab   = tfidf.vocabulary_
idf_v   = tfidf.idf_
i2t     = {v: k for k, v in vocab.items()}

if hasattr(clf, "feature_log_prob_"):
    mat    = clf.feature_log_prob_
    disc   = mat.max(axis=0) - mat.mean(axis=0)
    top_i  = set(np.argsort(disc)[-800:].tolist())
    lp_exp = {c: {str(i): float(mat[ci][i]) for i in top_i}
              for ci, c in enumerate(classes)}
    lpr    = {c: float(np.log(np.mean(np.array(labels)==c))) for c in classes}
    ctype  = "nb"
else:
    coef   = clf.coef_
    disc   = coef.max(axis=0) - coef.mean(axis=0)
    top_i  = set(np.argsort(disc)[-800:].tolist())
    lp_exp = {c: {str(i): float(coef[ci][i]) for i in top_i}
              for ci, c in enumerate(classes)}
    lpr    = {c: float(clf.intercept_[ci]) for ci, c in enumerate(classes)}
    ctype  = "lr"

# Always keep FEAT_ tokens regardless of discrimination score
for tok, idx in vocab.items():
    if tok.startswith("FEAT_"):
        top_i.add(idx)

model_json = {
    "classes":     classes,
    "clf_type":    ctype,
    "vocab":       {str(i): i2t[i] for i in top_i if i in i2t},
    "idf":         {i2t[i]: float(idf_v[i]) for i in top_i if i in i2t},
    "log_prior":   lpr,
    "log_probs":   lp_exp,
    "accuracy":    round(test_acc, 4),
    "cv_accuracy": round(float(best_cv), 4),
    "n_train":     len(X_train),
    "n_test":      len(X_test),
    "model_name":  best_name,
}

out = "model/model.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(model_json, f, separators=(",", ":"))

kb = os.path.getsize(out) / 1024

#  Accuracy report 
report = [
    f"Model         : {best_name}",
    f"Test accuracy : {test_acc:.1%}",
    f"5-fold CV     : {best_cv:.1%}",
    f"Model size    : {kb:.1f} KB",
    "",
    "Per-class:",
]
for cls in sorted(set(labels)):
    mask  = [i for i, y in enumerate(y_test) if y == cls]
    right = sum(1 for i in mask if y_pred[i] == cls)
    total = len(mask)
    pct   = right/total if total else 0
    bar   = "#" * int(pct * 20)
    report.append(f"  {cls:20s}: {right:2d}/{total:2d} ({pct:.0%}) {bar}")

report += [
    "",
    "RESUME LINE:",
    f"  {best_name} classifier (TF-IDF bigrams + phrase injection,",
    f"  {len(dataset)} Codeforces problems), {best_cv:.0%} 5-fold CV accuracy",
    f"  across {len(set(labels))} CP problem categories.",
]

with open("model/accuracy_report.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(report))

print(f"\nSaved: {out}  ({kb:.1f} KB)")
print("\n" + "="*55)
print("RESUME LINE:")
print(f"  {best_name}, TF-IDF + phrase injection,")
print(f"  {len(dataset)} samples, {best_cv:.0%} 5-fold CV accuracy,")
print(f"  {len(set(labels))} CP problem categories.")
print("="*55)
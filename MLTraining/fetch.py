

import json, time, re, os, random
from collections import defaultdict
import cloudscraper

os.makedirs("data", exist_ok=True)
random.seed(42)

TARGET_PER_CLASS = 100

# Initialize the Cloudflare bypasser
scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False})

# Correct Codeforces API tag names (
TAG_MAP = {
    "dp":             ["dp"],
    "graph":          ["graphs", "trees", "dfs and similar"],
    "shortest_path":  ["shortest paths"],
    "binary_search":  ["binary search"],
    "segment_tree":   ["segment tree"],
    "two_pointers":   ["two pointers"],
    "greedy":         ["greedy"],
    "math":           ["math"],
    "string_hashing": ["strings", "hashing"],
    "trie":           ["string suffix structures", "data structures"],  
    "dsu":            ["dsu"],
    "backtracking":   ["brute force"],   
    "prefix_sum":     ["implementation"],  
}

def fetch_cf_problems():
    url = "https://codeforces.com/api/problemset.problems"
    print("  Calling Codeforces API...")
    r = scraper.get(url, timeout=20)
    data = r.json()
    return data["result"]["problems"]

def extract_math_content(html):
    """
    Extract only input-spec + constraints + output-spec.
    Skip the story/legend which contains character names (noise).
    """
    def get_div(html, class_name):
        marker = f'class="{class_name}"'
        pos = html.find(marker)
        if pos == -1:
            return ""
        start = html.rfind("<div", 0, pos)
        depth, i = 0, start
        while i < len(html):
            if html[i:i+4] == "<div": depth += 1
            elif html[i:i+6] == "</div>":
                depth -= 1
                if depth == 0:
                    raw = html[start:i+6]
                    txt = re.sub(r"<[^>]+>", " ", raw)
                    return re.sub(r"\s+", " ", txt).strip()
            i += 1
        return ""

    parts = []

    # Input specification — describes variable types 
    inp = get_div(html, "input-specification")
    if inp: parts.append(inp[:1000])

    # Constraints (time/memory limits header)
    hdr = get_div(html, "header")
    if hdr: parts.append(hdr[:300])

    # Output spec
    out = get_div(html, "output-specification")
    if out: parts.append(out[:400])

    # Note section 
    note = get_div(html, "note")
    if note: parts.append(note[:400])

    # Extract constraint patterns directly (N <= 10^5 )
    constraints = re.findall(
        r"(?:[\$]{1,3}[^\$]*[\$]{1,3}|[0-9]+\s*(?:≤|<=|\\le)\s*[a-zA-Z_]+\s*(?:≤|<=|\\le)\s*[0-9^*e+]+)",
        html
    )
    if constraints:
        parts.append("constraints: " + " ".join(constraints[:15]))

    combined = " ".join(parts)
    combined = re.sub(r"\s+", " ", combined).strip()
    return combined if len(combined) > 150 else None

def scrape(contest_id, index):
    url = f"https://codeforces.com/problemset/problem/{contest_id}/{index}"
    try:
        r = scraper.get(url, timeout=15)
        if r.status_code == 200:
            return extract_math_content(r.text)
        else:
            return None
    except Exception as e:
        return None

def main():
    problems = fetch_cf_problems()
    print(f"  Got {len(problems)} problems from API\n")

    # Build buckets
    buckets = defaultdict(list)
    seen = set()
    for p in problems:
        tags = [t.lower() for t in p.get("tags", [])]
        for cls, cf_tags in TAG_MAP.items():
            for cf_tag in cf_tags:
                if cf_tag in tags:
                    pid = f"{p.get('contestId')}{p.get('index')}"
                    if pid not in seen:
                        buckets[cls].append(p)
                        seen.add(pid)
                    break

    print("\nCandidates per class:")
    for cls in sorted(TAG_MAP.keys()):
        print(f"  {cls:20s}: {len(buckets.get(cls, []))} candidates")

    existing_ids = set()
    existing_data = []
    out_path = "data/labelled_problems.json"

    if os.path.exists(out_path):
        with open(out_path, encoding="utf-8") as f:
            existing_data = json.load(f)

        for d in existing_data:
            raw_id = d.get("id", "")
            normalised = raw_id.replace("cf_", "")
            existing_ids.add(normalised)
            existing_ids.add(raw_id) 

        print(f"\nExisting: {len(existing_data)} samples ({len(existing_ids)} unique IDs tracked)")
    else:
        print("\nNo existing data — starting fresh")

    existing_counts = defaultdict(int)
    for d in existing_data:
        existing_counts[d["label"]] += 1

    dataset = list(existing_data)

    # Scrape weakest classes first
    for cls in sorted(TAG_MAP.keys(), key=lambda c: existing_counts.get(c, 0)):
        current = existing_counts.get(cls, 0)
        need    = TARGET_PER_CLASS - current
        if need <= 0:
            print(f"\n  {cls:20s}: {current} samples — skipping")
            continue

        candidates = buckets.get(cls, [])
        new_cands = []
        for p in candidates:
            pid = f"{p.get('contestId')}{p.get('index')}"
            if pid not in existing_ids and f"cf_{pid}" not in existing_ids:
                new_cands.append(p)

        random.shuffle(new_cands)
        print(f"\n  {cls:20s}: have {current}, need {need}, {len(new_cands)} new candidates")

        collected = 0
        for p in new_cands:
            if collected >= need:
                break
            cid, idx = p.get("contestId"), p.get("index")
            if not cid or not idx:
                continue

            pid  = f"{cid}{idx}"
            text = scrape(cid, idx)

            if text:
                entry_id = f"cf_{pid}"
                dataset.append({"text": text, "label": cls, "id": entry_id})
                existing_ids.add(pid)
                existing_ids.add(entry_id)
                existing_counts[cls] += 1
                collected += 1
                print(f"    [{collected}/{need}] cf_{pid}  ({len(text)} chars)")
            else:
                print(f"    [skip] cf_{pid} (Cloudflare block or parsing failed)")

            # time to avoid bans
            time.sleep(1.5)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    print(f"\n{'='*50}")
    print(f"Total saved: {len(dataset)} samples")

if __name__ == "__main__":
    main()
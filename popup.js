
//  View router 

const views = {
    generator: document.getElementById("view-generator"),
    history:   document.getElementById("view-history"),
    snippets:  document.getElementById("view-snippets"),
};

function showView(name) {
    Object.entries(views).forEach(([k, el]) => {
        el.style.display = k === name ? "block" : "none";
    });
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.view === name);
    });
    if (name === "history")  loadHistory();
    if (name === "snippets") loadSnippets();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
});

//  Theme toggle 

const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "Dark" : "Light";
    chrome.storage.local.set({ theme });
}

themeToggle.addEventListener("click", () => {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
});

chrome.storage.local.get(["theme"], (r) => {
    applyTheme(r.theme || "dark");
});

//  Generator view 

const statusText    = document.getElementById("status");
const templateSelect = document.getElementById("template-type");
const detectedBadge = document.getElementById("detected-badge");
const constraintsBox = document.getElementById("constraints-box");

document.getElementById("generate-btn").addEventListener("click", async () => {
    statusText.className = "status";
    statusText.textContent = "Generating…";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: "scrape_problem" }, (scrapeResponse) => {
        if (chrome.runtime.lastError || !scrapeResponse) {
            statusText.className = "status error";
            statusText.textContent = "Open a problem page and refresh.";
            return;
        }

        // Show constraints if found
        if (scrapeResponse.constraints) {
            constraintsBox.textContent = scrapeResponse.constraints;
            constraintsBox.style.display = "block";
        } else {
            constraintsBox.style.display = "none";
        }

        const userType = templateSelect.value;

        chrome.runtime.sendMessage(
            { action: "generate_template", type: userType, data: scrapeResponse },
            (bgResponse) => {
                if (chrome.runtime.lastError || !bgResponse) {
                    statusText.className = "status error";
                    statusText.textContent = "Error generating template.";
                    return;
                }

                // Show auto-detected badge
                if (userType === "auto" && bgResponse.detectedType) {
                    detectedBadge.textContent = `Auto → ${bgResponse.detectedType.replace(/_/g, " ")}`;
                    detectedBadge.style.display = "inline-block";
                } else {
                    detectedBadge.style.display = "none";
                }

                navigator.clipboard.writeText(bgResponse.code).then(() => {
                    statusText.className = "status success";
                    statusText.textContent = " Copied to clipboard!";
                }).catch(() => {
                    statusText.className = "status error";
                    statusText.textContent = "Clipboard write failed.";
                });
            }
        );
    });
});

//  History 
function loadHistory() {
    chrome.runtime.sendMessage({ action: "get_history" }, ({ history }) => {
        const container = document.getElementById("history-list");
        if (!history || history.length === 0) {
            container.innerHTML = `<p class="empty-msg">No history yet. Generate a template first.</p>`;
            return;
        }
        container.innerHTML = history.map((entry, i) => {
            const date = new Date(entry.timestamp).toLocaleString();
            const label = entry.type.replace(/_/g, " ");
            return `
                <div class="history-card">
                    <div class="history-meta">
                        <span class="tag">${label}</span>
                        <span class="history-time">${date}</span>
                    </div>
                    <div class="history-title">${entry.title}</div>
                    <button class="copy-btn" data-idx="${i}">Copy</button>
                </div>`;
        }).join("");

        container.querySelectorAll(".copy-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const entry = history[+btn.dataset.idx];
                navigator.clipboard.writeText(entry.code).then(() => {
                    btn.textContent = "Copied!";
                    setTimeout(() => { btn.textContent = "Copy"; }, 1500);
                });
            });
        });
    });
}

//  Snippets

const snippetKey    = document.getElementById("snippet-key");
const snippetCode   = document.getElementById("snippet-code");
const saveSnippetBtn = document.getElementById("save-snippet-btn");
const snippetStatus = document.getElementById("snippet-status");

function loadSnippets() {
    chrome.runtime.sendMessage({ action: "get_snippets" }, ({ snippets }) => {
        const container = document.getElementById("snippets-list");
        const keys = Object.keys(snippets || {});
        if (keys.length === 0) {
            container.innerHTML = `<p class="empty-msg">No custom snippets saved yet.</p>`;
            return;
        }
        container.innerHTML = keys.map(key => `
            <div class="snippet-card">
                <div class="snippet-header">
                    <span class="tag">${key}</span>
                    <div class="snippet-actions">
                        <button class="copy-btn" data-key="${key}">Copy</button>
                        <button class="del-btn"  data-key="${key}">✕</button>
                    </div>
                </div>
                <pre class="snippet-preview">${snippets[key].slice(0, 120)}${snippets[key].length > 120 ? "…" : ""}</pre>
            </div>`
        ).join("");

        container.querySelectorAll(".copy-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                navigator.clipboard.writeText(snippets[btn.dataset.key]).then(() => {
                    btn.textContent = "Copied!";
                    setTimeout(() => { btn.textContent = "Copy"; }, 1500);
                });
            });
        });

        container.querySelectorAll(".del-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                chrome.runtime.sendMessage(
                    { action: "delete_snippet", key: btn.dataset.key },
                    () => loadSnippets()
                );
            });
        });
    });
}

saveSnippetBtn.addEventListener("click", () => {
    const key  = snippetKey.value.trim().replace(/\s+/g, "_");
    const code = snippetCode.value.trim();

    if (!key || !code) {
        snippetStatus.className = "status error";
        snippetStatus.textContent = "Name and code are both required.";
        return;
    }

    chrome.runtime.sendMessage({ action: "save_snippet", key, code }, () => {
        snippetStatus.className = "status success";
        snippetStatus.textContent = `"${key}" saved!`;
        snippetKey.value = "";
        snippetCode.value = "";
        loadSnippets();
        setTimeout(() => { snippetStatus.textContent = ""; }, 2000);
    });
});


showView("generator");

async function scrapePageData() {
    const url = window.location.href;
    let statementText = document.body.innerText;
    let officialTags = [];
    let platform = "unknown";
    let title = document.title;

    // 1. LEETCODE 
    if (url.includes("leetcode.com")) {
        platform = "leetcode";


        const urlParts = url.split('/');
        const problemIndex = urlParts.indexOf('problems');

        if (problemIndex !== -1 && urlParts.length > problemIndex + 1) {
            const slug = urlParts[problemIndex + 1].split('?')[0]; // strip query params
            title = slug.replace(/-/g, ' ');


            try {
                const response = await fetch("https://leetcode.com/graphql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        operationName: "singleQuestionTopicTags",
                        variables: { titleSlug: slug },
                        query: "query singleQuestionTopicTags($titleSlug: String!) { question(titleSlug:$titleSlug) { topicTags { slug } } }"
                    })
                });
                const data = await response.json();
                if (data?.data?.question?.topicTags) {
                    officialTags = data.data.question.topicTags.map(tag => tag.slug);
                }
            } catch (e) {
                console.warn("Failed to fetch LeetCode tags (Might be a live contest)", e);
            }
        }
    }
    //  2. CODEFORCES
    else if (url.includes("codeforces.com")) {
        platform = "codeforces";


        const tagElements = document.querySelectorAll('.tag-box');
        tagElements.forEach(el => {
            officialTags.push(el.innerText.trim().toLowerCase());
        });

        const titleEl = document.querySelector('.problem-statement .title');
        if (titleEl) title = titleEl.innerText;
    }

    return {
        platform,
        title,
        officialTags,
        statementText: statementText.substring(0, 3000) // Pass text for ML fallback
    };
}

// Wait for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape_problem") {
        scrapePageData().then(data => sendResponse(data));
        return true;
    }
});
🚀 CP Boilerplate: Smart C++ Template Generator

A Chrome Extension for Competitive Programmers that automatically detects the algorithm required for a problem and instantly copies the correct C++ boilerplate to your clipboard.

Focus on the logic, stop typing vector<int> and BFS queues from scratch.

✨ Features

Instant Templates: One-click generation for DP, Graphs, Segment Trees, Trie, and more.

Smart Detection (100% Accuracy): Silently fetches official problem tags via LeetCode's GraphQL API and Codeforces DOM scraping.

ML Fallback (Contest Ready): During live contests, platforms hide the tags. This extension uses a custom Offline Machine Learning engine (Naive Bayes) running in your browser to predict the algorithm based on the problem text.

Cross-Platform: Works on LeetCode, Codeforces, CodeChef, and AtCoder.

🛠️ Installation

Since the extension is currently in development, you can install it manually in Chrome:

Download or clone this repository to your computer.

Open Chrome and go to chrome://extensions/.

Turn on Developer mode (top right corner).

Click Load unpacked (top left).

Select the folder containing the manifest.json file.

Pin the extension to your toolbar!

💻 Usage

Open any coding problem on LeetCode or Codeforces.

Click the CP Boilerplate extension icon.

Select "Auto-detect from page".

Click "Generate & Copy".

Paste the code into your editor and start solving.

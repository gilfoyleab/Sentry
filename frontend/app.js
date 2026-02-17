const healthStatus = document.getElementById("healthStatus");
const copyPrompt = document.getElementById("copyPrompt");
const promptBox = document.getElementById("promptBox");
const runWorkflow = document.getElementById("runWorkflow");
const showRanking = document.getElementById("showRanking");
const rankTable = document.getElementById("rankTable");

async function checkHealth() {
  try {
    const res = await fetch("/health");
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();
    healthStatus.textContent = `${data.status.toUpperCase()} · v${data.version}`;
    healthStatus.className = "pill pill-ok";
  } catch {
    healthStatus.textContent = "Offline";
    healthStatus.className = "pill pill-bad";
  }
}

async function copyText() {
  try {
    await navigator.clipboard.writeText(promptBox.textContent || "");
    copyPrompt.textContent = "Copied";
    setTimeout(() => {
      copyPrompt.textContent = "Copy Prompt";
    }, 1200);
  } catch {
    copyPrompt.textContent = "Copy failed";
  }
}

function shuffleRanking() {
  const variants = [
    [
      ["finance-core", 88, "A", 10],
      ["support-mcp", 76, "B", 19],
      ["malicious-demo", 0, "F", 112],
    ],
    [
      ["crm-assistant", 81, "A", 14],
      ["billing-reports", 69, "C", 31],
      ["malicious-demo", 0, "F", 112],
    ],
  ];
  const pick = variants[Math.floor(Math.random() * variants.length)];
  rankTable.innerHTML = pick
    .map((row) => {
      return `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td></tr>`;
    })
    .join("");
}

copyPrompt.addEventListener("click", copyText);
runWorkflow.addEventListener("click", () => {
  promptBox.textContent =
    "run trustops_run with autoHarden=true, hardenMode=strict, riskThreshold=75";
});
showRanking.addEventListener("click", shuffleRanking);

checkHealth();

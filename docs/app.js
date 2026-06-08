const draftEl = document.querySelector("#draft");
const outputEl = document.querySelector("#output");
const annotatedEl = document.querySelector("#annotated");
const findingsEl = document.querySelector("#findings");
const rewriteNotesEl = document.querySelector("#rewriteNotes");
const scoreGridEl = document.querySelector("#scoreGrid");
const scoreBadgeEl = document.querySelector("#scoreBadge");
const modeBadgeEl = document.querySelector("#modeBadge");
const statsEl = document.querySelector("#stats");
const ruleLegendEl = document.querySelector("#ruleLegend");
const modeSelectEl = document.querySelector("#modeSelect");
const copyHintEl = document.querySelector("#copyHint");
const aiProbabilityEl = document.querySelector("#aiProbability");
const aiRateEl = document.querySelector("#aiRate");
const humanRateEl = document.querySelector("#humanRate");
const riskLevelEl = document.querySelector("#riskLevel");
const riskBadgeEl = document.querySelector("#riskBadge");
const probabilityRingEl = document.querySelector("#probabilityRing");
const progressFillEl = document.querySelector("#progressFill");
const progressLabelEl = document.querySelector("#progressLabel");
const ruleCountEl = document.querySelector("#ruleCount");
const highRiskCountEl = document.querySelector("#highRiskCount");
const primaryRiskEl = document.querySelector("#primaryRisk");
const sourceBreakdownEl = document.querySelector("#sourceBreakdown");
const personaGridEl = document.querySelector("#personaGrid");
const historyListEl = document.querySelector("#historyList");
const exportBtnEl = document.querySelector("#exportBtn");
const analyzeBtnEl = document.querySelector("#analyzeBtn");

const brandName = "TextTrace";
const historyKey = "texttrace-v2-history";

const samples = {
  zh: `在当今快速变化的时代，人工智能正在深刻地改变内容创作的方式。值得注意的是，这不仅仅是一次技术升级，更是一场关于表达效率的革命。本文将深入探讨为什么企业应该积极拥抱这项能力，以及它如何帮助团队实现更高质量的增长。`,
  en: `In today's fast-paced digital landscape, it is important to note that AI is not just a tool, but a transformative force. This article will explore how teams can leverage it to unlock efficiency, drive innovation, and achieve meaningful outcomes.`
};

const connectorWords = [
  "因此", "再次", "总体来看", "随着", "同时", "此外", "首先", "其次", "最后", "再者", "进而", "与此同时",
  "therefore", "moreover", "furthermore", "overall", "meanwhile", "in addition", "firstly", "secondly", "finally"
];

const abstractWords = [
  "价值", "意义", "提升", "内涵", "体系", "机制", "结构", "功能", "趋势", "精神", "表达", "路径", "策略",
  "value", "meaning", "framework", "structure", "approach", "strategy", "system", "outcomes", "capabilities"
];

const modeConfigs = {
  light: {
    badge: "轻度模式",
    probabilityBias: -6,
    sentenceBias: -1
  },
  balanced: {
    badge: "标准模式",
    probabilityBias: 0,
    sentenceBias: 0
  },
  strong: {
    badge: "强力模式",
    probabilityBias: 8,
    sentenceBias: 1
  }
};

const sourceLabels = {
  template: "模板化表达",
  repetition: "句式重复",
  abstract: "抽象词密度",
  connector: "连接词依赖",
  detail: "细节缺失"
};

const sourceOrder = ["template", "repetition", "abstract", "connector", "detail"];

function escapeHtml(value) {
  return value.replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function splitSentences(text) {
  return (text.match(/[^。！？.!?]+[。！？.!?]?/g) || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function tokenizeSentence(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fa5\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function countMatches(sentence, words) {
  const lower = sentence.toLowerCase();
  return words.reduce((count, word) => count + (lower.includes(word.toLowerCase()) ? 1 : 0), 0);
}

function getSentenceProfile(sentence, index, allSentences, mode) {
  const reasons = [];
  const sources = {
    template: 0,
    repetition: 0,
    abstract: 0,
    connector: 0,
    detail: 0
  };

  let score = 0;
  const connectorCount = countMatches(sentence, connectorWords);
  const abstractCount = countMatches(sentence, abstractWords);
  const hasDigit = /\d/.test(sentence);
  const length = sentence.length;

  if (/(在当今|值得注意的是|本文将|深入探讨|In today's|it is important to note that|This article will)/i.test(sentence)) {
    reasons.push("模板化表达");
    sources.template += 2;
    score += 3;
  }

  if (connectorCount >= 2 || /因此|再次|总体来看|随着|therefore|overall/i.test(sentence)) {
    reasons.push("连接词过多");
    sources.connector += Math.max(1, connectorCount);
    score += 2;
  }

  if (abstractCount >= 2 || /(价值|意义|提升|内涵|体系|趋势|framework|strategy|outcomes)/i.test(sentence)) {
    reasons.push("抽象词过多");
    sources.abstract += Math.max(1, abstractCount);
    score += 2;
  }

  if ((/[,，；;]/.test(sentence) && length > 42) || length > 70) {
    reasons.push("句子过长");
    score += 1;
  }

  if (!hasDigit && !/“|”|"|\'/.test(sentence) && abstractCount >= 1 && length > 28) {
    reasons.push("细节缺失");
    sources.detail += 1;
    score += 2;
  }

  const normalizedStart = tokenizeSentence(sentence).slice(0, 4).join(" ");
  const duplicated = allSentences.some((other, otherIndex) => {
    if (otherIndex === index) return false;
    return tokenizeSentence(other).slice(0, 4).join(" ") === normalizedStart && normalizedStart.length > 3;
  });

  if (duplicated) {
    reasons.push("句式重复");
    sources.repetition += 2;
    score += 2;
  }

  if (!reasons.length) {
    reasons.push("表达较自然");
  }

  score += modeConfigs[mode].sentenceBias;

  let level = "low";
  if (score >= 6) level = "high";
  else if (score >= 3) level = "mid";

  return {
    text: sentence,
    level,
    score,
    reasons,
    sources
  };
}

function getAggregateSources(sentenceProfiles) {
  const totals = {
    template: 0,
    repetition: 0,
    abstract: 0,
    connector: 0,
    detail: 0
  };

  sentenceProfiles.forEach((sentence) => {
    sourceOrder.forEach((key) => {
      totals[key] += sentence.sources[key];
    });
  });

  const totalValue = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;

  return sourceOrder.map((key) => ({
    key,
    label: sourceLabels[key],
    value: totals[key],
    ratio: Math.round((totals[key] / totalValue) * 100)
  }));
}

function computeProbabilities(sentenceProfiles, mode) {
  const base = sentenceProfiles.reduce((sum, sentence) => sum + sentence.score, 0) * 6;
  const highCount = sentenceProfiles.filter((sentence) => sentence.level === "high").length * 7;
  const midCount = sentenceProfiles.filter((sentence) => sentence.level === "mid").length * 3;
  const ai = Math.max(6, Math.min(97, Math.round(base + highCount + midCount + modeConfigs[mode].probabilityBias)));
  return {
    ai,
    human: 100 - ai
  };
}

function getRiskMeta(aiProbability) {
  if (aiProbability >= 75) {
    return { level: "高风险", className: "risk-high", color: "#ef4444" };
  }
  if (aiProbability >= 45) {
    return { level: "中风险", className: "risk-mid", color: "#f59e0b" };
  }
  return { level: "低风险", className: "risk-low", color: "#16a34a" };
}

function getWordCount(text) {
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (hasChinese) {
    return (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  }
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getSentenceCount(text) {
  return splitSentences(text).length || 1;
}

function getAverageLength(text) {
  return Math.round(text.length / getSentenceCount(text));
}

function renderLegend() {
  ruleLegendEl.innerHTML = sourceOrder.map((key) => `
    <article class="legend-card">
      <strong>${sourceLabels[key]}</strong>
      <div>${getLegendReason(key)}</div>
    </article>
  `).join("");
}

function getLegendReason(key) {
  const reasons = {
    template: "常见模板句、套话开头和自动化总结句。",
    repetition: "多个句子在结构或开头上过于相似。",
    abstract: "抽象名词、评价词或包装词密度偏高。",
    connector: "因此、总体来看、随着等连接词依赖明显。",
    detail: "缺少数字、案例、场景或具体动作。"
  };
  return reasons[key];
}

function renderSentenceList(sentenceProfiles) {
  annotatedEl.classList.remove("empty");
  annotatedEl.innerHTML = sentenceProfiles.map((sentence, index) => {
    const riskMeta = sentence.level === "high"
      ? { label: "高风险", className: "risk-high" }
      : sentence.level === "mid"
        ? { label: "中风险", className: "risk-mid" }
        : { label: "低风险", className: "risk-low" };

    return `
      <article class="sentence-card ${riskMeta.className}">
        <div class="sentence-head">
          <strong>句子 ${index + 1}</strong>
          <span class="sentence-badge ${riskMeta.className}">${riskMeta.label}</span>
        </div>
        <div class="sentence-text">${escapeHtml(sentence.text)}</div>
        <div class="reason-tags">
          ${sentence.reasons.map((reason) => `<span class="reason-tag">${reason}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderSourceBreakdown(sourceData) {
  sourceBreakdownEl.innerHTML = sourceData.map((item) => `
    <article class="source-item">
      <div class="source-item-head">
        <strong>${item.label}</strong>
        <span>${item.ratio}%</span>
      </div>
      <div class="mini-track">
        <span class="mini-fill" style="width: ${item.ratio}%"></span>
      </div>
    </article>
  `).join("");
}

function renderPersona(sourceData, aiProbability) {
  const sourceMap = Object.fromEntries(sourceData.map((item) => [item.key, item.ratio]));
  const persona = [
    { label: "模板化", value: sourceMap.template || 0 },
    { label: "重复度", value: sourceMap.repetition || 0 },
    { label: "抽象度", value: sourceMap.abstract || 0 },
    { label: "细节度", value: Math.max(0, 100 - (sourceMap.detail || 0)) },
    { label: "人味度", value: Math.max(0, 100 - aiProbability) }
  ];

  personaGridEl.innerHTML = persona.map((item) => `
    <article class="persona-item">
      <div class="persona-head">
        <strong>${item.label}</strong>
        <span>${item.value}%</span>
      </div>
      <div class="mini-track">
        <span class="mini-fill" style="width: ${item.value}%"></span>
      </div>
    </article>
  `).join("");
}

function renderScores(sentenceProfiles) {
  const aggregate = {
    Directness: 10 - Math.min(8, sentenceProfiles.filter((sentence) => sentence.reasons.includes("模板化表达")).length * 2),
    Rhythm: 10 - Math.min(8, sentenceProfiles.filter((sentence) => sentence.reasons.includes("句式重复")).length * 2),
    Trust: 10 - Math.min(8, sentenceProfiles.filter((sentence) => sentence.reasons.includes("连接词过多")).length * 2),
    Authenticity: 10 - Math.min(8, sentenceProfiles.filter((sentence) => sentence.reasons.includes("抽象词过多")).length * 2),
    Density: 10 - Math.min(8, sentenceProfiles.filter((sentence) => sentence.reasons.includes("细节缺失")).length * 2)
  };

  scoreGridEl.innerHTML = [
    ["Directness", "是否直接进入主题"],
    ["Rhythm", "句长与节奏是否单一"],
    ["Trust", "表达是否过度包装"],
    ["Authenticity", "是否像真实作者写出"],
    ["Density", "信息密度是否偏低"]
  ].map(([name, hint]) => `
    <div class="score-row">
      <div class="score-label">
        <span>${name} · ${hint}</span>
        <strong>${aggregate[name]}/10</strong>
      </div>
      <div class="bar"><span style="width: ${aggregate[name] * 10}%"></span></div>
    </div>
  `).join("");

  return aggregate;
}

function renderFindings(sentenceProfiles) {
  const risky = sentenceProfiles
    .filter((sentence) => sentence.level !== "low")
    .slice(0, 5);

  findingsEl.innerHTML = risky.length
    ? risky.map((sentence) => `<li><strong>${sentence.reasons[0]}</strong>：${escapeHtml(sentence.text.slice(0, 54))}${sentence.text.length > 54 ? "..." : ""}</li>`).join("")
    : "<li>没有明显高风险模板表达，当前文本风险较低。</li>";
}

function renderSuggestions(sentenceProfiles, sourceData) {
  const suggestions = [];
  const sourceMap = Object.fromEntries(sourceData.map((item) => [item.key, item.ratio]));
  const longSentenceCount = sentenceProfiles.filter((sentence) => sentence.reasons.includes("句子过长")).length;

  if ((sourceMap.connector || 0) >= 20) {
    suggestions.push("连接词依赖较强，建议减少“随着、因此、总体来看”等词的密度，让句子更直接。");
  }
  if ((sourceMap.abstract || 0) >= 20) {
    suggestions.push("抽象词偏多，建议加入真实案例、数字、对象或具体场景。");
  }
  if (longSentenceCount >= 2) {
    suggestions.push("长句较多，建议把一条句子拆成两到三条信息更集中的短句。");
  }
  if ((sourceMap.repetition || 0) >= 18) {
    suggestions.push("句式重复明显，建议调整段落节奏，不要连续使用同一种综述结构。");
  }
  if ((sourceMap.detail || 0) >= 18) {
    suggestions.push("细节支撑不足，建议补充时间、人物、数据、事件过程或具体引用。");
  }
  if (!suggestions.length) {
    suggestions.push("当前文本整体较自然，建议继续增强事实密度和个体表达。");
  }

  rewriteNotesEl.innerHTML = suggestions.map((item) => `<li>${item}</li>`).join("");
}

function renderSummary(text, probabilities, riskMeta, sourceData, sentenceProfiles) {
  const primary = sourceData[0]?.label || "待检测";
  const highCount = sentenceProfiles.filter((sentence) => sentence.level === "high").length;
  const summary = [
    `${brandName} 判断这段文本的 AI 生成概率为 ${probabilities.ai}%，当前属于${riskMeta.level}。`,
    `主要风险来源集中在 ${primary}，同时命中 ${sentenceProfiles.length} 句中的 ${highCount} 句高风险表达。`,
    `如果要降低风险，优先处理高风险句子中的模板化表达、抽象词和连接词依赖。`
  ].join("\n\n");

  outputEl.textContent = summary;
  outputEl.classList.remove("empty");
  return summary;
}

function saveHistory(text, probabilities, riskMeta) {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  history.unshift({
    time: new Date().toLocaleString("zh-CN"),
    ai: probabilities.ai,
    level: riskMeta.level,
    preview: `${text.slice(0, 48)}${text.length > 48 ? "..." : ""}`
  });
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 5)));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  if (!history.length) {
    historyListEl.innerHTML = '<div class="history-empty">还没有检测记录。</div>';
    return;
  }

  historyListEl.innerHTML = history.map((item) => `
    <article class="history-item">
      <div class="history-meta">
        <strong>${item.ai}% AI</strong>
        <span>${item.level}</span>
      </div>
      <p>${escapeHtml(item.preview)}</p>
      <span>${item.time}</span>
    </article>
  `).join("");
}

function getTextStats(text) {
  return {
    chars: text.length,
    words: getWordCount(text),
    sentences: getSentenceCount(text),
    averageLength: getAverageLength(text)
  };
}

function updateTopMetrics(stats, probabilities, riskMeta, sourceData, sentenceProfiles) {
  aiProbabilityEl.textContent = `${probabilities.ai}%`;
  aiRateEl.textContent = `${probabilities.ai}%`;
  humanRateEl.textContent = `${probabilities.human}%`;
  riskLevelEl.textContent = riskMeta.level;
  progressLabelEl.textContent = `${probabilities.ai}%`;
  ruleCountEl.textContent = `${sentenceProfiles.reduce((sum, sentence) => sum + sentence.reasons.filter((reason) => reason !== "表达较自然").length, 0)}`;
  highRiskCountEl.textContent = `${sentenceProfiles.filter((sentence) => sentence.level === "high").length}`;
  primaryRiskEl.textContent = sourceData[0]?.label || "待检测";
  statsEl.textContent = `${stats.chars} 字符 · ${stats.sentences} 句 · ${stats.averageLength} 平均句长`;
  scoreBadgeEl.textContent = `${Math.max(100 - probabilities.ai, 3)}/100`;
  riskBadgeEl.className = `risk-badge ${riskMeta.className}`;
  riskBadgeEl.textContent = riskMeta.level;
  probabilityRingEl.style.setProperty("--progress", `${Math.round(probabilities.ai * 3.6)}deg`);
  probabilityRingEl.style.setProperty("--ring-color", riskMeta.color);
  progressFillEl.style.width = `${probabilities.ai}%`;
  progressFillEl.style.background = riskMeta.color;
}

function getExportText(report) {
  return [
    `${brandName} 检测报告`,
    `检测时间：${new Date().toLocaleString("zh-CN")}`,
    `AI生成概率：${report.probabilities.ai}%`,
    `人类写作概率：${report.probabilities.human}%`,
    `风险等级：${report.riskMeta.level}`,
    `文本统计：字数 ${report.stats.words} / 句子数 ${report.stats.sentences} / 平均句长 ${report.stats.averageLength}`,
    `风险来源：${report.sourceData.map((item) => `${item.label} ${item.ratio}%`).join("，")}`,
    "",
    "句子级高亮结果：",
    ...report.sentenceProfiles.map((sentence, index) => `句子 ${index + 1} [${sentence.level}] ${sentence.text} ｜ 原因：${sentence.reasons.join("、")}`),
    "",
    "优化建议：",
    ...report.suggestions,
    "",
    "检测摘要：",
    report.summary
  ].join("\n");
}

let latestReport = null;

function run() {
  const text = draftEl.value.trim();
  const mode = modeSelectEl.value;
  modeBadgeEl.textContent = modeConfigs[mode].badge;

  if (!text) {
    outputEl.textContent = "先输入一段待检测文本。";
    outputEl.classList.add("empty");
    annotatedEl.textContent = "这里会展示句子级风险分析。";
    annotatedEl.classList.add("empty");
    findingsEl.innerHTML = "<li>输入文字后会列出具体问题。</li>";
    rewriteNotesEl.innerHTML = "<li>检测后会说明这次主要发现了哪些文本特征。</li>";
    scoreBadgeEl.textContent = "等待输入";
    statsEl.textContent = "0 字符 · 0 句 · 0 平均句长";
    aiProbabilityEl.textContent = "0%";
    aiRateEl.textContent = "0%";
    humanRateEl.textContent = "100%";
    riskLevelEl.textContent = "待检测";
    progressLabelEl.textContent = "0%";
    ruleCountEl.textContent = "0";
    highRiskCountEl.textContent = "0";
    primaryRiskEl.textContent = "待检测";
    riskBadgeEl.className = "risk-badge risk-neutral";
    riskBadgeEl.textContent = "等待检测";
    probabilityRingEl.style.setProperty("--progress", "0deg");
    progressFillEl.style.width = "0%";
    progressFillEl.style.background = "#9ca3af";
    sourceBreakdownEl.innerHTML = "";
    personaGridEl.innerHTML = "";
    renderHistory();
    return;
  }

  const sentenceTexts = splitSentences(text);
  const sentenceProfiles = sentenceTexts.map((sentence, index) => getSentenceProfile(sentence, index, sentenceTexts, mode));
  const probabilities = computeProbabilities(sentenceProfiles, mode);
  const riskMeta = getRiskMeta(probabilities.ai);
  const sourceData = getAggregateSources(sentenceProfiles).sort((a, b) => b.ratio - a.ratio);
  const stats = getTextStats(text);
  const aggregateScores = renderScores(sentenceProfiles);

  renderSentenceList(sentenceProfiles);
  renderSourceBreakdown(sourceData);
  renderPersona(sourceData, probabilities.ai);
  renderFindings(sentenceProfiles);
  renderSuggestions(sentenceProfiles, sourceData);
  const summary = renderSummary(text, probabilities, riskMeta, sourceData, sentenceProfiles);
  updateTopMetrics(stats, probabilities, riskMeta, sourceData, sentenceProfiles);
  saveHistory(text, probabilities, riskMeta);
  renderHistory();

  latestReport = {
    text,
    sentenceProfiles,
    probabilities,
    riskMeta,
    sourceData,
    stats,
    summary,
    aggregateScores,
    suggestions: Array.from(rewriteNotesEl.querySelectorAll("li")).map((item) => item.textContent)
  };
}

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    draftEl.value = samples[button.dataset.sample];
    run();
  });
});

analyzeBtnEl.addEventListener("click", run);
document.querySelector("#clearBtn").addEventListener("click", () => {
  draftEl.value = "";
  latestReport = null;
  run();
});

document.querySelector("#copyBtn").addEventListener("click", async () => {
  const text = outputEl.textContent.trim();
  if (!text || text === "结果会显示在这里。" || text === "先输入一段待检测文本。") {
    copyHintEl.textContent = "先生成结果，再复制。";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyHintEl.textContent = "已复制到剪贴板。";
  } catch {
    copyHintEl.textContent = "复制失败，请手动选择文本。";
  }
});

exportBtnEl.addEventListener("click", () => {
  if (!latestReport) {
    copyHintEl.textContent = "先完成一次检测，再导出报告。";
    return;
  }

  const blob = new Blob([getExportText(latestReport)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `texttrace-report-${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  copyHintEl.textContent = "TXT 报告已导出。";
});

modeSelectEl.addEventListener("change", run);

renderLegend();
renderHistory();
draftEl.value = samples.zh;
run();

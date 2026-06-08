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
const printReportEl = document.querySelector("#printReport");
const optimizedTextEl = document.querySelector("#optimizedText");
const optimizationNotesEl = document.querySelector("#optimizationNotes");
const comparisonListEl = document.querySelector("#comparisonList");
const feedbackFabEl = document.querySelector("#feedbackFab");
const feedbackOverlayEl = document.querySelector("#feedbackOverlay");
const feedbackPanelEl = document.querySelector("#feedbackPanel");
const feedbackCloseEl = document.querySelector("#feedbackClose");
const feedbackQrEl = document.querySelector("#feedbackQr");
const feedbackQrFallbackEl = document.querySelector("#feedbackQrFallback");
const exportBtnEl = document.querySelector("#exportBtn");
const exportPdfBtnEl = document.querySelector("#exportPdfBtn");
const optimizeBtnEl = document.querySelector("#optimizeBtn");
const copyOptimizedBtnEl = document.querySelector("#copyOptimizedBtn");
const recheckOptimizedBtnEl = document.querySelector("#recheckOptimizedBtn");
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
  light: { badge: "轻度模式", probabilityBias: -6, sentenceBias: -1 },
  balanced: { badge: "标准模式", probabilityBias: 0, sentenceBias: 0 },
  strong: { badge: "强力模式", probabilityBias: 8, sentenceBias: 1 }
};

const sourceLabels = {
  template: "模板化表达",
  repetition: "句式重复",
  abstract: "抽象词密度",
  connector: "连接词依赖",
  detail: "细节缺失"
};

const sourceOrder = ["template", "repetition", "abstract", "connector", "detail"];

const zhPhraseReplacements = [
  { pattern: /^在当今[^，。！？]*[，,]?/, replacement: "", note: "删除模板化开场", reason: "模板化表达" },
  { pattern: /值得注意的是[，,]?/g, replacement: "", note: "删除提示式套话", reason: "模板化表达" },
  { pattern: /本文将深入探讨/g, replacement: "下面具体看", note: "弱化文章模板口吻", reason: "模板化表达" },
  { pattern: /总体来看[，,]?/g, replacement: "", note: "减少总结式连接词", reason: "连接词过多" },
  { pattern: /因此[，,]?/g, replacement: "所以", note: "减少生硬连接词", reason: "连接词过多" },
  { pattern: /再次[，,]?/g, replacement: "另外，", note: "调整重复连接词", reason: "连接词过多" },
  { pattern: /随着/g, replacement: "在", note: "简化高频连接词", reason: "连接词过多" },
  { pattern: /正在深刻地改变/g, replacement: "已经改变", note: "替换空泛强调词", reason: "抽象词过多" },
  { pattern: /实现更高质量的增长/g, replacement: "把内容写得更清楚", note: "替换抽象结果表述", reason: "抽象词过多" },
  { pattern: /表达效率的革命/g, replacement: "更直接的表达方式", note: "降低夸张表述", reason: "抽象词过多" },
  { pattern: /积极拥抱这项能力/g, replacement: "先把这套方法用起来", note: "改成更自然的行动表达", reason: "模板化表达" }
];

const enPhraseReplacements = [
  { pattern: /^In today's[^,.!?]*[, ]*/i, replacement: "", note: "Remove template-style opening", reason: "模板化表达" },
  { pattern: /it is important to note that\s*/gi, replacement: "", note: "Remove announcement phrase", reason: "模板化表达" },
  { pattern: /This article will explore/gi, replacement: "Let's look at", note: "Reduce article-template framing", reason: "模板化表达" },
  { pattern: /therefore[, ]*/gi, replacement: "so ", note: "Reduce formal connector", reason: "连接词过多" },
  { pattern: /moreover[, ]*/gi, replacement: "also ", note: "Soften repetitive connector", reason: "连接词过多" },
  { pattern: /transformative force/gi, replacement: "useful tool in practice", note: "Replace abstract hype phrase", reason: "抽象词过多" },
  { pattern: /meaningful outcomes/gi, replacement: "clearer drafts", note: "Make result description more concrete", reason: "抽象词过多" },
  { pattern: /unlock efficiency/gi, replacement: "save editing time", note: "Use more direct wording", reason: "抽象词过多" }
];

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

function normalizeSpacing(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/([。！？])\s+/g, "$1")
    .replace(/([.!?])\s+/g, "$1 ")
    .trim();
}

function trimLeadingConnectors(text) {
  return text
    .replace(/^(因此|再次|总体来看|另外|此外|同时)[，,\s]*/g, "")
    .replace(/^(therefore|moreover|overall|meanwhile|in addition)\s+/gi, "");
}

function splitLongSentence(sentence, isChinese) {
  const parts = sentence
    .split(isChinese ? /[，；]/ : /[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return sentence;
  }

  if (isChinese) {
    return `${parts[0]}。${parts.slice(1).join("，")}${/[。！？]$/.test(sentence) ? "" : "。"}`
      .replace(/。。+/g, "。");
  }

  const first = parts[0].replace(/[.!?]+$/, "");
  const rest = parts.slice(1).join(", ");
  return `${first}. ${rest}${/[.!?]$/.test(sentence) ? "" : "."}`.replace(/\.\./g, ".");
}

function smoothSentenceStart(sentence, index, isChinese) {
  if (index === 0) {
    return sentence;
  }

  if (isChinese) {
    return sentence
      .replace(/^下面具体看/g, "再看")
      .replace(/^另外，另外，/g, "另外，");
  }

  return sentence
    .replace(/^Let's look at/gi, "Next, look at")
    .replace(/^Also also/gi, "Also");
}

function optimizeSentenceText(sentenceProfile, index, isChinese) {
  let text = sentenceProfile.text;
  const replacements = isChinese ? zhPhraseReplacements : enPhraseReplacements;
  const notes = [];

  replacements.forEach((item) => {
    const next = text.replace(item.pattern, item.replacement);
    if (next !== text) {
      text = next;
      notes.push(item.note);
    }
  });

  if (sentenceProfile.reasons.includes("连接词过多")) {
    const next = trimLeadingConnectors(text);
    if (next !== text) {
      text = next;
      notes.push("减少高频连接词");
    }
  }

  if (sentenceProfile.reasons.includes("抽象词过多")) {
    if (isChinese && !/\d/.test(text) && !/例如|比如|具体/.test(text)) {
      text = text.replace(/这项能力/g, "这项能力，尤其是在具体写作场景里");
      notes.push("补充更自然的落地语气");
    }

    if (!isChinese && !/\d/.test(text) && !/for example|in practice/i.test(text)) {
      text = text.replace(/teams/gi, "teams in real editing work");
      notes.push("Make abstract wording more grounded");
    }
  }

  if (sentenceProfile.reasons.includes("句子过长")) {
    const next = splitLongSentence(text, isChinese);
    if (next !== text) {
      text = next;
      notes.push("拆分过长句");
    }
  }

  text = normalizeSpacing(text);
  text = smoothSentenceStart(text, index, isChinese);

  if (isChinese) {
    text = text.replace(/^，+/, "").replace(/，。/g, "。");
    if (text && !/[。！？]$/.test(text)) {
      text += "。";
    }
  } else if (text && !/[.!?]$/.test(text)) {
    text += ".";
  }

  return {
    text: text || sentenceProfile.text,
    notes
  };
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

  if ((/[，,；;]/.test(sentence) && length > 42) || length > 70) {
    reasons.push("句子过长");
    score += 1;
  }

  if (!hasDigit && !/“|”|"|'/.test(sentence) && abstractCount >= 1 && length > 28) {
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

  return { text: sentence, level, score, reasons, sources };
}

function getAggregateSources(sentenceProfiles) {
  const totals = { template: 0, repetition: 0, abstract: 0, connector: 0, detail: 0 };
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
  return { ai, human: 100 - ai };
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

function getLegendReason(key) {
  return {
    template: "常见模板句、套话开头和自动化总结句。",
    repetition: "多个句子在结构或开头上过于相似。",
    abstract: "抽象名词、评价词或包装词密度偏高。",
    connector: "因此、总体来看、随着等连接词依赖明显。",
    detail: "缺少数字、案例、场景或具体动作。"
  }[key];
}

function renderLegend() {
  ruleLegendEl.innerHTML = sourceOrder.map((key) => `
    <article class="legend-card">
      <strong>${sourceLabels[key]}</strong>
      <div>${getLegendReason(key)}</div>
    </article>
  `).join("");
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

  return {
    template: sourceMap.template || 0,
    repetition: sourceMap.repetition || 0,
    abstract: sourceMap.abstract || 0,
    detail: Math.max(0, 100 - (sourceMap.detail || 0)),
    humanity: Math.max(0, 100 - aiProbability)
  };
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
  const risky = sentenceProfiles.filter((sentence) => sentence.level !== "low").slice(0, 5);
  findingsEl.innerHTML = risky.length
    ? risky.map((sentence) => `<li><strong>${sentence.reasons[0]}</strong>：${escapeHtml(sentence.text.slice(0, 54))}${sentence.text.length > 54 ? "..." : ""}</li>`).join("")
    : "<li>没有明显高风险模板表达，当前文本风险较低。</li>";
}

function renderSuggestions(sentenceProfiles, sourceData) {
  const suggestions = [];
  const sourceMap = Object.fromEntries(sourceData.map((item) => [item.key, item.ratio]));
  const longSentenceCount = sentenceProfiles.filter((sentence) => sentence.reasons.includes("句子过长")).length;

  if ((sourceMap.connector || 0) >= 20) suggestions.push("连接词依赖较强，建议减少“随着、因此、总体来看”等词的密度，让句子更直接。");
  if ((sourceMap.abstract || 0) >= 20) suggestions.push("抽象词偏多，建议加入真实案例、数字、对象或具体场景。");
  if (longSentenceCount >= 2) suggestions.push("长句较多，建议把一条句子拆成两到三条信息更集中的短句。");
  if ((sourceMap.repetition || 0) >= 18) suggestions.push("句式重复明显，建议调整段落节奏，不要连续使用同一种综述结构。");
  if ((sourceMap.detail || 0) >= 18) suggestions.push("细节支撑不足，建议补充时间、人物、数据、事件过程或具体引用。");
  if (!suggestions.length) suggestions.push("当前文本整体较自然，建议继续增强事实密度和个体表达。");

  rewriteNotesEl.innerHTML = suggestions.map((item) => `<li>${item}</li>`).join("");
  return suggestions;
}

function renderSummary(probabilities, riskMeta, sourceData, sentenceProfiles) {
  const primary = sourceData[0]?.label || "待检测";
  const highCount = sentenceProfiles.filter((sentence) => sentence.level === "high").length;
  const summary = [
    `${brandName} 判断这段文本的 AI 生成概率为 ${probabilities.ai}%，当前属于${riskMeta.level}。`,
    `主要风险来源集中在 ${primary}，同时命中 ${sentenceProfiles.length} 句中的 ${highCount} 句高风险表达。`,
    "如果要降低写作痕迹，优先处理高风险句子中的模板化表达、抽象词和连接词依赖。"
  ].join("\n\n");

  outputEl.textContent = summary;
  outputEl.classList.remove("empty");
  return summary;
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

function getTextStats(text) {
  return {
    chars: text.length,
    words: getWordCount(text),
    sentences: getSentenceCount(text),
    averageLength: getAverageLength(text)
  };
}

function buildOptimization(report) {
  const isChinese = /[\u4e00-\u9fa5]/.test(report.text);
  const notes = new Set();
  const comparisons = [];

  const optimizedSentences = report.sentenceProfiles.map((sentenceProfile, index) => {
    const optimized = optimizeSentenceText(sentenceProfile, index, isChinese);
    optimized.notes.forEach((note) => notes.add(note));

    if (optimized.text !== sentenceProfile.text) {
      const reason = sentenceProfile.reasons.filter((item) => item !== "表达较自然").join("、") || "表达自然度优化";
      comparisons.push({
        original: sentenceProfile.text,
        optimized: optimized.text,
        reason
      });
    }

    if (sentenceProfile.reasons.includes("句式重复")) notes.add("调整句式节奏，减少重复开头");
    if (sentenceProfile.reasons.includes("细节缺失")) notes.add("补足更贴近真实写作的表达重心");

    return optimized.text;
  });

  const optimizedText = normalizeSpacing(optimizedSentences.join(isChinese ? "" : " "));
  if (!notes.size) {
    notes.add("整体结构较稳，仅做轻量表达自然度优化");
  }

  return {
    text: optimizedText || report.text,
    notes: Array.from(notes),
    comparisons: comparisons.length
      ? comparisons
      : [{
          original: report.text,
          optimized: optimizedText || report.text,
          reason: "当前文本风险较低，仅保留轻量优化结果"
        }]
  };
}

function ensureOptimization(report) {
  if (!report.optimization) {
    report.optimization = buildOptimization(report);
  }
  return report.optimization;
}

function renderOptimization(report) {
  const optimization = ensureOptimization(report);
  optimizedTextEl.textContent = optimization.text;
  optimizedTextEl.classList.remove("empty");

  optimizationNotesEl.innerHTML = optimization.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  comparisonListEl.innerHTML = optimization.comparisons.map((item, index) => `
    <article class="comparison-card">
      <div class="comparison-meta">
        <strong>修改 ${index + 1}</strong>
        <span>${escapeHtml(item.reason)}</span>
      </div>
      <div class="comparison-grid">
        <div class="comparison-column">
          <span>原文风险句</span>
          <p>${escapeHtml(item.original)}</p>
        </div>
        <div class="comparison-column">
          <span>优化后表达</span>
          <p>${escapeHtml(item.optimized)}</p>
        </div>
      </div>
      <p class="comparison-reason">修改原因：${escapeHtml(item.reason)}</p>
    </article>
  `).join("");
}

function resetOptimizationViews() {
  optimizedTextEl.textContent = "完成检测后，点击“优化文本”生成优化版本。";
  optimizedTextEl.classList.add("empty");
  optimizationNotesEl.innerHTML = "<li>生成优化文本后，这里会列出本次做过的调整。</li>";
  comparisonListEl.innerHTML = '<div class="history-empty">这里会展示原句、优化后表达和修改原因。</div>';
}

function getExportText(report) {
  const optimization = ensureOptimization(report);
  return [
    `${brandName} 检测报告`,
    `检测时间：${report.generatedAt}`,
    `AI生成概率：${report.probabilities.ai}%`,
    `人类写作概率：${report.probabilities.human}%`,
    `风险等级：${report.riskMeta.level}`,
    `文本统计：字数 ${report.stats.words} / 句子数 ${report.stats.sentences} / 平均句长 ${report.stats.averageLength}`,
    `风险来源：${report.sourceData.map((item) => `${item.label} ${item.ratio}%`).join("，")}`,
    "",
    "句子级高亮结果：",
    ...report.sentenceProfiles.map((sentence, index) => `句子 ${index + 1} [${sentence.level}] ${sentence.text} ｜ 原因：${sentence.reasons.join("、")}`),
    "",
    "文本优化：",
    optimization.text,
    "",
    "修改说明：",
    ...optimization.notes.map((item) => `- ${item}`),
    "",
    "优化前后对比：",
    ...optimization.comparisons.map((item, index) => `修改 ${index + 1}\n原文：${item.original}\n优化后：${item.optimized}\n原因：${item.reason}`),
    "",
    "优化建议：",
    ...report.suggestions,
    "",
    "检测摘要：",
    report.summary,
    "",
    "免责声明：本报告基于前端规则与启发式分析生成，仅用于辅助判断文本中的 AI 写作痕迹，不构成最终学术、法律或平台审核结论。"
  ].join("\n");
}

function buildPdfReportHtml(report) {
  const optimization = ensureOptimization(report);
  const sourceRows = report.sourceData.map((item) => `
    <tr>
      <td>${item.label}</td>
      <td>${item.ratio}%</td>
    </tr>
  `).join("");

  const personaRows = [
    { label: "模板化", value: report.persona.template },
    { label: "重复度", value: report.persona.repetition },
    { label: "抽象度", value: report.persona.abstract },
    { label: "细节度", value: report.persona.detail },
    { label: "人味度", value: report.persona.humanity }
  ].map((item) => `
    <div class="print-persona-row">
      <div class="print-persona-meta">
        <span>${item.label}</span>
        <strong>${item.value}%</strong>
      </div>
      <div class="print-persona-track"><span style="width:${item.value}%"></span></div>
    </div>
  `).join("");

  const sentenceRows = report.sentenceProfiles.map((sentence, index) => `
    <div class="print-sentence-item ${sentence.level}">
      <div class="print-sentence-top">
        <strong>句子 ${index + 1}</strong>
        <span>${sentence.level === "high" ? "高风险" : sentence.level === "mid" ? "中风险" : "低风险"}</span>
      </div>
      <p>${escapeHtml(sentence.text)}</p>
      <div class="print-reason">原因：${sentence.reasons.join("、")}</div>
    </div>
  `).join("");

  const suggestionRows = report.suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const optimizationNoteRows = optimization.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const comparisonRows = optimization.comparisons.map((item, index) => `
    <div class="print-sentence-item low">
      <div class="print-sentence-top">
        <strong>修改 ${index + 1}</strong>
        <span>${escapeHtml(item.reason)}</span>
      </div>
      <p><strong>原文：</strong>${escapeHtml(item.original)}</p>
      <p><strong>优化后：</strong>${escapeHtml(item.optimized)}</p>
    </div>
  `).join("");

  return `
    <main class="print-report">
      <section class="print-cover">
        <p class="print-report-title">AI Text Trace Report</p>
        <div class="print-logo-row">
          <div class="print-logo-mark">TT</div>
          <div class="print-brand">
            <h1>TextTrace</h1>
            <p>AI Text Trace Report</p>
          </div>
        </div>
        <div class="print-meta">检测时间：${report.generatedAt}</div>
      </section>

      <section class="print-grid print-metrics">
        <article class="print-card"><span>AI生成概率</span><strong>${report.probabilities.ai}%</strong></article>
        <article class="print-card"><span>人类写作概率</span><strong>${report.probabilities.human}%</strong></article>
        <article class="print-card"><span>风险等级</span><strong>${report.riskMeta.level}</strong></article>
        <article class="print-card"><span>高风险句子</span><strong>${report.highRiskCount}</strong></article>
      </section>

      <section class="print-section">
        <h2>文本统计</h2>
        <table class="print-table">
          <tr><td>字数</td><td>${report.stats.words}</td></tr>
          <tr><td>句子数</td><td>${report.stats.sentences}</td></tr>
          <tr><td>平均句长</td><td>${report.stats.averageLength}</td></tr>
          <tr><td>命中规则数</td><td>${report.ruleHitCount}</td></tr>
          <tr><td>主要风险来源</td><td>${report.primaryRisk}</td></tr>
        </table>
      </section>

      <section class="print-two-col">
        <section class="print-section">
          <h2>风险来源分析</h2>
          <table class="print-table">${sourceRows}</table>
        </section>
        <section class="print-section">
          <h2>AI写作画像</h2>
          ${personaRows}
        </section>
      </section>

      <section class="print-section">
        <h2>逐句分析</h2>
        ${sentenceRows}
      </section>

      <section class="print-section">
        <h2>文本优化</h2>
        <div class="print-summary">${escapeHtml(optimization.text)}</div>
      </section>

      <section class="print-section">
        <h2>修改说明</h2>
        <ul class="print-list">${optimizationNoteRows}</ul>
      </section>

      <section class="print-section">
        <h2>优化前后对比</h2>
        ${comparisonRows}
      </section>

      <section class="print-section">
        <h2>优化建议</h2>
        <ul class="print-list">${suggestionRows}</ul>
      </section>

      <section class="print-section">
        <h2>免责声明</h2>
        <div class="print-disclaimer">免责声明：本报告基于前端规则与启发式分析生成，仅用于辅助判断文本中的 AI 写作痕迹，不构成最终学术、法律或平台审核结论。</div>
      </section>
    </main>`;
}

function exportPdfReport(report) {
  if (!printReportEl) {
    copyHintEl.textContent = "打印区域初始化失败，请刷新页面后重试。";
    return false;
  }

  try {
    printReportEl.innerHTML = buildPdfReportHtml(report);
    printReportEl.setAttribute("aria-hidden", "false");
  } catch {
    copyHintEl.textContent = "PDF 报告写入失败，请刷新页面后重试。";
    return false;
  }

  const cleanupPrintMode = () => {
    document.body.classList.remove("printing");
    printReportEl.setAttribute("aria-hidden", "true");
    window.removeEventListener("afterprint", cleanupPrintMode);
  };

  window.addEventListener("afterprint", cleanupPrintMode, { once: true });
  document.body.classList.add("printing");

  setTimeout(() => {
    try {
      window.print();
    } catch {
      cleanupPrintMode();
      copyHintEl.textContent = "浏览器未能打开打印面板，请检查打印权限后重试。";
    }
  }, 120);

  return true;
}

let latestReport = null;

function openFeedbackPanel() {
  if (!feedbackPanelEl || !feedbackOverlayEl) return;
  feedbackOverlayEl.hidden = false;
  feedbackPanelEl.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    feedbackOverlayEl.classList.add("is-open");
    feedbackPanelEl.classList.add("is-open");
  });
}

function closeFeedbackPanel() {
  if (!feedbackPanelEl || !feedbackOverlayEl) return;
  feedbackOverlayEl.classList.remove("is-open");
  feedbackPanelEl.classList.remove("is-open");
  feedbackPanelEl.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    if (!feedbackOverlayEl.classList.contains("is-open")) {
      feedbackOverlayEl.hidden = true;
    }
  }, 180);
}

function initFeedbackQr() {
  if (!feedbackQrEl || !feedbackQrFallbackEl) return;

  feedbackQrEl.addEventListener("error", () => {
    feedbackQrEl.hidden = true;
    feedbackQrFallbackEl.hidden = false;
  });

  feedbackQrEl.addEventListener("load", () => {
    feedbackQrEl.hidden = false;
    feedbackQrFallbackEl.hidden = true;
  });
}

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
    latestReport = null;
    resetOptimizationViews();
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
  const generatedAt = new Date().toLocaleString("zh-CN");

  renderSentenceList(sentenceProfiles);
  renderSourceBreakdown(sourceData);
  const persona = renderPersona(sourceData, probabilities.ai);
  renderFindings(sentenceProfiles);
  const suggestions = renderSuggestions(sentenceProfiles, sourceData);
  const summary = renderSummary(probabilities, riskMeta, sourceData, sentenceProfiles);
  updateTopMetrics(stats, probabilities, riskMeta, sourceData, sentenceProfiles);
  saveHistory(text, probabilities, riskMeta);
  renderHistory();
  resetOptimizationViews();

  latestReport = {
    text,
    generatedAt,
    sentenceProfiles,
    probabilities,
    riskMeta,
    sourceData,
    stats,
    summary,
    aggregateScores,
    highRiskCount: sentenceProfiles.filter((sentence) => sentence.level === "high").length,
    ruleHitCount: sentenceProfiles.reduce((sum, sentence) => sum + sentence.reasons.filter((reason) => reason !== "表达较自然").length, 0),
    primaryRisk: sourceData[0]?.label || "待检测",
    persona,
    suggestions
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

optimizeBtnEl.addEventListener("click", () => {
  if (!latestReport) {
    run();
  }

  if (!latestReport) {
    copyHintEl.textContent = "先输入文本并完成检测。";
    return;
  }

  renderOptimization(latestReport);
  copyHintEl.textContent = "文本优化已生成，可以继续复制、对比或重新检测。";
});

copyOptimizedBtnEl.addEventListener("click", async () => {
  if (!latestReport) {
    copyHintEl.textContent = "先完成检测并生成优化文本。";
    return;
  }

  const optimization = ensureOptimization(latestReport);
  try {
    await navigator.clipboard.writeText(optimization.text);
    copyHintEl.textContent = "优化后文本已复制到剪贴板。";
  } catch {
    copyHintEl.textContent = "复制优化文本失败，请手动复制。";
  }
});

recheckOptimizedBtnEl.addEventListener("click", () => {
  if (!latestReport) {
    copyHintEl.textContent = "先完成检测并生成优化文本。";
    return;
  }

  const optimization = ensureOptimization(latestReport);
  draftEl.value = optimization.text;
  run();
  copyHintEl.textContent = "已经把优化后文本放回输入框，并重新完成检测。";
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

exportPdfBtnEl.addEventListener("click", () => {
  if (!latestReport) {
    copyHintEl.textContent = "先完成一次检测，再导出 PDF。";
    return;
  }

  const started = exportPdfReport(latestReport);
  if (started) {
    copyHintEl.textContent = "PDF 报告已生成，浏览器会使用当前页面打印。";
  }
});

feedbackFabEl?.addEventListener("click", openFeedbackPanel);
feedbackCloseEl?.addEventListener("click", closeFeedbackPanel);
feedbackOverlayEl?.addEventListener("click", closeFeedbackPanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && feedbackPanelEl?.classList.contains("is-open")) {
    closeFeedbackPanel();
  }
});

modeSelectEl.addEventListener("change", run);

renderLegend();
renderHistory();
resetOptimizationViews();
initFeedbackQr();
draftEl.value = samples.zh;
run();

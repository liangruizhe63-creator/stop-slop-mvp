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
const wordCountEl = document.querySelector("#wordCount");
const sentenceCountEl = document.querySelector("#sentenceCount");
const averageLengthEl = document.querySelector("#averageLength");
const ruleCountEl = document.querySelector("#ruleCount");
const historyListEl = document.querySelector("#historyList");

const brandName = "TextTrace";
const historyKey = "texttrace-history";

const samples = {
  zh: `在当今快速变化的时代，人工智能正在深刻地改变内容创作的方式。值得注意的是，这不仅仅是一次技术升级，更是一场关于表达效率的革命。本文将深入探讨为什么企业应该积极拥抱这项能力，以及它如何帮助团队实现更高质量的增长。`,
  en: `In today's fast-paced digital landscape, it is important to note that AI is not just a tool, but a transformative force. This article will explore how teams can leverage it to unlock efficiency, drive innovation, and achieve meaningful outcomes.`
};

const rules = [
  {
    label: "中文开场套话",
    pattern: /(在当今|快速变化|时代|值得注意的是|本文将|深入探讨|积极拥抱)/g,
    reason: "文章开头过于像模板，容易拉高 AI 风险判断。",
    weight: 2
  },
  {
    label: "英文开场套话",
    pattern: /(in today's|fast-paced|digital landscape|it is important to note that|this article will|explore how|unlock|drive innovation|meaningful outcomes)/gi,
    reason: "常见于自动生成内容的引导句和总结句。",
    weight: 2
  },
  {
    label: "二元对照句式",
    pattern: /(不仅仅是|不只是|not just|not only|but also|更是|but a)/gi,
    reason: "先否定再揭示结论的句式过多，会显得程式化。",
    weight: 2
  },
  {
    label: "空泛强词",
    pattern: /(深刻地|显著地|全面地|极大地|transformative|revolutionary|seamlessly|significantly)/gi,
    reason: "强调词多但信息密度不够，容易显得空。",
    weight: 1
  },
  {
    label: "商业抽象词",
    pattern: /(赋能|增长|效率|升级|革命|能力|leverage|efficiency|innovation|outcomes|capabilities)/gi,
    reason: "抽象词密度高时，文本更像包装过的生成内容。",
    weight: 1
  },
  {
    label: "被动或远景旁白",
    pattern: /(正在被|被.+?改变|is being|are being|has been|have been)/gi,
    reason: "旁白式叙述偏多，常见于自动扩写文本。",
    weight: 2
  }
];

const dimensions = [
  ["Directness", "是否直接进入主题"],
  ["Rhythm", "句长与节奏是否单一"],
  ["Trust", "表达是否过度包装"],
  ["Authenticity", "是否像真实作者写出"],
  ["Density", "信息密度是否偏低"]
];

const modeConfigs = {
  light: {
    badge: "轻度模式",
    notes: [
      "只标出最明显的模板表达，适合快速初筛。",
      `${brandName} 会保留文本原意，重点提示高风险表达。`
    ],
    zh: [
      [/在当今快速变化的时代，?/g, ""],
      [/值得注意的是，?/g, ""],
      [/本文将深入探讨/g, "下面直接看"],
      [/人工智能/g, "AI"],
      [/实现更高质量的增长/g, "写出更清楚的内容"]
    ],
    en: [
      [/In today's fast-paced digital landscape,?\s*/gi, ""],
      [/it is important to note that\s*/gi, ""],
      [/This article will explore how\s*/gi, "This shows how "],
      [/meaningful outcomes/gi, "clearer results"]
    ]
  },
  balanced: {
    badge: "标准模式",
    notes: [
      "会综合查看开场套话、抽象词密度和句式模板。",
      `${brandName} 会给出更完整的 AI 文本风险解释。`
    ],
    zh: [
      [/在当今快速变化的时代，?/g, ""],
      [/值得注意的是，?/g, ""],
      [/本文将深入探讨/g, "我们直接看"],
      [/人工智能/g, "AI"],
      [/正在深刻地改变/g, "已经改了"],
      [/内容创作的方式/g, "团队产出内容的流程"],
      [/这不仅仅是一次技术升级，更是一场关于表达效率的革命/g, "它真正有用的地方，是帮人更快看见废话"],
      [/企业应该积极拥抱这项能力/g, "团队可以先把它用在内容审核上"],
      [/实现更高质量的增长/g, "少交付空话，多交付能读的文本"]
    ],
    en: [
      [/In today's fast-paced digital landscape,?\s*/gi, ""],
      [/it is important to note that\s*/gi, ""],
      [/AI is not just a tool, but a transformative force/gi, "AI helps teams spot weak drafts faster"],
      [/This article will explore how\s*/gi, "Here is how "],
      [/leverage it to unlock efficiency, drive innovation, and achieve meaningful outcomes/gi, "use it to cut filler, name the actor, and ship clearer writing"],
      [/transformative/gi, "useful"],
      [/meaningful outcomes/gi, "clearer drafts"]
    ]
  },
  strong: {
    badge: "强力模式",
    notes: [
      "会更严格地标记模板腔、空泛词和过度包装表达。",
      "适合演示高敏感度检测结果。"
    ],
    zh: [
      [/在当今快速变化的时代，?/g, ""],
      [/值得注意的是，?/g, ""],
      [/本文将深入探讨为什么/g, "先看一个实际问题："],
      [/人工智能/g, "AI"],
      [/正在深刻地改变/g, "已经改了"],
      [/内容创作的方式/g, "内容生产这件事"],
      [/这不仅仅是一次技术升级，更是一场关于表达效率的革命/g, "它最值钱的地方，是能更快揪出废话"],
      [/企业应该积极拥抱这项能力/g, "团队先把它拿来做文本检测就行"],
      [/实现更高质量的增长/g, "少写空话，多写能让人信的内容"]
    ],
    en: [
      [/In today's fast-paced digital landscape,?\s*/gi, ""],
      [/it is important to note that\s*/gi, ""],
      [/AI is not just a tool, but a transformative force/gi, "AI is useful when it catches weak writing fast"],
      [/This article will explore how\s*/gi, ""],
      [/leverage it to unlock efficiency, drive innovation, and achieve meaningful outcomes/gi, "cut filler, name the actor, and make the draft readable"],
      [/transformative/gi, "practical"],
      [/meaningful outcomes/gi, "cleaner drafts"]
    ]
  }
};

function escapeHtml(value) {
  return value.replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function analyze(text) {
  const hits = [];
  for (const rule of rules) {
    const matches = [...text.matchAll(rule.pattern)];
    if (matches.length) {
      hits.push({
        ...rule,
        count: matches.length,
        examples: [...new Set(matches.map((match) => match[0]))].slice(0, 3)
      });
    }
  }
  return hits;
}

function rewrite(text, mode) {
  const config = modeConfigs[mode] || modeConfigs.balanced;
  const looksChinese = /[\u4e00-\u9fa5]/.test(text);
  const replacements = looksChinese ? config.zh : config.en;
  let clean = text;

  for (const [from, to] of replacements) {
    clean = clean.replace(from, to);
  }

  clean = clean
    .replace(/\s+/g, " ")
    .replace(/，\s*/g, "，")
    .replace(/。\s*/g, "。\n")
    .replace(/\.\s+/g, ".\n")
    .replace(/以及它如何帮助团队/g, "看它怎么帮团队")
    .replace(/关于表达效率的革命/g, "帮人删废话的工具")
    .trim();

  if (!clean) {
    return "";
  }

  return looksChinese ? polishChinese(clean, mode) : polishEnglish(clean, mode);
}

function polishChinese(text, mode) {
  let result = text
    .replace(/我们直接看为什么/g, "先看一个实际问题：")
    .replace(/帮助团队/g, "帮团队")
    .replace(/更高质量/g, "更清楚")
    .replace(/方式/g, "办法");

  if (mode === "strong") {
    result = result
      .replace(/团队可以先把它用在内容审核上/g, "先用它把文本检测这步做扎实")
      .replace(/它真正有用的地方/g, "它最有用的地方");
  }

  if (!/[。！？]$/.test(result)) {
    result += "。";
  }

  return result;
}

function polishEnglish(text, mode) {
  let result = text
    .replace(/^Here is how teams can /i, "Teams can ")
    .replace(/^This shows how teams can /i, "Teams can ")
    .replace(/teams can use it/i, "teams use it")
    .replace(/AI helps teams/i, "AI helps editors");

  if (mode === "strong") {
    result = result.replace(/Here is how /i, "");
  }

  if (!/[.!?]$/.test(result)) {
    result += ".";
  }

  return result;
}

function score(text, hits, mode) {
  const modeBoost = mode === "light" ? 0 : mode === "strong" ? 2 : 1;
  const penalty = hits.reduce((sum, hit) => sum + hit.count * hit.weight, 0);
  const sentenceLengths = text.split(/[。！？.!?]+/).map((part) => part.trim().length).filter(Boolean);
  const rhythmPenalty = sentenceLengths.length > 2 && new Set(sentenceLengths.slice(0, 3).map((length) => Math.round(length / 10))).size === 1 ? 2 : 0;

  return dimensions.map(([name, hint], index) => {
    const base = 10 - Math.min(7, Math.ceil((penalty - modeBoost) / (index + 2)));
    const value = Math.max(2, Math.min(10, base - (name === "Rhythm" ? rhythmPenalty : 0)));
    return { name, hint, value };
  });
}

function highlight(text, hits) {
  let html = escapeHtml(text);
  const terms = hits.flatMap((hit) => hit.examples).sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const escaped = escapeHtml(term);
    html = html.replaceAll(escaped, `<mark>${escaped}</mark>`);
  }
  return html;
}

function renderScores(scores) {
  scoreGridEl.innerHTML = scores.map((item) => `
    <div class="score-row">
      <div class="score-label">
        <span>${item.name} · ${item.hint}</span>
        <strong>${item.value}/10</strong>
      </div>
      <div class="bar"><span style="width: ${item.value * 10}%"></span></div>
    </div>
  `).join("");
}

function renderLegend() {
  ruleLegendEl.innerHTML = rules.map((rule) => `
    <article class="legend-card">
      <strong>${rule.label}</strong>
      <div>${rule.reason}</div>
    </article>
  `).join("");
}

function getSentenceCount(text) {
  return text.split(/[。！？.!?]+/).map((part) => part.trim()).filter(Boolean).length || 1;
}

function getWordCount(text) {
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (hasChinese) {
    return (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  }
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getAverageLength(text) {
  const sentences = getSentenceCount(text);
  return sentences ? Math.round(text.length / sentences) : 0;
}

function getRiskMeta(aiProbability) {
  if (aiProbability >= 75) {
    return {
      level: "高风险",
      className: "risk-high",
      color: "#ef4444"
    };
  }

  if (aiProbability >= 45) {
    return {
      level: "中风险",
      className: "risk-mid",
      color: "#f59e0b"
    };
  }

  return {
    level: "低风险",
    className: "risk-low",
    color: "#16a34a"
  };
}

function computeProbabilities(text, hits, scores, mode) {
  const modeFactor = mode === "light" ? 0.95 : mode === "strong" ? 1.1 : 1;
  const penalty = hits.reduce((sum, hit) => sum + hit.count * hit.weight, 0);
  const averageScore = scores.reduce((sum, item) => sum + item.value, 0) / scores.length;
  const baseline = penalty * 6 + Math.max(0, 8 - averageScore) * 5;
  const punctuationFactor = text.split(/[。！？.!?]+/).filter(Boolean).length <= 2 ? 5 : 0;
  const aiProbability = Math.max(6, Math.min(97, Math.round((baseline + punctuationFactor) * modeFactor)));
  return {
    ai: aiProbability,
    human: 100 - aiProbability
  };
}

function renderStats(text, hits) {
  const chars = text.length;
  const sentences = getSentenceCount(text);
  const hitCount = hits.reduce((sum, hit) => sum + hit.count, 0);
  statsEl.textContent = `${chars} 字符 · ${sentences} 句 · ${hitCount} 条规则命中`;
  wordCountEl.textContent = `${getWordCount(text)}`;
  sentenceCountEl.textContent = `${sentences}`;
  averageLengthEl.textContent = `${getAverageLength(text)}`;
  ruleCountEl.textContent = `${hitCount}`;
}

function renderNotes(mode, hits, aiProbability) {
  const config = modeConfigs[mode] || modeConfigs.balanced;
  const hitCount = hits.reduce((sum, hit) => sum + hit.count, 0);
  const dynamic = hitCount
    ? `${brandName} 本次识别到 ${hitCount} 处可疑表达，AI 风险概率约为 ${aiProbability}%，主要集中在 ${hits.slice(0, 2).map((hit) => hit.label).join("、")}。`
    : `${brandName} 没有识别到明显模板腔，当前文本风险较低。`;

  const suggestions = aiProbability >= 75
    ? "建议优先重写开头和总结句，减少抽象词与模板结构。"
    : aiProbability >= 45
      ? "建议压缩空泛修饰词，并补充更具体的主语和动作。"
      : "建议继续补充事实细节，保持当前自然表达。";

  rewriteNotesEl.innerHTML = [...config.notes, dynamic, suggestions]
    .map((note) => `<li>${note}</li>`)
    .join("");
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  if (!history.length) {
    historyListEl.innerHTML = '<div class="history-empty">还没有检测记录。</div>';
    return;
  }

  historyListEl.innerHTML = history.slice(0, 5).map((item) => `
    <article class="history-item">
      <strong>${item.ai}% AI · ${item.level}</strong>
      <div>${item.preview}</div>
      <div>${item.meta}</div>
    </article>
  `).join("");
}

function saveHistory(text, aiProbability, riskMeta) {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  history.unshift({
    ai: aiProbability,
    level: riskMeta.level,
    preview: `${text.slice(0, 52)}${text.length > 52 ? "..." : ""}`,
    meta: `${new Date().toLocaleString("zh-CN")}`
  });
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 8)));
}

function renderRisk(probabilities) {
  const riskMeta = getRiskMeta(probabilities.ai);
  aiProbabilityEl.textContent = `${probabilities.ai}%`;
  aiRateEl.textContent = `${probabilities.ai}%`;
  humanRateEl.textContent = `${probabilities.human}%`;
  riskLevelEl.textContent = riskMeta.level;
  progressLabelEl.textContent = `${probabilities.ai}%`;
  probabilityRingEl.style.setProperty("--progress", `${Math.round(probabilities.ai * 3.6)}deg`);
  probabilityRingEl.style.setProperty("--ring-color", riskMeta.color);
  progressFillEl.style.width = `${probabilities.ai}%`;
  progressFillEl.style.background = riskMeta.color;
  riskBadgeEl.className = `risk-badge ${riskMeta.className}`;
  riskBadgeEl.textContent = riskMeta.level;
  return riskMeta;
}

function run() {
  const text = draftEl.value.trim();
  const mode = modeSelectEl.value;
  modeBadgeEl.textContent = (modeConfigs[mode] || modeConfigs.balanced).badge;

  if (!text) {
    outputEl.textContent = "先输入一段待检测文本。";
    outputEl.classList.add("empty");
    annotatedEl.textContent = "这里会高亮原稿里的风险表达。";
    annotatedEl.classList.add("empty");
    findingsEl.innerHTML = "<li>输入文字后会列出具体问题。</li>";
    rewriteNotesEl.innerHTML = "<li>检测后会说明这次主要发现了哪些文本特征。</li>";
    scoreBadgeEl.textContent = "等待输入";
    statsEl.textContent = "0 字符 · 0 句 · 命中 0 处";
    copyHintEl.textContent = "复制后可以直接贴到邮件、帖子或文档里。";
    aiProbabilityEl.textContent = "0%";
    aiRateEl.textContent = "0%";
    humanRateEl.textContent = "100%";
    riskLevelEl.textContent = "待检测";
    progressLabelEl.textContent = "0%";
    wordCountEl.textContent = "0";
    sentenceCountEl.textContent = "0";
    averageLengthEl.textContent = "0";
    ruleCountEl.textContent = "0";
    probabilityRingEl.style.setProperty("--progress", "0deg");
    probabilityRingEl.style.setProperty("--ring-color", "#9ca3af");
    progressFillEl.style.width = "0%";
    progressFillEl.style.background = "#9ca3af";
    riskBadgeEl.className = "risk-badge risk-neutral";
    riskBadgeEl.textContent = "等待检测";
    renderScores(dimensions.map(([name, hint]) => ({ name, hint, value: 0 })));
    renderHistory();
    return;
  }

  const hits = analyze(text);
  const rewritten = rewrite(text, mode);
  const scores = score(text, hits, mode);
  const total = scores.reduce((sum, item) => sum + item.value, 0);
  const probabilities = computeProbabilities(text, hits, scores, mode);
  const riskMeta = renderRisk(probabilities);

  outputEl.innerHTML = highlight(rewritten, []);
  outputEl.classList.remove("empty");
  annotatedEl.innerHTML = highlight(text, hits);
  annotatedEl.classList.remove("empty");
  scoreBadgeEl.textContent = `${total}/50`;
  copyHintEl.textContent = "复制后可以直接贴到邮件、帖子或文档里。";

  findingsEl.innerHTML = hits.length
    ? hits.map((hit) => `<li><strong>${hit.label}</strong>：命中 ${hit.count} 处，例子：${hit.examples.map(escapeHtml).join("、")}。${hit.reason}</li>`).join("")
    : "<li>没有明显套话。可以继续关注事实密度与句式变化。</li>";

  renderScores(scores);
  renderNotes(mode, hits, probabilities.ai);
  renderStats(text, hits);
  saveHistory(text, probabilities.ai, riskMeta);
  renderHistory();
}

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    draftEl.value = samples[button.dataset.sample];
    run();
  });
});

document.querySelector("#rewriteBtn").addEventListener("click", run);
document.querySelector("#clearBtn").addEventListener("click", () => {
  draftEl.value = "";
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

modeSelectEl.addEventListener("change", run);

renderLegend();
renderHistory();
draftEl.value = samples.zh;
run();

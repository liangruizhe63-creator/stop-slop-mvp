const draftEl = document.querySelector("#draft");
const outputEl = document.querySelector("#output");
const annotatedEl = document.querySelector("#annotated");
const findingsEl = document.querySelector("#findings");
const scoreGridEl = document.querySelector("#scoreGrid");
const scoreBadgeEl = document.querySelector("#scoreBadge");

const samples = {
  zh: `在当今快速变化的时代，人工智能正在深刻地改变内容创作的方式。值得注意的是，这不仅仅是一次技术升级，更是一场关于表达效率的革命。本文将深入探讨为什么企业应该积极拥抱这项能力，以及它如何帮助团队实现更高质量的增长。`,
  en: `In today's fast-paced digital landscape, it is important to note that AI is not just a tool, but a transformative force. This article will explore how teams can leverage it to unlock efficiency, drive innovation, and achieve meaningful outcomes.`
};

const rules = [
  {
    label: "中文开场套话",
    pattern: /(在当今|快速变化|时代|值得注意的是|本文将|深入探讨|积极拥抱)/g,
    reason: "像文章模板开头，先删掉铺垫。",
    weight: 2
  },
  {
    label: "英文开场套话",
    pattern: /(in today's|fast-paced|digital landscape|it is important to note that|this article will|explore how|unlock|drive innovation|meaningful outcomes)/gi,
    reason: "常见 AI 文章语气，读者会先听见模板。",
    weight: 2
  },
  {
    label: "二元对照句式",
    pattern: /(不仅仅是|不只是|not just|not only|but also|更是|but a)/gi,
    reason: "先说否定再揭示答案，会显得公式化。",
    weight: 2
  },
  {
    label: "空泛强词",
    pattern: /(深刻地|显著地|全面地|极大地|transformative|revolutionary|seamlessly|significantly)/gi,
    reason: "副词和大词没有给出具体信息。",
    weight: 1
  },
  {
    label: "商业抽象词",
    pattern: /(赋能|增长|效率|升级|革命|能力|leverage|efficiency|innovation|outcomes|capabilities)/gi,
    reason: "抽象词过密，需要换成具体动作或结果。",
    weight: 1
  },
  {
    label: "被动或远景旁白",
    pattern: /(正在被|被.+?改变|is being|are being|has been|have been)/gi,
    reason: "读起来像旁白。找到人，让人做动作。",
    weight: 2
  }
];

const replacements = [
  [/在当今快速变化的时代，?/g, ""],
  [/值得注意的是，?/g, ""],
  [/本文将深入探讨/g, "我们直接看"],
  [/人工智能/g, "AI"],
  [/正在深刻地改变/g, "已经改了"],
  [/内容创作的方式/g, "团队写草稿、改稿和定稿的流程"],
  [/这不仅仅是一次技术升级，更是一场关于表达效率的革命/g, "它真正有用的地方，是帮人更快看见废话"],
  [/企业应该积极拥抱这项能力/g, "团队可以先把它用在改稿上"],
  [/实现更高质量的增长/g, "少交付空话，多交付能读的文本"],
  [/In today's fast-paced digital landscape,?\s*/gi, ""],
  [/it is important to note that\s*/gi, ""],
  [/AI is not just a tool, but a transformative force/gi, "AI helps teams spot weak drafts faster"],
  [/This article will explore how\s*/gi, "Here is how "],
  [/leverage it to unlock efficiency, drive innovation, and achieve meaningful outcomes/gi, "use it to cut filler, name the actor, and ship clearer writing"],
  [/transformative/gi, "useful"],
  [/meaningful outcomes/gi, "clearer drafts"]
];

const dimensions = [
  ["Directness", "直接说事，不宣布要说事"],
  ["Rhythm", "句长有变化，不像模板"],
  ["Trust", "不替读者做过多解释"],
  ["Authenticity", "像具体的人在说话"],
  ["Density", "删掉可删内容"]
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

function rewrite(text) {
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

  const looksChinese = /[\u4e00-\u9fa5]/.test(clean);
  if (looksChinese) {
    return polishChinese(clean);
  }
  return polishEnglish(clean);
}

function polishChinese(text) {
  let result = text
    .replace(/我们直接看为什么/g, "先看一个实际问题：")
    .replace(/帮助团队/g, "帮团队")
    .replace(/更高质量/g, "更清楚")
    .replace(/方式/g, "办法");

  if (!/[。！？]$/.test(result)) {
    result += "。";
  }

  return result;
}

function polishEnglish(text) {
  let result = text
    .replace(/^Here is how teams can /i, "Teams can ")
    .replace(/teams can use it/i, "teams use it")
    .replace(/AI helps teams/i, "AI helps editors");

  if (!/[.!?]$/.test(result)) {
    result += ".";
  }

  return result;
}

function score(text, hits) {
  const penalty = hits.reduce((sum, hit) => sum + hit.count * hit.weight, 0);
  const sentenceLengths = text.split(/[。！？.!?]+/).map((part) => part.trim().length).filter(Boolean);
  const rhythmPenalty = sentenceLengths.length > 2 && new Set(sentenceLengths.slice(0, 3).map((length) => Math.round(length / 10))).size === 1 ? 2 : 0;

  return dimensions.map(([name, hint], index) => {
    const base = 10 - Math.min(7, Math.ceil(penalty / (index + 2)));
    const value = Math.max(2, base - (name === "Rhythm" ? rhythmPenalty : 0));
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

function run() {
  const text = draftEl.value.trim();
  if (!text) {
    outputEl.textContent = "先输入一段草稿。";
    outputEl.classList.add("empty");
    annotatedEl.textContent = "这里会高亮原稿里的套路表达。";
    annotatedEl.classList.add("empty");
    findingsEl.innerHTML = "<li>输入文字后会列出具体问题。</li>";
    scoreBadgeEl.textContent = "等待输入";
    renderScores(dimensions.map(([name, hint]) => ({ name, hint, value: 0 })));
    return;
  }

  const hits = analyze(text);
  const rewritten = rewrite(text);
  const scores = score(text, hits);
  const total = scores.reduce((sum, item) => sum + item.value, 0);

  outputEl.innerHTML = highlight(rewritten, []);
  outputEl.classList.remove("empty");
  annotatedEl.innerHTML = highlight(text, hits);
  annotatedEl.classList.remove("empty");
  scoreBadgeEl.textContent = `${total}/50`;

  findingsEl.innerHTML = hits.length
    ? hits.map((hit) => `<li><strong>${hit.label}</strong>：命中 ${hit.count} 处，例子：${hit.examples.map(escapeHtml).join("、")}。${hit.reason}</li>`).join("")
    : "<li>没有明显套话。可以再检查事实是否具体。</li>";

  renderScores(scores);
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

draftEl.value = samples.zh;
run();

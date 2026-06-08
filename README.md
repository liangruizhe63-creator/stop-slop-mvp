# Stop Slop MVP Demo

这是一个基于 `hardikpandya/stop-slop` 思路做的最小可运行 demo。

原项目是一个写作 Skill，不是完整应用。它的 README 和 `SKILL.md` 说明了核心规则：删除套话、避开公式化结构、使用主动语态、减少抽象词、让句子更具体，并用 Directness、Rhythm、Trust、Authenticity、Density 五个维度评分。

## 文件结构

```text
.
├── index.html   # 页面结构
├── styles.css   # 界面样式
├── app.js       # 检测、评分、改写逻辑
└── README.md    # 运行说明
```

## 实现步骤

1. 读取 `stop-slop` README 和 `SKILL.md`，确认它适合抽成文本编辑体验。
2. 做一个无依赖的本地页面，避免 Git、Node、Python 环境不稳定带来的运行门槛。
3. 内置中英文样例、规则命中、五维评分和一键改写。
4. 保留可扩展入口：后续可以把规则表扩成配置文件，或接入真实 LLM 做更强改写。

## 运行

直接双击 `index.html`，或在浏览器里打开这个文件。

## 发布为长期网址

最稳的轻量方案是 GitHub Pages。官方文档说明，GitHub Pages 可以直接托管仓库里的 HTML、CSS 和 JavaScript 文件，也支持把 `/docs` 目录作为发布源；发布后会得到一个长期 URL，比如 `https://<username>.github.io/<repo>/`。

这个仓库已经准备好了可发布目录：

```text
docs/
├── index.html
├── app.js
└── styles.css
```

如果你把当前项目推到 GitHub 并把 Pages 的发布源设为 `main` 分支下的 `/docs`，就可以直接在线访问。

## Demo 目标

输入一段 AI 味很重的中文或英文草稿，输出更自然、更像人写的版本，同时展示哪些地方被判定为“slop”。

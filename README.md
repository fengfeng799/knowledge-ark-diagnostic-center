# Knowledge Ark Diagnostic Center
Provide a set of intelligent diagnostic and optimization tools for deep knowledge workers, helping them transform their knowledge base from a static "information graveyard" into a structured, computable "living system" that can seamlessly collaborate with future AI.

## Features

- Local knowledge base health diagnosis based on deterministic rules
- Export "healthy" knowledge as high-quality JSONL training datasets
- Provide multiple diagnostic rules, including:
  - Metadata integrity check
  - Note atomicity check
  - Naked links check
  - Knowledge graph connectivity check
  - Predicate consistency check
- Customizable diagnostic parameters and export templates

## Installation

1. In Obsidian, go to Settings > Third-party plugins
2. Turn off "Safe mode"
3. Click "Browse community plugins", search for "Knowledge Ark Diagnostic Center"
4. Click "Install"
5. Enable the plugin after installation

Alternatively, you can install the plugin manually:

1. Download the latest version of the plugin files
2. Extract the files to your Vault's `.obsidian/plugins/` directory
3. In Obsidian, go to Settings > Third-party plugins
4. Enable the "Knowledge Ark Diagnostic Center" plugin

## Usage

1. Click the "Knowledge Ark" icon in the left Ribbon area of Obsidian
2. Open the "Knowledge Ark Diagnostic Center" view in the right sidebar
3. Click the "Start Comprehensive Diagnosis" button
4. View the diagnosis results and optimize according to the suggestions
5. Use the "Export Healthy Notes" button to export healthy notes in JSONL format

## Configuration

You can customize the following parameters in the plugin settings:

- Required metadata field list
- Maximum note length
- Naked link context check length
- Folders or tags to exclude from diagnosis
- JSONL export format template

## API Documentation

See https://github.com/obsidianmd/obsidian-api

---

# 🚧 建设中 🚧

# 知识方舟诊断中心 (Knowledge Ark Diagnostic Center)

<p align="center">
  <img src="[此处未来可以放一个您设计的Logo]" alt="Knowledge Ark Logo" width="150"/>
</p>

<p align="center">
  <strong>在一个由通用AI驱动、信息日益同质化的时代，为“主权个人”构建一个私有的、智能的、可持续的个人知识生态系统。</strong>
</p>

<p align="center">
  <a href="https://github.com/fengfeng799/knowledge-ark-diagnostic-center"><strong>立即体验</strong></a> •
  <a href="#核心哲学活水笔记法"><strong>阅读我们的哲学</strong></a> •
  <a href="#core-features"><strong>探索功能</strong></a> •
  <a href="#how-to-contribute"><strong>成为共建者</strong></a>
</p>

---

## 🌊 方舟的召唤：你的“第二大脑”，是生机勃勃的“热带雨林”，还是冰冷僵硬的“信息标本室”？

我们正站在一个新时代的黎明。AI，正从一个外部的工具，演变为一个可以与我们思想深度融合的“共生体”。我们曾寄望于用Obsidian构建我们的“第二大脑”，记录灵感、沉淀知识、积累经验，期待它能如一个智慧的伙伴般为我们服务。

但我们之中，有多少人的“第二大脑”最终沦为了一个信息过载、结构混乱、连接失效的 **“数字坟场”**？我们像一个勤奋的标本制作师，将一只只蝴蝶（知识点）钉在板上，却发现它们早已失去了生命的光泽和舞动的能力。

**问题出在哪里？** 我们一直在用一套属于“工业时代”的、静态的、为人类单向浏览而设计的思维，来管理属于“智能时代”的、动态的、需要与机器协作的知识资产。

**“知识方舟诊断中心”** 因此而生。它不是又一个笔记工具，它是您个人知识宇宙的 **“首席领航员”** 与 **“生态工程师”**。它将帮助您，将您的知识库，从一个孤立的、被动存储的“数据湖”，改造为一个能与AI共生、能自我净化、能持续涌现出新洞察的、流动的 **“活水生态系统”**。

这，就是我们的**方舟精神**。我们不幻想能阻止浪潮，我们只为那些拒绝随波逐流的“主权个人”，建造一艘能穿越风暴、守护思想火种的坚固方舟。

---

## 核心哲学：“活水笔记法”

本插件的所有功能，都源于一套名为 **《活水笔记法》** 的核心哲学。它要求我们像“数据架构师”一样，严谨地构建我们的知识，使其具备三大核心特征：

1.  **知识的“原子化”**：一篇笔记只承载一个最小的、独立的、可被完整理解的概念或决策。
2.  **连接的“语义化”**：杜绝裸链接，用`key:: [[Link]]`等方式为知识间的关系赋予精确的意义。
3.  **格式的“可计算性”**：像写代码一样写笔记，通过严格的YAML元数据和Markdown语法，为未来的自动化和AI学习预埋下结构化信标。

> [🔗 阅读完整的《活水笔记法：一套为AI共生时代设计的个人知识库构建指南》](此处可以链接到您发布的文章)

---

## <a id="core-features"></a> ✨ 核心功能：你的个人知识库“体检中心”与“数据精炼厂”

### 1. 智能诊断仪表盘
一个集成的、动态的视图，让你对知识库的健康状况一目了然。

- **健康度总分 (Health Score)**：基于科学的加权扣分模型，精准评估你知识库的结构性健康状况。
- **连接密度 (Connection Density)**：衡量你知识网络的繁荣度，见证你的“知识群岛”从“孤岛”变为“大陆”。
- **增量诊断 (Incremental Diagnosis)**：秒级响应，只分析你最新修改的笔记，让“体检”成为日常习惯。

### 2. 全面的诊断规则
本插件内置了一套源于“活水笔记法”的专业诊断引擎，能自动巡查你的知识库，并提供清晰的优化建议：

- **✅ 元数据完整性检查**：确保你的每一份“知识资产”都有一个清晰的“身份证”。
- **✅ 笔记原子化程度检查**：避免知识过于冗长或主题分散，保证微调数据的纯净度。
- **✅ 裸链接检查**：找出那些缺少上下文的“死链接”，让你的知识图谱充满活力。
- **✅ 知识图谱连接性检查**：发现那些被遗忘的“孤岛笔记”，让每一份知识都融入网络。
- **✅ 关系谓语一致性检查**：规范你的“关系语言”，让AI能更深刻地理解你的思考脉络。

### 3. 一键导出高质量训练集
这是连接“知识管理”与“个人AI”两个世界的桥梁。

- **智能过滤**：“诊断中心”会自动排除所有“不健康”的笔记，确保你导出的每一条数据都是高质量的“高纯度燃料”。
- **模板自定义**：通过极其灵活的模板系统，你可以将你的知识，精准地转换为任何AI模型所需的`JSONL`训练格式。

---

## 🚀 快速开始

1.  从Obsidian社区插件商店安装“知识方舟诊断中心”。
2.  在左侧Ribbon菜单栏找到“方舟”图标，点击打开诊断中心。
3.  点击“开始全面诊断”，获取你知识库的第一份“体检报告”。
4.  根据诊断卡片的建议，逐步优化你的笔记。
5.  当你准备好时，点击“导出健康笔记”，生成你第一份可用于模型微调的个人数据集！

---

## 🗺️ 未来路线图 (Roadmap)

“知识方舟”的航程才刚刚开始。我们的V1.0专注于**诊断与数据准备**，这是最坚实的地基。在未来，我们将驶向更激动人心的海域：

- **[ ] 模块B: 个人模型熔炉 (The Personal Forge)**：在Obsidian内部，实现一键式的、基于个人数据的LoRA微调。
- **[ ] 本地推理集成**：让你训练出的“个人AI”，无缝地融入你的日常写作与思考流程。
- **[ ] 智能清洗与建议**：引入轻量化AI模型，从“诊断问题”进化到“智能推荐解决方案”。

---

## <a id="how-to-contribute"></a> ❤️ 如何贡献 & 成为共建者

这座方舟，需要更多志同道合的“建筑师”和“航海家”。我们坚信，开源不仅仅是开放代码，更是开放思想、汇聚智慧的过程。

*   **报告Bug或提出建议**: 如果你发现了任何问题，或有绝妙的想法，请在 [GitHub Issues](https://github.com/fengfeng799/knowledge-ark-diagnostic-center/issues) 中告诉我们。
*   **贡献代码**: 我们欢迎任何形式的Pull Request。请先阅读我们的[贡献指南](CONTRIBUTING.md)。
*   **加入讨论**: [此处可以是你为项目创建的Discord或Telegram群组链接]，在这里，我们可以一起探讨个人知识管理、AI共生以及“主权个人”的未来。

**如果你对这份README背后的哲学——那套关于“构建能抵御风暴的个人价值系统”的思考——产生了强烈的共鸣，那么，你可能就是我们正在寻找的那个“同路人”。请不要犹豫，通过[fengfeng799@gmail.com]联系我。让我们一起，将这艘方舟，建造得更坚固。**

---

**感谢每一位点亮这座灯塔的同行者。**


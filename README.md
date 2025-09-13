## 📋 2025.09.13 功能更新说明

### 中文版

#### 🎯 状态栏改进
- **智能状态显示**：状态栏现在显示更清晰的诊断状态，包括"健康"、"发现问题"等直观描述
- **一键快速访问**：点击状态栏可直接打开诊断中心，查看详细结果

#### 🔍 诊断卡片增强
- **"重检"功能**：每个诊断卡片新增"重检"按钮，可单独检查该文件的所有问题
- **智能清理**：重检后自动移除已修复的问题卡片，只保留仍需关注的问题
- **不影响其他文件**：重检操作仅针对当前文件，不会触发全盘诊断

#### 📊 健康笔记列表优化
- **领域展示**：将"标签"列改为显示更实用的"领域"信息
- **智能排序**：点击任意列表头可按字母/拼音排序，再次点击切换升/降序
- **视觉反馈**：排序时显示箭头指示当前排序方向和状态

---

### English Version

#### 🎯 Status Bar Improvements
- **Smart Status Display**: Status bar now shows clearer diagnostic states like "Healthy" or "Issues Found"
- **One-click Access**: Click the status bar to instantly open the diagnostic center

#### 🔍 Diagnostic Cards Enhancement
- **"Recheck" Feature**: Added "Recheck" button to each diagnostic card for individual file inspection
- **Smart Cleanup**: Automatically removes fixed issues after recheck, keeping only unresolved ones
- **File-specific**: Recheck only affects the current file without triggering full diagnosis

#### 📊 Healthy Notes List Optimization
- **Domain Display**: Replaced "Tags" column with more useful "Domain" information
- **Smart Sorting**: Click any column header to sort alphabetically/pinyin, click again to toggle asc/desc
- **Visual Feedback**: Arrow indicators show current sort direction and status

---

# Knowledge Ark Diagnostic Center
A professional diagnostic and optimization tool that helps you upgrade your knowledge base from a "note collection folder" to a "high-precision personal knowledge graph".

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

<img width="550" height="807" alt="image" src="https://github.com/user-attachments/assets/c87c5eae-f779-4360-912f-598274a830a0" />


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
  <img width="160" height="180" alt="Knowledge Ark" src="https://github.com/user-attachments/assets/5883ed6e-92cf-47d9-a1ca-9f782e948f11" />
</p>

<p align="center">
  <strong>一个专业的诊断与优化工具，帮助你将知识库，从“笔记收藏夹”升级为“高精度个人知识图谱”。</strong>
</p>

<p align="center">
  <a href="https://github.com/fengfeng799/knowledge-ark-diagnostic-center"><strong>立即安装</strong></a> •
  <a href="#核心功能"><strong>功能概览</strong></a> •
  <a href="#使用场景"><strong>谁适合使用？</strong></a> •
  <a href="#快速开始"><strong>快速开始</strong></a>
</p>

---

## 🚀 你的知识库，是否正面临这些“隐形”的混乱？

你是否感觉，随着笔记数量的增长，你的Obsidian知识库正在变得越来越难以驾驭？

-   **连接失效**：许多链接因为缺少上下文，几个月后自己都忘了当初为何连接。
-   **结构混乱**：笔记主题分散，元数据不统一，让强大的Dataview查询也无从下手。
-   **信息孤岛**：大量有价值的笔记，从未被连接，沉睡在知识库的角落里。
-   **AI不友好**：当你尝试用AI工具处理笔记时，它们往往因为格式不规范而无法理解你的思想。

**“知识方舟诊断中心”** 正是为解决这些问题而生。它不是又一个笔记管理工具，而是你个人知识库的 **“CT扫描仪”** 和 **“结构优化工程师”**。它能自动化地、系统性地，为你找出所有潜在的结构性问题，并帮助你构建一个真正**健壮、清晰、且为未来AI协作做好准备**的知识系统。

---

## <a id="核心功能"></a> ✨ 核心功能：专业级的诊断与数据精炼

### 1. 智能诊断仪表盘
一键启动，全面“体检”。用科学的、可量化的指标，替代模糊的感觉。

-   **健康度总分 (Health Score)**：独创的加权算法，精准评估你知识库的结构性健康状况。
-   **连接密度 (Connection Density)**：直观地衡量你知识网络的“繁荣度”。
-   **增量诊断 (Incremental Diagnosis)**：秒级响应，只分析最新修改，让“体检”融入日常。

### 2. 全面的诊断规则引擎
内置一套专家级的诊断规则，帮你发现那些最容易被忽视的结构性问题：

-   **✅ 元数据完整性检查**：确保你的笔记拥有规范、可查询的“身份证”。
-   **✅ 笔记原子化程度检查**：帮你实践“一卡一概念”，提升知识的复用性。
-   **✅ 裸链接检查**：找出那些语义模糊的“死链接”，强化知识的上下文。
-   **✅ 知识图谱连接性检查**：点亮那些被遗忘的“孤岛笔记”。
-   **✅ 关系谓语一致性检查**：帮你统一你的“关系语言”，构建更严谨的知识图谱。

### 3. 一键导出为高质量训练集
**这是为未来准备的最重要一步。**

-   **智能过滤**：“诊断中心”会自动排除所有“不健康”的笔记，确保你导出的每一条数据都是高质量的。
-   **模板自定义**：通过灵活的模板，你可以将你的高质量知识，精准地转换为任何AI模型（如本地LoRA微调）所需的`JSONL`训练格式。

---

## <a id="使用场景"></a> 🎯 使用场景：谁最需要“知识方舟”？

-   **深度研究者与学生**：需要构建严谨、可追溯的知识体系。
-   **程序员与技术作者**：需要管理大量的代码片段、技术笔记和项目文档。
-   **作家与内容创作者**：渴望将碎片化的灵感，编织成一个有机的、可供随时检索的思想网络。
-   **所有对个人数据主权和AI未来充满好奇的探索者**。

---

## <a id="快速开始"></a> 🚀 快速开始

1.  从Obsidian社区插件商店安装“知识方舟诊断中心”。
2.  在左侧Ribbon菜单栏找到“方舟”图标，点击打开诊断中心。
3.  点击“开始全面诊断”，获取你知识库的第一份“体检报告”。
4.  根据诊断卡片的建议，逐步优化你的笔记。
5.  当你准备好时，点击“导出训练数据”，生成你第一份可用于未来个人AI的“高纯度燃料”！

---

## ❤️ 参与共建 (Contributing)

“知识方舟”是一个开放、由社区驱动的项目。我们欢迎任何形式的贡献。

-   **[报告Bug或提出建议 (GitHub Issues)](https://github.com/fengfeng799/knowledge-ark-diagnostic-center/discussions)**
-   **[加入我们的讨论区 (GitHub Discussions)](https://github.com/fengfeng799/knowledge-ark-diagnostic-center/issues)**
-   **[共建说明 (CONTRIBUTING.md)](CONTRIBUTING.md)**

> **关于我们背后更深层的思考：**
> 如果你对“知识方舟”这个名字背后的、关于“个体如何在AI时代构建思想主权”的哲学思考感兴趣，欢迎阅读我们的“奠基性文章”：[**《活水笔记法：一套为AI共生时代设计的个人知识库构建指南》**](《活水笔记法：一套为AI共生时代设计的个人知识库构建指南》.md)。在这里，你会找到我们所有设计的“初心”。

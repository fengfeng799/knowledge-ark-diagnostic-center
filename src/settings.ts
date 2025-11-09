import { App, PluginSettingTab, Setting } from 'obsidian';
import KnowledgeArkPlugin from './main';
import { KnowledgeArkSettings } from './types';

export class KnowledgeArkSettingTab extends PluginSettingTab {
	plugin: KnowledgeArkPlugin;

	constructor(app: App, plugin: KnowledgeArkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// Language toggle
		new Setting(containerEl)
			.setName('语言 / Language')
			.addDropdown(dropdown => dropdown
				.addOption('zh', '中文')
				.addOption('en', 'English')
				.setValue(this.plugin.settings.language || 'zh')
				.onChange(async (value) => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		const isEnglish = this.plugin.settings.language === 'en';
		const titleText = isEnglish ? 'Knowledge Ark Diagnostic Center Settings' : '知识方舟诊断中心设置';
		containerEl.createEl('h3', {text: titleText});

		const getLocalizedText = (zhText: string, enText: string) => {
				return isEnglish ? enText : zhText;
			};

		new Setting(containerEl)
			.setName(getLocalizedText('必填元数据字段', 'Required Metadata Fields'))
			.setDesc(getLocalizedText('请输入必填的元数据字段，用逗号分隔', 'Please enter the required metadata fields, separated by commas'))
			.addText(text => text
				.setPlaceholder('type,status,domain')
				.setValue(this.plugin.settings.requiredMetadataFields.join(','))
				.onChange(async (value) => {
					this.plugin.settings.requiredMetadataFields = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(getLocalizedText('最大笔记长度', 'Maximum Note Length'))
			.setDesc(getLocalizedText('超过此长度的笔记将被标记为问题', 'Notes exceeding this length will be flagged as issues'))
			.addText(text => text
				.setPlaceholder('1500')
				.setValue(this.plugin.settings.maxNoteLength.toString())
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num)) {
						this.plugin.settings.maxNoteLength = num;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName(getLocalizedText('最小上下文长度', 'Minimum Context Length'))
			.setDesc(getLocalizedText('检查裸链接时的上下文长度', 'Context length when checking naked links'))
			.addText(text => text
				.setPlaceholder('30')
				.setValue(this.plugin.settings.minContextLength.toString())
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num)) {
						this.plugin.settings.minContextLength = num;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName(getLocalizedText('排除文件夹', 'Excluded Folders'))
			.setDesc(getLocalizedText('请输入要排除的文件夹路径，用逗号分隔', 'Please enter the folder paths to exclude, separated by commas'))
			.addText(text => text
				.setPlaceholder('templates,archive')
				.setValue(this.plugin.settings.excludedFolders.join(','))
				.onChange(async (value) => {
					this.plugin.settings.excludedFolders = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(getLocalizedText('排除标签', 'Excluded Tags'))
			.setDesc(getLocalizedText('请输入要排除的标签(tags)，用逗号分隔', 'Please enter the tags to exclude, separated by commas'))
			.addText(text => text
				.setPlaceholder('draft,template')
				.setValue(this.plugin.settings.excludedTags.join(','))
				.onChange(async (value) => {
					this.plugin.settings.excludedTags = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(getLocalizedText('知识原子类型', 'Knowledge Atom Types'))
			.setDesc(getLocalizedText('请输入被视为知识原子的笔记类型(type)，用逗号分隔', 'Please enter the note types (type) considered as knowledge atoms, separated by commas'))
			.addText(text => text
				.setPlaceholder('atom,concept,entity')
				.setValue(this.plugin.settings.knowledgeAtomTypes.join(','))
				.onChange(async (value) => {
					this.plugin.settings.knowledgeAtomTypes = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(getLocalizedText('谓语使用频率阈值', 'Predicate Usage Threshold'))
			.setDesc(getLocalizedText('低于此使用次数的谓语将被标记为使用频率过低（设为0可禁用此检查）', 'Predicates with usage count below this threshold will be flagged as low usage (set to 0 to disable this check)'))
			.addText(text => text
				.setPlaceholder('1')
				.setValue(this.plugin.settings.predicateUsageThreshold.toString())
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num >= 0) {
						this.plugin.settings.predicateUsageThreshold = num;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName(getLocalizedText('导出模板', 'Export Template'))
			.setDesc(getLocalizedText('设置导出JSONL的模板', 'Set the template for exporting JSONL'))
			.addTextArea(text => {
				text
					.setPlaceholder('{"content": "{{content}}", "tags": "{{tags}}", "type": "{{type}}"}')
					.setValue(this.plugin.settings.exportTemplate)
					.onChange(async (value) => {
						this.plugin.settings.exportTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 4;
				text.inputEl.cols = 50;
			});

		// Add section for managing ignored issues
		new Setting(containerEl)
			.setName(getLocalizedText('白名单管理', 'Whitelist Management'))
			.setDesc(getLocalizedText('以下问题已被添加到白名单中，不会在诊断中显示。', 'The following issues have been added to the whitelist and will not be displayed in the diagnosis.'));

		// Create a container for ignored issues
		const ignoredIssuesContainer = containerEl.createEl('div', { cls: 'knowledge-ark-ignored-issues' });

		// Function to render ignored issues
		const renderIgnoredIssues = () => {
			ignoredIssuesContainer.empty();

			if (this.plugin.settings.ignoredIssues.length === 0) {
				ignoredIssuesContainer.createEl('p', { text: getLocalizedText('暂无被忽略的问题。', 'No ignored issues.') });
				return;
			}

			// Add "Remove All" button
			const removeAllButton = ignoredIssuesContainer.createEl('button', {
				text: getLocalizedText('全部移除', 'Remove All'),
				cls: 'knowledge-ark-ignored-issue-button'
			});
			removeAllButton.style.marginBottom = '10px';

			removeAllButton.onClickEvent(async () => {
				this.plugin.settings.ignoredIssues = [];
				await this.plugin.saveSettings();
				renderIgnoredIssues();
			});

			const listEl = ignoredIssuesContainer.createEl('ul');
			
			this.plugin.settings.ignoredIssues.forEach((issueId, index) => {
				const itemEl = listEl.createEl('li', { cls: 'knowledge-ark-ignored-issue-item' });
				
				const issueTextEl = itemEl.createEl('span', { 
					text: issueId,
					cls: 'knowledge-ark-ignored-issue-text' 
				});
				
				const unignoreButtonEl = itemEl.createEl('button', { 
						text: getLocalizedText('移除', 'Remove'),
						cls: 'knowledge-ark-ignored-issue-button' 
					});
				
				unignoreButtonEl.onClickEvent(async () => {
					// Remove issue from ignoredIssues
					this.plugin.settings.ignoredIssues.splice(index, 1);
					await this.plugin.saveSettings();
					
					// Re-render the list
					renderIgnoredIssues();
				});
			});
		};

		// Initial render
		renderIgnoredIssues();

		// Add section for rule weights configuration
		const weightsTitle = getLocalizedText('诊断规则权重配置', 'Diagnostic Rule Weights Configuration');
		containerEl.createEl('h3', { text: weightsTitle });

		const weightsDescription = getLocalizedText(
			'为每个诊断规则设置单项扣分值。扣分值越高，该问题对健康度总分的影响越大。',
			'Set the penalty points for each diagnostic rule. Higher penalty points mean the issue will have a greater impact on the health score.'
		);
		containerEl.createEl('p', { text: weightsDescription });

		// Define the rule weights with their default values and descriptions
		const ruleWeightsConfig = [
			{ id: 'metadata-integrity', name: getLocalizedText('元数据完整性检查', 'Metadata Integrity Check'), default: 5.0 },
			{ id: 'naked-links', name: getLocalizedText('裸链接检查', 'Naked Links Check'), default: 2.0 },
			{ id: 'graph-connectivity', name: getLocalizedText('知识图谱连接性检查', 'Knowledge Graph Connectivity Check'), default: 1.0 },
			{ id: 'note-atomicity', name: getLocalizedText('笔记原子化程度检查', 'Note Atomicity Check'), default: 0.8 },
			{ id: 'predicate-consistency', name: getLocalizedText('关系谓语一致性检查', 'Predicate Consistency Check'), default: 0.5 },
			{ id: 'word-count-exceed', name: getLocalizedText('笔记长度超限', 'Word Count Exceed'), default: 0.1 }
		];

		// Create settings for each rule weight
		for (const rule of ruleWeightsConfig) {
			const currentValue = this.plugin.settings.ruleWeights[rule.id] !== undefined ? 
				this.plugin.settings.ruleWeights[rule.id] : rule.default;

			new Setting(containerEl)
				.setName(rule.name)
				.addText(text => text
					.setPlaceholder(rule.default.toString())
					.setValue(currentValue.toString())
					.onChange(async (value) => {
						const num = parseFloat(value);
						if (!isNaN(num)) {
							this.plugin.settings.ruleWeights[rule.id] = num;
							await this.plugin.saveSettings();
						}
					}));
		}
	}
}
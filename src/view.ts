import { ItemView, WorkspaceLeaf, TFile, MarkdownView } from 'obsidian';
import KnowledgeArkPlugin from './main';
import { DiagnosticIssue } from './types';
import { DataExporter } from './export';
import { RuleRegistry } from './main';
import { DiagnosticRule } from './types';

// Add CSS styles for health score colors
const addHealthScoreStyles = () => {
  const styleId = 'knowledge-ark-health-score-styles';
  
  // Check if styles already exist
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .knowledge-ark-score.score-healthy {
      color: #28a745 !important; /* Green */
      font-size: 1.2em !important;
      font-weight: bold !important;
    }
    
    .knowledge-ark-score.score-warning {
      color: #ffc107 !important; /* Yellow */
      font-size: 1.2em !important;
      font-weight: bold !important;
    }
    
    .knowledge-ark-score.score-critical {
      color: #dc3545 !important; /* Red */
      font-size: 1.2em !important;
      font-weight: bold !important;
    }
  `;
  
  document.head.appendChild(style);
};

// Call the function to add styles when the module loads
addHealthScoreStyles();

export const VIEW_TYPE = 'knowledge-ark-view';

export class KnowledgeArkView extends ItemView {
	plugin: KnowledgeArkPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: KnowledgeArkPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		const isEnglish = this.plugin.settings.language === 'en';
		return isEnglish ? 'Knowledge Ark Diagnostic Center' : '知识方舟诊断中心';
	}

	getIcon() {
		return 'lucide-compass';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		const isEnglish = this.plugin.settings.language === 'en';
		
		container.empty();
		container.createEl('h2', { text: isEnglish ? 'Knowledge Ark Diagnostic Center' : '知识方舟诊断中心' });

		// Create dashboard header
		const headerEl = container.createEl('div', { cls: 'knowledge-ark-header' });
		
		// Start diagnosis button
		const diagnoseButton = headerEl.createEl('button', { 
			text: isEnglish ? 'Start Full Diagnosis' : '开始全面诊断', 
			cls: 'knowledge-ark-button primary' 
		});
		
		// Start incremental diagnosis button
		const incrementalDiagnoseButton = headerEl.createEl('button', { 
			text: isEnglish ? 'Start Incremental Diagnosis' : '新增笔记诊断', 
			cls: 'knowledge-ark-button primary' 
		});
		
		// Export button
		const exportButton = headerEl.createEl('button', { 
			text: isEnglish ? 'Export Healthy Notes' : '导出健康笔记', 
			cls: 'knowledge-ark-button secondary' 
		});
		
		// Metrics display
		const metricsEl = headerEl.createEl('div', { cls: 'knowledge-ark-metrics' });
		const scoreEl = metricsEl.createEl('div', { 
			text: isEnglish ? 'Health Score: --%' : '健康度总分: --%', 
			cls: 'knowledge-ark-score' 
		});
		const atomCountEl = metricsEl.createEl('div', { 
			text: isEnglish ? 'Knowledge Atom Stats: --' : '知识原子统计: --', 
			cls: 'knowledge-ark-atom-count' 
		});
		const connectionDensityEl = metricsEl.createEl('div', { 
			text: isEnglish ? 'Connection Density: --' : '连接密度: --', 
			cls: 'knowledge-ark-connection-density' 
		});
		
		// Diagnostic results area
		const resultsEl = container.createEl('div', { cls: 'knowledge-ark-results' });
		
		// Check if there are saved diagnosis results
		const savedResults = this.plugin.settings.savedDiagnosisResults;
		if (savedResults) {
			// Update metrics with saved results
			scoreEl.setText(isEnglish ? `Health Score: ${savedResults.healthScore}%` : `健康度总分: ${savedResults.healthScore}%`);
			scoreEl.className = `knowledge-ark-score ${this.getScoreClass(savedResults.healthScore)}`;
			
			atomCountEl.setText(isEnglish ? `Knowledge Atom Stats: ${savedResults.atomCount}` : `知识原子统计: ${savedResults.atomCount}`);
			connectionDensityEl.setText(isEnglish ? `Connection Density: ${savedResults.connectionDensity}` : `连接密度: ${savedResults.connectionDensity}`);
			
			// Update results with saved issues
			resultsEl.empty();
			if (savedResults.issues.length === 0) {
				resultsEl.createEl('p', { 
					text: isEnglish ? 'Congratulations! Your knowledge base is very healthy.' : '恭喜！您的知识库非常健康。', 
					cls: 'knowledge-ark-placeholder' 
				});
			} else {
				this.renderDiagnosticCards(resultsEl, savedResults.issues);
				
				// Render healthy notes
				await this.renderHealthyNotes(resultsEl);
			}
		} else {
			// Show placeholder if no saved results
			const placeholderEl = resultsEl.createEl('p', { 
				text: isEnglish ? 'Click "Start Full Diagnosis" to analyze your knowledge ark' : '点击"开始全面诊断"以分析您的知识方舟', 
				cls: 'knowledge-ark-placeholder' 
			});
		}
		
		// Add tooltip for connection density
		connectionDensityEl.addEventListener('mouseenter', (event) => {
			// Calculate actual connection density values
			const densityText = this.calculateConnectionDensity();
			const matches = densityText.match(/\[↑ ([0-9.]+)\] \[↓ ([0-9.]+)\]/);
			let inboundAvg = '0';
			let outboundAvg = '0';
			
			if (matches && matches.length === 3) {
				inboundAvg = matches[1];
				outboundAvg = matches[2];
			}
			
			// Create tooltip element
			const tooltip = document.createElement('div');
			tooltip.className = 'knowledge-ark-tooltip';
			tooltip.textContent = isEnglish ? 
				`Each note is referenced by an average of ${inboundAvg} other notes / Each note references an average of ${outboundAvg} other notes` :
				`平均每个笔记被${inboundAvg}个其他笔记所引用 / 平均每个笔记引用了${outboundAvg}个其他笔记`;
			
			// Position tooltip
			tooltip.style.position = 'absolute';
			tooltip.style.left = `${event.pageX}px`;
			tooltip.style.top = `${event.pageY - 30}px`;
			
			// Add to document
			document.body.appendChild(tooltip);
		});
		
		connectionDensityEl.addEventListener('mouseleave', () => {
			// Remove tooltip
			const tooltips = document.querySelectorAll('.knowledge-ark-tooltip');
			tooltips.forEach(tooltip => tooltip.remove());
		});
		
		diagnoseButton.onClickEvent(async () => {
			// Update button state
			diagnoseButton.setText(isEnglish ? 'Diagnosing...' : '诊断中...');
			diagnoseButton.disabled = true;
			
			// Run diagnostics
			const issues = await this.plugin.runDiagnostics();
			
			// Update metrics
			const healthScore = this.calculateHealthScore(issues);
			scoreEl.setText(isEnglish ? `Health Score: ${healthScore}%` : `健康度总分: ${healthScore}%`);
			scoreEl.className = `knowledge-ark-score ${this.getScoreClass(healthScore)}`;
			
			// Calculate and update atom count
			const atomCount = this.calculateAtomCount();
			atomCountEl.setText(isEnglish ? `Knowledge Atom Stats: ${atomCount}` : `知识原子统计: ${atomCount}`);

			// Calculate and update connection density
			const connectionDensity = this.calculateConnectionDensity();
			connectionDensityEl.setText(isEnglish ? `Connection Density: ${connectionDensity}` : `连接密度: ${connectionDensity}`);
			
			// Save diagnosis results to plugin settings for persistence
			this.plugin.settings.savedDiagnosisResults = {
				issues: issues,
				healthScore: healthScore,
				atomCount: atomCount,
				connectionDensity: connectionDensity,
				diagnosisTime: Date.now()
			};
			await this.plugin.saveSettings();
			
			// Update results
			resultsEl.empty();
			if (issues.length === 0) {
				resultsEl.createEl('p', { 
					text: isEnglish ? 'Congratulations! Your knowledge base is very healthy.' : '恭喜！您的知识库非常健康。', 
					cls: 'knowledge-ark-placeholder' 
				});
			} else {
				this.renderDiagnosticCards(resultsEl, issues);
				
				// Render healthy notes
				await this.renderHealthyNotes(resultsEl);
			}
			
			// Reset button state
			diagnoseButton.setText(isEnglish ? 'Start Full Diagnosis' : '开始全面诊断');
			diagnoseButton.disabled = false;
		});
		
		incrementalDiagnoseButton.onClickEvent(async () => {
			// Update button state
			incrementalDiagnoseButton.setText(isEnglish ? 'Diagnosing...' : '诊断中...');
			incrementalDiagnoseButton.disabled = true;
			
			// Run incremental diagnostics
			const newIssues = await this.plugin.runDiagnostics(true);
			
			// Get existing issues from saved results
			let allIssues = newIssues;
			if (this.plugin.settings.savedDiagnosisResults) {
				// Get all current files to check for deleted files
				const currentFiles = new Set(this.app.vault.getMarkdownFiles().map(file => file.path));
				
				// Filter out issues from deleted files and issues that are already in the saved results
				const existingIssues = this.plugin.settings.savedDiagnosisResults.issues.filter(issue => currentFiles.has(issue.filePath));
				const existingIssueIds = new Set(existingIssues.map(issue => issue.id));
				const uniqueNewIssues = newIssues.filter(issue => !existingIssueIds.has(issue.id));
				
				// Combine existing issues with new unique issues
				allIssues = [...existingIssues, ...uniqueNewIssues];
			}
			
			// Update metrics
			const healthScore = this.calculateHealthScore(allIssues);
			scoreEl.setText(isEnglish ? `Health Score: ${healthScore}%` : `健康度总分: ${healthScore}%`);
			scoreEl.className = `knowledge-ark-score ${this.getScoreClass(healthScore)}`;
			
			// Calculate and update atom count
			const atomCount = this.calculateAtomCount();
			atomCountEl.setText(isEnglish ? `Knowledge Atom Stats: ${atomCount}` : `知识原子统计: ${atomCount}`);

			// Calculate and update connection density
			const connectionDensity = this.calculateConnectionDensity();
			connectionDensityEl.setText(isEnglish ? `Connection Density: ${connectionDensity}` : `连接密度: ${connectionDensity}`);
			
			// Save diagnosis results to plugin settings for persistence
			this.plugin.settings.savedDiagnosisResults = {
				issues: allIssues,
				healthScore: healthScore,
				atomCount: atomCount,
				connectionDensity: connectionDensity,
				diagnosisTime: Date.now()
			};
			await this.plugin.saveSettings();
			
			// Update results
			resultsEl.empty();
			if (allIssues.length === 0) {
				resultsEl.createEl('p', { 
					text: isEnglish ? 'Congratulations! Your knowledge base is very healthy.' : '恭喜！您的知识库非常健康。', 
					cls: 'knowledge-ark-placeholder' 
				});
			} else {
				this.renderDiagnosticCards(resultsEl, allIssues);
				
				// Render healthy notes
				await this.renderHealthyNotes(resultsEl);
			}
			
			// Reset button state
			incrementalDiagnoseButton.setText(isEnglish ? 'Start Incremental Diagnosis' : '新增笔记诊断');
			incrementalDiagnoseButton.disabled = false;
		});
		
		exportButton.onClickEvent(async () => {
			// Update button state
			exportButton.setText(isEnglish ? 'Exporting...' : '导出中...');
			exportButton.disabled = true;
			
			// Run diagnostics to get issues
			const issues = await this.plugin.runDiagnostics();
			
			// Export healthy notes
			await this.plugin.exportHealthyNotes(issues);
			
			// Reset button state
			exportButton.setText(isEnglish ? 'Export Healthy Notes' : '导出健康笔记');
			exportButton.disabled = false;
		});
	}

		calculateHealthScore(issues: DiagnosticIssue[]): number {
		// Filter out ignored issues
		const filteredIssues = issues.filter(issue => !this.plugin.settings.ignoredIssues.includes(issue.id));

		// Calculate total penalty based on rule weights
		let totalPenalty = 0;
		const issuesByRule: Record<string, number> = {};

		// Count issues by rule
		for (const issue of filteredIssues) {
			if (!issuesByRule[issue.ruleId]) {
				issuesByRule[issue.ruleId] = 0;
			}
			issuesByRule[issue.ruleId]++;
		}

		// Calculate penalty for each rule
		for (const [ruleId, count] of Object.entries(issuesByRule)) {
			const weight = this.plugin.settings.ruleWeights[ruleId] || 0;
			totalPenalty += count * weight;
		}

		// Calculate final score
		const finalScore = Math.max(0, 100 - totalPenalty);
		return Math.round(finalScore);
	}
	
	getScoreClass(score: number): string {
		if (score >= 90) return 'score-healthy';
		if (score >= 70) return 'score-warning';
		return 'score-critical';
	}
	
	renderDiagnosticCards(container: HTMLElement, issues: DiagnosticIssue[]) {
		const isEnglish = this.plugin.settings.language === 'en';
		
		// Filter out ignored issues
		const filteredIssues = issues.filter(issue => !this.plugin.settings.ignoredIssues.includes(issue.id));

		// Group issues by rule
		const issuesByRule: Record<string, DiagnosticIssue[]> = {};
		
		for (const issue of filteredIssues) {
			if (!issuesByRule[issue.ruleId]) {
				issuesByRule[issue.ruleId] = [];
			}
			issuesByRule[issue.ruleId].push(issue);
		}
		
		// Render a card for each rule
			for (const [ruleId, ruleIssues] of Object.entries(issuesByRule)) {
				const cardEl = container.createEl('div', { 
					cls: 'knowledge-ark-card',
					attr: { 'data-rule-id': ruleId }
				});
			
			// Card header
			const headerEl = cardEl.createEl('div', { cls: 'knowledge-ark-card-header' });
			const titleContainerEl = headerEl.createEl('div', { cls: 'knowledge-ark-card-title-container' });
			const titleEl = titleContainerEl.createEl('div', { cls: 'knowledge-ark-card-title' });
			
			// Get rule name and description
			let ruleName = ruleIssues[0].ruleId;
			let ruleDescription = isEnglish ? 'Issue Description' : '问题描述';
			
			// Map rule IDs to their names and descriptions
			const ruleInfoMap: Record<string, { name: string; description: string }> = isEnglish ? {
			  'metadata-integrity': { 
				name: 'Metadata Integrity Check', 
				description: 'Check if note files contain standard YAML Frontmatter' 
			  },
			  'note-atomicity': { 
				name: 'Note Atomicity Check', 
				description: 'Check if notes are too lengthy or have scattered topics' 
			  },
			  'naked-links': { 
				name: 'Naked Links Check', 
				description: 'Check if internal links lack sufficient context' 
			  },
			  'graph-connectivity': { 
				name: 'Knowledge Graph Connectivity Check', 
				description: 'Check for unconnected "information islands"' 
			  },
			  'predicate-consistency': { 
				name: 'Predicate Consistency Check', 
				description: 'Encourage the standard use of `key:: [[Link]]`' 
			  }
			} : {
			  'metadata-integrity': { 
				name: '元数据完整性检查', 
				description: '检查笔记文件是否包含规范的YAML Frontmatter' 
			  },
			  'note-atomicity': { 
				name: '笔记原子化程度检查', 
				description: '检查笔记是否过于冗长或主题分散' 
			  },
			  'naked-links': { 
				name: '裸链接检查', 
				description: '检查内部链接是否缺少足够的上下文' 
			  },
			  'graph-connectivity': { 
				name: '知识图谱连接性检查', 
				description: '检查是否存在未被连接的"信息孤岛"' 
			  },
			  'predicate-consistency': { 
				name: '关系谓语一致性检查', 
				description: '鼓励`key:: [[Link]]`的规范使用' 
			  }
			};
			
			if (ruleInfoMap[ruleId]) {
			  ruleName = ruleInfoMap[ruleId].name;
			  ruleDescription = ruleInfoMap[ruleId].description;
			}
			
			titleEl.createEl('span', { text: `⚠️ ${ruleName}` });
			titleContainerEl.createEl('div', { 
				text: ruleDescription,
				cls: 'knowledge-ark-card-description' 
			});
			
			// Create a container for badge and toggle button
			const badgeToggleContainerEl = headerEl.createEl('div', { cls: 'knowledge-ark-badge-toggle-container' });
			
			// Create badge element
			badgeToggleContainerEl.createEl('span', { 
				text: ruleIssues.length.toString(), 
				cls: 'knowledge-ark-card-badge' 
			});
			
			// Create toggle button with SVG icon
			const toggleEl = badgeToggleContainerEl.createEl('button', { 
				cls: 'knowledge-ark-card-toggle' 
			});
			
			// SVG icons for expand/collapse
			const expandIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
			const collapseIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
			
			toggleEl.innerHTML = expandIcon;
			
			// Card content (initially hidden)
			const contentEl = cardEl.createEl('div', { cls: 'knowledge-ark-card-content' });
			contentEl.hide();
			
			// Create issues table
			const tableEl = contentEl.createEl('table', { cls: 'knowledge-ark-issue-table' });
			const theadEl = tableEl.createEl('thead');
			const headerRowEl = theadEl.createEl('tr');
			headerRowEl.createEl('th', { text: isEnglish ? 'File Name' : '文件名' });
			headerRowEl.createEl('th', { text: isEnglish ? 'Context Preview' : '上下文预览' });
			headerRowEl.createEl('th', { text: isEnglish ? 'Actions' : '操作' });
			
			const tbodyEl = tableEl.createEl('tbody');
			
			for (const issue of ruleIssues) {
				const rowEl = tbodyEl.createEl('tr');
				rowEl.addClass('diagnostic-issue');
				rowEl.setAttribute('data-file-path', issue.filePath);
				
				// File name
				const fileCellEl = rowEl.createEl('td');
				const fileLinkEl = fileCellEl.createEl('a', { 
					text: issue.fileName,
					href: '#' 
				});
				fileLinkEl.onClickEvent((evt) => {
					evt.preventDefault();
					this.navigateToIssue(issue.filePath, issue.position);
				});
				
				// Context preview
				rowEl.createEl('td', { 
					text: issue.contextPreview,
					cls: 'knowledge-ark-issue-context' 
				});
				
				// Actions
				const actionsCellEl = rowEl.createEl('td', { cls: 'knowledge-ark-issue-actions' });
				const recheckButtonEl = actionsCellEl.createEl('button', { 
					text: isEnglish ? 'Recheck' : '重检',
					cls: 'knowledge-ark-issue-button' 
				});
				recheckButtonEl.onClickEvent(async () => {
					await this.recheckFileIssues(issue.filePath, issue.ruleId, rowEl);
				});
				
				const ignoreButtonEl = actionsCellEl.createEl('button', { 
					text: isEnglish ? 'Ignore' : '忽略',
					cls: 'knowledge-ark-issue-button' 
				});
				ignoreButtonEl.onClickEvent(() => {
					this.ignoreIssue(issue.id);
					rowEl.remove();
				});

				// Add unignore button for ignored issues
				if (this.plugin.settings.ignoredIssues.includes(issue.id)) {
					const unignoreButtonEl = actionsCellEl.createEl('button', { 
						text: isEnglish ? 'Unignore' : '取消忽略',
						cls: 'knowledge-ark-issue-button' 
					});
					unignoreButtonEl.onClickEvent(() => {
						this.unignoreIssue(issue.id);
						// Update button text to '忽略'
						ignoreButtonEl.setText('忽略');
						// Remove the unignore button
						unignoreButtonEl.remove();
					});
				}
			}
			
			// Toggle card content
			const toggleContent = () => {
				if (contentEl.isShown()) {
					contentEl.hide();
					toggleEl.innerHTML = expandIcon;
				} else {
					contentEl.show();
					toggleEl.innerHTML = collapseIcon;
				}
			};
			
			toggleEl.onClickEvent((evt) => {
				// Stop propagation to prevent header click event
				evt.stopPropagation();
				toggleContent();
			});
			
			headerEl.onClickEvent(toggleContent);
		}
	}

	private async renderHealthyNotes(container: HTMLElement) {
		const isEnglish = this.plugin.settings.language === 'en';
		// Create a section for healthy notes
		const sectionEl = container.createEl('div', { cls: 'knowledge-ark-healthy-notes-section' });
		
		// Section header
		const headerEl = sectionEl.createEl('div', { cls: 'knowledge-ark-card-header' });
		
		const titleContainerEl = headerEl.createEl('div', { cls: 'knowledge-ark-card-title-container' });
		const titleEl = titleContainerEl.createEl('div', { cls: 'knowledge-ark-card-title' });
		
		// Add a checkmark icon before the title
		titleEl.createEl('span', { text: '✅ ' });
		titleEl.createEl('span', { text: isEnglish ? 'Healthy Notes List' : '健康笔记列表' });
		
		// Get healthy notes
		const allIssues = await this.plugin.runDiagnostics();
		const exporter = new DataExporter(this.plugin, this.app);
		const allFiles = this.app.vault.getMarkdownFiles();
		
		// Filter out excluded folders and files with excluded tags
		const files = allFiles.filter(file => {
			// Check if file is in excluded folders
			const isInExcludedFolder = this.plugin.settings.excludedFolders.some(folder => 
				file.path.startsWith(folder + '/')
			);
			
			// Get file cache to check tags
			const cache = this.app.metadataCache.getFileCache(file);
			
			// Check tags from frontmatter (consistent with diagnostic rules)
			let fileTags: string[] = [];
			if (cache && cache.frontmatter && cache.frontmatter.tags) {
				fileTags = Array.isArray(cache.frontmatter.tags) 
					? cache.frontmatter.tags 
					: cache.frontmatter.tags.split(',').map((tag: string) => tag.trim());
			}
			
			// 支持带#和不带#的标签格式，不区分大小写
			const hasExcludedTag = this.plugin.settings.excludedTags.length > 0 && (() => {
				const normalizedExcludedTags = this.plugin.settings.excludedTags.map((tag: string) => 
					tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
				);
				
				const normalizedFileTags = fileTags.map((tag: string) => 
					tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
				);
				
				return normalizedFileTags.some((fileTag: string) => normalizedExcludedTags.includes(fileTag));
			})();
			
			// Include file only if it's not in excluded folder and doesn't have excluded tags
			return !isInExcludedFolder && !hasExcludedTag;
		});
		
		const healthyFiles = files.filter(file => 
		  !allIssues.some(issue => issue.filePath === file.path)
		);
		
		// Create a container for badge and toggle button
		const badgeToggleContainerEl = headerEl.createEl('div', { cls: 'knowledge-ark-badge-toggle-container' });
		
		// Update badge with count
		badgeToggleContainerEl.createEl('span', { 
			text: healthyFiles.length.toString(), 
			cls: 'knowledge-ark-card-badge' 
		});
		
		// Create toggle button with SVG icon
		const toggleEl = badgeToggleContainerEl.createEl('button', { 
			cls: 'knowledge-ark-card-toggle' 
		});
		
		// SVG icons for expand/collapse
		const expandIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
		const collapseIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
		
		toggleEl.innerHTML = expandIcon;
		
		// Card content (initially hidden)
		const contentEl = sectionEl.createEl('div', { cls: 'knowledge-ark-card-content' });
		contentEl.hide();
		
		// Add a checkmark icon before the title
		titleEl.createEl('span', { text: '✅ ' });
		titleEl.createEl('span', { text: isEnglish ? 'Healthy Notes List' : '健康笔记列表' });
		
		// Create table for healthy notes
			const tableEl = contentEl.createEl('table', { cls: 'knowledge-ark-issue-table' });
			const theadEl = tableEl.createEl('thead');
			const headerRowEl = theadEl.createEl('tr');
			
			// Create sortable headers
			const fileNameHeader = headerRowEl.createEl('th', { text: isEnglish ? 'File Name' : '文件名', cls: 'sortable-header' });
			const domainHeader = headerRowEl.createEl('th', { text: isEnglish ? 'Domain' : '领域', cls: 'sortable-header' });
			const typeHeader = headerRowEl.createEl('th', { text: isEnglish ? 'Type' : '类型', cls: 'sortable-header' });
			
			const tbodyEl = tableEl.createEl('tbody');
			
			// Prepare data for sorting
			const healthyNotesData = healthyFiles.map(file => {
				const cache = this.app.metadataCache.getFileCache(file);
				const domain = cache?.frontmatter?.domain || '';
				const type = cache?.frontmatter?.type || '';
				
				return {
					file,
					fileName: file.name,
					domain,
					type,
					pinyin: this.getPinyin(file.name)
				};
			});
			
			let currentSortField = '';
			let currentSortDirection = 'asc';
			
			const renderTable = (data: any[], sortField: string, direction: string) => {
				tbodyEl.empty();
				
				// Sort data
				const sortedData = [...data].sort((a, b) => {
					let valueA = a[sortField];
					let valueB = b[sortField];
					
					// Handle empty values
					if (!valueA) valueA = '';
					if (!valueB) valueB = '';
					
					// Convert to string for comparison
					const strA = String(valueA).toLowerCase();
					const strB = String(valueB).toLowerCase();
					
					let result = 0;
					
					// Special handling for Chinese characters and pinyin
					if (sortField === 'fileName') {
						// Try pinyin first, then fallback to string comparison
						const pinyinA = a.pinyin || strA;
						const pinyinB = b.pinyin || strB;
						result = pinyinA.localeCompare(pinyinB);
					} else {
						result = strA.localeCompare(strB);
					}
					
					return direction === 'asc' ? result : -result;
				});
				
				// Render rows
				for (const note of sortedData) {
					const rowEl = tbodyEl.createEl('tr');
					
					// File name
					const fileCellEl = rowEl.createEl('td');
					const fileLinkEl = fileCellEl.createEl('a', { 
						text: note.fileName,
						href: '#' 
					});
					fileLinkEl.onClickEvent((evt) => {
						evt.preventDefault();
						this.app.workspace.getLeaf(true).openFile(note.file);
					});
					
					// Domain
					rowEl.createEl('td', { text: note.domain });
					
					// Type
					rowEl.createEl('td', { text: note.type });
				}
			};
			
			// Add click handlers for sorting
			const addSortHandler = (header: HTMLElement, field: string) => {
				header.style.cursor = 'pointer';
				header.style.userSelect = 'none';
				
				header.addEventListener('click', () => {
					if (currentSortField === field) {
						currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
					} else {
						currentSortField = field;
						currentSortDirection = 'asc';
					}
					
					// Update header indicators
					const allHeaders = theadEl.querySelectorAll('.sortable-header');
					allHeaders.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
					
					const directionClass = currentSortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
					header.classList.add(directionClass);
					
					renderTable(healthyNotesData, currentSortField, currentSortDirection);
				});
			};
			
			// Add sort indicators CSS
			const style = document.createElement('style');
			style.textContent = `
				.sortable-header {
					position: relative;
					padding-right: 20px;
				}
				.sortable-header:hover {
					background-color: var(--background-secondary);
				}
				.sorted-asc::after {
					content: ' ↑';
					position: absolute;
					right: 5px;
					color: var(--text-accent);
				}
				.sorted-desc::after {
					content: ' ↓';
					position: absolute;
					right: 5px;
					color: var(--text-accent);
				}
			`;
			document.head.appendChild(style);
			
			// Initialize with file name sorting
			addSortHandler(fileNameHeader, 'fileName');
			addSortHandler(domainHeader, 'domain');
			addSortHandler(typeHeader, 'type');
			
			// Initial render
			renderTable(healthyNotesData, 'fileName', 'asc');
		
		// Toggle content
		const toggleContent = () => {
			if (contentEl.isShown()) {
				contentEl.hide();
				toggleEl.innerHTML = expandIcon;
			} else {
				contentEl.show();
				toggleEl.innerHTML = collapseIcon;
			}
		};
		
		toggleEl.onClickEvent((evt) => {
			// Stop propagation to prevent header click event
			evt.stopPropagation();
			toggleContent();
		});
		
		headerEl.onClickEvent(toggleContent);
	}
	
	/**
	 * Calculate the number of knowledge atoms based on user-defined types
	 * @returns The count of knowledge atoms
	 */
	private calculateAtomCount(): number {
		const files = this.app.vault.getMarkdownFiles();
		let atomCount = 0;
		
		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			const type = cache?.frontmatter?.type;
			
			// Check if the file's type matches any of the user-defined knowledge atom types
			if (type && this.plugin.settings.knowledgeAtomTypes.includes(type)) {
				atomCount++;
			}
		}
		
		return atomCount;
	}
	
	/**
	 * Calculate the connection density of the knowledge graph
	 * @returns The connection density as a string in the format "[↑ inboundAvg] [↓ outboundAvg]"
	 */
	/**
	 * Convert Chinese characters to pinyin for sorting
	 * @param text Input text
	 * @returns Pinyin string for sorting
	 */
	private getPinyin(text: string): string {
		// Simple pinyin mapping for common Chinese characters
		const pinyinMap: { [key: string]: string } = {
			'啊': 'a', '吧': 'ba', '才': 'cai', '的': 'de', '额': 'e', '发': 'fa', '给': 'gei',
			'哈': 'ha', '是': 'shi', '就': 'jiu', '看': 'kan', '了': 'le', '吗': 'ma',
			'你': 'ni', '哦': 'o', '怕': 'pa', '去': 'qu', '人': 'ren', '三': 'san',
			'他': 'ta', '我': 'wo', '想': 'xiang', '一': 'yi', '在': 'zai',
			'阿': 'a', '八': 'ba', '擦': 'ca', '答': 'da', '俄': 'e',
			'噶': 'ga', '击': 'ji', '卡': 'ka', '拉': 'la',
			'那': 'na', '啪': 'pa', '七': 'qi', '然': 'ran', '撒': 'sa',
			'哇': 'wa', '西': 'xi', '呀': 'ya', '杂': 'za',
			'安': 'an', '白': 'bai', '采': 'cai', '带': 'dai', '诶': 'ei',
			'该': 'gai', '海': 'hai', '家': 'jia', '开': 'kai', '来': 'lai', '买': 'mai',
			'乃': 'nai', '欧': 'ou', '拍': 'pai', '千': 'qian', '让': 'rang', '赛': 'sai',
			'太': 'tai', '外': 'wai', '先': 'xian', '再': 'zai',
			'昂': 'ang', '帮': 'bang', '仓': 'cang', '当': 'dang',
			'刚': 'gang', '航': 'hang', '将': 'jiang', '康': 'kang',
			'郎': 'lang', '忙': 'mang', '囊': 'nang', '旁': 'pang', '强': 'qiang',
			'桑': 'sang', '唐': 'tang', '王': 'wang', '香': 'xiang', '张': 'zhang'
		};
		
		// Convert Chinese characters to pinyin
		let pinyin = '';
		for (const char of text) {
			const charPinyin = pinyinMap[char];
			if (charPinyin) {
				pinyin += charPinyin;
			} else if (/[\u4e00-\u9fff]/.test(char)) {
				// For unknown Chinese characters, use a placeholder
				pinyin += 'z';
			} else {
				// For non-Chinese characters, keep as-is
				pinyin += char.toLowerCase();
			}
		}
		
		return pinyin;
	}
	
	private calculateConnectionDensity(): string {
		// Get all markdown files
		const allFiles = this.app.vault.getMarkdownFiles();
		
		// Filter out excluded folders and files with excluded tags
		const files = allFiles.filter(file => {
			// Check if file is in excluded folders
			const isInExcludedFolder = this.plugin.settings.excludedFolders.some(folder => 
				file.path.startsWith(folder + '/')
			);
			
			// Get file cache to check tags
			const cache = this.app.metadataCache.getFileCache(file);
			
			// Check tags from frontmatter (consistent with diagnostic rules)
			let fileTags: string[] = [];
			if (cache && cache.frontmatter && cache.frontmatter.tags) {
				fileTags = Array.isArray(cache.frontmatter.tags) 
					? cache.frontmatter.tags 
					: cache.frontmatter.tags.split(',').map((tag: string) => tag.trim());
			}
			
			// 支持带#和不带#的标签格式，不区分大小写
			const hasExcludedTag = this.plugin.settings.excludedTags.length > 0 && (() => {
				const normalizedExcludedTags = this.plugin.settings.excludedTags.map((tag: string) => 
					tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
				);
				
				const normalizedFileTags = fileTags.map((tag: string) => 
					tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
				);
				
				return normalizedFileTags.some((fileTag: string) => normalizedExcludedTags.includes(fileTag));
			})();
			
			// Include file only if it's not in excluded folder and doesn't have excluded tags
			return !isInExcludedFolder && !hasExcludedTag;
		});
		
		const totalFiles = files.length;
		
		// If there are no files, return default values
		if (totalFiles === 0) {
			return "[↑ 0] [↓ 0]";
		}
		
		let totalInboundLinks = 0;
		let totalOutboundLinks = 0;
		
		// Get resolved links from metadata cache
		const resolvedLinks = this.app.metadataCache.resolvedLinks;
		
		// Iterate through filtered files to count links
		for (const file of files) {
			// Count outbound links (links to other files)
			const outboundLinks = resolvedLinks[file.path] ? Object.values(resolvedLinks[file.path]).reduce((sum, count) => sum + count, 0) : 0;
			totalOutboundLinks += outboundLinks;
			
			// Count inbound links (backlinks from other files)
			let inboundLinks = 0;
			for (const sourcePath in resolvedLinks) {
				// Check if source file is also in our filtered list
				const sourceFile = allFiles.find(f => f.path === sourcePath);
				if (sourceFile) {
					// Check if source file should be included
					const sourceCache = this.app.metadataCache.getFileCache(sourceFile);
					const sourceTags = sourceCache?.tags?.map(tag => tag.tag) || [];
					const isSourceInExcludedFolder = this.plugin.settings.excludedFolders.some(folder => 
						sourceFile.path.startsWith(folder + '/')
					);
					const hasSourceExcludedTag = this.plugin.settings.excludedTags.some(excludedTag => 
						sourceTags.includes('#' + excludedTag)
					);
					
					// Only count links from included files
					if (!isSourceInExcludedFolder && !hasSourceExcludedTag) {
						if (resolvedLinks[sourcePath][file.path]) {
							inboundLinks += resolvedLinks[sourcePath][file.path];
						}
					}
				}
			}
			totalInboundLinks += inboundLinks;
		}
		
		// Calculate averages
		const inboundAvg = (totalInboundLinks / totalFiles).toFixed(1);
		const outboundAvg = (totalOutboundLinks / totalFiles).toFixed(1);
		
		// Return formatted string
		return `[↑ ${inboundAvg}] [↓ ${outboundAvg}]`;
	}
	
	async recheckFileIssues(filePath: string, ruleId: string, issueRowEl: HTMLElement) {
		const isEnglish = this.plugin.settings.language === 'en';
		
		// Show loading state
		const originalText = issueRowEl.querySelector('.knowledge-ark-issue-button')?.textContent;
		const recheckButton = issueRowEl.querySelector('.knowledge-ark-issue-button') as HTMLButtonElement;
		if (recheckButton) {
			recheckButton.textContent = isEnglish ? 'Checking...' : '检查中...';
			recheckButton.disabled = true;
		}
		
		try {
			// Get the specific rule to recheck this file
			const ruleRegistry = RuleRegistry.getInstance();
			const rule = ruleRegistry.getRules(this.plugin, this.app).find((r: DiagnosticRule) => r.id === ruleId);
			
			if (!rule) {
				console.error(`Rule not found: ${ruleId}`);
				return;
			}
			
			// Check this specific file
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (!file || !(file instanceof TFile)) {
				console.error(`File not found: ${filePath}`);
				return;
			}
			
			// Run the rule check for this specific file
			const newIssues = await rule.check();
			const fileIssues = newIssues.filter((issue: DiagnosticIssue) => issue.filePath === filePath && !issue.isIgnored);
			
			// Find the existing issue for this file
			const existingIssues = this.plugin.settings.savedDiagnosisResults?.issues || [];
			const oldIssue = existingIssues.find((issue: DiagnosticIssue) => 
				issue.filePath === filePath && 
				issue.ruleId === ruleId && 
				!issue.isIgnored
			);
			
			// If the issue is fixed (no longer exists)
			if (fileIssues.length === 0 && oldIssue) {
				// Remove the issue from saved results
				const updatedIssues = existingIssues.filter((issue: DiagnosticIssue) => issue.id !== oldIssue.id);
				
				// Recalculate health metrics
				const healthScore = this.calculateHealthScore(updatedIssues);
				const atomCount = this.calculateAtomCount();
				const connectionDensity = this.calculateConnectionDensity();
				
				// Update saved diagnosis results
				const currentResults = this.plugin.settings.savedDiagnosisResults || { issues: [], healthScore: 100, atomCount: 0, connectionDensity: '0', diagnosisTime: 0 };
				this.plugin.settings.savedDiagnosisResults = {
					...currentResults,
					issues: updatedIssues,
					healthScore: healthScore,
					atomCount: atomCount,
					connectionDensity: connectionDensity,
					diagnosisTime: Date.now()
				};
				await this.plugin.saveSettings();
				
				// Update the health score display
				const scoreEl = this.containerEl.querySelector('.knowledge-ark-score');
				const isEnglish = this.plugin.settings.language === 'en';
				if (scoreEl) {
					scoreEl.textContent = isEnglish ? `Health Score: ${healthScore}%` : `健康度总分: ${healthScore}%`;
					scoreEl.className = `knowledge-ark-score ${this.getScoreClass(healthScore)}`;
				}
				
				// Update other metrics
				const atomCountEl = this.containerEl.querySelector('.knowledge-ark-atom-count');
				if (atomCountEl) {
					atomCountEl.textContent = isEnglish ? `Knowledge Atom Stats: ${atomCount}` : `知识原子统计: ${atomCount}`;
				}
				
				const connectionDensityEl = this.containerEl.querySelector('.knowledge-ark-connection-density');
				if (connectionDensityEl) {
					connectionDensityEl.textContent = isEnglish ? `Connection Density: ${connectionDensity}` : `连接密度: ${connectionDensity}`;
				}
				
				// Remove the row from the table
				issueRowEl.remove();
				
				// Update the badge count for this rule
				this.updateRuleBadgeCount(ruleId);
				
				// If no more issues for this rule, remove the entire card
				const remainingIssues = updatedIssues.filter((issue: DiagnosticIssue) => issue.ruleId === ruleId);
				if (remainingIssues.length === 0) {
					const ruleCard = this.containerEl.querySelector(`[data-rule-id="${ruleId}"]`);
					if (ruleCard) {
						ruleCard.remove();
					}
				}
				
				console.log(`Issue fixed for file: ${filePath}, rule: ${ruleId}, new health score: ${healthScore}`);
			} else if (fileIssues.length > 0 && oldIssue) {
				// Issue still exists, update the issue details if needed
				const updatedIssues = existingIssues.map((issue: DiagnosticIssue) => 
					issue.id === oldIssue.id ? fileIssues[0] : issue
				);
				
				// Recalculate health metrics
				const healthScore = this.calculateHealthScore(updatedIssues);
				const atomCount = this.calculateAtomCount();
				const connectionDensity = this.calculateConnectionDensity();
				
				const currentResults = this.plugin.settings.savedDiagnosisResults || { issues: [], healthScore: 100, atomCount: 0, connectionDensity: '0', diagnosisTime: 0 };
				this.plugin.settings.savedDiagnosisResults = {
					...currentResults,
					issues: updatedIssues,
					healthScore: healthScore,
					atomCount: atomCount,
					connectionDensity: connectionDensity,
					diagnosisTime: Date.now()
				};
				await this.plugin.saveSettings();
				
				// Update the health score display
				const scoreEl = this.containerEl.querySelector('.knowledge-ark-score');
				const isEnglish = this.plugin.settings.language === 'en';
				if (scoreEl) {
					scoreEl.textContent = isEnglish ? `Health Score: ${healthScore}%` : `健康度总分: ${healthScore}%`;
					scoreEl.className = `knowledge-ark-score ${this.getScoreClass(healthScore)}`;
				}
				
				// Update other metrics
				const atomCountEl = this.containerEl.querySelector('.knowledge-ark-atom-count');
				if (atomCountEl) {
					atomCountEl.textContent = isEnglish ? `Knowledge Atom Stats: ${atomCount}` : `知识原子统计: ${atomCount}`;
				}
				
				const connectionDensityEl = this.containerEl.querySelector('.knowledge-ark-connection-density');
				if (connectionDensityEl) {
					connectionDensityEl.textContent = isEnglish ? `Connection Density: ${connectionDensity}` : `连接密度: ${connectionDensity}`;
				}
				
				console.log(`Issue updated for file: ${filePath}, rule: ${ruleId}, new health score: ${healthScore}`);
			}
			
		} catch (error) {
			console.error(`Error rechecking file ${filePath}:`, error);
		} finally {
			// Restore button state
			if (recheckButton) {
				recheckButton.textContent = originalText || (isEnglish ? 'Recheck' : '重检');
				recheckButton.disabled = false;
			}
		}
	}
	
	private updateRuleBadgeCount(ruleId: string) {
		const ruleCard = this.containerEl.querySelector(`[data-rule-id="${ruleId}"]`);
		if (!ruleCard) return;
		
		const badgeEl = ruleCard.querySelector('.knowledge-ark-card-badge');
		if (!badgeEl) return;
		
		const currentIssues = this.plugin.settings.savedDiagnosisResults?.issues || [];
		const ruleIssues = currentIssues.filter(issue => issue.ruleId === ruleId && !issue.isIgnored);
		
		badgeEl.textContent = ruleIssues.length.toString();
	}

	async navigateToIssue(filePath: string, position: { start: number; end: number }) {
		// Open the file
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file) {
			const leaf = this.app.workspace.getLeaf(true);
			await leaf.openFile(file as TFile);
			
			// Scroll to the position if editor is available
			const editor = leaf.view instanceof MarkdownView ? leaf.view.editor : null;
			if (editor) {
				const pos = editor.offsetToPos(position.start);
				editor.setCursor(pos);
				editor.scrollIntoView({ from: pos, to: pos }, true);
			}
		} else {
			console.error(`File not found: ${filePath}`);
		}
	}
	
	ignoreIssue(issueId: string) {
		// Add issueId to ignoredIssues in settings
		if (!this.plugin.settings.ignoredIssues.includes(issueId)) {
			this.plugin.settings.ignoredIssues.push(issueId);
			this.plugin.saveSettings();
		}
	}

	unignoreIssue(issueId: string) {
		// Remove issueId from ignoredIssues in settings
		const index = this.plugin.settings.ignoredIssues.indexOf(issueId);
		if (index > -1) {
			this.plugin.settings.ignoredIssues.splice(index, 1);
			this.plugin.saveSettings();
		}
	}
	
	async onClose() {
		// Nothing to clean up.
		return;
	}

	/**
	 * Navigate to a specific file in the diagnostic view
	 * @param filePath The path of the file to navigate to
	 */
	async navigateToFile(filePath: string) {
		// Find the card that contains issues for this file
		const resultsEl = this.containerEl.querySelector('.knowledge-ark-results');
		if (!resultsEl) return;

		// Scroll to the first issue for this file
		const issues = this.plugin.settings.savedDiagnosisResults?.issues || [];
		const fileIssues = issues.filter(issue => issue.filePath === filePath && !issue.isIgnored);
		
		if (fileIssues.length > 0) {
			// Find the card for the rule of the first issue
			const firstIssue = fileIssues[0];
			const ruleCard = resultsEl.querySelector(`[data-rule-id="${firstIssue.ruleId}"]`);
			
			if (ruleCard) {
				// Ensure the card is visible (expand if collapsed)
				const cardHeader = ruleCard.querySelector('.knowledge-ark-card-header') as HTMLElement;
				const cardContent = ruleCard.querySelector('.knowledge-ark-card-content') as HTMLElement;
				
				if (cardHeader && cardContent && cardContent.style.display === 'none') {
					// Click to expand if collapsed
					cardHeader.click();
				}
				
				// Scroll the card into view after a brief delay for animation
				setTimeout(() => {
					ruleCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
					
					// Highlight the specific issue for this file
					const issueElements = ruleCard.querySelectorAll('.diagnostic-issue');
					for (let i = 0; i < issueElements.length; i++) {
						const issueEl = issueElements[i] as HTMLElement;
						const issueFilePath = issueEl.getAttribute('data-file-path');
						if (issueFilePath === filePath) {
							issueEl.style.backgroundColor = 'var(--background-modifier-active)';
							issueEl.style.borderLeft = '3px solid var(--interactive-accent)';
							setTimeout(() => {
								issueEl.style.backgroundColor = '';
								issueEl.style.borderLeft = '';
							}, 3000);
							break;
						}
					}
				}, 100);
			}
		}
	}
}
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { KnowledgeArkSettingTab } from './settings';
import { KnowledgeArkView, VIEW_TYPE } from './view';
import { DiagnosticRule, DiagnosticIssue, KnowledgeArkSettings } from './types';
import { MetadataIntegrityRule, NoteAtomicityRule, NakedLinksRule, GraphConnectivityRule, PredicateConsistencyRule } from './diagnostic-rules';
import { DataExporter } from './export';

// Default settings
const DEFAULT_SETTINGS: KnowledgeArkSettings = {
	requiredMetadataFields: ['type', 'status', 'domain'],
	maxNoteLength: 1500,
	minContextLength: 50,
	excludedFolders: [],
	excludedTags: [],
	ignoredIssues: [],
	exportTemplate: '{"instruction": "请根据以下内容生成知识图谱节点和关系", "input": {"content": {{content}}, "fileName": {{fileName}}, "filePath": {{filePath}}, "frontmatter": {{frontmatter}}}, "output": {"tags": {{tags}}, "type": {{type}}, "links": {{links}}, "headings": {{headings}}}}',
	knowledgeAtomTypes: ['atom', 'concept', 'entity'],
	language: 'zh',
	ruleWeights: {
		'metadata-integrity': 5.0,
		'naked-links': 2.0,
		'graph-connectivity': 1.0,
		'note-atomicity': 0.8,
		'predicate-consistency': 0.5,
		'word-count-exceed': 0.1
	},
	predicateUsageThreshold: 1,
	lastDiagnosisTime: 0
}

// Rule Registry
export class RuleRegistry {
  private static instance: RuleRegistry;
  private rules: Map<string, new (plugin: KnowledgeArkPlugin, app: App) => DiagnosticRule> = new Map();

  private constructor() {}

  static getInstance(): RuleRegistry {
    if (!RuleRegistry.instance) {
      RuleRegistry.instance = new RuleRegistry();
    }
    return RuleRegistry.instance;
  }

  registerRule(id: string, ruleClass: new (plugin: KnowledgeArkPlugin, app: App) => DiagnosticRule) {
    this.rules.set(id, ruleClass);
  }

  getRules(plugin: KnowledgeArkPlugin, app: App): DiagnosticRule[] {
    return Array.from(this.rules.values()).map(RuleClass => new RuleClass(plugin, app));
  }

  getRuleIds(): string[] {
    return Array.from(this.rules.keys());
  }
}

export default class KnowledgeArkPlugin extends Plugin {
	settings: KnowledgeArkSettings;
	statusBarItem: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// Register diagnostic rules
		const ruleRegistry = RuleRegistry.getInstance();
		ruleRegistry.registerRule('metadata-integrity', MetadataIntegrityRule);
		ruleRegistry.registerRule('note-atomicity', NoteAtomicityRule);
		ruleRegistry.registerRule('naked-links', NakedLinksRule);
		ruleRegistry.registerRule('graph-connectivity', GraphConnectivityRule);
		ruleRegistry.registerRule('predicate-consistency', PredicateConsistencyRule);

		// Create ribbon icon
		const ribbonIconTitle = this.settings.language === 'en' ? 'Knowledge Ark Diagnostic Center' : '知识方舟诊断中心';
		const ribbonIconEl = this.addRibbonIcon('lucide-compass', ribbonIconTitle, (evt: MouseEvent) => {
			this.activateView();
		});
		ribbonIconEl.addClass('knowledge-ark-ribbon-class');

		// Register view
		this.registerView(
			VIEW_TYPE,
			(leaf) => new KnowledgeArkView(leaf, this)
		);

		// Add settings tab
		this.addSettingTab(new KnowledgeArkSettingTab(this.app, this));

		// Add command to open the view
		this.addCommand({
			id: 'open-knowledge-ark-view',
			name: this.settings.language === 'en' ? 'Open Knowledge Ark Diagnostic Center' : '打开知识方舟诊断中心',
			callback: () => {
				this.activateView();
			}
		});

		// Add status bar item for current note diagnostics
		this.createStatusBarItem();
		
		// Listen for active file changes
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.updateStatusBarItem();
			})
		);
		
		// Listen for file modifications
		this.registerEvent(
			this.app.vault.on('modify', () => {
				this.updateStatusBarItem();
			})
		);
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE);
		
		// Clean up status bar item
		if (this.statusBarItem) {
			this.statusBarItem.remove();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		// Check if the view is already open
		const existingLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
		if (existingLeaves.length > 0) {
			// If view exists, just activate it instead of reopening
			const existingLeaf = existingLeaves[0];
			this.app.workspace.revealLeaf(existingLeaf);
			return;
		}

		// If view doesn't exist, create a new one
		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE,
				active: true,
			});

			this.app.workspace.revealLeaf(leaf);
		}
	}

	async runDiagnostics(incremental: boolean = false): Promise<DiagnosticIssue[]> {
		// Get rules from registry
		const ruleRegistry = RuleRegistry.getInstance();
		const rules: DiagnosticRule[] = ruleRegistry.getRules(this, this.app);

		// Get the last diagnosis time from settings
		const lastDiagnosisTime = this.settings.lastDiagnosisTime || 0;

		// Get all markdown files
		const allFiles = this.app.vault.getMarkdownFiles();

		// Filter files for incremental diagnosis
		let filesToCheck = allFiles;
		if (incremental) {
			filesToCheck = allFiles.filter(file => {
				// Ensure the file is a TFile and check its modification time
				return file instanceof TFile && file.stat.mtime > lastDiagnosisTime;
			});
		}

		// Run all diagnostic rules in parallel
		const rulePromises = rules.map(async (rule) => {
			try {
				const issues = await rule.check();
				
				// Filter issues for incremental diagnosis
				if (incremental) {
					return issues.filter(issue => 
						filesToCheck.some(file => file.path === issue.filePath)
					);
				}
				
				return issues;
			} catch (error) {
				console.error(`Error running diagnostic rule ${rule.name}:`, error);
				return [];
			}
		});

		// Wait for all rules to complete
		const results = await Promise.all(rulePromises);
		
		// Flatten the results into a single array
		const allIssues = results.flat();

		// Update last diagnosis time
		if (incremental) {
			this.settings.lastDiagnosisTime = Date.now();
			await this.saveSettings();
		}

		return allIssues;
	}

	async exportHealthyNotes(issues: DiagnosticIssue[]): Promise<void> {
		const exporter = new DataExporter(this, this.app);
		await exporter.exportHealthyNotes(issues);
	}

	createStatusBarItem() {
		this.statusBarItem = super.addStatusBarItem();
		this.statusBarItem?.addClass('knowledge-ark-status-bar');
		this.updateStatusBarItem();
	}

	async updateStatusBarItem() {
		if (!this.statusBarItem) return;

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			this.statusBarItem.style.display = 'none';
			return;
		}

		this.statusBarItem.style.display = 'block';
		this.statusBarItem.textContent = this.settings.language === 'en' ? 'Diagnosing...' : '诊断中...';

		try {
			// Check if file should be excluded
			const isExcludedByFolder = this.settings.excludedFolders.some(folder => 
				activeFile.path.startsWith(folder + '/') || activeFile.path === folder
			);
			
			let isExcludedByTag = false;
			const cache = this.app.metadataCache.getFileCache(activeFile);
			if (cache && cache.frontmatter && cache.frontmatter.tags && this.settings.excludedTags.length > 0) {
				const fileTags = Array.isArray(cache.frontmatter.tags) 
					? cache.frontmatter.tags 
					: cache.frontmatter.tags.split(',').map((tag: string) => tag.trim());
				
				const normalizedExcludedTags = this.settings.excludedTags.map((tag: string) => 
					tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
				);
				
				const normalizedFileTags = fileTags.map((tag: string) => 
					tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
				);
				
				isExcludedByTag = normalizedFileTags.some((fileTag: string) => normalizedExcludedTags.includes(fileTag));
			}

			// Handle excluded files
			if (isExcludedByFolder || isExcludedByTag) {
				this.statusBarItem.textContent = this.settings.language === 'en' ? '⭕ Excluded Note' : '⭕ 排除笔记';
				this.statusBarItem.title = this.settings.language === 'en' 
					? 'This note is excluded from diagnostics' 
					: '该笔记已从诊断中排除';
				this.statusBarItem.style.color = '#6c757d'; // 灰色
				this.statusBarItem.onclick = () => {
					// 被排除的文件不跳转到诊断视图
					console.log(`Note ${activeFile.path} is excluded from diagnostics`);
				};
				return;
			}

			// Get issues for the current file
			const issues = await this.getFileIssues(activeFile.path);
			
			if (issues.length === 0) {
				this.statusBarItem.textContent = this.settings.language === 'en' ? '✅ Healthy Note' : '✅ 健康笔记';
				this.statusBarItem.title = this.settings.language === 'en' ? 'This note has no issues' : '该笔记没有发现问题';
				this.statusBarItem.style.color = '#28a745';
			} else {
				// Show the first issue
				const firstIssue = issues[0];
				const ruleName = this.getRuleDisplayName(firstIssue.ruleId);
				const severityIcon = this.getSeverityIcon(firstIssue.severity);
				
				this.statusBarItem.textContent = `${severityIcon} ${ruleName}`;
				this.statusBarItem.title = firstIssue.contextPreview;
				this.statusBarItem.style.color = this.getSeverityColor(firstIssue.severity);
			}

			// Add click handler to navigate to the issue
			this.statusBarItem.onclick = () => {
				this.activateViewAndNavigateToFile(activeFile.path);
			};
		} catch (error) {
			console.error('Error updating status bar:', error);
			this.statusBarItem.textContent = this.settings.language === 'en' ? '❌ Error' : '❌ 错误';
		}
	}

	async getFileIssues(filePath: string): Promise<DiagnosticIssue[]> {
		// Check if file should be excluded
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file || !(file instanceof TFile)) {
			return [];
		}

		// Check if file is in excluded folder
		const isExcludedByFolder = this.settings.excludedFolders.some(folder => 
			filePath.startsWith(folder + '/') || filePath === folder
		);
		if (isExcludedByFolder) {
			return [];
		}

		// Check if file has excluded tags
		const cache = this.app.metadataCache.getFileCache(file);
		if (cache && cache.frontmatter && cache.frontmatter.tags && this.settings.excludedTags.length > 0) {
			const fileTags = Array.isArray(cache.frontmatter.tags) 
				? cache.frontmatter.tags 
				: cache.frontmatter.tags.split(',').map((tag: string) => tag.trim());
			
			// 支持带#和不带#的标签格式，不区分大小写
			const normalizedExcludedTags = this.settings.excludedTags.map((tag: string) => 
				tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
			);
			
			const normalizedFileTags = fileTags.map((tag: string) => 
				tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
			);
			
			if (normalizedFileTags.some((fileTag: string) => normalizedExcludedTags.includes(fileTag))) {
					return [];
				}
		}

		// Use cached results if available and recent
		const savedResults = this.settings.savedDiagnosisResults;
		if (savedResults && savedResults.issues) {
			return savedResults.issues.filter(issue => issue.filePath === filePath && !issue.isIgnored);
		}

		// Otherwise run a quick diagnosis for this file
		const ruleRegistry = RuleRegistry.getInstance();
		const rules = ruleRegistry.getRules(this, this.app);
		const fileIssues: DiagnosticIssue[] = [];

		for (const rule of rules) {
			try {
				const issues = await rule.check();
				fileIssues.push(...issues.filter(issue => issue.filePath === filePath && !issue.isIgnored));
			} catch (error) {
				console.error(`Error running rule ${rule.id}:`, error);
			}
		}

		return fileIssues;
	}

	getRuleDisplayName(ruleId: string): string {
		const ruleNames: Record<string, string> = {
			'metadata-integrity': this.settings.language === 'en' ? 'Metadata Issue' : '元数据问题',
			'note-atomicity': this.settings.language === 'en' ? 'Atomicity Issue' : '原子化问题',
			'naked-links': this.settings.language === 'en' ? 'Link Issue' : '链接问题',
			'graph-connectivity': this.settings.language === 'en' ? 'Connectivity Issue' : '连接问题',
			'predicate-consistency': this.settings.language === 'en' ? 'Predicate Issue' : '谓词问题'
		};
		return ruleNames[ruleId] || ruleId;
	}

	getSeverityIcon(severity: string): string {
		switch (severity) {
			case 'high': return '🔴';
			case 'medium': return '🟡';
			case 'low': return '🔵';
			default: return '⚪';
		}
	}

	getSeverityColor(severity: string): string {
		switch (severity) {
			case 'high': return '#dc3545';
			case 'medium': return '#ffc107';
			case 'low': return '#17a2b8';
			default: return '#6c757d';
		}
	}

	async activateViewAndNavigateToFile(filePath: string) {
		await this.activateView();
		
		// Wait a bit for the view to be ready
		setTimeout(() => {
			const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
			if (leaves.length > 0) {
				const view = leaves[0].view as KnowledgeArkView;
				view.navigateToFile(filePath);
			}
		}, 100);
	}
}
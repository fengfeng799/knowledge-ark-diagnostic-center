import { App, TFile, Notice } from 'obsidian';
import KnowledgeArkPlugin from './main';
import { DiagnosticIssue } from './types';

export class DataExporter {
  constructor(private plugin: KnowledgeArkPlugin, private app: App) {}
  
  async exportHealthyNotes(issues: DiagnosticIssue[]): Promise<void> {
    // Get all markdown files
    const files = this.app.vault.getMarkdownFiles();
    
    // Filter out files with issues
    let healthyFiles = files.filter(file => 
      !issues.some(issue => issue.filePath === file.path)
    );
    
    // Apply excluded folders filter
    healthyFiles = healthyFiles.filter(file => 
      !this.plugin.settings.excludedFolders.some((folder: string) => file.path.startsWith(folder + '/') || file.path === folder)
    );
    
    // Apply excluded tags filter
		healthyFiles = healthyFiles.filter(file => {
		  const cache = this.app.metadataCache.getFileCache(file);
		  if (cache && cache.frontmatter && cache.frontmatter.tags && this.plugin.settings.excludedTags.length > 0) {
			const fileTags = Array.isArray(cache.frontmatter.tags) 
			  ? cache.frontmatter.tags 
			  : cache.frontmatter.tags.split(',').map((tag: string) => tag.trim());
			
			// 支持带#和不带#的标签格式，不区分大小写
			const normalizedExcludedTags = this.plugin.settings.excludedTags.map((tag: string) => 
			  tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
			);
			
			const normalizedFileTags = fileTags.map((tag: string) => 
			  tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
			);
			
			return !normalizedFileTags.some((fileTag: string) => normalizedExcludedTags.includes(fileTag));
		  }
		  return true;
		});
    
    // Log excluded folders and tags for debugging
    console.log('Excluded folders:', this.plugin.settings.excludedFolders);
    console.log('Excluded tags:', this.plugin.settings.excludedTags);
    
    // Calculate the number of problematic files after applying exclusion rules
    // Problematic files are those with issues and not excluded
    const problematicFiles = files.filter(file => {
      // Check if the file has any issues
      const hasIssue = issues.some(issue => issue.filePath === file.path);
      
      // If no issues, it's not a problematic file
      if (!hasIssue) return false;
      
      // Check if the file is excluded by folder
      const isExcludedByFolder = this.plugin.settings.excludedFolders.some((folder: string) => file.path.startsWith(folder + '/') || file.path === folder);
      if (isExcludedByFolder) return false;
      
      // Check if the file is excluded by tags
		const cache = this.app.metadataCache.getFileCache(file);
		if (cache && cache.frontmatter && cache.frontmatter.tags && this.plugin.settings.excludedTags.length > 0) {
		  const fileTags = Array.isArray(cache.frontmatter.tags) 
			? cache.frontmatter.tags 
			: cache.frontmatter.tags.split(',').map((tag: string) => tag.trim());
		  
		  // 支持带#和不带#的标签格式，不区分大小写
		  const normalizedExcludedTags = this.plugin.settings.excludedTags.map((tag: string) => 
			tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
		  );
		  
		  const normalizedFileTags = fileTags.map((tag: string) => 
			tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
		  );
		  
		  const isExcludedByTag = normalizedFileTags.some((fileTag: string) => normalizedExcludedTags.includes(fileTag));
		  if (isExcludedByTag) return false;
		}
      
      // If it has issues and is not excluded, it's a problematic file
      return true;
    });
    
    // Show a notice with the number of healthy files
    new Notice(`导出 ${healthyFiles.length} 个健康笔记，${problematicFiles.length} 个笔记有问题。`);
    
    // Convert healthy files to JSONL
    const jsonlLines: string[] = [];
    
    for (const file of healthyFiles) {
      // Skip excluded folders
      if (this.plugin.settings.excludedFolders.some((folder: string) => file.path.startsWith(folder + '/') || file.path === folder)) {
        continue;
      }
      
      // Skip excluded tags
		const cache = this.app.metadataCache.getFileCache(file);
		if (cache && cache.frontmatter && cache.frontmatter.tags && this.plugin.settings.excludedTags.length > 0) {
		  const fileTags = Array.isArray(cache.frontmatter.tags) 
			? cache.frontmatter.tags 
			: cache.frontmatter.tags.split(',').map((tag: string) => tag.trim());
		  
		  // 支持带#和不带#的标签格式，不区分大小写
    const normalizedExcludedTags = this.plugin.settings.excludedTags.map((tag: string) => 
      tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
    );
    
    const normalizedFileTags = fileTags.map((tag: string) => 
      tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
    );
    
    if (normalizedFileTags.some((fileTag: string) => normalizedExcludedTags.includes(fileTag))) {
      continue;
    }
		}
      
      const content = await this.app.vault.read(file);
      
      // Create JSON object based on template
      const jsonObject: Record<string, any> = {};
      
      // Simple template replacement with proper escaping
      // In a real implementation, this would be more sophisticated
      const template = this.plugin.settings.exportTemplate
        .replace('{{content}}', JSON.stringify(content))
        .replace('{{tags}}', JSON.stringify(cache?.tags?.map(tag => tag.tag).join(', ') || ''))
        .replace('{{type}}', JSON.stringify(cache?.frontmatter?.type || ''))
        .replace('{{fileName}}', JSON.stringify(file.name))
        .replace('{{filePath}}', JSON.stringify(file.path))
        .replace('{{frontmatter}}', JSON.stringify(cache?.frontmatter || {}))
        .replace('{{links}}', JSON.stringify(cache?.links || []))
        .replace('{{headings}}', JSON.stringify(cache?.headings || []));
      
      try {
        const parsedTemplate = JSON.parse(template);
        jsonlLines.push(JSON.stringify(parsedTemplate));
        console.log(`Successfully parsed template for file ${file.path}`);
      } catch (error) {
        console.error(`Error parsing template for file ${file.path}:`, error);
        console.error(`Template content: ${template}`);
      }
    }
    
    // Create JSONL content
    const jsonlContent = jsonlLines.join('\n');
    
    // Create download
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-ark-export.jsonl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
}
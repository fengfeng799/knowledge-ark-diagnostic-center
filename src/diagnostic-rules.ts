import { App, TFile } from 'obsidian';
import { DiagnosticRule, DiagnosticIssue } from './types';
import KnowledgeArkPlugin from './main';

export class MetadataIntegrityRule implements DiagnosticRule {
  id = 'metadata-integrity';
  name = '元数据完整性检查';
  description = '检查笔记文件是否包含规范的YAML Frontmatter';
  
  constructor(private plugin: KnowledgeArkPlugin, private app: App) {}
  
  async check(): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      // Skip excluded folders
      if (this.plugin.settings.excludedFolders.some((folder: string) => file.path.startsWith(folder))) {
        continue;
      }
      
      const cache = this.app.metadataCache.getFileCache(file);
      
      // Skip excluded tags - 被排除的笔记不参与诊断
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
          continue; // 跳过被排除标签的笔记
        }
      }
      
      // Check if YAML frontmatter exists
      if (!cache || !cache.frontmatter) {
        issues.push({
          id: `${this.id}-${file.path}`,
          ruleId: this.id,
          filePath: file.path,
          fileName: file.name,
          contextPreview: this.plugin.settings.language === 'en' ? 'Missing YAML Frontmatter' : '缺少YAML Frontmatter',
          position: { start: 0, end: 0 },
          severity: 'high',
          isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${file.path}`)
        });
        continue;
      }
      
      // Check required fields
      const missingFields: string[] = [];
      for (const field of this.plugin.settings.requiredMetadataFields) {
        if (!(field in cache.frontmatter)) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        issues.push({
          id: `${this.id}-${file.path}`,
          ruleId: this.id,
          filePath: file.path,
          fileName: file.name,
          contextPreview: this.plugin.settings.language === 'en' ? `Missing required fields: ${missingFields.join(', ')}` : `缺少必填字段: ${missingFields.join(', ')}`,
          position: { start: 0, end: 0 },
          severity: 'medium',
          isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${file.path}`)
        });
      }
    }
    
    return issues;
  }
}

export class NoteAtomicityRule implements DiagnosticRule {
  id = 'note-atomicity';
  name = '笔记原子化程度检查';
  description = '检查笔记是否过于冗长或主题分散';
  
  constructor(private plugin: KnowledgeArkPlugin, private app: App) {}
  
  async check(): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      // Skip excluded folders
      if (this.plugin.settings.excludedFolders.some((folder: string) => file.path.startsWith(folder))) {
        continue;
      }
      
      const cache = this.app.metadataCache.getFileCache(file);
      
      // Skip excluded tags
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
      
      // Check note length
      if (content.length > this.plugin.settings.maxNoteLength) {
        issues.push({
          id: `${this.id}-${file.path}`,
          ruleId: this.id,
          filePath: file.path,
          fileName: file.name,
          contextPreview: this.plugin.settings.language === 'en' ? `Note length (${content.length}) exceeds threshold (${this.plugin.settings.maxNoteLength})` : `笔记长度 (${content.length}) 超过阈值 (${this.plugin.settings.maxNoteLength})`,
          position: { start: 0, end: 0 },
          severity: 'medium',
          isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${file.path}`)
        });
      }
      
      // Check for multiple H1 headers and count H2 headers for better context
      // Remove code blocks (including unclosed ones) and YAML front matter before counting headers
      let processedContent = content.replace(/```[\s\S]*?```/g, '').replace(/```[\s\S]*$/g, '');
      processedContent = processedContent.replace(/`[^`]*`/g, '');
      processedContent = processedContent.replace(/---[\s\S]*?---/, '');
      const h1Count = (processedContent.match(/^#\s/gm) || []).length;
      const h2Count = (processedContent.match(/^##\s/gm) || []).length;
      
      if (h1Count > 1) {
        issues.push({
          id: `${this.id}-${file.path}-h1`,
          ruleId: this.id,
          filePath: file.path,
          fileName: file.name,
          contextPreview: this.plugin.settings.language === 'en' ? `Found ${h1Count} H1 headers and ${h2Count} H2 headers` : `发现 ${h1Count} 个H1标题，${h2Count} 个H2标题`,
          position: { start: 0, end: 0 },
          severity: 'medium',
          isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${file.path}-h1`)
        });
      } else if (h2Count >= 5) {
        // Warn about too many H2 titles when there's only one H1
        issues.push({
          id: `${this.id}-${file.path}-h2`,
          ruleId: this.id,
          filePath: file.path,
          fileName: file.name,
          contextPreview: this.plugin.settings.language === 'en' ? `Found ${h2Count} H2 headers, consider splitting the note` : `发现 ${h2Count} 个H2标题，建议考虑拆分笔记`,
          position: { start: 0, end: 0 },
          severity: 'low',
          isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${file.path}-h2`)
        });
      }
    }
    
    return issues;
  }
}

export class NakedLinksRule implements DiagnosticRule {
  id = 'naked-links';
  name = '裸链接检查';
  description = '检查内部链接是否缺少足够的上下文';
  
  constructor(private plugin: KnowledgeArkPlugin, private app: App) {}
  
  async check(): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      // Skip excluded folders
      if (this.plugin.settings.excludedFolders.some((folder: string) => file.path.startsWith(folder))) {
        continue;
      }
      
      const cache = this.app.metadataCache.getFileCache(file);
      
      // Skip excluded tags
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
      const cache2 = this.app.metadataCache.getFileCache(file);
      
      if (!cache2 || !cache2.links) {
        continue;
      }
      
      for (const link of cache2.links) {
        // Only check internal links
        if (link.link.startsWith('http')) {
          continue;
        }
        
        const linkStart = link.position.start.offset;
        const linkEnd = link.position.end.offset;
        
        // Get context around the link
        const contextStart = Math.max(0, linkStart - this.plugin.settings.minContextLength);
        const contextEnd = Math.min(content.length, linkEnd + this.plugin.settings.minContextLength);
        const context = content.substring(contextStart, contextEnd);
        
        // Check if the link text itself contains meaningful words
        const linkText = link.displayText || link.link;
        const hasMeaningfulLinkText = /[\u4e00-\u9fa5a-zA-Z0-9]{2,}/.test(linkText);
        
        // Check for verbs or meaningful context around the link - simplified check for any Chinese characters
        const hasVerbInContext = /[\u4e00-\u9fa5]/.test(context);
        
        // Check for simple context indicators like "总结", "说明", "参考" etc.
        const contextKeywords = /(总结|说明|参考|详见|见|关于|介绍|讨论|分析|描述|解释|定义|提供|展示|记录|表示|指出|强调|认为|觉得|发现|::|关联|连接|影响|导致|促进|抑制|包含|组成|构成|体现|代表|象征|反映|支持|反对|依赖|源于|归因于|属于|作用于|适用于|应用于|产生|形成|达成|实现|发展|演变|转化|转变|影响|引发|基于|遵循|符合|符合于|来源于|揭示|证明|阐述|涉及|涵盖|包括|意味着|预示|对比|承载|运用|构建|分类于|区别于|平行于|解决|处理|整合|优化|简化|relate|connect|affect|cause|promote|inhibit|contain|compose|constitute|embody|represent|symbolize|reflect|support|oppose|depend|derive|attribute|belong|act|apply|produce|form|develop|evolve|transform|trigger|base|follow|comply|source|reveal|prove|explain|involve|cover|include|mean|predict|contrast|carry|use|build|classify|distinguish|parallel|solve|handle|integrate|optimize|simplify)/;
        
        // Extract text before and after the link, excluding the link text itself
        const beforeLink = content.substring(contextStart, linkStart);
        const afterLink = content.substring(linkEnd, contextEnd);
        const contextWithoutLink = beforeLink + afterLink;
        
        const hasContextKeyword = contextKeywords.test(contextWithoutLink);
        
        // Check for proper link formatting
        const isProperlyFormatted = /\[\[[^\]]+\|[^\]]+\]\]/.test(content.substring(linkStart-10, linkEnd+10)) || 
                                  /\[[^\]]+\]\([^)]+\)/.test(content.substring(linkStart-10, linkEnd+10));
        
        // Only flag as naked link if it lacks meaningful context AND is not properly formatted
        if (!hasContextKeyword && !isProperlyFormatted) {
          issues.push({
            id: `${this.id}-${file.path}-${linkStart}`,
            ruleId: this.id,
            filePath: file.path,
            fileName: file.name,
            contextPreview: this.plugin.settings.language === 'en' ? context : context,
            position: { start: linkStart, end: linkEnd },
            severity: 'low',
            isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${file.path}-${linkStart}`)
          });
        }
      }
    }
    
    return issues;
  }
}

export class GraphConnectivityRule implements DiagnosticRule {
  id = 'graph-connectivity';
  name = '知识图谱连接性检查';
  description = '检查是否存在未被连接的"信息孤岛"';
  
  constructor(private plugin: KnowledgeArkPlugin, private app: App) {}
  
  async check(): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];
    const files = this.app.vault.getMarkdownFiles();
    
    // Create a map of file paths to their link counts
    const linkMap = new Map<string, { inbound: number; outbound: number }>();
    
    for (const file of files) {
      // Skip excluded folders
      if (this.plugin.settings.excludedFolders.some((folder: string) => file.path.startsWith(folder))) {
        continue;
      }
      
      const cache = this.app.metadataCache.getFileCache(file);
      
      // Skip excluded tags
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
      
      if (!linkMap.has(file.path)) {
        linkMap.set(file.path, { inbound: 0, outbound: 0 });
      }
      
      if (cache && cache.links) {
        // Count outbound links
        linkMap.get(file.path)!.outbound += cache.links.length;
        
        // Count inbound links
        for (const link of cache.links) {
          // Only consider internal links
          if (!link.link.startsWith('http')) {
            const linkedFilePath = this.resolveLinkPath(file.path, link.link);
            if (linkedFilePath) {
              if (!linkMap.has(linkedFilePath)) {
                linkMap.set(linkedFilePath, { inbound: 0, outbound: 0 });
              }
              linkMap.get(linkedFilePath)!.inbound += 1;
            }
          }
        }
      }
    }
    
    // Check for isolated nodes (inbound=0 and outbound=0) and leaf nodes (outbound=0 but inbound>0)
    for (const [filePath, links] of linkMap.entries()) {
      const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
      if (!file) continue;
      
      // Skip excluded folders
      if (this.plugin.settings.excludedFolders.some(folder => file.path.startsWith(folder))) {
        continue;
      }
      
      // Check for isolated nodes
      if (links.inbound === 0 && links.outbound === 0) {
        issues.push({
          id: `${this.id}-${filePath}-isolated`,
          ruleId: this.id,
          filePath: filePath,
          fileName: file.name,
          contextPreview: this.plugin.settings.language === 'en' ? 'Isolated node (inbound=0 and outbound=0)' : '信息孤岛节点 (入链=0 且 出链=0)',
          position: { start: 0, end: 0 },
          severity: 'medium',
          isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${filePath}-isolated`)
        });
      }
      
      // Check for leaf nodes
      if (links.outbound === 0 && links.inbound > 0) {
        issues.push({
          id: `${this.id}-${filePath}-leaf`,
          ruleId: this.id,
          filePath: filePath,
          fileName: file.name,
          contextPreview: this.plugin.settings.language === 'en' ? 'Leaf node (outbound=0 but inbound>0)' : '终点节点 (出链=0 但 入链>0)',
          position: { start: 0, end: 0 },
          severity: 'low',
          isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${filePath}-leaf`)
        });
      }
    }
    
    return issues;
  }
  
  private resolveLinkPath(currentFilePath: string, link: string): string | null {
    // This is a simplified implementation
    // A real implementation would need to handle relative paths, etc.
    const dir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
    return `${dir}/${link}.md`;
  }
}

export class PredicateConsistencyRule implements DiagnosticRule {
  id = 'predicate-consistency';
  name = '关系谓语一致性检查';
  description = '鼓励`key:: [[Link]]`的规范使用';
  
  constructor(private plugin: KnowledgeArkPlugin, private app: App) {}
  
  async check(): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];
    const files = this.app.vault.getMarkdownFiles();
    
    // Map to store predicate usage counts and their locations
    const predicateMap = new Map<string, { count: number; locations: { filePath: string; fileName: string; position: { start: number; end: number }; contextPreview: string }[] }>();
    
    for (const file of files) {
      // Skip excluded folders
      if (this.plugin.settings.excludedFolders.some(folder => file.path.startsWith(folder))) {
        continue;
      }
      
      const cache = this.app.metadataCache.getFileCache(file);
      
      // Skip excluded tags
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
      
      // Find all predicate patterns (key:: value)
      // 支持中英文、数字、下划线和连字符的谓语
      const predicateRegex = /([\u4e00-\u9fa5\w-]+)::/g;
      let match;
      
      while ((match = predicateRegex.exec(content)) !== null) {
        const predicate = match[1];
        const position = { start: match.index, end: match.index + match[0].length };
        
        // Get context preview (50 characters before and after)
        const start = Math.max(0, position.start - 50);
        const end = Math.min(content.length, position.end + 50);
        const contextPreview = content.substring(start, end);
        
        if (!predicateMap.has(predicate)) {
          predicateMap.set(predicate, { count: 0, locations: [] });
        }
        
        const predicateInfo = predicateMap.get(predicate)!;
        predicateInfo.count++;
        predicateInfo.locations.push({
          filePath: file.path,
          fileName: file.name,
          position,
          contextPreview
        });
      }
    }
    
    // Find predicates with low usage or potential typos
    for (const [predicate, info] of predicateMap.entries()) {
      const threshold = this.plugin.settings.predicateUsageThreshold || 1;
      if (info.count < threshold) { // 使用可配置的阈值
        // Create an issue for each location of the low-usage predicate
        for (const location of info.locations) {
          issues.push({
            id: `${this.id}-${predicate}-${location.filePath}-${location.position.start}`,
            ruleId: this.id,
            filePath: location.filePath,
            fileName: location.fileName,
            contextPreview: this.plugin.settings.language === 'en' ? `Predicate "${predicate}" has low usage (${info.count} times): ${location.contextPreview}` : `谓语 "${predicate}" 使用频率过低 (${info.count} 次): ${location.contextPreview}`,
            position: location.position,
            severity: 'low',
            isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${predicate}-${location.filePath}-${location.position.start}`)
          });
        }
      }
      
      // Simple typo detection (this is a very basic implementation)
      // 使用Set来避免重复检查和提示
      const checkedPairs = new Set<string>();
      
      for (const [otherPredicate, otherInfo] of predicateMap.entries()) {
        if (predicate !== otherPredicate && this.isSimilar(predicate, otherPredicate)) {
          // 创建排序后的谓语对，确保每对只检查一次
          const pairKey = [predicate, otherPredicate].sort().join('|');
          
          if (!checkedPairs.has(pairKey)) {
            checkedPairs.add(pairKey);
            
            // For similar predicates, we'll create an issue only once with the first location
            if (info.locations.length > 0) {
              const firstLocation = info.locations[0];
              issues.push({
                id: `${this.id}-${predicate}-${otherPredicate}`,
                ruleId: this.id,
                filePath: firstLocation.filePath,
                fileName: firstLocation.fileName,
                contextPreview: this.plugin.settings.language === 'en' ? `Predicate "${predicate}" and "${otherPredicate}" may have spelling similarity` : `谓语 "${predicate}" 与 "${otherPredicate}" 可能存在拼写相似性`,
                position: firstLocation.position,
                severity: 'low',
                isIgnored: this.plugin.settings.ignoredIssues.includes(`${this.id}-${predicate}-${otherPredicate}`)
              });
            }
          }
        }
      }
    }
    
    return issues;
  }
  
  private isSimilar(str1: string, str2: string): boolean {
    // 使用Levenshtein距离算法计算字符串相似度
    // 支持中英文字符
    const distance = this.levenshteinDistance(str1, str2);
    
    // 计算相似度百分比
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return true;
    
    const similarity = 1 - (distance / maxLength);
    
    // 如果相似度大于70%，则认为是相似的谓语
    return similarity >= 0.7;
  }
  
  /**
   * 计算两个字符串之间的Levenshtein距离
   * 支持中英文字符
   * @param str1 第一个字符串
   * @param str2 第二个字符串
   * @returns 两个字符串之间的编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    
    // 创建二维数组存储距离
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // 初始化边界条件
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    
    // 动态规划计算编辑距离
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,          // 删除
          dp[i][j - 1] + 1,          // 插入
          dp[i - 1][j - 1] + cost    // 替换
        );
      }
    }
    
    return dp[m][n];
  }
}
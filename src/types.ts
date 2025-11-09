export interface KnowledgeArkSettings {
  requiredMetadataFields: string[];
  maxNoteLength: number;
  minContextLength: number;
  excludedFolders: string[];
  excludedTags: string[];
  ignoredIssues: string[];
  exportTemplate: string;
  knowledgeAtomTypes: string[];
  language?: string;
  ruleWeights: Record<string, number>;
  lastDiagnosisTime?: number;
  predicateUsageThreshold: number;
  // Persistent diagnosis results
  savedDiagnosisResults?: SavedDiagnosisResults;
}

export interface SavedDiagnosisResults {
  issues: DiagnosticIssue[];
  healthScore: number;
  atomCount: number;
  connectionDensity: string;
  diagnosisTime: number;
}

export interface DiagnosticRule {
  id: string;
  name: string;
  description: string;
  check: () => Promise<DiagnosticIssue[]>;
}

export interface DiagnosticIssue {
  id: string;
  ruleId: string;
  filePath: string;
  fileName: string;
  contextPreview: string;
  position: { start: number; end: number };
  severity: 'low' | 'medium' | 'high';
  isIgnored: boolean;
}

export interface DiagnosticCardProps {
  ruleName: string;
  issueCount: number;
  description: string;
  issues: DiagnosticIssue[];
  onIgnoreIssue: (issueId: string) => void;
  onNavigateToIssue: (filePath: string, position: { start: number; end: number }) => void;
}

export interface KnowledgeAtomStats {
  type: string;
  count: number;
}

export interface ConnectionDensityStats {
  inboundLinks: number;
  outboundLinks: number;
  isolatedNodes: number;
  leafNodes: number;
}
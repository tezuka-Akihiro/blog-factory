export interface BlogPost {
  title: string;
  description: string;
  category: string;
  path: string; // ファイル特定用
  lastModified?: string;
}

export interface InspectionResult {
  inspectedAt: string;
  category: string;
  totalCount: number;
  articles: BlogPost[];
}
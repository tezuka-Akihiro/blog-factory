export interface BlogPost {
  title: string;
  description: string;
  category: string;
  path: string;
  lastModified?: string;
  isPaid: boolean;
  characterCount: number;
  tags: string[];
  body: string;
  slug: string;
  publishedAt?: string;
  author?: string;
  paywall?: boolean;
  freeContentHeading?: string;
  jsonLd?: boolean;
}

export interface SummaryData {
  totalPosts: number;
  categoryCounts: Record<string, number>;
  tagGroupCounts: Record<string, number>;
  paidPostsCount: number;
  totalPaidCharacterCount: number;
}

export interface InspectionResult {
  inspectedAt: string;
  category: string;
  totalCount: number;
  articles: BlogPost[];
}

export interface BlogSpec {
  access_control?: {
    public_categories?: string[];
  };
  tags?: Array<{
    name: string;
    group: string;
  }>;
}

export interface BlogStats {
  categories: Record<string, {
    count: number;
    premiumChars: number;
  }>;
  total: {
    count: number;
    paidCount: number;
    premiumChars: number;
  };
  updatedAt: string;
}

export interface D1MonitoringReport {
  id: number;
  level: 'Critical' | 'Warning' | 'Info';
  message: string;
  timestamp: string;
}

export interface ReportData {
  strategy: import('./strategy').Strategy;
  stats: {
    totalArticles: number;
    last30DaysUpdates: number;
    jsonLdCoverage: number;
    lighthouseScore: number;
    monitoring: {
      criticalCount: number;
      warningCount: number;
    };
    traffic: {
      pv: number | string;
      uu: number | string;
      avgStayTime: number | string;
    };
  };
}

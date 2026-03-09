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
  freeContentHeading?: string | undefined;
  jsonLd?: boolean;
}

export interface BlogFrontmatter {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  updatedAt?: string;
  slug?: string;
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
  id: string;
  type: string;
  status: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  created_at: string;
}

export interface BlogSnapshot {
  generatedAt: string;       // ISO 8601
  totalArticles: number;
  last30DaysUpdates: number;
}

export interface KpiRecord {
  date: string; // YYYY-MM-DD (UTC)
  pv: number;
  uu: number;
  requests: number;
  bytes: number;
  collectedAt: string; // ISO timestamp
}

export interface ReportData {
  strategy: import('./strategy').Strategy;
  stats: {
    totalArticles: number;
    last30DaysUpdates: number;
    lighthouseScore: number;
    monitoring: {
      criticalCount: number;
      warningCount: number;
      errorRate: string;
    };
    business: {
      paidMembers: number;
      freeMembers: number;
      activeSubscriptions: number;
    };
    traffic: {
      pv: number | string;
      uu: number | string;
      avgStayTime: number | string;
      topSources: Array<{ host: string; visits: number }>;
      topPages: Array<{ path: string; requests: number }>;
    };
    brand: {
      namedSearchCount: number;
      avgEngagementTime: string;
      returnRate: string;
      avgScrollDepth: string;
    };
    conversion: {
      microCvCount: number;
    };
  };
}

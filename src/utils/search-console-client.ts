import { JWT } from 'google-auth-library';

export interface SearchConsoleData {
  namedSearchCount: number;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

interface SearchAnalyticsRow {
  clicks?: number;
  impressions?: number;
  keys?: string[];
}

interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0] as string;
}

export async function fetchSearchConsoleData(days: number = 28): Promise<SearchConsoleData> {
  const serviceAccountJson = process.env['GOOGLE_SERVICE_ACCOUNT_JSON'];
  const siteUrl = process.env['SEARCH_CONSOLE_SITE_URL'];

  if (!serviceAccountJson || !siteUrl) {
    return { namedSearchCount: 0 };
  }

  try {
    const key = JSON.parse(serviceAccountJson) as ServiceAccountKey;
    const client = new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;
    if (!token) throw new Error('アクセストークンの取得に失敗しました');

    // データ遅延が通常 2〜3日 あるため endDate は 3daysAgo
    const endDate = daysAgo(3);
    const startDate = daysAgo(days + 3);

    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const body = {
      startDate,
      endDate,
      dimensions: ['query'],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: 'query',
              operator: 'contains',
              expression: 'claudemix',
            },
          ],
        },
      ],
      rowLimit: 25000,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Search Console API エラー: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as SearchAnalyticsResponse;
    const rows = data.rows ?? [];
    const namedSearchCount = rows.reduce((sum, row) => sum + (row.clicks ?? 0), 0);

    return { namedSearchCount };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[search-console-client] フォールバック: ${msg}\n`);
    return { namedSearchCount: 0 };
  }
}

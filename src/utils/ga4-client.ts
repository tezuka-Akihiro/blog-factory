import { JWT } from 'google-auth-library';

export interface GA4Data {
  activeUsers: number;
  screenPageViews: number;
  avgEngagementTime: string;
  returnRate: string;
  topPages: Array<{ path: string; requests: number }>;
  weeklyTraffic: Array<{ label: string; uu: number; pv: number }>;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

interface DimensionValue {
  value: string;
}

interface MetricValue {
  value: string;
}

interface ReportRow {
  dimensionValues: DimensionValue[];
  metricValues: MetricValue[];
}

interface RunReportResponse {
  rows?: ReportRow[];
}

function formatSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)}秒`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}分${seconds}秒`;
}

const FALLBACK: GA4Data = {
  activeUsers: 0,
  screenPageViews: 0,
  avgEngagementTime: '-',
  returnRate: '-',
  topPages: [],
  weeklyTraffic: [],
};

export async function fetchGA4Data(days: number = 28): Promise<GA4Data> {
  const serviceAccountJson = process.env['GOOGLE_SERVICE_ACCOUNT_JSON'];
  const propertyId = process.env['GA4_PROPERTY_ID'];

  if (!serviceAccountJson || !propertyId) {
    return FALLBACK;
  }

  try {
    const key = JSON.parse(serviceAccountJson) as ServiceAccountKey;
    const client = new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;
    if (!token) throw new Error('アクセストークンの取得に失敗しました');

    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: '2daysAgo' }];

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 内部トラフィック除外フィルター（東久留米 = 開発者の主要アクセス元）
    const excludeInternal = {
      notExpression: {
        filter: {
          fieldName: 'city',
          stringFilter: { matchType: 'EXACT', value: 'Higashikurume' },
        },
      },
    };

    // 流入ページフィルター（/blog 完全一致 = 唯一の外部entry point）
    const blogEntryFilter = {
      andGroup: {
        expressions: [
          excludeInternal,
          {
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'EXACT', value: '/blog' },
            },
          },
        ],
      },
    };

    const weekRanges = [
      { label: '1週前', startDate: '14daysAgo', endDate: '8daysAgo' },
      { label: '2週前', startDate: '21daysAgo', endDate: '15daysAgo' },
      { label: '3週前', startDate: '28daysAgo', endDate: '22daysAgo' },
    ];

    const [usersRes, pagesRes, ...weeklyResponses] = await Promise.all([
      // 流入: /blog のUU・PV・エンゲージメント・新規/リピーター
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges,
          dimensions: [{ name: 'newVsReturning' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'userEngagementDuration' },
            { name: 'screenPageViews' },
          ],
          dimensionFilter: blogEntryFilter,
        }),
      }),
      // 上位ページ（/blog/ 配下のみ、PV数順）
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges,
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
                  },
                },
                excludeInternal,
              ],
            },
          },
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 5,
        }),
      }),
      // 週次推移（4週分を並列取得、/blog のみ）
      ...weekRanges.map(range =>
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
            metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
            dimensionFilter: blogEntryFilter,
          }),
        })
      ),
    ]);

    if (!usersRes.ok) throw new Error(`GA4 API エラー (users): ${usersRes.status}`);
    if (!pagesRes.ok) throw new Error(`GA4 API エラー (pages): ${pagesRes.status}`);
    for (const [i, res] of weeklyResponses.entries()) {
      if (!res.ok) throw new Error(`GA4 API エラー (weekly[${i}]): ${res.status}`);
    }

    const [usersData, pagesData, ...weeklyDataList] = await Promise.all([
      usersRes.json() as Promise<RunReportResponse>,
      pagesRes.json() as Promise<RunReportResponse>,
      ...weeklyResponses.map(r => r.json() as Promise<RunReportResponse>),
    ]);

    // UU / PV / エンゲージメント / リピーター率
    let totalUsers = 0;
    let returningUsers = 0;
    let totalEngagementDuration = 0;
    let totalPageViews = 0;

    for (const row of usersData.rows ?? []) {
      const dimension = row.dimensionValues[0]?.value ?? '';
      const users = parseFloat(row.metricValues[0]?.value ?? '0');
      const engagementDuration = parseFloat(row.metricValues[1]?.value ?? '0');
      const pageViews = parseFloat(row.metricValues[2]?.value ?? '0');

      totalUsers += users;
      totalEngagementDuration += engagementDuration;
      totalPageViews += pageViews;

      if (dimension === 'returning') {
        returningUsers += users;
      }
    }

    const avgEngagementTime =
      totalUsers > 0 ? formatSeconds(totalEngagementDuration / totalUsers) : '-';
    const returnRate =
      totalUsers > 0 ? `${((returningUsers / totalUsers) * 100).toFixed(1)}%` : '-';

    // 上位ページ
    const topPages = (pagesData.rows ?? []).map(row => ({
      path: row.dimensionValues[0]?.value ?? '(unknown)',
      requests: parseFloat(row.metricValues[0]?.value ?? '0'),
    }));

    // 週次推移（4週分を集計）
    const weeklyTraffic = weekRanges.map((range, i) => {
      const data = weeklyDataList[i];
      let uu = 0;
      let pv = 0;
      for (const row of data?.rows ?? []) {
        uu += parseFloat(row.metricValues[0]?.value ?? '0');
        pv += parseFloat(row.metricValues[1]?.value ?? '0');
      }
      return { label: range.label, uu: Math.round(uu), pv: Math.round(pv) };
    });

    return {
      activeUsers: Math.round(totalUsers),
      screenPageViews: Math.round(totalPageViews),
      avgEngagementTime,
      returnRate,
      topPages,
      weeklyTraffic,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[ga4-client] フォールバック: ${msg}\n`);
    return FALLBACK;
  }
}

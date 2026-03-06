import { JWT } from 'google-auth-library';

export interface GA4Data {
  avgEngagementTime: string;
  returnRate: string;
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

export async function fetchGA4Data(days: number = 28): Promise<GA4Data> {
  const serviceAccountJson = process.env['GOOGLE_SERVICE_ACCOUNT_JSON'];
  const propertyId = process.env['GA4_PROPERTY_ID'];

  if (!serviceAccountJson || !propertyId) {
    return { avgEngagementTime: '-', returnRate: '-' };
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

    // データ遅延が 24〜48h あるため endDate は '2daysAgo'
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    const body = {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: '2daysAgo' }],
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'userEngagementDuration' },
      ],
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
      throw new Error(`GA4 Data API エラー: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as RunReportResponse;
    const rows = data.rows ?? [];

    let totalUsers = 0;
    let returningUsers = 0;
    let totalEngagementDuration = 0;

    for (const row of rows) {
      const dimension = row.dimensionValues[0]?.value ?? '';
      const users = parseFloat(row.metricValues[0]?.value ?? '0');
      const engagementDuration = parseFloat(row.metricValues[1]?.value ?? '0');

      totalUsers += users;
      totalEngagementDuration += engagementDuration;

      if (dimension === 'returning') {
        returningUsers += users;
      }
    }

    const avgEngagementTime =
      totalUsers > 0
        ? formatSeconds(totalEngagementDuration / totalUsers)
        : '-';

    const returnRate =
      totalUsers > 0
        ? `${((returningUsers / totalUsers) * 100).toFixed(1)}%`
        : '-';

    return { avgEngagementTime, returnRate };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[ga4-client] フォールバック: ${msg}\n`);
    return { avgEngagementTime: '-', returnRate: '-' };
  }
}

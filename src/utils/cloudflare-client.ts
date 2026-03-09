import { Logger } from './logger';

const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

export interface CloudflareTrafficData {
  uu: number;
  pv: number;
  topSources: Array<{ host: string; visits: number }>;
  topPages: Array<{ path: string; requests: number }>;
  errorRate: string;
}

const FALLBACK: CloudflareTrafficData = {
  uu: 0,
  pv: 0,
  topSources: [],
  topPages: [],
  errorRate: '-',
};

/** ISO 8601 datetime（秒まで、UTC）例: "2026-03-04T08:00:00Z" */
function datetimeString(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function graphql<T>(
  apiToken: string,
  query: string,
  variables: Record<string, string>,
): Promise<{ data?: T; errors?: Array<{ message: string }> } | null> {
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) {
      Logger.warn(`Cloudflare API HTTP ${res.status}`);
      return null;
    }
    return res.json() as Promise<{ data?: T; errors?: Array<{ message: string }> }>;
  } catch (e) {
    Logger.warn(`Cloudflare fetch error: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

interface CloudflareGraphQLResponse {
  viewer: {
    zones: Array<{
      totals: Array<{
        count: number;
        sum: { visits: number };
      }>;
      topPages: Array<{
        count: number;
        dimensions: { clientRequestPath: string };
      }>;
      errorGroups: Array<{
        count: number;
        dimensions: { edgeResponseStatus: string };
      }>;
    }>;
  };
}

/** UU / PV / 人気記事 / エラー率（直近24時間） */
async function fetchZoneMetrics(
  zoneId: string,
  apiToken: string,
  since: string,
  until: string,
): Promise<CloudflareTrafficData> {
  const query = `
    query ZoneMetrics($zoneId: String!, $since: String!, $until: String!) {
      viewer {
        zones(filter: { zoneTag: $zoneId }) {
          totals: httpRequestsAdaptiveGroups(
            filter: { datetimeMinute_geq: $since, datetimeMinute_leq: $until }
            limit: 1
          ) {
            count
            sum { visits }
          }
          topPages: httpRequestsAdaptiveGroups(
            filter: { datetimeMinute_geq: $since, datetimeMinute_leq: $until }
            limit: 30
            orderBy: [count_DESC]
          ) {
            count
            dimensions { clientRequestPath }
          }
          errorGroups: httpRequestsAdaptiveGroups(
            filter: { datetimeMinute_geq: $since, datetimeMinute_leq: $until }
            limit: 20
            orderBy: [count_DESC]
          ) {
            count
            dimensions { edgeResponseStatus }
          }
        }
      }
    }
  `;

  const json = await graphql<CloudflareGraphQLResponse>(apiToken, query, { zoneId, since, until });
  if (!json || json.errors?.length) {
    if (json?.errors?.length) Logger.warn(`Cloudflare zone query errors: ${JSON.stringify(json.errors)}`);
    return FALLBACK;
  }

  const zone = json.data?.viewer?.zones?.[0];
  if (!zone) return FALLBACK;

  const totalsGroup = zone.totals?.[0];
  const uu: number = totalsGroup?.sum?.visits ?? 0;
  const pv: number = totalsGroup?.count ?? 0;

  const topPages: CloudflareTrafficData['topPages'] = (zone.topPages ?? [])
    .filter((g) => {
      const path = g.dimensions.clientRequestPath;
      // /blog/{slug} のみ。画像・静的ファイル・その他パスを除外
      return /^\/blog\/[^/]+\/?$/.test(path);
    })
    .map((g) => ({ path: g.dimensions.clientRequestPath, requests: g.count }))
    .slice(0, 5);

  const errorGroups: Array<{ count: number; status: number }> = (zone.errorGroups ?? []).map(
    (g) => ({ count: g.count, status: Number(g.dimensions.edgeResponseStatus) }),
  );
  const total = errorGroups.reduce((s, g) => s + g.count, 0);
  const errors = errorGroups.filter(g => g.status >= 400).reduce((s, g) => s + g.count, 0);
  const errorRate: string = total > 0 ? `${((errors / total) * 100).toFixed(1)}%` : '0.0%';

  // clientRefererHost は現在のプランでは利用不可（フォールバック）
  return { uu, pv, topSources: [], topPages, errorRate };
}

/**
 * 直近 `hours` 時間のトラフィックデータを取得する。
 * 無料プランの制限により最大24時間まで。
 */
export async function fetchCloudflareAnalytics(hours: number = 24): Promise<CloudflareTrafficData> {
  const apiToken = process.env.CF_ANALYTICS_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!apiToken || !zoneId) {
    Logger.warn('CF_ANALYTICS_TOKEN or CLOUDFLARE_ZONE_ID is not set. Using fallback values.');
    return FALLBACK;
  }

  const until = new Date();
  const since = new Date(until.getTime() - Math.min(hours, 24) * 60 * 60 * 1000);

  return fetchZoneMetrics(zoneId, apiToken, datetimeString(since), datetimeString(until));
}

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { KpiRecord } from '../types';
import { Logger } from '../utils/logger';

const KPI_HISTORY_PATH = join(process.cwd(), 'results', 'kpi-history.json');

// ---------------------------------------------------------------------------
// Cloudflare Zone Analytics GraphQL API
// Docs: https://developers.cloudflare.com/analytics/graphql-api/
// ---------------------------------------------------------------------------

interface CfGraphQLResponse {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequests1dGroups?: Array<{
          sum: { pageViews: number; requests: number; bytes: number };
          uniq: { uniques: number };
          dimensions: { date: string };
        }>;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Cloudflare Zone Analytics GraphQL API から前日（UTC）の指標を取得する。
 * API は最大 24h 粒度の集計値しか返さないため、毎日実行して手元に蓄積する。
 */
export async function fetchYesterdayKpi(): Promise<KpiRecord> {
  const apiToken = process.env.CF_ANALYTICS_TOKEN;
  const zoneTag = process.env.CLOUDFLARE_ZONE_ID;

  if (!apiToken || !zoneTag) {
    throw new Error('CF_ANALYTICS_TOKEN / CLOUDFLARE_ZONE_ID が .env に設定されていません');
  }

  // 前日 UTC の日付を取得
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const query = `
    query KpiDaily($zoneTag: string!, $date: Date!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 1
            filter: { date: $date }
            orderBy: [date_ASC]
          ) {
            sum { pageViews requests bytes }
            uniq { uniques }
            dimensions { date }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ query, variables: { zoneTag, date: dateStr } }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as CfGraphQLResponse;

  if (json.errors?.length) {
    throw new Error(`Cloudflare GraphQL error: ${json.errors.map(e => e.message).join(', ')}`);
  }

  const group = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups?.[0];

  if (!group) {
    // API がデータを返さない場合は 0 で記録する（後で上書き可能）
    Logger.warn(`${dateStr} のデータが Cloudflare から返されませんでした。0 で記録します。`);
    return {
      date: dateStr,
      pv: 0,
      uu: 0,
      requests: 0,
      bytes: 0,
      collectedAt: new Date().toISOString(),
    };
  }

  return {
    date: group.dimensions.date,
    pv: group.sum.pageViews,
    uu: group.uniq.uniques,
    requests: group.sum.requests,
    bytes: group.sum.bytes,
    collectedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// ローカル履歴ファイルへの蓄積
// ---------------------------------------------------------------------------

export async function loadKpiHistory(): Promise<KpiRecord[]> {
  try {
    const content = await readFile(KPI_HISTORY_PATH, 'utf-8');
    return JSON.parse(content) as KpiRecord[];
  } catch {
    return [];
  }
}

/**
 * 同一日付のレコードがあれば上書き、なければ末尾に追加して保存する。
 */
export async function appendKpiRecord(record: KpiRecord): Promise<void> {
  const history = await loadKpiHistory();

  const existingIndex = history.findIndex(r => r.date === record.date);
  if (existingIndex >= 0) {
    Logger.warn(`${record.date} のレコードが既に存在します。上書きします。`);
    history[existingIndex] = record;
  } else {
    history.push(record);
  }

  // 日付昇順でソート
  history.sort((a, b) => a.date.localeCompare(b.date));

  await mkdir(join(process.cwd(), 'results'), { recursive: true });
  await writeFile(KPI_HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * レポート用：直近 N 日分の合計 PV・UU を返す。
 */
export function summarizeKpiHistory(
  history: KpiRecord[],
  days: number = 30
): { pv: number; uu: number } {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recent = history.filter(r => r.date >= cutoffStr);
  const pv = recent.reduce((sum, r) => sum + r.pv, 0);
  const uu = recent.reduce((sum, r) => sum + r.uu, 0);
  return { pv, uu };
}

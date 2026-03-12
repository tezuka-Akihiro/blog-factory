import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { KpiRecord } from '../types';
import { Logger } from '../utils/logger';
import { fetchKpiByDate } from '../utils/cloudflare-client';

const KPI_HISTORY_PATH = join(process.cwd(), 'results', 'kpi-history.json');

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
  const since = `${dateStr}T00:00:00Z`;
  const until = `${dateStr}T23:59:59Z`;

  const data = await fetchKpiByDate(zoneTag, apiToken, dateStr, since, until);

  const zone = data?.viewer?.zones?.[0];
  const group = zone?.httpRequests1dGroups?.[0];

  // エラー率計算
  const errorCount = zone?.errorGroups?.[0]?.count ?? 0;
  const totalCount = zone?.totalGroups?.[0]?.count ?? 0;
  const errorRate = totalCount > 0
    ? `${((errorCount / totalCount) * 100).toFixed(1)}%`
    : '0.0%';

  if (!group) {
    // API がデータを返さない場合は 0 で記録する（後で上書き可能）
    Logger.warn(`${dateStr} のデータが Cloudflare から返されませんでした。0 で記録します。`);
    return {
      date: dateStr,
      pv: 0,
      uu: 0,
      requests: 0,
      bytes: 0,
      errorRate,
      collectedAt: new Date().toISOString(),
    };
  }

  return {
    date: group.dimensions.date,
    pv: group.sum.pageViews,
    uu: group.uniq.uniques,
    requests: group.sum.requests,
    bytes: group.sum.bytes,
    errorRate,
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
 * レポート用：直近 N 日分の合計 PV・UU、および最新レコードのエラー率を返す。
 */
export function summarizeKpiHistory(
  history: KpiRecord[],
  days: number = 30
): { pv: number; uu: number; errorRate: string } {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recent = history.filter(r => r.date >= cutoffStr);
  const pv = recent.reduce((sum, r) => sum + r.pv, 0);
  const uu = recent.reduce((sum, r) => sum + r.uu, 0);

  // 最新レコードのエラー率を使用（未記録分は '-'）
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const errorRate = sorted.find(r => r.errorRate !== undefined)?.errorRate ?? '-';

  return { pv, uu, errorRate };
}

import { Command } from 'commander';
import { Logger } from '../utils/logger';
import { fetchYesterdayKpi, appendKpiRecord, loadKpiHistory } from '../tasks/kpi';

export const kpiCollectCommand = new Command('kpi-collect')
  .description('Cloudflare Analytics API から前日の KPI を取得してローカルに蓄積する')
  .option('--dry-run', '取得のみ行い、ファイルへの書き込みをスキップする')
  .action(async (options: { dryRun?: boolean }) => {
    try {
      Logger.info('Cloudflare Analytics から KPI を取得中...');

      const record = await fetchYesterdayKpi();

      Logger.info(`取得完了: ${record.date} — PV: ${record.pv}, UU: ${record.uu}, requests: ${record.requests}`);

      if (options.dryRun) {
        Logger.warn('--dry-run モード: ファイルへの書き込みをスキップしました。');
        return;
      }

      await appendKpiRecord(record);

      const history = await loadKpiHistory();
      Logger.success(`kpi-history.json に保存しました（累計 ${history.length} 件）`);
    } catch (error) {
      Logger.error(`KPI 収集に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

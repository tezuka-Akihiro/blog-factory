import { execSync } from 'child_process';
import { BlogPost, ReportData, D1User, D1MonitoringReport } from '../types';
import { scanFiles } from './scan';
import { extractPost } from './extract';
import { Logger } from '../utils/logger';

async function executeD1Query<T>(query: string): Promise<T[]> {
  try {
    const command = `npx wrangler d1 execute DB --local --command="${query}" --json`;
    const output = execSync(command, { encoding: 'utf-8' });
    const result = JSON.parse(output);
    // Wrangler output for multiple statements might be an array of results,
    // but for a single query it's usually an array of rows directly or [{ results: [...] }]
    if (Array.isArray(result) && result[0]?.results) {
      return result[0].results as T[];
    }
    return result as T[];
  } catch (error) {
    Logger.error(`Failed to execute D1 query: ${error}`);
    return [];
  }
}

export async function fetchReportData(blogSourcePath: string): Promise<ReportData> {
  Logger.info('Extracting blog post metadata...');
  const files = await scanFiles(blogSourcePath);
  const posts = await Promise.all(files.map(file => extractPost(file, blogSourcePath)));

  const totalPosts = posts.length;
  const jsonLdPosts = posts.filter(p => p.jsonLd).length;
  const jsonLdCoverageRate = totalPosts > 0 ? (jsonLdPosts / totalPosts) * 100 : 0;

  Logger.info('Fetching data from D1...');
  const users = await executeD1Query<D1User>("SELECT id, subscription_status, created_at FROM users WHERE deleted_at IS NULL");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalUsers = users.length;
  const paidUsers = users.filter(u => u.subscription_status !== 'inactive').length;
  const recentUsers = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length;

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().replace('T', ' ').substring(0, 19);

  const monitoringReports = await executeD1Query<D1MonitoringReport>(
    `SELECT severity, created_at FROM monitoring_reports WHERE created_at >= '${sevenDaysAgoStr}'`
  );

  const criticalErrors = monitoringReports.filter(r => r.severity === 'CRITICAL').length;
  const warningErrors = monitoringReports.filter(r => r.severity === 'WARNING').length;

  return {
    generatedAt: now.toISOString(),
    members: {
      total: totalUsers,
      paid: paidUsers,
      recentChange30Days: recentUsers,
    },
    content: {
      totalPosts,
      jsonLdCoverageRate,
    },
    system: {
      errorsLast7Days: {
        critical: criticalErrors,
        warning: warningErrors,
      },
    },
  };
}

import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';
import { D1MonitoringReport } from '../types';

const execAsync = promisify(exec);

async function executeQuery(query: string): Promise<any[]> {
  try {
    const command = `npx wrangler d1 execute DB --local --json --command "${query}"`;
    const { stdout } = await execAsync(command);
    const result = JSON.parse(stdout);

    if (Array.isArray(result) && result[0]?.results) {
      return result[0].results;
    }
    return [];
  } catch (error) {
    Logger.warn(`Failed to execute D1 query: ${query}. Falling back to empty array.`);
    return [];
  }
}

export async function fetchD1MonitoringReports(days: number = 7): Promise<D1MonitoringReport[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - days);
  const timestampStr = sevenDaysAgo.toISOString().replace('T', ' ').split('.')[0];

  const query = `SELECT * FROM monitoring_reports WHERE created_at >= '${timestampStr}'`;
  return executeQuery(query);
}

export async function fetchBusinessMetrics(): Promise<{ paidMembers: number; freeMembers: number; activeSubscriptions: number }> {
  const paidMembersResult = await executeQuery("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'");
  const freeMembersResult = await executeQuery("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'inactive'");
  const activeSubsResult = await executeQuery("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");

  return {
    paidMembers: paidMembersResult[0]?.count || 0,
    freeMembers: freeMembersResult[0]?.count || 0,
    activeSubscriptions: activeSubsResult[0]?.count || 0,
  };
}

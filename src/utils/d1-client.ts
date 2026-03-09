import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { Logger } from './logger';
import { D1MonitoringReport } from '../types';

const execAsync = promisify(exec);

function getClaudemixPath(): string {
  const blogSourcePath = process.env.BLOG_SOURCE_PATH;
  if (!blogSourcePath) {
    throw new Error('BLOG_SOURCE_PATH is not set');
  }
  // BLOG_SOURCE_PATH = ../claudemix/content/blog/posts → ../claudemix
  return path.resolve(process.cwd(), blogSourcePath, '../../..');
}

async function executeQuery<T = Record<string, unknown>>(query: string): Promise<T[]> {
  try {
    const claudemixPath = getClaudemixPath();
    const command = `npx wrangler d1 execute claudemix-prod --remote --json --command "${query}"`;
    const { stdout, stderr } = await execAsync(command, { cwd: claudemixPath });
    if (stderr) Logger.warn(`wrangler stderr: ${stderr}`);
    const result = JSON.parse(stdout);

    if (Array.isArray(result) && result[0]?.results) {
      return result[0].results as T[];
    }
    return [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stderr = (error as { stderr?: string })?.stderr || '';
    const stdout = (error as { stdout?: string })?.stdout || '';
    Logger.warn(`Failed to execute D1 query: ${query}. Error: ${errorMessage}\nstderr: ${stderr}\nstdout: ${stdout}`);
    return [];
  }
}

export async function fetchD1MonitoringReports(days: number = 7): Promise<D1MonitoringReport[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - days);
  const timestampStr = sevenDaysAgo.toISOString().replace('T', ' ').split('.')[0];

  const query = `SELECT * FROM monitoring_reports WHERE created_at >= '${timestampStr}'`;
  return executeQuery<D1MonitoringReport>(query);
}

export async function fetchBusinessMetrics(): Promise<{ paidMembers: number; freeMembers: number; activeSubscriptions: number }> {
  interface CountResult { count: number }
  const paidMembersResult = await executeQuery<CountResult>("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'");
  const freeMembersResult = await executeQuery<CountResult>("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'inactive'");
  const activeSubsResult = await executeQuery<CountResult>("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");

  return {
    paidMembers: paidMembersResult[0]?.count || 0,
    freeMembers: freeMembersResult[0]?.count || 0,
    activeSubscriptions: activeSubsResult[0]?.count || 0,
  };
}

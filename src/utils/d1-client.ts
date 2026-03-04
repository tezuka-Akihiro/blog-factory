import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';
import { D1MonitoringReport } from '../types';

const execAsync = promisify(exec);

export async function fetchD1MonitoringReports(days: number = 7): Promise<D1MonitoringReport[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - days);
    const timestampStr = sevenDaysAgo.toISOString();

    const query = `SELECT * FROM monitoring_reports WHERE timestamp >= '${timestampStr}'`;
    const command = `npx wrangler d1 execute DB --local --json --command "${query}"`;

    const { stdout } = await execAsync(command);
    const result = JSON.parse(stdout);

    if (Array.isArray(result) && result[0]?.results) {
      return result[0].results as D1MonitoringReport[];
    }

    return [];
  } catch (error) {
    Logger.warn('Failed to fetch D1 monitoring reports. Falling back to empty array.');
    return [];
  }
}

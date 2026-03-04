import { Command } from 'commander';
import { Logger } from '../../utils/logger';
import { scanFiles } from '../../tasks/scan';
import { extractPost } from '../../tasks/extract';
import { loadBlogSpec } from '../../utils/spec-loader';
import { loadStrategy, generateHtmlReport, saveExportFile } from '../../tasks/report';
import { fetchD1MonitoringReports } from '../../utils/d1-client';
import { BlogPost, ReportData } from '../../types';

export const reportCommand = new Command('report')
  .description('Generate Management Design Sheet Business Progress Report')
  .action(async () => {
    try {
      Logger.info('Generating Management Design Sheet report...');

      const spec = await loadBlogSpec();
      const strategy = await loadStrategy();
      const sourcePath = process.env.BLOG_SOURCE_PATH!;

      // 1. Scan local Markdown files
      const files = await scanFiles(sourcePath);
      const articles: BlogPost[] = [];
      for (const file of files) {
        articles.push(await extractPost(file, sourcePath, spec.access_control?.public_categories));
      }

      // 2. Fetch D1 monitoring data
      const monitoringLogs = await fetchD1MonitoringReports(7);
      const criticalCount = monitoringLogs.filter(log => log.level === 'Critical').length;
      const warningCount = monitoringLogs.filter(log => log.level === 'Warning').length;

      // 3. Calculate stats
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      let last30DaysUpdates = 0;
      let jsonLdCount = 0;

      for (const article of articles) {
        const updateDate = article.lastModified ? new Date(article.lastModified) : new Date(article.publishedAt || 0);
        if (updateDate >= thirtyDaysAgo) {
          last30DaysUpdates++;
        }
        if (article.jsonLd) {
          jsonLdCount++;
        }
      }

      const jsonLdCoverage = articles.length > 0 ? Math.round((jsonLdCount / articles.length) * 100) : 0;

      const reportData: ReportData = {
        strategy,
        stats: {
          totalArticles: articles.length,
          last30DaysUpdates,
          jsonLdCoverage,
          lighthouseScore: 100, // Hardcoded as per requirements
          monitoring: {
            criticalCount,
            warningCount,
          },
          traffic: {
            pv: 0,
            uu: 0,
            avgStayTime: '-',
          },
        },
      };

      // 4. Generate HTML
      const html = await generateHtmlReport(reportData);
      const filePath = await saveExportFile(html, 'report.html');

      Logger.success(`Management Design Sheet report generated: ${filePath}`);
    } catch (error) {
      Logger.error(`Failed to generate report: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

import { Command } from 'commander';
import { Logger } from '../../utils/logger';
import { fetchReportData } from '../../tasks/report-data';
import { generateHtmlReport } from '../../tasks/report-generator';
import { saveExportFile } from '../../tasks/report';

export const reportCommand = new Command('report')
  .description('Generate a structured business progress report (HTML)')
  .action(async () => {
    try {
      const blogSourcePath = process.env.BLOG_SOURCE_PATH!;

      Logger.info('Starting report generation process...');

      const reportData = await fetchReportData(blogSourcePath);
      const html = generateHtmlReport(reportData);

      await saveExportFile(html, 'report.html');

      Logger.success('Business progress report generated successfully: results/report.html');
      Logger.info('You can open this file in any browser and print to PDF (A4).');
    } catch (error) {
      Logger.error(`Failed to generate report: ${error}`);
      process.exit(1);
    }
  });

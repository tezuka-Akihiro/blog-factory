import { Command } from 'commander';
import { scanFiles } from '../../tasks/scan';
import { extractPost } from '../../tasks/extract';
import { convertToCSV } from '../../tasks/export';
import { saveExportFile } from '../../tasks/report';
import { Logger } from '../../utils/logger';
import path from 'path';
import { loadBlogSpec } from '../../utils/spec-loader';

export const exportCommand = new Command('export')
  .description('Export article metadata to CSV for spreadsheet management')
  .action(async () => {
    try {
      const sourcePath = process.env.BLOG_SOURCE_PATH!;
      const absoluteSourcePath = path.resolve(sourcePath);
      Logger.info(`Starting export in: ${absoluteSourcePath}`);

      const spec = await loadBlogSpec();
      const publicCategories = spec.access_control?.public_categories || [];

      const files = await scanFiles(absoluteSourcePath);
      Logger.info(`Found ${files.length} files`);

      const articles = await Promise.all(
        files.map((file) => extractPost(file, absoluteSourcePath, publicCategories))
      );

      const csvContent = convertToCSV(articles);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `blog-metadata-export-${timestamp}.csv`;

      await saveExportFile(csvContent, filename);

      Logger.success('Export completed successfully');
    } catch (err) {
      Logger.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

import { Command } from 'commander';
import { scanFiles } from '../../tasks/scan';
import { extractPost } from '../../tasks/extract';
import { saveReport } from '../../tasks/report';
import { Logger } from '../../utils/logger';
import { InspectionResult } from '../../types';
import path from 'path';
import { loadBlogSpec } from '../../utils/spec-loader';

export const inspectCommand = new Command('inspect')
  .description('Scan articles and extract metadata')
  .option('-c, --category <name>', 'Filter by category')
  .action(async (options) => {
    try {
      const sourcePath = process.env.BLOG_SOURCE_PATH;
      if (!sourcePath) {
        Logger.error('BLOG_SOURCE_PATH is not set in environment variables');
        process.exit(1);
      }

      const absoluteSourcePath = path.resolve(sourcePath);
      Logger.info(`Starting inspection in: ${absoluteSourcePath}`);

      // blog-spec.yaml から公開カテゴリを取得
      const spec = await loadBlogSpec();
      const publicCategories = spec.access_control?.public_categories || [];

      const files = await scanFiles(absoluteSourcePath);
      Logger.info(`Found ${files.length} files`);

      const articles = await Promise.all(
        files.map((file) => extractPost(file, absoluteSourcePath, publicCategories))
      );

      const targetCategory = options.category;
      const filteredArticles = targetCategory
        ? articles.filter((article) => article.category === targetCategory)
        : articles;

      if (targetCategory) {
        Logger.info(`Filtered ${filteredArticles.length} articles for category: ${targetCategory}`);
      }

      const result: InspectionResult = {
        inspectedAt: new Date().toISOString(),
        category: targetCategory || 'all',
        totalCount: filteredArticles.length,
        articles: filteredArticles,
      };

      await saveReport(result);
      Logger.success('Inspection completed successfully');
    } catch (err) {
      Logger.error(`Inspection failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

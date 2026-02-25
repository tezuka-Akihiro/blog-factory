import { Command } from 'commander';
import { scanFiles } from '../../tasks/scan';
import { extractPost } from '../../tasks/extract';
import { formatInfoList } from '../../tasks/info';
import { saveMarkdownReport } from '../../tasks/report';
import { Logger } from '../../utils/logger';
import path from 'path';
import { loadBlogSpec } from '../../utils/spec-loader';

export const infoCommand = new Command('info')
  .description('Extract titles and summaries for Information category articles')
  .action(async () => {
    try {
      const sourcePath = process.env.BLOG_SOURCE_PATH!;
      const absoluteSourcePath = path.resolve(sourcePath);
      Logger.info(`Starting information extraction in: ${absoluteSourcePath}`);

      const spec = await loadBlogSpec();
      const publicCategories = spec.access_control?.public_categories || [];

      const files = await scanFiles(absoluteSourcePath);
      Logger.info(`Found ${files.length} files`);

      const articles = await Promise.all(
        files.map((file) => extractPost(file, absoluteSourcePath, publicCategories))
      );

      const targetCategory = 'インフォメーション';
      const filteredArticles = articles.filter((article) => article.category === targetCategory);

      Logger.info(`Filtered ${filteredArticles.length} articles for category: ${targetCategory}`);

      for (const article of filteredArticles) {
        Logger.info(`Title: ${article.title}`);
        Logger.info(`Summary: ${article.description}`);
      }

      const markdown = formatInfoList(filteredArticles);
      await saveMarkdownReport(markdown, 'info-list.md');

      Logger.success('Information extraction completed successfully');
    } catch (err) {
      Logger.error(`Information extraction failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

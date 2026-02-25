import { Command } from 'commander';
import { scanFiles } from '../../tasks/scan';
import { extractPost } from '../../tasks/extract';
import { calculateSummary, formatSummaryToMarkdown } from '../../tasks/summary';
import { saveMarkdownReport } from '../../tasks/report';
import { Logger } from '../../utils/logger';
import path from 'path';
import { loadBlogSpec, getTagToGroupMap } from '../../utils/spec-loader';

export const summaryCommand = new Command('summary')
  .description('Generate a summary report of blog articles')
  .action(async () => {
    try {
      const sourcePath = process.env.BLOG_SOURCE_PATH!;
      const absoluteSourcePath = path.resolve(sourcePath);
      Logger.info(`Starting summary generation in: ${absoluteSourcePath}`);

      const spec = await loadBlogSpec();
      const publicCategories = spec.access_control?.public_categories || [];
      const tagToGroupMap = getTagToGroupMap(spec);

      const files = await scanFiles(absoluteSourcePath);
      Logger.info(`Scanning ${files.length} files...`);

      const articles = await Promise.all(
        files.map((file) => extractPost(file, absoluteSourcePath, publicCategories))
      );

      const summaryData = calculateSummary(articles, tagToGroupMap);
      const markdown = formatSummaryToMarkdown(summaryData);

      await saveMarkdownReport(markdown, 'summary.md');

      Logger.success('Summary generation completed successfully');
      Logger.info(`Total Articles: ${summaryData.totalPosts}`);
      Logger.info(`Paid Articles: ${summaryData.paidPostsCount}`);
    } catch (err) {
      Logger.error(`Summary generation failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

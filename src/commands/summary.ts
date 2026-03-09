import { Command } from 'commander';
import { scanFiles } from '../tasks/scan';
import { extractPost } from '../tasks/extract';
import { calculateSummary, formatSummaryToMarkdown } from '../tasks/summary';
import { saveMarkdownReport, saveBlogSnapshot } from '../tasks/report';
import { Logger } from '../utils/logger';
import path from 'path';
import { loadBlogSpec, getTagToGroupMap } from '../utils/spec-loader';

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

      // 30日以内更新数を算出してスナップショットを保存（git追跡対象）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const last30DaysUpdates = articles.filter(a => {
        const d = a.lastModified ? new Date(a.lastModified) : new Date(a.publishedAt || 0);
        return d >= thirtyDaysAgo;
      }).length;

      await saveBlogSnapshot({
        generatedAt: new Date().toISOString(),
        totalArticles: summaryData.totalPosts,
        last30DaysUpdates,
      });

      Logger.success('Summary generation completed successfully');
      Logger.info(`Total Articles: ${summaryData.totalPosts}`);
      Logger.info(`Paid Articles: ${summaryData.paidPostsCount}`);
    } catch (err) {
      Logger.error(`Summary generation failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

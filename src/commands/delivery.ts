import { Command } from 'commander';
import { scanFiles } from '../tasks/scan';
import { extractPost } from '../tasks/extract';
import { calculateStats } from '../tasks/stats';
import { deliverStats } from '../tasks/delivery';
import { Logger } from '../utils/logger';
import path from 'path';
import { loadBlogSpec } from '../utils/spec-loader';

export const deliveryCommand = new Command('delivery')
  .description('Calculate blog statistics and update subscription spec')
  .action(async () => {
    try {
      const sourcePath = process.env.BLOG_SOURCE_PATH;
      const specPath = process.env.SUBSCRIPTION_SPEC_PATH;

      if (!sourcePath) {
        Logger.error('BLOG_SOURCE_PATH is not set');
        process.exit(1);
      }

      if (!specPath) {
        Logger.error('SUBSCRIPTION_SPEC_PATH is not set');
        process.exit(1);
      }

      const absoluteSourcePath = path.resolve(sourcePath);
      const absoluteSpecPath = path.resolve(specPath);

      Logger.info('Starting delivery process...');

      const spec = await loadBlogSpec();
      const publicCategories = spec.access_control?.public_categories || [];

      // 1. Scan Task
      const files = await scanFiles(absoluteSourcePath);
      Logger.info(`Scanned ${files.length} files.`);

      // 2. Extract Task
      const articles = await Promise.all(
        files.map((file) => extractPost(file, absoluteSourcePath, publicCategories))
      );

      // 3. Stats Task
      const stats = calculateStats(articles);

      await deliverStats(stats, absoluteSpecPath);

      Logger.success('Delivery completed');
    } catch (error) {
      Logger.error(`Delivery command failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

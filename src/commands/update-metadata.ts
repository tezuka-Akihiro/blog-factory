import { Command } from 'commander';
import { updateMetadataFromCsv } from '../tasks/update-metadata';
import { Logger } from '../utils/logger';
import path from 'path';

export const updateMetadataCommand = new Command('update-metadata')
  .description('Update blog post metadata from a CSV file')
  .argument('<csv-path>', 'Path to the CSV file')
  .action(async (csvPath: string) => {
    try {
      const sourcePath = process.env.BLOG_SOURCE_PATH!;
      const absoluteSourcePath = path.resolve(sourcePath);
      const absoluteCsvPath = path.resolve(csvPath);

      Logger.info(`Starting metadata update from: ${absoluteCsvPath}`);
      Logger.info(`Target source path: ${absoluteSourcePath}`);

      await updateMetadataFromCsv(absoluteCsvPath, absoluteSourcePath);

      Logger.success('Metadata update completed successfully');
    } catch (err) {
      Logger.error(`Metadata update failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

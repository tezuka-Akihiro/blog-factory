import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { Logger } from '../utils/logger';
import { inspectCommand } from './inspect';
import { summaryCommand } from './summary';
import { infoCommand } from './info';
import { deliveryCommand } from './delivery';
import { exportCommand } from './export';
import { updateMetadataCommand } from './update-metadata';
import { reportCommand } from './report';
import { kpiCollectCommand } from './kpi-collect';

dotenv.config();

const program = new Command();

program
  .name('blog-factory')
  .description('Technical Document Production Line')
  .version('1.0.0')
  .hook('preAction', () => {
    if (!process.env.BLOG_SOURCE_PATH) {
      Logger.error('BLOG_SOURCE_PATH is required');
      process.exit(1);
    }
  });

[
  inspectCommand,
  summaryCommand,
  infoCommand,
  deliveryCommand,
  exportCommand,
  updateMetadataCommand,
  reportCommand,
  kpiCollectCommand,
].forEach((cmd) => program.addCommand(cmd));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

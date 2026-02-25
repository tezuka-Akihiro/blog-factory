import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { inspectCommand } from './commands/task/inspect';
import { summaryCommand } from './commands/task/summary';
import { infoCommand } from './commands/task/info';

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

[inspectCommand, summaryCommand, infoCommand].forEach((cmd) => program.addCommand(cmd));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

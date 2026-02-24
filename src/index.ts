import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { inspectCommand } from './commands/task/inspect';

dotenv.config();

const program = new Command();

program
  .name('blog-factory')
  .description('Technical Document Production Line (Phase 1: Inspection)')
  .version('1.0.0');

program.addCommand(inspectCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

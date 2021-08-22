#!/usr/bin/env node

import chalk from 'chalk';
import Commander from 'commander';
import packageJson from '../package.json';
import { resize } from './resize';

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<input-file> [options]')
  .option('-w, --width <width>', 'width size in pixel')
  .option('-h, --height <height>', 'height size in pixel')
  .option('-p, --prefix <prefix>', 'prefix of result files')
  .option('-o, --out [file]', `output directory for build (defaults to ${chalk.cyanBright('<input-file-path>/min')})`)
  .usage(`
    Usage:
      npx diet-image ${chalk.cyanBright('<input-file>')} [options]

    Commands:
      ${chalk.cyanBright('<input-file>')} [opts]
  `)
  .parse(process.argv);

const {
  width, height, prefix, out
} = program.opts();

resize(
  program.args[0],
  {
    prefix,
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
    outDir: out,
  },
);

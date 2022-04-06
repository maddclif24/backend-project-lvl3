#!/usr/bin/env node
import pageLoader from '../src/pageLoader.js';
import { program } from 'commander';
import process from 'process';

program
  .version('0.0.1')
  .arguments('<url>')
  .description('Page loader utility')
  .option('-o, --output [dir]', `output dir (default: "${process.cwd()}")`)
  .action((link, path) => pageLoader(link, path.output)
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    }))
  .parse(process.argv);

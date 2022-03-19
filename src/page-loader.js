#!/usr/bin/env node
import pageLoader from "./pageLoader.js";

import { program } from 'commander';

import process from 'process';

program
  .version('0.0.1')
  .arguments('<url>')
  .description('Page loader utility')
  .option('-o, --output [dir]', `output dir (default: "${process.cwd()}")`)
  .action((link, path) => {
    // console.log(link, path.output);
    pageLoader(link, path.output)
  })
  .parse();

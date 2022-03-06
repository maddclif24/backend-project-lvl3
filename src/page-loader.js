#!/usr/bin/env node
// import pageLoader from "./pageLoader.js";

import { program } from 'commander';


program
  .version('0.0.1')
  .arguments('<url>')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir")')
  .parse();
// pageLoader('https://ru.hexlet.io/courses');
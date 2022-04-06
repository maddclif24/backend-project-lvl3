import axios from 'axios';
import * as fs from 'fs/promises';
import process from 'process';
import * as cheerio from 'cheerio';
import path from 'path';
import { parseFileName, loadResources, canLoad, genFileName } from './utils.js';

export default async (url, pathDir = process.cwd()) => {
  const { indexHTML, mediaDirName } = parseFileName(url);
  const { hostname } = new URL(url);
  const config = { hostname, mediaDirName, url, pathDir };
  let domTree;
  return axios.get(url)
  .then(({ data }) => {
    fs.mkdir(path.join(pathDir, mediaDirName))
    domTree = cheerio.load(data);
    // return cheerio.load(data);
    return domTree;
  })
  .then(() => {
    return loadResources(domTree, config);
    // return html;
  })
  .then(() => {
    domTree('img, script, link').each(function() {
      const attribute = domTree(this).attr('href') ? 'href' : 'src';
      const source = domTree(this).attr(attribute);
      const validSource = canLoad(source) ? genFileName(source, config) : source;
      domTree(this).attr(attribute, validSource);
    });
    return domTree;
  })
  .then((domTree) => fs.writeFile(path.join(pathDir, indexHTML), domTree.html()))
  .catch((error) => console.log(error));
};

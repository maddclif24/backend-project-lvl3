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
  const savedSources = [];

  return axios.get(url)
  .then(({ data }) => {
    const domThree = cheerio.load(data);

    domThree('img, script, link').each((i, elem) => {
      const attribute = domThree(elem).attr('href') ? 'href' : 'src';
      const source = domThree(elem).attr(attribute);
      const validSource = canLoad(source) ? (savedSources.push(source), genFileName(source, config)) : source;
      domThree(elem).attr(attribute, validSource);
    });

    return fs.writeFile(path.join(pathDir, indexHTML), domThree.html());
  })
  .then(() => fs.mkdir(path.join(pathDir, mediaDirName)))
  .then(() => loadResources(savedSources, config))
};

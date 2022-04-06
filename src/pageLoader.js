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

  return axios.get(url)
  .then(({ data }) => {
    fs.mkdir(path.join(pathDir, mediaDirName))
    const domThree = cheerio.load(data);
    const oldPaths = [];
    domThree('img, script, link').each((i, elem) => {
      const attribute = domThree(elem).attr('href') ? 'href' : 'src';
      const source = domThree(elem).attr(attribute);
      const validSource = canLoad(source) ? (oldPaths.push(source), genFileName(source, config)) : source;
      domThree(elem).attr(attribute, validSource);
    });
    fs.writeFile(path.join(pathDir, indexHTML), domThree.html());
    return oldPaths;
  })
  .then((paths) => {
    return loadResources(paths, config);
  })
  .catch((error) => console.log(error));
};

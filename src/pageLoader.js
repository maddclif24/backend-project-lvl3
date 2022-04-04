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
    return cheerio.load(data);
  })
  .then((html) => {
    loadResources(html, config);
    return html;
  })
  .then((html) => {
    html('img, script, link').each(function() {
      const attribute = html(this).attr('href') ? 'href' : 'src';
      const source = html(this).attr(attribute);
      const validSource = canLoad(source) ? genFileName(source, config) : source;
      html(this).attr(attribute, validSource);
    });
    return html;
  })
  .then((html) => fs.writeFile(path.join(pathDir, indexHTML), html.html()))
  .catch((error) => console.log(error));
};

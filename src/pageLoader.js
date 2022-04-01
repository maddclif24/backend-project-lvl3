import axios from 'axios';
import * as fs from 'fs/promises';
import process from 'process';
import * as cheerio from 'cheerio';
import path from 'path';
import Listr from 'listr';

import { addLogger } from 'axios-debug-log';

import Debug from 'debug';

const debug = Debug('page-loader');

const parseFileName = (path) => {
  const { origin } = new URL(path);
  const [, slicePath] = origin.split('://');
  const result = slicePath.split('.').join('-').split('/').join('-')
  const indexHTML = `${result}.html`;
  const mediaDirName = `${result}_files`;
  return { indexHTML, mediaDirName };
};

const genFileName = (dirName, hostName, src) => {
  let normalizedSrc;
  const parsedHostname = hostName.split('.').join('-');
  if (src.includes('https') || src.includes('http')) {
    const url = new URL(src);
    const splitSrc = url.pathname.split('/').join('').split('.').join('-');
    normalizedSrc = [parsedHostname, splitSrc].join('-');
    return `${dirName}/${normalizedSrc}`
  }
  normalizedSrc = path.normalize(src).split('/').join('-');
  return `${dirName}/${parsedHostname}${normalizedSrc}`;
};

const isUrl = (str) => str.startsWith('http');

const canDownload = (href, hostName) => {
  if (!href) {
    return false;
  }
  if (isUrl(href)) {
    const { hostname } = new URL(href);
    return hostname === hostName;
  }
  else if (href.startsWith('//')) {
    return false;
  }
  return true;
};

const createFile = (fileName, data) => {
  const encoding = data.name === 'img' ? 'base64' : 'utf-8';
  fs.writeFile(fileName, data, encoding, (err) => err);
};


const downLoadResourse = (dirName, resourcePath, hostName) => {
  if (canDownload(resourcePath, hostName)) {
    const url = isUrl(resourcePath) ? resourcePath : `https://${hostName}${resourcePath}`;
    const fileName = genFileName(dirName, hostName, resourcePath);
    const download = axios.create({ baseURL: `https://${hostName}/` });

    addLogger(download, debug);
    return download(url, { responseType: 'arraybuffer' })
      .then(({ data }) => createFile(fileName, data))
  }
  return Promise.resolve();
};



export default async (link, pathDir = process.cwd()) => {
  axios.get(link).then((res) => {
    const { data } = res;
    const { hostname } = new URL(link);
    const { indexHTML, mediaDirName } = parseFileName(link);
    const $ = cheerio.load(data);
    // Достать все ресурсы
    const images = Array.from($('img'));
    const links = Array.from($('link'));
    const scripts = Array.from($('script')).filter((script) => script.attribs.src);
    const resources = [...images, ...links, ...scripts];


    fs.mkdir(path.join(pathDir, mediaDirName), (err) => err)
    .then(() => {
      const promises = resources.map(({ attribs }) => {
        const source = attribs.href ? attribs.href : attribs.src;
        return {
          title: `${link}${source.slice(1)}`,
          task: () => downLoadResourse(mediaDirName, source, hostname).catch((e) => {
            return Promise.reject(new Error(e.response.statusText));
          }),
        }
      })
      const tasks = new Listr(promises, { concurrent: true, exitOnError: false });
      return tasks.run().catch(e => e);
    })
    .then(() => {
      // Заменяем пути на локальные
      $('img, script, link').each(function() {
        const attribute = $(this).attr('href') ? 'href' : 'src';
        const source = $(this).attr(attribute);
        const validSource = canDownload(source) ? genFileName(mediaDirName, hostname, source) : source;
        $(this).attr(attribute, validSource);
      });

      fs.writeFile(path.join(pathDir, indexHTML), $.html(), (err) => err)
    });
  })
  .catch((error) => error);
};

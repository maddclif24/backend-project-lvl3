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

const genFileName = (src, { hostname, mediaDirName }) => {
  let normalizedSrc;
  const parsedHostname = hostname.split('.').join('-');
  if (src.includes('https') || src.includes('http')) {
    const url = new URL(src);
    const splitSrc = url.pathname.split('/').join('').split('.').join('-');
    normalizedSrc = [parsedHostname, splitSrc].join('-');
    return `${mediaDirName}/${normalizedSrc}`;
  }
  normalizedSrc = path.normalize(src).split('/').join('-');
  return `${mediaDirName}/${parsedHostname}${normalizedSrc}`;
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


const downLoadResourse = (mediaDirName, resourcePath, hostname) => {
  const url = isUrl(resourcePath) ? resourcePath : `https://${hostname}${resourcePath}`;
  const fileName = genFileName(resourcePath, { hostname, mediaDirName });
  const download = axios.create({ baseURL: `https://${hostname}/` });

  addLogger(download, debug);
  return download(url, { responseType: 'arraybuffer' })
    .then(({ data }) => createFile(fileName, data));
};

const loadResources = (html, { hostname, pathDir, mediaDirName, url }) => {
  const images = Array.from(html('img'));
  const links = Array.from(html('link'));
  const scripts = Array.from(html('script')).filter((script) => script.attribs.src);
  const resources = [...images, ...links, ...scripts];

  const promises = resources.map(({ attribs }) => {
    const source = attribs.href ? attribs.href : attribs.src;
    return {
      title: `${url}${source.slice(1)}`,
      enabled: () => canDownload(source, hostname),
      task: () => downLoadResourse(path.join(pathDir, mediaDirName), source, hostname).catch((error) => {
        const description = error.message ? error.message : error.response.statusText;
        return Promise.reject(new Error(description));
      }),
    }
  })
  const tasks = new Listr(promises, { concurrent: true, exitOnError: false });
  return tasks.run().catch(e => e);
}


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
      const validSource = canDownload(source) ? genFileName(source, config) : source;
      html(this).attr(attribute, validSource);
    });
    return html;
  })
  .then((html) => fs.writeFile(path.join(pathDir, indexHTML), html.html()))
  .catch((error) => console.log(error));
};

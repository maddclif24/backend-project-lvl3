import axios from 'axios';
import * as fs from 'fs/promises';
import path from 'path';
import Listr from 'listr';

const parseFileName = (url) => {
  let [, href] = url.split('://');
  href = href.endsWith('/') ? href.slice(0, -1) : href;
  const result = href.split('.').join('-').split('/').join('-');
  const fileName = result.concat('.html');
  const mediaDirName = result.concat('_files');
  return { fileName, mediaDirName };
};

const isUrl = (str) => str.startsWith('http');

const genFileName = (src, { hostname, mediaDirName }) => {
  let normalizedSrc;
  const parsedHostname = hostname.split('.').join('-');
  if (isUrl(src)) {
    const url = new URL(src);
    const splitSrc = url.pathname.split('/').join('-');
    normalizedSrc = parsedHostname.concat(splitSrc);
    return path.join(mediaDirName, normalizedSrc);
  }
  normalizedSrc = path.normalize(src).split('/').join('-');
  normalizedSrc = path.extname(normalizedSrc) ? normalizedSrc : normalizedSrc.concat('.html');
  return path.join(mediaDirName, parsedHostname).concat(normalizedSrc);
};

const canLoad = (href, hostName) => {
  if (!href) {
    return false;
  }
  if (isUrl(href)) {
    if (href.startsWith('//')) {
      return false;
    }
    const { hostname } = new URL(href);
    return hostname === hostName;
  }
  return true;
};

const createFile = (fileName, pathDir, data) => {
  const encoding = data.name === 'img' ? 'base64' : 'utf-8';
  const validFileName = path.extname(fileName) ? fileName : fileName.concat('.html');
  return fs.writeFile(path.join(pathDir, validFileName), data, encoding, (err) => err);
};

const downLoadResourse = (resourcePath, hostname, protocol) => {
  const url = isUrl(resourcePath) ? resourcePath : `${protocol}//${hostname}${resourcePath}`;
  return axios.get(url, { responseType: 'arraybuffer' });
};

const loadResources = (sources, {
  hostname, mediaDirName, pathDir, url, protocol,
}) => {
  const promises = sources.map((source) => {
    const fileName = genFileName(source, { hostname, pathDir, mediaDirName });
    const title = `${url}${source.slice(1)}`;
    return {
      title,
      enabled: () => canLoad(source, hostname),
      task: () => downLoadResourse(source, hostname, protocol)
        .then(({ data }) => createFile(fileName, pathDir, data))
        .catch((error) => error),
    };
  });

  const tasks = new Listr(promises, { concurrent: true, exitOnError: false });
  return tasks.run();
};

export {
  loadResources,
  canLoad,
  genFileName,
  parseFileName,
};

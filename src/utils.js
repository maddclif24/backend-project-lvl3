import axios from 'axios';
import * as fs from 'fs/promises';
import path from 'path';
import Listr from 'listr';

const parseFileName = (path) => {
  const { origin } = new URL(path);
  const [, slicePath] = origin.split('://');
  const result = slicePath.split('.').join('-').split('/').join('-');
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

const canLoad = (href, hostName) => {
  if (!href) {
    return false;
  }
  if (isUrl(href)) {
    const { hostname } = new URL(href);
    return hostname === hostName;
  } else if (href.startsWith('//')) {
    return false;
  }
  return true;
};

const createFile = (fileName, pathDir, data) => {
  const encoding = data.name === 'img' ? 'base64' : 'utf-8';
  return fs.writeFile(path.join(pathDir, fileName), data, encoding, (err) => err);
};

const downLoadResourse = (resourcePath, hostname) => {
  const url = isUrl(resourcePath)
    ? resourcePath
    : `https://${hostname}${resourcePath}`;
  return axios.get(url, { responseType: 'arraybuffer' });
};

const loadResources = (paths, { hostname, mediaDirName, pathDir, url }) => {
  const resources = paths.filter((path) => path);

  const promises = resources.map((path) => {
    const fileName = genFileName(path, { hostname, pathDir, mediaDirName });
    const title = `${url}${path.slice(1)}`;
    return {
      title,
      enabled: () => canLoad(path, hostname),
      task: () =>
        downLoadResourse(path, hostname)
        .then(({ data }) => {
          return createFile(fileName, pathDir, data)
        })
        .catch((error) => {
          const description = error.message
            ? error.message
            : error.response.statusText;
          return Promise.reject(new Error(description));
        }),
    };
  });
  const tasks = new Listr(promises, { concurrent: true, exitOnError: false });
  return tasks.run().catch((e) => e);
};

export {
  loadResources,
  canLoad,
  genFileName,
  parseFileName,
};

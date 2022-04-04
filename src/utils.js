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

const createFile = (fileName, data) => {
  const encoding = data.name === 'img' ? 'base64' : 'utf-8';
  fs.writeFile(fileName, data, encoding, (err) => err);
};

const downLoadResourse = (mediaDirName, resourcePath, hostname) => {
  const url = isUrl(resourcePath)
    ? resourcePath
    : `https://${hostname}${resourcePath}`;
  const fileName = genFileName(resourcePath, { hostname, mediaDirName });
  const download = axios.create({ baseURL: `https://${hostname}/` });

  return download(url, { responseType: 'arraybuffer' }).then(({ data }) => {
    return createFile(fileName, data)
  });
};

const loadResources = (html, { hostname, pathDir, mediaDirName, url }) => {
  const media = Array.from(html('img, link'));
  const scripts = Array.from(html('script')).filter(
    (resource) => resource.attribs.src
  );
  const resources = [...media, ...scripts];

  const promises = resources.map(({ attribs }) => {
    const source = attribs.href ? attribs.href : attribs.src;
    return {
      title: `${url}${source.slice(1)}`,
      enabled: () => canLoad(source, hostname),
      task: () =>
        downLoadResourse(
          path.join(pathDir, mediaDirName),
          source,
          hostname
        ).catch((error) => {
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

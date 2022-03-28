import axios from 'axios';
import * as fs from 'fs/promises';
import process from 'process';
import * as cheerio from 'cheerio';
import path from 'path';


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
    console.log(`${dirName}/${normalizedSrc}`)
    return `${dirName}/${normalizedSrc}`
  }
  normalizedSrc = path.normalize(src).split('/').join('-');
  return `${dirName}/${parsedHostname}${normalizedSrc}`;
};

const isUrl = (str) => str.startsWith('http');

const canDownload = (href, hostName) => {
  if (isUrl(href)) {
    const { hostname } = new URL(href);
    return hostname === hostName;
  }
  else if (href.startsWith('//')) {
    return false;
  }
  return true;
};


const downLoadResourse = (dirName, resourcePath, hostName) => {
  console.log(resourcePath, '------------------------------------')
  if (canDownload(resourcePath, hostName)) {
    const url = isUrl(resourcePath) ? resourcePath : `https://${hostName}${resourcePath}`;
    axios.get(url, { responseType: 'arraybuffer' })
    .then(({ data }) => {
      const fileName = genFileName(dirName, hostName, resourcePath);
      const encoding = data.name === 'img' ? 'base64' : 'utf-8';
      fs.writeFile(fileName, data, encoding, (err) => err);
  })
    .catch((error) => console.log(error));
  }
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
    const scripts = Array.from($('script'));
    const resources = [...images, ...links, ...scripts];


    fs.mkdir(path.join(pathDir, mediaDirName), (err) => err)
    .then(() => {
      resources.forEach((resources) => {
        if (resources.name === 'script') {
          if (resources.attribs.src) {
            downLoadResourse(mediaDirName, resources.attribs.src, hostname);
          }
        }
        else {
          const resourcePath = resources.attribs.href ? resources.attribs.href : resources.attribs.src;
          console.log(resources.name, resources.attribs.href, resources.attribs.src, genFileName(mediaDirName, hostname, resourcePath), 'CHECK__CHECK');
          downLoadResourse(mediaDirName, resourcePath, hostname);
        }
      })
    })
    .then(() => {
      // Менять пути у всех ресурсов (Функция)
      $('img').replaceWith(function() {
        const src = $(this).attr('src');
        return $(this).attr('src', src.replace(src, genFileName(mediaDirName, hostname, src)));
      });
    })
    .then(() => fs.writeFile(path.join(pathDir, indexHTML), $.html(), (err) => err));
  })
  .catch((error) => console.log(error.message));
};

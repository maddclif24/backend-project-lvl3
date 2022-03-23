import axios from 'axios';
import * as fs from 'fs/promises';
import process from 'process';
import * as cheerio from 'cheerio';
import path from 'path';


const parseFileName = (path) => {
  const [, slicePath] = path.split('://');
  const result = slicePath.split('.').join('-').split('/').join('-')
  const indexHTML = `${result}.html`;
  const mediaDirName = `${result}_files`;
  return { indexHTML, mediaDirName };
};

const genImageSrc = (dirName, hostName, src) => {
  const normalizedSrc = path.normalize(src).split('/').join('-');
  const parsedHostname = hostName.split('.').join('-');
  return `${dirName}/${parsedHostname}${normalizedSrc}`;
}


export default async (link, pathDir = process.cwd()) => {
  axios.get(link).then((res) => {
    const { data } = res;
    const { hostname } = new URL(link);
    const { indexHTML, mediaDirName } = parseFileName(link);
    const $ = cheerio.load(data);
    const images = Array.from($('img'));
    fs.mkdir(path.join(pathDir, mediaDirName), (err) => err)
    .then(() => {
      images.forEach((img) => {
        const imgSrc = img.attribs.src;
        axios.get(`https://${hostname}${imgSrc}`, { responseType: 'arraybuffer' })
        .then(({ data }) => {
          const fileName = genImageSrc(mediaDirName, hostname, imgSrc);
          fs.writeFile(fileName, data, 'base64', (err) => err);
        })
        .catch((error) => console.log(error));
      })
    })
    .then(() => {
      $('img').replaceWith(function() {
        const src = $(this).attr('src');
        return $(this).attr('src', src.replace(src, genImageSrc(mediaDirName, hostname, src)));
      });
    })
    .then(() => fs.writeFile(path.join(pathDir, indexHTML), $.html(), (err) => err));
  })
  .catch((error) => console.log(error.message));
};

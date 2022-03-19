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


export default async (link, pathDir = process.cwd()) => {
  console.log(link);
  axios.get(link).then((res) => {
    const { data } = res;
    const $ = cheerio.load(data);
    const images = Array.from($('img'));
    // console.log(images);
    const { hostname } = new URL(link);
    console.log(hostname);
    // Циклом пройтись и строить пути до картинок
    const { indexHTML, mediaDirName }= parseFileName(link);
    fs.writeFile(`${pathDir}/${indexHTML}`, data, (err) => err);
    fs.mkdir(`${pathDir}/${mediaDirName}`, (err) => err)
    .then(() => {
      images.forEach((img) => {
        const imgSrc = img.attribs.src;
        axios.get(`https://${hostname}${imgSrc}`, { responseType: 'arraybuffer' })
        .then(({ data }) => {
          // console.log(data);
          // const extname = path.extname(imgSrc);
          console.log(imgSrc);
          const normalizedSrc = path.normalize(imgSrc).split('/').join('-');
          const parsedHostname = hostname.split('.').join('-') 
          fs.writeFile(`${mediaDirName}/${parsedHostname}${normalizedSrc}`, data, 'base64', (err) => err);  
        })
        .catch((error) => console.log(error));
      })
    })
  })
  .catch((error) => console.log(error.message));
  
};
// https://en.lyrsense.com/images/userDefault.png

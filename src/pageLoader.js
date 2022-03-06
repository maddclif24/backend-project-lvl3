import axios from 'axios';
import * as fs from 'fs/promises';

const parseFileName = (path) => {
  const [, slicePath] = path.split('://');
  const result = slicePath.split('.').join('-').split('/').join('-')
  return `${result}.html`;
};


export default async (path) => {
  axios.get(path).then((res) => {
    const { data } = res;
    const fileName = parseFileName(path)
    fs.writeFile(`./src/${fileName}`, data, (err) => err);
  })
  .catch((error) => console.log(error.message));
};
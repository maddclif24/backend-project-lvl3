import { test, expect, beforeEach } from '@jest/globals';
import * as fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import pageLoader from '../src/pageLoader.js';

nock.disableNetConnect();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (filename, encoding = 'utf-8') => fs.readFile(getFixturePath(filename), encoding);

let tempDir;
let beforeHtml;
let afterHtml;
let css;
let image;
let script;
let canonical;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  beforeHtml = await readFile('before.html');
  afterHtml = await readFile('after.html');
  css = await readFile('main.css');
  image = await readFile('img.png', 'base64');
  script = await readFile('script.js');
  canonical = await readFile('canonical.html');
});

test('Load resources', async () => {
  nock('https://page-loader.hexlet.repl.co/')
    .get('/')
    .reply(200, beforeHtml)
    .get('/assets/application.css')
    .reply(200, css);
  nock('https://page-loader.hexlet.repl.co/')
    .get('/courses')
    .reply(200, canonical);
  nock('https://page-loader.hexlet.repl.co/')
    .get('/assets/professions/nodejs.png')
    .reply(200, image);
  nock('https://page-loader.hexlet.repl.co/')
    .get('/script.js')
    .reply(200, script);

  await pageLoader('https://page-loader.hexlet.repl.co/', tempDir);
  const [htmlName, mediaDirName] = await fs.readdir(tempDir);
  const mediaDir = await fs.readdir(path.join(tempDir, mediaDirName));
  const [cssName, imageName, canonicalName, scriptName] = mediaDir;
  const readCss = await fs.readFile(path.join(tempDir, mediaDirName, cssName), 'utf-8');
  const readImage = await fs.readFile(path.join(tempDir, mediaDirName, imageName), 'utf-8');
  const readCanonical = await fs.readFile(path.join(tempDir, mediaDirName, canonicalName), 'utf-8');
  const readScript = await fs.readFile(path.join(tempDir, mediaDirName, scriptName), 'utf-8');
  const html = await fs.readFile(path.join(tempDir, htmlName), 'utf-8');

  expect(html).toEqual(afterHtml);
  expect(css).toEqual(readCss);
  expect(image).toEqual(readImage);
  expect(canonical).toEqual(readCanonical);
  expect(script).toEqual(readScript);
});

test('Files already exist', async () => {
  nock('https://page-loader.hexlet.repl.co/')
    .persist()
    .get('/')
    .reply(200, beforeHtml)
    .get('/assets/application.css')
    .reply(200, css);
  nock('https://page-loader.hexlet.repl.co/')
    .get('/courses')
    .reply(200, canonical);
  nock('https://page-loader.hexlet.repl.co/')
    .get('/assets/professions/nodejs.png')
    .reply(200, image);
  nock('https://page-loader.hexlet.repl.co/')
    .get('/script.js')
    .reply(200, script);

  await pageLoader('https://page-loader.hexlet.repl.co/', tempDir);
  await expect(pageLoader('https://page-loader.hexlet.repl.co/', tempDir)).rejects.toThrow();
});

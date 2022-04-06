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
let text;


beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    beforeHtml = await readFile('before.html');
    afterHtml = await readFile('after.html');
    css = await readFile('main.css');
    image = await readFile('img.png', 'base64');
    script = await readFile('script.js');
    text = await readFile('text');
});


test('Load resources', async () => {
    nock('https://page-loader.hexlet.repl.co/')
        .get('/')
        .reply(200, beforeHtml)
        .get('/assets/application.css')
        .reply(200, css)
    nock('https://page-loader.hexlet.repl.co/')
        .get('/courses')
        .reply(200, text)
    nock('https://page-loader.hexlet.repl.co/')
        .get('/assets/professions/nodejs.png')
        .reply(200, image)
    nock('https://page-loader.hexlet.repl.co/')
        .get('/script.js')
        .reply(200, script);
            
    await pageLoader('https://page-loader.hexlet.repl.co/', tempDir);
    const data = await fs.readdir(tempDir);
    const data2 = await fs.readdir(path.join(tempDir, data[1]));
    const [ cssName, imageName, textName, scriptName ] = data2;
    const readCss = await fs.readFile(path.join(tempDir, data[1], cssName), 'utf-8');
    const readImage = await fs.readFile(path.join(tempDir, data[1], imageName), 'utf-8');
    const readText = await fs.readFile(path.join(tempDir, data[1], textName), 'utf-8');
    const readScript = await fs.readFile(path.join(tempDir, data[1], scriptName), 'utf-8');
    const html = await fs.readFile(path.join(tempDir, data[0]), 'utf-8');
    expect(html).toEqual(afterHtml);
    expect(css).toEqual(readCss);
    expect(image).toEqual(readImage);
    expect(text).toEqual(readText);
    expect(script).toEqual(readScript);
});

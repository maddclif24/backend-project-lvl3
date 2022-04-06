import { test, expect, beforeEach, describe } from '@jest/globals';
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

/* test('html-exist', async () => {
    nock('https://page-loader.hexlet.repl.co/')
        .get('/')
        .reply(200, beforeHtml);
    await pageLoader('https://page-loader.hexlet.repl.co/', tempDir);
    const [fileName] = await fs.readdir(tempDir);
    const html = await fs.readFile(path.join(tempDir, fileName), 'utf-8');
    expect(html).toEqual(afterHtml);
}); */


describe('load resources', () => {
    test('css', async () => {
        nock('https://page-loader.hexlet.repl.co/')
            .get('/')
            .reply(200, beforeHtml)
        nock('https://page-loader.hexlet.repl.co/')
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
        console.log(data2);
    });
});
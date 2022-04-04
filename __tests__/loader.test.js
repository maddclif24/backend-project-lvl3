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
const readFile = (filename) => fs.readFile(getFixturePath(filename), 'utf-8');

let tempDir;
let beforeHtml;
let afterHtml;

beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    beforeHtml = await readFile('before.html');
    afterHtml = await readFile('after.html');
});

test('html-exist', async () => {
    nock('https://page-loader.hexlet.repl.co/')
        .get('/')
        .reply(200, beforeHtml);
    await pageLoader('https://page-loader.hexlet.repl.co/', tempDir);
    const [fileName] = await fs.readdir(tempDir);
    const html = await fs.readFile(path.join(tempDir, fileName), 'utf-8');
    expect(html).toEqual(afterHtml);
});
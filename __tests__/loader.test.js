import pageLoader from '../src/pageLoader.js';
import { test, expect, beforeEach } from '@jest/globals';
import * as fs from 'fs/promises';
import nock from 'nock';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import path from 'path';
import { readdir } from 'fs';


const __dirname = dirname(fileURLToPath(import.meta.url));


beforeEach(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-hexlet-repl-co.html'));
    await pageLoader('https://page-loader.hexlet.repl.co/', dir);
})

const getFixturePath = (filename) => `${__dirname}/../__fixtures__/${filename}`;


test('Load hexlet-repl', async () => {
    nock('https://page-loader.hexlet.repl.co/')
    .get('/assets/professions/nodejs.png')
    .reply(200)
    
});



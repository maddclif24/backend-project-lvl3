import pageLoader from './src/page-loader.js';
import { test, expect } from 'jest';
import * as fs from 'fs';

test('file-exist', async () => {
    const downLoadPagePath = './downloads/ru-hexlet-io-courses.html';
    await pageLoader('https://ru.hexlet.io/courses');
    const fileStats = fs.stat(downLoadPagePath);
    await expect(fileStats.isFile()).toBe(true);
});
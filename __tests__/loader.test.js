import pageLoader from '../src/pageLoader.js';
import { test, expect, beforeEach } from '@jest/globals';
import * as fs from 'fs/promises';

beforeEach(async () => {
    await pageLoader('https://ru.hexlet.io/courses');
})


test('file-exist', async () => {
    const downLoadPagePath = '../src/ru-hexlet-io-courses.html';
    // await pageLoader('https://ru.hexlet.io/courses');
    const fileStats = await fs.readFile(downLoadPagePath);
    console.log(fileStats)
    // await expect(fileStats.isFile()).toBe(true);
});
import { test as base, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { baseUrl } from '../config/environment.js';
import { createTestRunId } from '../utils/dataGenerator.js';
import { SearchPage } from '../pages/searchPage.js';
import { ProductListingPage } from '../pages/productListingPage.js';
import testData from '../test-data/searchScenarios.json' with { type: 'json' };

interface FrameworkFixtures {
  searchPage: SearchPage;
  productListingPage: ProductListingPage;
  testRunId: string;
}

export const test = base.extend<FrameworkFixtures>({
  page: async ({ page }, use, testInfo) => {
    await use(page);
    if (testInfo.status === testInfo.expectedStatus) return;

    const screenshotDirectory = path.resolve(process.cwd(), 'reports/screenshots');
    const fileName = `${testInfo.project.name}-${testInfo.testId}-${testInfo.retry}`
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    await mkdir(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDirectory, `${fileName}.png`),
      fullPage: true,
    }).catch(() => undefined);
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  productListingPage: async ({ page }, use) => {
    await use(new ProductListingPage(page, new URL(baseUrl).origin));
  },
  testRunId: [async ({}, use, testInfo) => {
    const testRunId = createTestRunId();
    await use(testRunId);
    await testInfo.attach('test-run-metadata', {
      body: JSON.stringify({ testRunId, title: testInfo.title }, null, 2),
      contentType: 'application/json',
    });
  }, { auto: true }],
});

export { expect, testData };

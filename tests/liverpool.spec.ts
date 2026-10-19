import { test, expect, testData } from '../fixtures/test.js';
import { scanAccessibility } from '../utils/accessibility.js';

const searchTerms = testData.searchTerms;
for (const searchTerm of searchTerms) {
test(`real-world e-commerce flow on Liverpool for:${searchTerm}`, async ({ searchPage, productListingPage }) => {
  await searchPage.search(searchTerm);
  await searchPage.filterByColor(testData.colorFilter);
  await searchPage.sortByLowestPrice();
  const audit = await productListingPage.auditFirstProducts(searchTerm, {
    limit: testData.productAudit.sampleSize,
    priceTolerance: testData.productAudit.priceTolerance,
  });
  expect(
    audit.uiProductCount,
    'Could not scrape any product names from the product list'
  ).toBeGreaterThanOrEqual(testData.productAudit.minimumVisibleProducts);
  expect(
    audit.sourceProductCount,
    'Could not obtain independent product data from the network or page payload'
  ).toBeGreaterThan(0);
  expect(
    audit.matchedProductCount,
    `Only ${audit.matchedProductCount} of ${audit.uiProductCount} products matched.\n` +
      audit.discrepancies.join('\n')
  ).toBeGreaterThanOrEqual(testData.productAudit.minimumMatches);
});
}
for (const { searchTerm, secondsToLoad } of testData.performanceScenarios) {
test(`Search for ${searchTerm} with timeout ${secondsToLoad}s`, async ({ page, searchPage }) => {
  const startTime = Date.now();
  await searchPage.search(searchTerm);
  const loadDurationSeconds = (Date.now() - startTime) / 1000;
  console.log(`Search results page load time: ${loadDurationSeconds}s`);
  expect(loadDurationSeconds).toBeLessThan(secondsToLoad);
});
}
for (const searchTerm of searchTerms) {
test(`Accessibility check: scan search results for WCAG violations for ${searchTerm}`, async ({ page, searchPage }) => {
  await searchPage.search(searchTerm);
  const accessibilityScanResults = await scanAccessibility(page);
  expect(accessibilityScanResults.violations).toEqual([]);
});
}
for (const searchTerm of searchTerms) {
test(`Visual regression: search results page matches baseline ${searchTerm}`, async ({ page, searchPage }) => {
  await searchPage.search(searchTerm);
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot('search-results.png', {
    maxDiffPixelRatio: 0.05, 
  });
});
}

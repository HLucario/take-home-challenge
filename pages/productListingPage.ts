import type { Locator, Page, Response } from '@playwright/test';
import { catalog, timeouts } from '../config/catalog.js';
import { searchLocators } from '../locators/searchLocators.js';
import { resolvePriceLocator, safeText } from '../utils/locatorHelpers.js';
import { extractFromNextData, parseRscChunks, type ApiProduct } from '../utils/productData.js';
import { auditProducts, type ProductAuditResult, type UiProduct } from '../utils/productAudit.js';

export class ProductListingPage {
  private readonly productList: Locator;

  constructor(private readonly page: Page, private readonly applicationOrigin: string) {
    this.productList = page.locator(searchLocators.productList);
  }

  async auditFirstProducts(
    searchTerm: string,
    options: { limit: number; priceTolerance: number }
  ): Promise<ProductAuditResult> {
    const apiProducts = await this.captureProductData(searchTerm);
    const uiProducts = await this.readVisibleProducts(options.limit);
    return auditProducts(uiProducts, apiProducts, options.priceTolerance);
  }

  private async captureProductData(searchTerm: string): Promise<ApiProduct[]> {
    const responseProducts = await this.captureResponseProducts(searchTerm);
    if (responseProducts.length > 0) return responseProducts;

    const rscProducts = await this.captureRscProducts();
    if (rscProducts.length > 0) return rscProducts;

    return [];
  }

  private async captureResponseProducts(searchTerm: string): Promise<ApiProduct[]> {
    const capturedProducts: ApiProduct[] = [];
    const pendingReads: Promise<void>[] = [];
    const captureResponse = (response: Response): void => {
      const contentType = response.headers()['content-type'] ?? '';
      if (
        new URL(response.url()).origin !== this.applicationOrigin ||
        !contentType.includes('application/json')
      ) {
        return;
      }

      pendingReads.push((async () => {
        try {
          const products = extractFromNextData(await response.json());
          if (products.length > 0 && capturedProducts.length === 0) {
            capturedProducts.push(...products);
          }
        } catch {
          // Ignore unrelated or non-product JSON responses.
        }
      })());
    };

    this.page.on('response', captureResponse);
    try {
      await this.page.goto(
        `${catalog.sortedListingPath}?s=${encodeURIComponent(searchTerm)}&${catalog.sortParameter}=${encodeURIComponent(catalog.lowestPriceSort)}`,
        { waitUntil: 'domcontentloaded', timeout: timeouts.navigation }
      );
      await this.productList.waitFor({ state: 'visible', timeout: timeouts.productList });
    } finally {
      this.page.off('response', captureResponse);
    }
    await Promise.all(pendingReads);
    return capturedProducts;
  }

  private async captureRscProducts(): Promise<ApiProduct[]> {
    const rscChunks = await this.page.locator('script:not([src])').evaluateAll(scripts =>
      scripts
        .map(script => script.textContent ?? '')
        .filter(text =>
          text.includes('__next_f') ||
          text.includes('productId') ||
          text.includes('displayName') ||
          text.includes('salePrice')
        )
    );
    return parseRscChunks(rscChunks);
  }

  private async readVisibleProducts(limit: number): Promise<UiProduct[]> {
    await this.productList.waitFor({ state: 'visible', timeout: timeouts.productList });
    const cards = this.productList.locator('> *');
    await cards.first().waitFor({ state: 'visible', timeout: timeouts.firstProduct });

    const products: UiProduct[] = [];
    const count = Math.min(await cards.count(), limit);
    for (let index = 0; index < count; index++) {
      const card = cards.nth(index);
      const name = await safeText(card.locator(searchLocators.productName).last());
      const originalPrice = await safeText(
        await resolvePriceLocator(
          card,
          searchLocators.originalPriceTestId,
          searchLocators.priceFallback
        )
      );
      const discountedPriceLocator = card.getByTestId(searchLocators.discountedPriceTestId);
      const hasDiscount = await discountedPriceLocator.isVisible().catch(() => false);
      const discountedPrice = hasDiscount ? await safeText(discountedPriceLocator) : null;

      if (name) products.push({ name, originalPrice, discountedPrice });
    }
    return products;
  }
}
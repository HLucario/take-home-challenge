import type { Page } from '@playwright/test';
import { catalog } from '../config/catalog.js';
import { searchLocators } from '../locators/searchLocators.js';

export class SearchPage {
  constructor(private readonly page: Page) {}

  async search(keyword: string): Promise<void> {
    await this.page.goto(catalog.homePath, { waitUntil: 'domcontentloaded' });
    await this.page.goto(`${catalog.searchPath}?s=${encodeURIComponent(keyword)}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async filterByColor(color: string): Promise<void> {
    await searchLocators.colorCheckbox(this.page, color).click();
  }

  async sortByLowestPrice(): Promise<void> {
    const resultsUrl = new URL(this.page.url());
    resultsUrl.searchParams.set(catalog.sortParameter, catalog.lowestPriceSort);
    await this.page.goto(resultsUrl.toString(), { waitUntil: 'domcontentloaded' });
  }

}

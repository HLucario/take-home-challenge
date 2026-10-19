import type { Page } from '@playwright/test';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const searchLocators = {
  productList: '#plp-page-card-product-list',
  productName: 'h3',
  originalPriceTestId: 'original',
  discountedPriceTestId: 'discounted',
  priceFallback: '[data-testid$="price"]',
  colorCheckbox: (page: Page, color: string) =>
    page.getByRole('checkbox', {
      name: new RegExp(`^${escapeRegExp(color)}(?:\\s|$)`),
    }),
};

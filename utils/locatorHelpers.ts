import type { Locator } from '@playwright/test';

export async function safeText(locator: Locator): Promise<string> {
  return ((await locator.textContent().catch(() => '')) ?? '').trim();
}

export async function resolvePriceLocator(
  card: Locator,
  exactTestId: string,
  fallbackSelector: string
): Promise<Locator> {
  const exact = card.getByTestId(exactTestId);
  const isPresent = await exact.isVisible().catch(() => false);
  return isPresent ? exact : card.locator(fallbackSelector).first();
}
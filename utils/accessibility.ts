import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export async function scanAccessibility(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  if (results.violations.length > 0) {
    console.table(results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      nodes: violation.nodes.length,
    })));
  }
  return results;
}
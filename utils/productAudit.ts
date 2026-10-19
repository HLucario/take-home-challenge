import { parseLocalizedPrice } from './priceUtils.js';
import { normaliseName } from './textUtils.js';
import type { ApiProduct } from './productData.js';

export interface UiProduct {
  name: string;
  originalPrice: string;
  discountedPrice: string | null;
}

export interface ProductAuditResult {
  uiProductCount: number;
  sourceProductCount: number;
  matchedProductCount: number;
  discrepancies: string[];
}

export function auditProducts(
  uiProducts: UiProduct[],
  sourceProducts: ApiProduct[],
  priceTolerance: number
): ProductAuditResult {
  const discrepancies: string[] = [];
  let matchedProductCount = 0;

  for (const uiProduct of uiProducts) {
    const uiName = normaliseName(uiProduct.name);
    const sourceMatch = sourceProducts.find(product => {
      const sourceName = normaliseName(product.title ?? product.displayName ?? '');
      return sourceName.includes(uiName) || uiName.includes(sourceName);
    });

    if (!sourceMatch) {
      discrepancies.push(`Product not found in source data: "${uiProduct.name}"`);
      continue;
    }

    matchedProductCount++;
    const displayedPrice = uiProduct.discountedPrice ?? uiProduct.originalPrice;
    const uiPrice = parseLocalizedPrice(displayedPrice);
    const sourcePrice = sourceMatch.salePrice ?? sourceMatch.listPrice ?? sourceMatch.price;

    if (
      sourcePrice !== undefined &&
      uiPrice !== undefined &&
      Math.abs(sourcePrice - uiPrice) > priceTolerance
    ) {
      discrepancies.push(
        `Price mismatch for "${uiProduct.name}": UI ${displayedPrice}, source ${sourcePrice}`
      );
    }
  }

  return {
    uiProductCount: uiProducts.length,
    sourceProductCount: sourceProducts.length,
    matchedProductCount,
    discrepancies,
  };
}
export interface ApiProduct {
  productId: string;
  title: string;
  displayName?: string;
  salePrice?: number;
  listPrice?: number;
  price?: number;
}

type ProductRecord = Record<string, unknown>;

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function nestedNumber(value: unknown, key: string): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return numberValue((value as ProductRecord)[key]);
}

function normalizeProduct(value: unknown): ApiProduct | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as ProductRecord;
  const priceInfo = record.priceInfo as ProductRecord | undefined;
  const title = typeof record.title === 'string'
    ? record.title
    : typeof record.displayName === 'string' ? record.displayName : undefined;
  const productId = typeof record.productId === 'string'
    ? record.productId
    : typeof record.skuRepositoryId === 'string' ? record.skuRepositoryId : undefined;

  if (!title && !productId) return undefined;

  return {
    productId: productId ?? '',
    title: title ?? '',
    displayName: typeof record.displayName === 'string' ? record.displayName : undefined,
    salePrice:
      numberValue(record.salePrice) ??
      nestedNumber(priceInfo?.promoPrice, 'price') ??
      numberValue(priceInfo?.salePrice),
    listPrice:
      numberValue(record.listPrice) ??
      nestedNumber(record.listPrice, 'price') ??
      nestedNumber(priceInfo?.listPrice, 'price'),
    price: numberValue(record.price),
  };
}

function decodeFlightChunk(chunk: string): string {
  const payloads: string[] = [];
  const pushPattern = /self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/gs;
  for (const match of chunk.matchAll(pushPattern)) {
    try {
      payloads.push(JSON.parse(match[1]) as string);
    } catch {
      continue;
    }
  }
  return payloads.length > 0 ? payloads.join('\n') : chunk;
}

function findArrayEnd(value: string, start: number): number | undefined {
  let depth = 0;
  let insideString = false;
  let escaped = false;

  for (let index = start; index < value.length; index++) {
    const character = value[index];
    if (insideString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') insideString = false;
      continue;
    }
    if (character === '"') insideString = true;
    else if (character === '[') depth++;
    else if (character === ']' && --depth === 0) return index;
  }
}

function extractRecordArrays(chunk: string): unknown[][] {
  const arrays: unknown[][] = [];
  const recordsKey = '"records":';
  let searchFrom = 0;

  while (true) {
    const keyIndex = chunk.indexOf(recordsKey, searchFrom);
    if (keyIndex < 0) return arrays;
    const start = chunk.indexOf('[', keyIndex + recordsKey.length);
    if (start < 0) return arrays;
    const end = findArrayEnd(chunk, start);
    if (end === undefined) return arrays;

    try {
      const parsed: unknown = JSON.parse(chunk.slice(start, end + 1));
      if (Array.isArray(parsed)) arrays.push(parsed);
    } catch {
      // Ignore incomplete record arrays in Flight chunks.
    }
    searchFrom = end + 1;
  }
}

export function extractFromNextData(json: Record<string, unknown>): ApiProduct[] {
  const candidates: ApiProduct[][] = [];
  function walk(node: unknown): void {
    if (Array.isArray(node)) {
      const looksLikeProducts =
        node.length > 0 &&
        typeof node[0] === 'object' &&
        node[0] !== null &&
        ('title' in node[0] || 'productId' in node[0] || 'displayName' in node[0]);

      if (looksLikeProducts) {
        const products = node
          .map(normalizeProduct)
          .filter((product): product is ApiProduct => Boolean(product));
        if (products.length > 0) candidates.push(products);
      }
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      Object.values(node as object).forEach(walk);
    }
  }
  walk(json);
  return candidates.sort((a, b) => b.length - a.length)[0] ?? [];
}

export function parseRscChunks(rawChunks: string[]): ApiProduct[] {
  const candidates: ApiProduct[][] = [];
  for (const rawChunk of rawChunks) {
    const chunk = decodeFlightChunk(rawChunk);
    const productKeywords = ['productId', 'displayName', 'salePrice', 'listPrice', 'title'];
    if (!productKeywords.some(keyword => chunk.includes(keyword))) continue;
    for (const records of extractRecordArrays(chunk)) {
      const products = records
        .map(normalizeProduct)
        .filter((product): product is ApiProduct => Boolean(product));
      if (products.length > 0) candidates.push(products);
    }
    const objectMatches = chunk.match(/\{[^{}]{50,}\}/g) ?? [];
    for (const raw of objectMatches) {
      try {
        const value: unknown = JSON.parse(raw);
        if (
          value &&
          typeof value === 'object' &&
          ('productId' in value || 'displayName' in value || 'title' in value)
        ) {
          const product = normalizeProduct(value);
          if (product) candidates.push([product]);
        }
      } catch {
        // Skip fragments that are not complete JSON objects.
      }
    }
    try {
      const parsed: unknown = JSON.parse(chunk);
      const products = extractFromNextData(
        Array.isArray(parsed) ? { items: parsed } : parsed as Record<string, unknown>
      );
      if (products.length > 0) candidates.push(products);
    } catch {
      // Skip chunks that are not complete JSON values.
    }
  }

  const seen = new Set<string>();
  return candidates.flat().filter(product => {
    const key = product.productId ?? product.title ?? '';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
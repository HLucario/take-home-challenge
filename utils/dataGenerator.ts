import { faker } from '@faker-js/faker';

export function createTestRunId(): string {
  return faker.string.alphanumeric(10).toLowerCase();
}

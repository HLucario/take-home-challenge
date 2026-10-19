import dotenv from 'dotenv';
import path from 'node:path';

const shellEnvironment = { ...process.env };
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });
const environment = shellEnvironment.TEST_ENV ?? process.env.TEST_ENV ?? 'dev';
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${environment}`),
  override: true,
  quiet: true,
});
Object.assign(process.env, shellEnvironment);

export const baseUrl = process.env.BASE_URL ?? 'https://www.liverpool.com.mx';

# Liverpool Playwright Test Framework

[![Playwright Tests](https://github.com/HLucario/take-home-challenge/actions/workflows/test.yml/badge.svg)](https://github.com/HLucario/take-home-challenge/actions/workflows/test.yml)

Latest passing run: [Playwright Tests #3](https://github.com/HLucario/take-home-challenge/actions/runs/39273882437)

A TypeScript end-to-end test framework built with Playwright. The suite covers product search, product-data auditing, accessibility, performance, and visual regression across Chromium, Firefox, and WebKit.

## Prerequisites

- Node.js LTS
- npm

## Install

```bash
npm ci
npx playwright install
```

On Linux CI, install browser system dependencies with:

```bash
npx playwright install --with-deps
```

## Run Tests

Tests run headless by default:

```bash
npm test
```

Run headed in a visible browser:

```bash
npm run test:headed
```

Select a browser project:

```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

Run one of those projects headed:

```bash
npm run test:headed -- --project=chromium
```

Typecheck the project with:

```bash
npm run typecheck
```

## Configuration

Set `BASE_URL` and `TEST_ENV` in `.env`, or use an environment-specific file such as `.env.staging`. Copy `.env.example` to `.env` to start with the default Liverpool configuration. Search terms and audit thresholds are in `test-data/searchScenarios.json`.

## Reports

Playwright HTML and test artifacts are written under `reports/`. Generate the Allure HTML report after a test run with:

```bash
npm run report:allure
```

The GitHub Actions workflow at `.github/workflows/test.yml` runs typecheck and the cross-browser suite on pushes, pull requests, and nightly; it also supports manual dispatch and uploads the reports as an artifact.

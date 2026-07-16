import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

const runtimeIssues = new WeakMap<Page, string[]>();
const checkedResourceTypes = new Set(['script', 'stylesheet', 'font']);

test.beforeEach(async ({ page }) => {
  const issues: string[] = [];
  runtimeIssues.set(page, issues);

  page.on('pageerror', (error) => {
    issues.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push(`console.error: ${message.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (checkedResourceTypes.has(request.resourceType())) {
      issues.push(`requestfailed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`);
    }
  });
  page.on('response', (response) => {
    if (checkedResourceTypes.has(response.request().resourceType()) && response.status() >= 400) {
      issues.push(`response: ${response.status()} ${response.url()}`);
    }
  });
});

test.afterEach(async ({ page }) => {
  expect(runtimeIssues.get(page) ?? [], 'ブラウザー実行時のエラー').toEqual([]);
});

test('トップページから代表ドキュメントへ遷移できる', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /Tricentis Testim.*ユーザー制作日本語翻訳ドキュメント/ })
  ).toBeVisible();
  await page.getByRole('link', { name: 'ドキュメントを読む' }).click();
  await expect(page).toHaveURL(/\/docs\/overview\/testim-overview\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('既存のMarkdown拡張が本番ビルドで描画される', async ({ page }) => {
  await page.goto('/docs/administration/api-access');

  await expect(page.getByRole('heading', { level: 1, name: 'Testim REST API' })).toBeVisible();
  await expect(page.locator('.callout').first()).toBeVisible();
  await expect(page.locator('.expressive-code').first()).toBeVisible();
  await expect(page.locator('.heading-link').first()).toBeVisible();

  await page.goto('/docs/recording-tests/how-to-record-a-test');
  await expect(page.getByRole('heading', { level: 1, name: 'Web テストの記録方法' })).toBeVisible();
  await expect(page.locator('.overflow-x-auto > table').first()).toBeVisible();
});

test('検索インデックスとキーボード操作が機能する', async ({ page }) => {
  await page.goto('/docs/overview/testim-overview');

  const searchResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/search.json') && response.request().method() === 'GET'
  );
  await page.getByRole('button', { name: '検索' }).click();
  const response = await searchResponse;
  expect(response.status()).toBe(200);
  await expect(page.getByRole('dialog', { name: 'ドキュメント検索' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'ドキュメント検索' })).toBeHidden();

  await page.getByRole('button', { name: '検索' }).click();

  const searchInput = page.getByRole('combobox', { name: '検索クエリ' });
  await searchInput.fill('REST API');
  await expect(
    page.getByRole('option').filter({ hasText: 'Testim REST API' }).first()
  ).toBeVisible();
  await searchInput.press('ArrowDown');
  await searchInput.press('ArrowUp');
  await searchInput.press('Enter');
  await expect(page).toHaveURL(/\/docs\/administration\/api-access\/?$/);
});

test('リダイレクト、404、robots、sitemapが有効である', async ({ request }) => {
  const deploymentConfig = JSON.parse(await readFile('.vercel/output/config.json', 'utf8')) as {
    routes: Array<{ src?: string; status?: number; headers?: Record<string, string> }>;
  };
  expect(deploymentConfig.routes).toContainEqual(
    expect.objectContaining({
      src: '^/docs/applitools-integration$',
      status: 301,
      headers: { Location: '/docs/integrations/visual-validation' },
    })
  );

  const notFound = await request.get('/this-page-does-not-exist');
  expect(notFound.status()).toBe(404);

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<sitemapindex');
});

test('モバイル幅でページ全体が横にはみ出さない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const targets = [
    {
      path: '/',
      primaryElement: page.getByRole('link', { name: 'ドキュメントを読む' }),
    },
    {
      path: '/docs/administration/api-access',
      primaryElement: page.getByRole('button', { name: '検索' }),
    },
  ];

  for (const { path, primaryElement } of targets) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(primaryElement).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});

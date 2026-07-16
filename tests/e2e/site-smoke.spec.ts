import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

type RuntimeIssue = { message: string; url?: string };

const runtimeIssues = new WeakMap<Page, RuntimeIssue[]>();
const checkedResourceTypes = new Set(['script', 'stylesheet', 'font', 'image']);
const isRemoteTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const expectedDocument404ConsoleErrorPattern =
  /^console\.error: Failed to load resource: the server responded with a status of 404 \((?:Not Found)?\)$/;
const visualViewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'mobile-390x844', width: 390, height: 844 },
];

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

function acknowledgeExpectedDocument404(page: Page) {
  const issues = runtimeIssues.get(page) ?? [];
  const matchingIndexes = issues.flatMap((issue, index) =>
    expectedDocument404ConsoleErrorPattern.test(issue.message) && issue.url === page.url()
      ? [index]
      : []
  );
  expect(
    matchingIndexes.length,
    '404ドキュメントに付随する既知のconsole error数'
  ).toBeLessThanOrEqual(1);

  if (matchingIndexes.length === 1) {
    issues.splice(matchingIndexes[0], 1);
  }
}

test.beforeEach(async ({ page }) => {
  const issues: RuntimeIssue[] = [];
  runtimeIssues.set(page, issues);

  page.on('pageerror', (error) => {
    issues.push({ message: `pageerror: ${error.message}` });
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push({
        message: `console.error: ${message.text()}`,
        url: message.location().url,
      });
    }
  });
  page.on('requestfailed', (request) => {
    if (checkedResourceTypes.has(request.resourceType())) {
      issues.push({
        message: `requestfailed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
      });
    }
  });
  page.on('response', (response) => {
    if (checkedResourceTypes.has(response.request().resourceType()) && response.status() >= 400) {
      issues.push({ message: `response: ${response.status()} ${response.url()}` });
    }
  });
});

test.afterEach(async ({ page }) => {
  expect(runtimeIssues.get(page) ?? [], 'ブラウザー実行時のエラー').toEqual([]);
});

test('トップページから代表ドキュメントへ遷移できる', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Tricentis Testim.*\| Tricentis Testim/);
  await expect(
    page.getByRole('heading', { name: /Tricentis Testim.*ユーザー制作日本語翻訳ドキュメント/ })
  ).toBeVisible();
  await page.getByRole('link', { name: 'ドキュメントを読む' }).click();
  await expect(page).toHaveURL(/\/docs\/overview\/testim-overview\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('デスクトップのサイドバーからドキュメントへ遷移できる', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/docs/overview/testim-overview');

  const navigation = page.getByRole('navigation', { name: 'ドキュメントナビゲーション' });
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Web とモバイルテスト', exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/overview\/testim-overview\/testim-automate\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Web とモバイルテスト' })).toBeVisible();
});

test('APIドキュメントのMarkdown拡張と主要画像が本番ビルドで描画される', async ({ page }) => {
  await page.goto('/docs/administration/api-access');

  await expect(page.getByRole('heading', { level: 1, name: 'Testim REST API' })).toBeVisible();
  await expect(page.locator('.callout').first()).toBeVisible();
  await expect(page.locator('.expressive-code').first()).toBeVisible();
  await expect(page.locator('.heading-link').first()).toBeVisible();

  const contentImage = page.getByRole('img', {
    name: 'API 設定ページと Generate API Key ボタン',
  });
  await expect(contentImage).toBeVisible();
  await expect(contentImage).toHaveJSProperty('complete', true);
  expect(
    await contentImage.evaluate((image: HTMLImageElement) => image.naturalWidth)
  ).toBeGreaterThan(0);
});

test('記録ドキュメントの表と主要画像が本番ビルドで描画される', async ({ page }) => {
  await page.goto('/docs/recording-tests/how-to-record-a-test');

  await expect(page.getByRole('heading', { level: 1, name: 'Web テストの記録方法' })).toBeVisible();
  await expect(page.locator('.overflow-x-auto > table').first()).toBeVisible();

  const contentImage = page.getByRole('img', { name: 'New Test の作成' });
  await expect(contentImage).toBeVisible();
  await expect(contentImage).toHaveJSProperty('complete', true);
  expect(
    await contentImage.evaluate((image: HTMLImageElement) => image.naturalWidth)
  ).toBeGreaterThan(0);
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

test('モバイルのカテゴリナビゲーションからドキュメントへ遷移できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/overview/testim-overview');

  await expect(page.getByRole('navigation', { name: 'ドキュメントナビゲーション' })).toBeHidden();
  const navigation = page.getByRole('combobox', { name: 'カテゴリナビゲーション' });
  await expect(navigation).toBeVisible();
  await navigation.selectOption('/docs/administration/api-access');
  await expect(page).toHaveURL(/\/docs\/administration\/api-access\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Testim REST API' })).toBeVisible();
});

test('404ページが期待どおり表示される', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'ページが見つかりません' })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'トップページへ戻る' })).toHaveAttribute('href', '/');
  acknowledgeExpectedDocument404(page);
});

test('リダイレクト、robots、sitemapが有効である', async ({ request }) => {
  if (isRemoteTarget) {
    const redirect = await request.get('/docs/applitools-integration', { maxRedirects: 0 });
    expect(redirect.status()).toBe(301);
    expect(new URL(redirect.headers().location, 'https://example.invalid').pathname).toBe(
      '/docs/integrations/visual-validation'
    );
  } else {
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
  }

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<sitemapindex');
});

test('公開ページにセキュリティヘッダーが付与される', async ({ request }) => {
  if (isRemoteTarget) {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    expect(response.headers()).toMatchObject({
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
    });
  } else {
    const vercelConfig = JSON.parse(await readFile('vercel.json', 'utf8')) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    expect(vercelConfig.headers).toContainEqual(
      expect.objectContaining({
        source: '/(.*)',
        headers: expect.arrayContaining([
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ]),
      })
    );
  }
});

test('設定済みのNoto Sans JP 4ウェイトを読み込める', async ({ page }) => {
  await page.goto('/');

  const fontFaceResults = await page.evaluate(async () => {
    const weights = ['400', '500', '600', '700'];
    const fontLoadCanary = 'Testim';
    const normalizeFamily = (family: string) => family.replace(/^(['"])(.*)\1$/, '$2');
    const fontFamily = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-noto-sans-jp')
      .split(',')[0]
      .trim();
    const matchingFaces = Array.from(document.fonts).filter(
      (face) => normalizeFamily(face.family) === normalizeFamily(fontFamily)
    );

    return Promise.all(
      weights.map(async (weight) => {
        const faces = matchingFaces.filter(
          (face) => face.weight === weight && face.style === 'normal'
        );
        await Promise.all(faces.map((face) => face.load()));
        const canaryFaces = await document.fonts.load(
          `${weight} 16px ${fontFamily}`,
          fontLoadCanary
        );
        return {
          weight,
          count: faces.length,
          loaded: faces.length === 1 && faces[0].status === 'loaded',
          canaryMatched: faces.length === 1 && canaryFaces.includes(faces[0]),
        };
      })
    );
  });
  expect(fontFaceResults).toEqual(
    ['400', '500', '600', '700'].map((weight) => ({
      weight,
      count: 1,
      loaded: true,
      canaryMatched: true,
    }))
  );
});

test('desktopとmobileでトップページが横にはみ出さない', async ({ page }, testInfo) => {
  await page.setViewportSize(visualViewports[0]);
  await page.goto('/');

  for (const viewport of visualViewports) {
    await page.setViewportSize(viewport);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ドキュメントを読む' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const screenshotName = `home-${viewport.name}`;
    const screenshotPath = testInfo.outputPath(`${screenshotName}.png`);
    await page.screenshot({ path: screenshotPath });
    await testInfo.attach(screenshotName, { path: screenshotPath, contentType: 'image/png' });
  }
});

test('desktopとmobileで代表ドキュメントが横にはみ出さない', async ({ page }, testInfo) => {
  await page.setViewportSize(visualViewports[0]);
  await page.goto('/docs/administration/api-access');

  for (const viewport of visualViewports) {
    await page.setViewportSize(viewport);

    await expect(page.getByRole('heading', { level: 1, name: 'Testim REST API' })).toBeVisible();
    await expect(page.getByRole('button', { name: '検索' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const screenshotName = `api-access-${viewport.name}`;
    const screenshotPath = testInfo.outputPath(`${screenshotName}.png`);
    await page.screenshot({ path: screenshotPath });
    await testInfo.attach(screenshotName, { path: screenshotPath, contentType: 'image/png' });
  }
});

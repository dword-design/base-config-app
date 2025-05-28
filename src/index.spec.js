import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import { expect } from '@playwright/test';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import { test } from 'playwright-local-tmp-dir';
import kill from 'tree-kill-promise';

test('dev', async ({ page }) => {
  test.setTimeout(60_000);
  await outputFiles({
    'config.js': "export default { name: 'Foo' }",
    'package.json': JSON.stringify({}),
    'pages/index.vue': endent`
      <template>
        <div class="foo" />
      </template>
    `,
  });

  const base = new Base({ name: '../src/index.js' });
  await base.prepare();
  const nuxt = base.run('dev');

  try {
    await nuxtDevReady();
    await page.goto('http://localhost:3000');
    await expect(page.locator('.foo')).toBeAttached();
    expect(await page.title()).toEqual('Foo');
  } finally {
    await kill(nuxt.pid);
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
});

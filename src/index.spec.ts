import { Base } from '@dword-design/base';
import { expect, test } from '@playwright/test';
import endent from 'endent';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import kill from 'tree-kill-promise';

test('dev', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'config.ts': "export default { name: 'Foo' };",
    'package.json': JSON.stringify({}),
    'pages/index.vue': endent`
      <template>
        <div class="foo" />
      </template>
    `,
  });

  const base = new Base({ name: '../../src' }, { cwd });
  await base.prepare();
  const port = await getPort();
  const nuxt = base.run('dev', { env: { PORT: port } });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    await expect(page.locator('.foo')).toBeAttached();
    expect(await page.title()).toEqual('Foo');
  } finally {
    await kill(nuxt.pid);
  }
});

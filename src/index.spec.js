import { Base } from '@dword-design/base';
import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import kill from 'tree-kill-promise';

export default tester(
  {
    async dev() {
      await outputFiles({
        'config.js': endent`
          export default {
            name: 'Foo',
          }
        `,
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
        await this.page.goto('http://localhost:3000');
        await this.page.$('.foo');
        expect(await this.page.title()).toEqual('Foo');
      } finally {
        await kill(nuxt.pid);
      }
    },
  },
  [testerPluginPuppeteer(), testerPluginTmpDir()],
);

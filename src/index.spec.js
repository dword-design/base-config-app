import { endent, noop } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import outputFiles from 'output-files'
import portReady from 'port-ready'
import kill from 'tree-kill-promise'

export default tester(
  {
    dev: {
      files: {
        'nuxt.config.js': endent`
        export default {
          name: 'Foo',
        }

      `,
        'pages/index.vue': endent`
          <script>
          export default {
            render() {
              return <div class="foo" />
            }
          }
          </script>

      `,
      },
      test: async () => {
        const childProcess = execa.command('base dev')
        try {
          await portReady(3000)
          await this.page.goto('http://localhost:3000')
          await this.page.waitForSelector('.foo')
          expect(await this.page.title()).toEqual('Foo')
        } finally {
          await kill(childProcess.pid)
        }
      },
    },
  },
  [
    {
      transform: config => () => {
        config = { test: noop, ...config }

        return async () => {
          await outputFiles({
            'node_modules/base-config-self/index.js':
              "module.exports = require('../../../src')",
            'package.json': JSON.stringify(
              {
                baseConfig: 'self',
              },
              undefined,
              2
            ),
            ...config.files,
          })
          await config.test()
        }
      },
    },
    testerPluginPuppeteer(),
    testerPluginTmpDir(),
  ]
)

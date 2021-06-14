import { endent, mapValues, noop } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import stealthyRequire from 'stealthy-require-no-leak'
import withLocalTmpDir from 'with-local-tmp-dir'

let browser
let page

const runTest = config => () => {
  config = { test: noop, ...config }

  return withLocalTmpDir(async () => {
    await outputFiles(config.files)

    const nuxtConfig = stealthyRequire(require.cache, () =>
      require('./nuxt.config')
    )

    const nuxt = new Nuxt(nuxtConfig)
    await new Builder(nuxt).build()
    await nuxt.listen()
    try {
      await config.test()
    } finally {
      await nuxt.close()
    }
  })
}

export default {
  after: () => browser.close(),
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  ...({
    valid: {
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
                return <div />
              }
            }
            </script>

        `,
      },
      test: async () => {
        await page.goto('http://localhost:3000')
        expect(await page.title()).toEqual('Foo')
      },
    },
  } |> mapValues(runTest)),
}

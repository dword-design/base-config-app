import nuxtConfig from '@dword-design/base-config-nuxt'
import execa from 'execa'
import { outputFile } from 'fs-extra'
import getPackageName from 'get-package-name'
import loadPkg from 'load-pkg'

import ecosystem from './ecosystem'

const packageConfig = loadPkg.sync()

export default {
  ...nuxtConfig,
  prepare: async () => {
    await nuxtConfig.prepare()
    return outputFile('ecosystem.json', JSON.stringify(ecosystem, undefined, 2))
  },
  gitignore: [...nuxtConfig.gitignore, '/.ceilingrc.json', '/ecosystem.json'],
  packageConfig: {
    main: 'dist/index.js',
  },
  npmPublish: false,
  useJobMatrix: false,
  ...(!packageConfig.private && {
    deployPlugins: [
      [
        getPackageName(require.resolve('@semantic-release/exec')),
        {
          publishCmd: `${getPackageName(
            require.resolve('pm2')
          )} deploy production`,
        },
      ],
    ],
    preDeploySteps: [
      {
        uses: 'webfactory/ssh-agent@v0.4.0',
        with: {
          'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}',
        },
      },
    ],
  }),
  commands: {
    ...nuxtConfig.commands,
    setupDeploy: {
      handler: () =>
        execa.command('pm2 deploy production setup', { stdio: 'inherit' }),
    },
    pull: {
      arguments: '<endpoint>',
      handler: endpoint =>
        execa.command(`ceiling pull ${endpoint}`, { stdio: 'inherit' }),
    },
    push: {
      arguments: '<endpoint>',
      handler: endpoint =>
        execa.command(`ceiling push ${endpoint}`, { stdio: 'inherit' }),
    },
  },
}

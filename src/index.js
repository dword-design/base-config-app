import nuxtConfig from '@dword-design/base-config-nuxt'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import { outputFile } from 'fs-extra'
import loadPkg from 'load-pkg'

import ecosystem from './ecosystem'

const packageConfig = loadPkg.sync()

export default {
  ...nuxtConfig,
  editorIgnore: [...nuxtConfig.editorIgnore, 'ecosystem.json'],
  gitignore: [...nuxtConfig.gitignore, '/.ceilingrc.json'],
  npmPublish: false,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: async () => {
    await nuxtConfig.prepare()
    return outputFile('ecosystem.json', JSON.stringify(ecosystem, undefined, 2))
  },
  useJobMatrix: false,
  ...(!packageConfig.private && {
    deployPlugins: [
      [
        packageName`@semantic-release/exec`,
        {
          publishCmd: `${packageName`pm2`} deploy production --force`,
        },
      ],
    ],
    preDeploySteps: [
      {
        uses: 'webfactory/ssh-agent@v0.4.1',
        with: {
          'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}',
        },
      },
      { run: 'ssh-keyscan dword-design.de >> ~/.ssh/known_hosts' },
    ],
  }),
  commands: {
    ...nuxtConfig.commands,
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
    setupDeploy: {
      handler: () =>
        execa.command('pm2 deploy production setup', { stdio: 'inherit' }),
    },
  },
}

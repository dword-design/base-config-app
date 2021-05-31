import baseConfigNuxt from '@dword-design/base-config-nuxt'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import loadPkg from 'load-pkg'
import outputFiles from 'output-files'
import yaml from 'yaml'

import dockerCompose from './docker-compose'
import ecosystem from './ecosystem'
import nginxConfig from './nginx-config'

const packageConfig = loadPkg.sync()

export default {
  ...baseConfigNuxt,
  isLockFileFixCommitType: true,
  allowedMatches: [
    ...baseConfigNuxt.allowedMatches,
    'docker-compose.yml',
    'ecosystem.json',
    'nginx',
  ],
  editorIgnore: [
    ...baseConfigNuxt.editorIgnore,
    'docker-compose.yml',
    'ecosystem.json',
    'nginx',
  ],
  gitignore: [
    ...baseConfigNuxt.gitignore,
    '/.ceilingrc.json',
    '/nginx/default.config',
  ],
  npmPublish: false,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: async () => {
    await baseConfigNuxt.prepare()

    return outputFiles({
      'docker-compose.yml': yaml.stringify(dockerCompose),
      'ecosystem.json': JSON.stringify(ecosystem, undefined, 2),
      'nginx/default.config': JSON.stringify(nginxConfig, undefined, 2),
    })
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
        uses: 'webfactory/ssh-agent@v0.5.1',
        with: {
          'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}',
        },
      },
      { run: 'ssh-keyscan dword-design.de >> ~/.ssh/known_hosts' },
    ],
  }),
  commands: {
    ...baseConfigNuxt.commands,
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

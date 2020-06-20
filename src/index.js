import nuxtConfig from '@dword-design/base-config-nuxt'
import depcheckCeilingSpecial from '@dword-design/depcheck-special-ceiling'
import execa from 'execa'
import getPackageName from 'get-package-name'
import loadPkg from 'load-pkg'

const packageConfig = loadPkg.sync()

export default {
  ...nuxtConfig,
  depcheckConfig: {
    ...nuxtConfig.depcheckConfig,
    specials: [...nuxtConfig.depcheckConfig.specials, depcheckCeilingSpecial],
  },
  allowedMatches: [...nuxtConfig.allowedMatches, '.ceilingrc.json'],
  gitignore: [...nuxtConfig.gitignore, '/.ceilingrc.json'],
  packageConfig: {
    main: 'dist/index.js',
  },
  npmPublish: false,
  useJobMatrix: false,
  ...(!packageConfig.private && {
    deployPlugins: [
      getPackageName(require.resolve('@dword-design/semantic-release-vserver')),
    ],
    deployEnv: {
      SSH_USER: '${{ secrets.SSH_USER }}',
      SSH_PRIVATE_KEY: '${{ secrets.SSH_PRIVATE_KEY }}',
    },
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
  },
}

import nuxtConfig from '@dword-design/base-config-nuxt'
import getPackageName from 'get-package-name'
import loadPkg from 'load-pkg'

const packageConfig = loadPkg.sync()

export default {
  ...nuxtConfig,
  packageConfig: {
    main: 'dist/index.js',
    private: true,
    workspaces: ['modules/*'],
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
}

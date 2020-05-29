import nuxtConfig from '@dword-design/base-config-nuxt'
import getPackageName from 'get-package-name'

export default {
  ...nuxtConfig,
  npmPublish: false,
  useJobMatrix: false,
  deployPlugins: [
    getPackageName(require.resolve('@dword-design/semantic-release-vserver')),
  ],
  deployEnv: {
    SSH_HOST: 'dword-design.de',
    SSH_USER: '${{ secrets.SSH_USER }}',
    SSH_PRIVATE_KEY: '${{ secrets.SSH_PRIVATE_KEY }}',
  },
}

import nuxtConfig from '@dword-design/base-config-nuxt'
import getPackageName from 'get-package-name'

export default {
  ...nuxtConfig,
  npmPublish: false,
  deployPlugins: [
    getPackageName(require.resolve('@dword-design/semantic-release-vserver')),
  ],
}

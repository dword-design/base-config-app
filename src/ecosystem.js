import { existsSync } from 'fs-extra'
import parseGitConfig from 'parse-git-config'

const repositoryUrl = existsSync('.git')
  ? parseGitConfig.sync()['remote "origin"']?.url
  : undefined

export default {
  apps: [
    {
      name: 'test-pm2-deploy',
      exec_mode: 'cluster',
      instances: 'max',
      script: './node_modules/nuxt/bin/nuxt.js',
      args: 'start',
    },
  ],
  deploy: {
    production: {
      user: 'root',
      host: ['dword-design.de'],
      path: '/var/www/test-pm2-deploy',
      ...(repositoryUrl && { repo: repositoryUrl }),
      ref: 'origin/master',
      'post-deploy':
        'source ~/.nvm/nvm.sh && yarn --frozen-lockfile && yarn nuxt build && pm2 startOrReload ecosystem.json',
    },
  },
}

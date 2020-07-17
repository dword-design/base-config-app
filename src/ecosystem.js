import { existsSync } from 'fs-extra'
import loadPkg from 'load-pkg'
import parseGitConfig from 'parse-git-config'
import parsePkgName from 'parse-pkg-name'

const repositoryUrl = existsSync('.git')
  ? parseGitConfig.sync()['remote "origin"']?.url
  : undefined
const packageConfig = loadPkg.sync()
const packageName = parsePkgName(packageConfig.name).name

export default {
  apps: [
    {
      name: packageName,
      exec_mode: 'cluster',
      instances: 'max',
      script: 'npm',
      args: 'start',
    },
  ],
  deploy: {
    production: {
      user: 'root',
      host: ['dword-design.de'],
      path: `/var/www/${packageName}`,
      ...(repositoryUrl && { repo: repositoryUrl }),
      ref: 'origin/master',
      'post-deploy':
        'source ~/.nvm/nvm.sh && yarn --frozen-lockfile && yarn build && pm2 startOrReload ecosystem.json',
    },
  },
}

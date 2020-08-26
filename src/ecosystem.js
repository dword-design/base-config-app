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
      args: 'start',
      exec_mode: 'cluster',
      instances: 'max',
      name: packageName,
      script: 'npm',
    },
  ],
  deploy: {
    production: {
      host: ['dword-design.de'],
      path: `/var/www/${packageName}`,
      user: 'root',
      ...(repositoryUrl && { repo: repositoryUrl }),
      'post-deploy':
        'source ~/.nvm/nvm.sh && yarn --frozen-lockfile && yarn prepublishOnly && pm2 startOrReload ecosystem.json',
      ref: 'origin/master',
    },
  },
}

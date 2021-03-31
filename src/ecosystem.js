import { existsSync } from 'fs-extra'
import hostedGitInfo from 'hosted-git-info'
import loadPkg from 'load-pkg'
import parseGitConfig from 'parse-git-config'
import parsePkgName from 'parse-pkg-name'

const repositoryUrl = existsSync('.git')
  ? parseGitConfig.sync()['remote "origin"']?.url
  : undefined

const gitInfo = hostedGitInfo.fromUrl(repositoryUrl) || {}
if (repositoryUrl !== undefined && gitInfo.type !== 'github') {
  throw new Error('Only GitHub repositories are supported.')
}

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
      ...(repositoryUrl && {
        repo: `git@github.com:${gitInfo.user}/${gitInfo.project}.git`,
      }),
      'post-deploy':
        'source ~/.nvm/nvm.sh && yarn --frozen-lockfile && yarn prepublishOnly && pm2 startOrReload ecosystem.json',
      ref: 'origin/master',
    },
  },
}

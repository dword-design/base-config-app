import fs from 'fs-extra'
import hostedGitInfo from 'hosted-git-info'
import parseGitConfig from 'parse-git-config'
import parsePackagejsonName from 'parse-packagejson-name'

export default packageConfig => {
  const repositoryUrl = fs.existsSync('.git')
    ? parseGitConfig.sync()['remote "origin"']?.url
    : undefined

  const gitInfo = hostedGitInfo.fromUrl(repositoryUrl) || {}
  if (repositoryUrl !== undefined && gitInfo.type !== 'github') {
    throw new Error('Only GitHub repositories are supported.')
  }

  const packageName = parsePackagejsonName(packageConfig.name).fullName

  return {
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
        host: ['sebastianlandwehr.com'],
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
}

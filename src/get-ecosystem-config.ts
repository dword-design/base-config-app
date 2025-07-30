import pathLib from 'node:path';

import fs from 'fs-extra';
import hostedGitInfo from 'hosted-git-info';
import parseGitConfig from 'parse-git-config';
import parsePackagejsonName from 'parse-packagejson-name';

export default (packageConfig, { cwd = '.' } = {}) => {
  const repositoryUrl = fs.existsSync(pathLib.join(cwd, '.git'))
    ? parseGitConfig.sync({ cwd })['remote "origin"']?.url
    : undefined;

  const gitInfo = hostedGitInfo.fromUrl(repositoryUrl) || {};

  if (repositoryUrl !== undefined && gitInfo.type !== 'github') {
    throw new Error('Only GitHub repositories are supported.');
  }

  const packageName = parsePackagejsonName(packageConfig.name).fullName;
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
        'post-deploy':
          'source ~/.nvm/nvm.sh && pnpm install --frozen-lockfile && pnpm checkUnknownFiles && pnpm prepublishOnly && pm2 startOrReload ecosystem.json',
        ref: 'origin/master',
        user: 'root',
        ...(repositoryUrl && {
          repo: `git@github.com:${gitInfo.user}/${gitInfo.project}.git`,
        }),
      },
    },
  };
};

import getBaseConfigNuxt from '@dword-design/base-config-nuxt';
import packageName from 'depcheck-package-name';
import { execaCommand } from 'execa';
import loadPkg from 'load-pkg';
import outputFiles from 'output-files';
import yaml from 'yaml';

import dockerCompose from './docker-compose.js';
import getEcosystemConfig from './get-ecosystem-config.js';
import getNginxConfig from './get-nginx-config.js';

export default config => {
  const baseConfigNuxt = getBaseConfigNuxt(config);
  const packageConfig = loadPkg.sync();
  return {
    ...baseConfigNuxt,
    allowedMatches: [
      ...baseConfigNuxt.allowedMatches,
      'docker-compose.yml',
      'ecosystem.json',
      'nginx',
    ],
    editorIgnore: [
      ...baseConfigNuxt.editorIgnore,
      'docker-compose.yml',
      'ecosystem.json',
      'nginx',
    ],
    gitignore: [
      ...baseConfigNuxt.gitignore,
      '/.ceilingrc.json',
      '/nginx/default.config',
    ],
    isLockFileFixCommitType: true,
    npmPublish: false,
    packageConfig: { main: 'dist/index.js' },
    prepare: async () => {
      await baseConfigNuxt.prepare();
      return outputFiles({
        'docker-compose.yml': yaml.stringify(dockerCompose),
        'ecosystem.json': JSON.stringify(
          getEcosystemConfig(packageConfig),
          undefined,
          2,
        ),
        'nginx/default.config': getNginxConfig(packageConfig),
      });
    },
    renovateConfig: { ignorePaths: ['docker-compose.yml'] },
    useJobMatrix: false,
    ...(!packageConfig.private && {
      deployPlugins: [
        [
          packageName`@semantic-release/exec`,
          { publishCmd: `${packageName`pm2`} deploy production --force` },
        ],
      ],
      preDeploySteps: [
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: { 'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}' },
        },
        { run: 'ssh-keyscan sebastianlandwehr.com >> ~/.ssh/known_hosts' },
      ],
    }),
    commands: {
      ...baseConfigNuxt.commands,
      pull: {
        arguments: '<endpoint>',
        handler: endpoint =>
          execaCommand(`ceiling pull ${endpoint}`, { stdio: 'inherit' }),
      },
      push: {
        arguments: '<endpoint>',
        handler: endpoint =>
          execaCommand(`ceiling push ${endpoint}`, { stdio: 'inherit' }),
      },
      setupDeploy: {
        handler: () =>
          execaCommand('pm2 deploy production setup', { stdio: 'inherit' }),
      },
    },
  };
};

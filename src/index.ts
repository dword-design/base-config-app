import { type Base, type Config, defineBaseConfig } from '@dword-design/base';
import getBaseConfigNuxt, {
  getEslintConfig,
} from '@dword-design/base-config-nuxt';
import packageName from 'depcheck-package-name';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';
import { readPackageSync } from 'read-pkg';
import yaml from 'yaml';

import dockerCompose from './docker-compose';
import getEcosystemConfig from './get-ecosystem-config';
import getNginxConfig from './get-nginx-config';

type ConfigApp = Config & { virtualImports?: string[] };

export default defineBaseConfig(function (this: Base, config: ConfigApp) {
  const packageConfig = readPackageSync({ cwd: this.cwd });
  const baseConfigNuxt = getBaseConfigNuxt.call(this, config);
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
    eslintConfig: getEslintConfig({
      ignore: ['ecosystem.json'],
      virtualImports: config.virtualImports,
    }),
    gitignore: [
      ...baseConfigNuxt.gitignore,
      '/.ceilingrc.json',
      '/nginx/default.config',
    ],
    isLockFileFixCommitType: true,
    npmPublish: false,
    prepare: async () => {
      await baseConfigNuxt.prepare();
      return outputFiles(this.cwd, {
        'docker-compose.yml': yaml.stringify(dockerCompose),
        'ecosystem.json': JSON.stringify(
          getEcosystemConfig(packageConfig, { cwd: this.cwd }),
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
          /**
           * TODO: For some reason there are unpushed changes in CI before this command, which is why
           * we need --force. The package.json version change and the changelog change should be
           * pushed by @semantic-release/git in prepare phase.
           * Interestingly I also get "Updates were rejected because the remote contains work that you do
           * not have locally." when pulling, so something seems to get pushed.
           * Output the unpushed diff commit: Add this in publishCmd here below before the deploy command:
           * git log -p @{upstream}.. --max-count=1 &&
           */
          { publishCmd: `${packageName`pm2`} deploy production --force` },
        ],
      ],
      preDeploySteps: [
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: { 'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}' },
        },
        { run: 'ssh-keyscan -H sebastianlandwehr.com >> ~/.ssh/known_hosts' },
      ],
    }),
    commands: {
      ...baseConfigNuxt.commands,
      pull: {
        arguments: '<endpoint>',
        handler: (endpoint: string) =>
          execaCommand(`ceiling pull ${endpoint}`, {
            cwd: this.cwd,
            stdio: 'inherit',
          }),
      },
      push: {
        arguments: '<endpoint>',
        handler: (endpoint: string) =>
          execaCommand(`ceiling push ${endpoint}`, {
            cwd: this.cwd,
            stdio: 'inherit',
          }),
      },
      setupDeploy: {
        handler: () =>
          execaCommand(`${packageName`pm2`} deploy production setup`, {
            cwd: this.cwd,
            stdio: 'inherit',
          }),
      },
    },
  };
});

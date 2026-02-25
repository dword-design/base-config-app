import { createRequire } from 'node:module';

import { type Base, type Config, defineBaseConfig } from '@dword-design/base';
import getBaseConfigNuxt, {
  getEslintConfig,
} from '@dword-design/base-config-nuxt';
import packageName from 'depcheck-package-name';
import endent from 'endent';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import outputFiles from 'output-files';
import { readPackageSync } from 'read-pkg';
import yaml from 'yaml';

import dockerCompose from './docker-compose';
import getEcosystemConfig from './get-ecosystem-config';
import getNginxConfig from './get-nginx-config';

type ConfigApp = Config & { virtualImports?: string[] };
const resolver = createRequire(import.meta.url);

const requirementsYml = fs.readFileSync(
  resolver.resolve('./requirements.yml'),
  'utf8',
);

const playbookYml = fs.readFileSync(resolver.resolve('./playbook.yml'), 'utf8');

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
      'playbook.yml',
      'requirements.yml',
    ],
    editorIgnore: [
      ...baseConfigNuxt.editorIgnore,
      'docker-compose.yml',
      'ecosystem.json',
      'nginx',
      'playbook.yml',
      'requirements.yml',
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
        'playbook.yml': playbookYml,
        'requirements.yml': requirementsYml,
      });
    },
    renovateConfig: { ignorePaths: ['docker-compose.yml'] },
    ...(!packageConfig.private && {
      deployPlugins: [
        [
          packageName`@semantic-release/exec`,
          { publishCmd: 'ansible-playbook playbook.yml -i .inventory' },
        ],
      ],
      preDeploySteps: [
        { name: 'Build project', run: 'pnpm build' },
        { name: 'Create deploy artifact', run: 'tar -czf deploy.tgz .output' },
        {
          name: 'Install Python',
          uses: 'actions/setup-python@v4',
          with: { 'python-version': '3.x' },
        },
        {
          name: 'Install ansible',
          run: endent`
            python -m pip install --upgrade pip
            pip install ansible
          `,
        },
        {
          name: 'Install requirements',
          run: 'ansible-galaxy install -r requirements.yml',
        },
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: { 'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}' },
        },
        { run: 'ssh-keyscan -H sebastianlandwehr.com >> ~/.ssh/known_hosts' },
        {
          run: endent`
            cat <<EOF > .inventory
            [servers]
            sebastianlandwehr.com ansible_user=\${{ secrets.SSH_USER }} ansible_become=True
            EOF
          `,
        },
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

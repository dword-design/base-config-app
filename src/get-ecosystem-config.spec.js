import { expect } from '@playwright/test';
import { execaCommand } from 'execa';
import { test } from 'playwright-local-tmp-dir';

import self from './get-ecosystem-config.js';

test('git https url', async () => {
  await execaCommand('git init');

  await execaCommand(
    'git remote add origin https://github.com/dword-design/foo.git',
  );

  expect(self({ name: 'foo' }).deploy.production.repo).toEqual(
    'git@github.com:dword-design/foo.git',
  );
});

test('git ssh url', async () => {
  await execaCommand('git init');

  await execaCommand(
    'git remote add origin git@github.com:dword-design/foo.git',
  );

  expect(self({ name: 'foo' }).deploy.production.repo).toEqual(
    'git@github.com:dword-design/foo.git',
  );
});

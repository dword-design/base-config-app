import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { execaCommand } from 'execa'

import self from './get-ecosystem-config.js'

export default tester(
  {
    'git https url': async () => {
      await execaCommand('git init')
      await execaCommand(
        'git remote add origin https://github.com/dword-design/foo.git',
      )
      expect(self({ name: 'foo' }).deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git',
      )
    },
    'git ssh url': async () => {
      await execaCommand('git init')
      await execaCommand(
        'git remote add origin git@github.com:dword-design/foo.git',
      )
      expect(self({ name: 'foo' }).deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git',
      )
    },
  },
  [testerPluginTmpDir()],
)

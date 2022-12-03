import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import execa from 'execa'
import fs from 'fs-extra'

import self from './get-ecosystem-config.js'

export default tester(
  {
    'git https url': async () => {
      await fs.outputFile('package.json', JSON.stringify({ name: 'foo' }))
      await execa.command('git init')
      await execa.command(
        'git remote add origin https://github.com/dword-design/foo.git'
      )
      expect(self().deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git'
      )
    },
    'git ssh url': async () => {
      await fs.outputFile('package.json', JSON.stringify({ name: 'foo' }))
      await execa.command('git init')
      await execa.command(
        'git remote add origin git@github.com:dword-design/foo.git'
      )
      expect(self().deploy.production.repo).toEqual(
        'git@github.com:dword-design/foo.git'
      )
    },
  },
  [testerPluginTmpDir()]
)

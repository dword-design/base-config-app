import execa from 'execa'
import { outputFile } from 'fs-extra'
import withLocalTmpDir from 'with-local-tmp-dir'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import self from './get-ecosystem-config.js'

export default tester({
  'git https url': async () => {
    await outputFile('package.json', JSON.stringify({ name: 'foo' }))
    await execa.command('git init')
    await execa.command(
      'git remote add origin https://github.com/dword-design/foo.git'
    )

    expect(self().deploy.production.repo).toEqual(
      'git@github.com:dword-design/foo.git'
    )
  },
  'git ssh url': async () => {
    await outputFile('package.json', JSON.stringify({ name: 'foo' }))
    await execa.command('git init')
    await execa.command(
      'git remote add origin git@github.com:dword-design/foo.git'
    )

    expect(self().deploy.production.repo).toEqual(
      'git@github.com:dword-design/foo.git'
    )
  },
}, [testerPluginTmpDir()])

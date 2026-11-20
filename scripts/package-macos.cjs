#!/usr/bin/env node
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { packager } = require('@electron/packager')

const root = path.resolve(__dirname, '..')

async function main() {
  if (process.platform !== 'darwin') throw new Error('The macOS package must be built on macOS')
  const paths = await packager({
    dir: root, name: 'Overwatch', platform: 'darwin', arch: 'arm64',
    out: '/private/tmp/overwatch-release', overwrite: true, prune: true, asar: true,
    appBundleId: 'com.mayday.overwatch', helperBundleId: 'com.mayday.overwatch.helper',
    appCategoryType: 'public.app-category.utilities', appVersion: require('../package.json').version,
    download: { cacheRoot: path.join(root, '.cache', 'electron') },
    ignore: [/^\/\.git($|\/)/, /^\/work($|\/)/, /^\/release($|\/)/, /^\/coverage($|\/)/, /^\/docs($|\/)/, /^\/src($|\/)/, /^\/electron($|\/)/, /^\/scripts($|\/)/],
  })
  for (const outputPath of paths) {
    const appPath = path.join(outputPath, 'Overwatch.app')
    execFileSync('xattr', ['-cr', appPath], { stdio: 'inherit' })
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
  }
  console.log(`Packaged Overwatch: ${paths.join(', ')}`)
}
main().catch(error => { console.error(error.message); process.exit(1) })

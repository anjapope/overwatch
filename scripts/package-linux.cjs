#!/usr/bin/env node
const path = require('node:path')
const { packager } = require('@electron/packager')

const root = path.resolve(__dirname, '..')

async function main() {
  const paths = await packager({
    dir: root, name: 'Overwatch', platform: 'linux', arch: 'x64',
    out: '/private/tmp/overwatch-linux-release', overwrite: true, prune: true, asar: true,
    appVersion: require('../package.json').version,
    download: { cacheRoot: path.join(root, '.cache', 'electron') },
    ignore: [/^\/\.git($|\/)/, /^\/work($|\/)/, /^\/release($|\/)/, /^\/coverage($|\/)/, /^\/docs($|\/)/, /^\/src($|\/)/, /^\/electron($|\/)/, /^\/scripts($|\/)/],
  })
  console.log(`Packaged Overwatch: ${paths.join(', ')}`)
}
main().catch(error => { console.error(error.message); process.exit(1) })

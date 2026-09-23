#!/usr/bin/env node
const path = require('path')
const assert = require('assert')
const { isLikelyOverwatchProcess } = require('./lifecycle-utils.cjs')

const repoRoot = path.resolve(__dirname, '..')

function makeOwner(cwd, cmd = 'node app') {
  return { pid: 1234, ppid: 1, command: cmd, cwd }
}

const cases = [
  { cwd: repoRoot, expect: true, desc: 'exact repo root' },
  { cwd: path.join(repoRoot, 'subdir'), expect: true, desc: 'child path' },
  { cwd: path.join('/some', 'path with spaces', 'repo'), expect: false, desc: 'unrelated path with spaces' },
  { cwd: path.join(repoRoot, '..', 'other'), expect: false, desc: 'sibling path' },
]

for (const c of cases) {
  const owner = makeOwner(c.cwd)
  const got = isLikelyOverwatchProcess(owner, repoRoot)
  try {
    assert.strictEqual(got, c.expect)
    // eslint-disable-next-line no-console
    console.log('OK:', c.desc)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('FAIL:', c.desc, 'expected', c.expect, 'got', got)
    process.exit(2)
  }
}

// ambiguous metadata fallback: missing cwd
const amb = { pid: 1, ppid: 0, command: 'node', cwd: null }
if (isLikelyOverwatchProcess(amb, repoRoot)) {
  console.error('FAIL: ambiguous owner should not be recognized')
  process.exit(2)
}

// machine-readable lsof (-Fn) parsing check
const { parseLsofFnOutput } = require('./lifecycle-utils.cjs')
const sample = 'p14996\nn/Users/andrewpope/Desktop/overwatch repo/overwatch\n'
const parsed = parseLsofFnOutput(sample)
if (parsed !== path.join(repoRoot)) {
  console.error('FAIL: parseLsofFnOutput did not return expected path')
  console.error('got:', parsed, 'expected:', path.join(repoRoot))
  process.exit(2)
} else {
  console.log('OK: parseLsofFnOutput handles machine-readable cwd with spaces')
}

// all tests passed
console.log('test-ownership: all tests passed')
process.exit(0)


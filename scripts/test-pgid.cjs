#!/usr/bin/env node
const assert = require('assert')
const { getProcessPGID } = require('./lifecycle-utils.cjs')
const { execFileSync } = require('child_process')

function psPgid(pid) {
  try {
    const out = execFileSync('ps', ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8' })
    return Number(out.trim())
  } catch (e) {
    return null
  }
}

const pid = process.pid
const pgid = getProcessPGID(pid)
const expected = psPgid(pid)
if (!pgid || !expected) {
  console.error('Could not determine PGID for process', pid)
  process.exit(2)
}
if (pgid !== expected) {
  console.error('PGID mismatch', { pid, pgid, expected })
  process.exit(2)
}
console.log('test-pgid: OK', { pid, pgid })
process.exit(0)

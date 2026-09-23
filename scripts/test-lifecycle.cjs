#!/usr/bin/env node
const net = require('net')
const fs = require('fs')
const path = require('path')
const assert = require('assert')

function waitForPort(port, timeoutMs = 5000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function attempt() {
      const s = net.connect({ port }, () => { s.destroy(); resolve() })
      s.on('error', () => {
        s.destroy()
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout'))
        setTimeout(attempt, 100)
      })
    })()
  })
}

function waitForFile(filePath, timeoutMs = 5000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function check() {
      fs.stat(filePath, (err) => {
        if (!err) return resolve()
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout'))
        setTimeout(check, 100)
      })
    })()
  })
}

(async () => {
  // Port readiness test
  const server = net.createServer().listen(0)
  await new Promise((r) => server.once('listening', r))
  const port = server.address().port
  try {
    await waitForPort(port)
    console.log('port readiness: OK')
  } catch (e) {
    console.error('port readiness: FAIL')
    process.exit(2)
  } finally {
    server.close()
  }

  // File readiness test
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ow-'))
  const f = path.join(tmpDir, 'file.txt')
  setTimeout(() => fs.writeFileSync(f, 'hi'), 200)
  try {
    await waitForFile(f)
    console.log('file readiness: OK')
  } catch (e) {
    console.error('file readiness: FAIL')
    process.exit(2)
  }

  console.log('test-lifecycle: all tests passed')
  process.exit(0)
})()

#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const net = require('net')
const { getPortOwner, isLikelyOverwatchProcess, getProcessPGID } = require('./lifecycle-utils.cjs')

const REPO_ROOT = path.resolve(__dirname, '..')
const VITE_PORT = 5173

function spawnChild(role, cmd, args, opts = {}) {
  const child = spawn(cmd, args, Object.assign({ cwd: REPO_ROOT, stdio: 'inherit', detached: true }, opts))
  child.role = role
  child.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('child error', role, err)
  })
  return child
}

function waitForPort(port, timeoutMs = 60000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function attempt() {
      const socket = net.connect({ port }, () => {
        socket.destroy()
        resolve()
      })
      socket.on('error', () => {
        socket.destroy()
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout waiting for port'))
        setTimeout(attempt, 150)
      })
    })()
  })
}

function waitForFile(filePath, timeoutMs = 60000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function check() {
      fs.stat(filePath, (err) => {
        if (!err) return resolve()
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout waiting for file'))
        setTimeout(check, 150)
      })
    })()
  })
}

async function ensurePortFreeOrOwned() {
  const owner = await getPortOwner(VITE_PORT)
  if (!owner) return
  if (isLikelyOverwatchProcess(owner, REPO_ROOT)) {
    // attempt graceful shutdown
    try {
      // send SIGINT to process group
      process.kill(-owner.pid, 'SIGINT')
    } catch (e) {
      try { process.kill(owner.pid, 'SIGINT') } catch (e2) {}
    }
    // wait briefly for it to release the port
    try {
      await waitForPortFree(VITE_PORT, 8000)
      return
    } catch (e) {
      // escalate
      try { process.kill(-owner.pid, 'SIGTERM') } catch (e2) {}
      try { process.kill(owner.pid, 'SIGTERM') } catch (e2) {}
    }
    // final attempt
    try { process.kill(-owner.pid, 'SIGKILL') } catch (e) {}
    try { process.kill(owner.pid, 'SIGKILL') } catch (e) {}
  } else {
    // ambiguous — fail safely with details
    // eslint-disable-next-line no-console
    console.error('Port', VITE_PORT, 'is in use by a non-Overwatch process:')
    // eslint-disable-next-line no-console
    console.error(owner)
    process.exit(1)
  }
}

function waitForPortFree(port, timeoutMs = 8000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function attempt() {
      const socket = net.connect({ port }, () => {
        // someone is listening
        socket.destroy()
        if (Date.now() - start > timeoutMs) return reject(new Error('still in use'))
        setTimeout(attempt, 200)
      })
      socket.on('error', () => {
        // connection refused => port free
        socket.destroy()
        resolve()
      })
    })()
  })
}

async function main() {
  // Step 1: check port ownership
  await ensurePortFreeOrOwned()

  // Start Vite renderer
  const vite = spawnChild('vite', 'npm', ['run', 'dev:renderer'])

  // Start TypeScript watcher for electron
  const tsc = spawnChild('tsc', 'npm', ['run', 'dev:electron:ts'])

  // Wait for dev server and compiled electron main
  await waitForPort(VITE_PORT)
  const builtMain = path.join(REPO_ROOT, 'build', 'electron', 'main.cjs')
  await waitForFile(builtMain)

  // Start electron runtime via npm script (owns wait-on & electron invocation)
  const electron = spawnChild('electron', 'npm', ['run', 'dev:electron:run'])

  const children = [vite, tsc, electron].filter(Boolean)

  // enrich children with discovered PGID where possible
  for (const c of children) {
    try {
      const pgid = getProcessPGID(c.pid)
      c._pgid = pgid
    } catch (e) {
      c._pgid = null
    }
  }

  let shuttingDown = false

  async function shutdownOnce(signal) {
    if (shuttingDown) return
    shuttingDown = true
    // eslint-disable-next-line no-console
    console.log('Shutting down development children (signal=%s)...', signal)

    const sendSignalTo = (targetPid, targetPgid, sig) => {
      try {
        if (targetPgid && Number.isFinite(targetPgid)) {
          // send to process group
          process.kill(-targetPgid, sig)
          // eslint-disable-next-line no-console
          console.log('signaled pgid', targetPgid, 'signal', sig)
          return { ok: true }
        }
        // fallback to individual PID
        process.kill(targetPid, sig)
        // eslint-disable-next-line no-console
        console.log('signaled pid', targetPid, 'signal', sig)
        return { ok: true }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('signal failed', { pid: targetPid, pgid: targetPgid, signal: sig, error: err && err.message })
        return { ok: false, err }
      }
    }

    const isAlive = (pid) => {
      try {
        process.kill(pid, 0)
        return true
      } catch (e) {
        return false
      }
    }

    // escalation sequence
    const seq = ['SIGINT', 'SIGTERM', 'SIGKILL']

    for (const sig of seq) {
      // send signal to all remaining children
      for (const c of children) {
        if (!c || !c.pid) continue
        if (!isAlive(c.pid)) continue
        const pgid = c._pgid || getProcessPGID(c.pid)
        // log intent
        // eslint-disable-next-line no-console
        console.log('attempt', sig, 'for', c.role || 'child', 'pid', c.pid, 'pgid', pgid)
        sendSignalTo(c.pid, pgid, sig)
      }

      // wait up to X ms for processes to die
      const waitUntil = Date.now() + 3000
      while (Date.now() < waitUntil) {
        let anyAlive = false
        for (const c of children) {
          if (!c || !c.pid) continue
          if (isAlive(c.pid)) { anyAlive = true; break }
        }
        if (!anyAlive) break
        // short sleep
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 200))
      }

      // if none alive, break escalation
      const survivors = children.filter((c) => c && c.pid && isAlive(c.pid))
      if (survivors.length === 0) break
      // otherwise continue escalation
    }

    // final check and exit
    const finalSurvivors = children.filter((c) => c && c.pid && isAlive(c.pid))
    if (finalSurvivors.length > 0) {
      // eslint-disable-next-line no-console
      console.error('shutdown completed but some children remain:', finalSurvivors.map((c) => ({ role: c.role, pid: c.pid })))
      process.exit(1)
    }

    process.exit(0)
  }

  process.on('SIGINT', () => shutdownOnce('SIGINT'))
  process.on('SIGTERM', () => shutdownOnce('SIGTERM'))

  // If any child exits unexpectedly, begin shutdown
  for (const c of children) {
    c.on('exit', (code, sig) => {
      if (!shuttingDown) shutdownOnce('SIGTERM')
    })
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('dev-launcher failed:', err)
  process.exit(1)
})

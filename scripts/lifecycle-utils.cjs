#!/usr/bin/env node
const { execFileSync } = require('child_process')
const path = require('path')

function runCommand(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8' })
  } catch (e) {
    return ''
  }
}

function parseLsofForPort(port) {
  const out = runCommand('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'])
  if (!out) return null
  const lines = out.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return null
  // parse the first non-header line
  const parts = lines[1].trim().split(/\s+/)
  const command = parts[0]
  const pid = Number(parts[1]) || null
  return { command, pid }
}

function getProcessPPID(pid) {
  const out = runCommand('ps', ['-p', String(pid), '-o', 'ppid='])
  if (!out) return null
  return Number(out.trim()) || null
}

function getProcessCmd(pid) {
  const out = runCommand('ps', ['-p', String(pid), '-o', 'command='])
  return out ? out.trim() : null
}

function parseLsofFnOutput(out) {
  if (!out) return null
  const lines = out.split(/\r?\n/).filter(Boolean)
  for (const line of lines) {
    if (line.startsWith('n')) {
      return line.slice(1)
    }
  }
  return null
}

function getProcessCwd(pid) {
  // Use machine-readable lsof output to get cwd reliably, handling paths with spaces.
  // lsof -a -p <PID> -d cwd -Fn  -> lines beginning with 'n' contain pathnames.
  const out = runCommand('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'])
  const parsed = parseLsofFnOutput(out)
  if (parsed) return parsed
  // fallback to legacy parsing of human-readable output
  const alt = runCommand('lsof', ['-p', String(pid)])
  if (!alt) return null
  const lines = alt.split(/\r?\n/)
  for (const line of lines) {
    const idx = line.indexOf(' cwd ')
    if (idx !== -1) {
      const cwd = line.slice(idx + ' cwd '.length).trim()
      if (cwd) return cwd
    }
  }
  return null
}

function getProcessPGID(pid) {
  try {
    const out = runCommand('ps', ['-o', 'pgid=', '-p', String(pid)])
    if (!out) return null
    const v = out.trim()
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch (e) {
    return null
  }
}

async function getPortOwner(port) {
  const found = parseLsofForPort(port)
  if (!found || !found.pid) return null
  const pid = found.pid
  const ppid = getProcessPPID(pid)
  const command = getProcessCmd(pid)
  const cwd = getProcessCwd(pid)
  return { pid, ppid, command, cwd }
}

function isLikelyOverwatchProcess(owner, repoRoot) {
  if (!owner) return false
  if (!owner.cwd) return false
  try {
    const resolvedCwd = path.resolve(owner.cwd)
    const resolvedRepo = path.resolve(repoRoot)
    if (resolvedCwd === resolvedRepo) return true
    if (resolvedCwd.startsWith(resolvedRepo + path.sep)) return true
  } catch (e) {
    return false
  }
  return false
}

module.exports = { getPortOwner, isLikelyOverwatchProcess, getProcessCwd, parseLsofFnOutput, getProcessPGID }

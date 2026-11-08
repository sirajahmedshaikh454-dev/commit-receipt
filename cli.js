#!/usr/bin/env node
// Usage: node cli.js [folder] [--days 7] [--author name] [--html] [--open]
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { FORMAT, parseLog, summarize, renderText, renderHtml, splitPeriod } from './lib.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : fallback; };
const days = Math.max(1, Math.min(3650, parseInt(opt('--days', '7'), 10) || 7));
const author = opt('--author', null);
const open = args.includes('--open') ? (args.splice(args.indexOf('--open'), 1), true) : false;
const html = (args.includes('--html') ? (args.splice(args.indexOf('--html'), 1), true) : false) || open;
const desktop = join(homedir(), 'Desktop');
const root = resolve(args[0] ?? (existsSync(desktop) ? desktop : '.'));

// Repos at the root, one level down, or two levels down. Skips dot-folders and node_modules.
function findRepos(dir, depth = 0) {
  if (existsSync(join(dir, '.git'))) return [dir];
  if (depth >= 2) return [];
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  return entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .flatMap(e => findRepos(join(dir, e.name), depth + 1));
}

const repos = findRepos(root).map(dir => {
  const gitArgs = ['-C', dir, 'log', `--since=${days * 2}.days`, '--numstat', `--format=${FORMAT}`];
  if (author) gitArgs.push(`--author=${author}`);
  try {
    return { name: basename(dir), commits: parseLog(execFileSync('git', gitArgs, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] })) };
  } catch { return { name: basename(dir), commits: [] }; } // empty repo or not readable
});

const { current, prev } = splitPeriod(repos, Date.now() - days * 864e5);
const summary = summarize(current, days, prev);
console.log('\n' + renderText(summary) + '\n');
if (html) { writeFileSync('receipt.html', renderHtml(summary)); console.log(`Printable receipt: ${resolve('receipt.html')}`); }
if (open) {
  const file = resolve('receipt.html');
  const [cmd, a] = process.platform === 'win32' ? ['explorer.exe', [file]] : process.platform === 'darwin' ? ['open', [file]] : ['xdg-open', [file]];
  spawn(cmd, a, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
}

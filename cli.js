#!/usr/bin/env node
// Usage: node cli.js [folder] [--days 7] [--author name]
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { FORMAT, parseLog, summarize, renderText } from './lib.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : fallback; };
const days = Math.max(1, Math.min(3650, parseInt(opt('--days', '7'), 10) || 7));
const author = opt('--author', null);
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
  const gitArgs = ['-C', dir, 'log', `--since=${days}.days`, '--numstat', `--format=${FORMAT}`];
  if (author) gitArgs.push(`--author=${author}`);
  try {
    return { name: basename(dir), commits: parseLog(execFileSync('git', gitArgs, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] })) };
  } catch { return { name: basename(dir), commits: [] }; } // empty repo or not readable
});

console.log('\n' + renderText(summarize(repos, days)) + '\n');

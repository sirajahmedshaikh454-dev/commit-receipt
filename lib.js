// Pure logic: parse git logs, add them up, print a receipt. No I/O here (tested by test.js).

export const FORMAT = '@@%H|%at|%an|%s';

// Parse `git log --numstat --format=@@%H|%at|%an|%s` output.
export function parseLog(text) {
  const commits = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('@@')) {
      const [hash, at, author, ...rest] = line.slice(2).split('|');
      commits.push({ hash, time: Number(at) * 1000, author, subject: rest.join('|'), add: 0, del: 0, files: 0 });
    } else if (commits.length && /^(\d+|-)\t(\d+|-)\t/.test(line)) {
      const [a, d] = line.split('\t');
      const c = commits.at(-1);
      c.add += a === '-' ? 0 : +a; c.del += d === '-' ? 0 : +d; c.files++;
    }
  }
  return commits.filter(c => c.hash && Number.isFinite(c.time));
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STOP = new Set(['the', 'a', 'an', 'to', 'and', 'of', 'for', 'in', 'on', 'with', 'from', 'by', 'at', 'is', 'it', 'co', 'authored', 'claude', 'noreply', 'anthropic', 'com']);
const top = counts => Object.entries(counts).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];

// repos: [{ name, commits }] -> one summary object
export function summarize(repos, days) {
  const all = repos.flatMap(r => r.commits);
  const items = repos.filter(r => r.commits.length).map(r => ({
    name: r.name, qty: r.commits.length,
    add: r.commits.reduce((s, c) => s + c.add, 0), del: r.commits.reduce((s, c) => s + c.del, 0),
  })).sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
  const hours = {}, weekdays = {}, words = {}, dates = new Set();
  for (const c of all) {
    const d = new Date(c.time);
    hours[d.getHours()] = (hours[d.getHours()] ?? 0) + 1;
    weekdays[d.getDay()] = (weekdays[d.getDay()] ?? 0) + 1;
    dates.add(d.toDateString());
    for (const w of c.subject.toLowerCase().match(/[a-z][a-z'-]{1,}/g) ?? []) if (!STOP.has(w)) words[w] = (words[w] ?? 0) + 1;
  }
  const add = items.reduce((s, i) => s + i.add, 0), del = items.reduce((s, i) => s + i.del, 0);
  const longest = all.reduce((m, c) => (c.subject.length > (m?.subject.length ?? -1) ? c : m), null);
  const hour = top(hours), day = top(weekdays), word = top(words);
  return {
    days, items, add, del, net: add - del, commits: all.length,
    nightOwl: all.filter(c => new Date(c.time).getHours() < 5).length,
    activeDays: dates.size,
    busiestHour: hour ? { hour: +hour[0], count: hour[1] } : null,
    busiestDay: day ? DAYS[+day[0]] : null,
    longest: longest?.subject ?? null,
    word: word ? { word: word[0], count: word[1] } : null,
    seed: all.map(c => c.hash.slice(0, 8)).join('') || '0'.repeat(8),
  };
}

export function fortune(s) {
  if (!s.commits) return 'Quiet week. The best code is no code.';
  if (s.nightOwl >= 3) return 'Sleep is also a feature. Ship it.';
  if (s.del > s.add) return 'You left the codebase lighter than you found it.';
  if (s.activeDays >= 5) return 'Consistency compounds. Same time next week?';
  if (s.items.length >= 3) return 'Many repos, one you. Pick a favourite.';
  return 'Small commits, big changes. Keep going.';
}

// Each hex digit -> 4-module bar pattern; looks like a barcode, encodes your hashes.
export function barcode(seed, width = 40) {
  const bars = [...seed.slice(0, width / 4 * 2)].map(ch => parseInt(ch, 16).toString(2).padStart(4, '0')).join('');
  return bars.slice(0, width).replace(/1/g, '█').replace(/0/g, ' ');
}

const n = v => v.toLocaleString('en-US');
const W = 40;
const center = s => ' '.repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
const row = (l, r) => { l = l.length + r.length + 1 > W ? l.slice(0, W - r.length - 2) + '…' : l; return l + ' '.repeat(W - l.length - r.length) + r; };
const rule = '-'.repeat(W);

export function renderText(s, now = new Date(), title = 'DESKTOP CODE MARKET') {
  const stamp = now.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
  const L = [center('*  COMMIT RECEIPT  *'), center(title), center(`${stamp} · LAST ${s.days} DAYS`), rule, row('QTY ITEM', 'LINES')];
  if (!s.items.length) L.push(center('(nothing sold this week)'));
  for (const i of s.items) { L.push(row(`${String(i.qty).padStart(3)} ${i.name}`, `+${n(i.add)}`)); L.push(row('', `-${n(i.del)}`)); }
  L.push(rule,
    row('SUBTOTAL (lines added)', `+${n(s.add)}`),
    row('REFACTOR DISCOUNT', `-${n(s.del)}`));
  if (s.nightOwl) L.push(row(`NIGHT-OWL SURCHARGE x${s.nightOwl}`, 'sleep'));
  L.push(rule, row('TOTAL NET LINES', n(s.net)), row(`${s.commits} COMMITS · ${s.activeDays} ACTIVE DAYS`, ''), rule);
  if (s.busiestHour) L.push(row('BUSIEST HOUR', `${String(s.busiestHour.hour).padStart(2, '0')}:00 (${s.busiestHour.count})`));
  if (s.busiestDay) L.push(row('BUSIEST DAY', s.busiestDay));
  if (s.word) L.push(row('FAVOURITE WORD', `"${s.word.word}" x${s.word.count}`));
  if (s.longest) L.push(row('LONGEST MESSAGE', `${s.longest.length} chars`));
  L.push(rule, barcode(s.seed, W), center(s.seed.slice(0, 16)), '', center('THANK YOU FOR SHIPPING'), center(fortune(s)));
  return L.join('\n');
}

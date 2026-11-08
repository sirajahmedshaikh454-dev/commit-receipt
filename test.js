import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLog, summarize, renderText, barcode, fortune } from './lib.js';

const LOG = `@@aaaa1111|1762560000|Siraj|Add parser | with pipe

10\t2\ta.js
-\t-\timg.png
@@bbbb2222|1762570000|Siraj|Fix parser bug
3\t7\ta.js
`;

test('parseLog reads commits, numstat, binary files and pipes in subjects', () => {
  const c = parseLog(LOG);
  assert.equal(c.length, 2);
  assert.deepEqual([c[0].add, c[0].del, c[0].files], [10, 2, 2]);
  assert.equal(c[0].subject, 'Add parser | with pipe');
  assert.equal(parseLog('').length, 0);
});

test('summarize totals and receipt lines stay 40 wide', () => {
  const s = summarize([{ name: 'a-very-long-repository-name-that-overflows', commits: parseLog(LOG) }, { name: 'empty', commits: [] }], 7);
  assert.deepEqual([s.add, s.del, s.net, s.commits, s.items.length], [13, 9, 4, 2, 1]);
  assert.equal(s.word.word, 'parser');
  const text = renderText(s, new Date(0));
  for (const line of text.split('\n')) assert.ok(line.length <= 40, `too wide: "${line}"`);
});

test('empty week still prints a receipt', () => {
  const s = summarize([], 7);
  assert.match(renderText(s), /nothing sold/);
  assert.match(fortune(s), /Quiet week/);
  assert.equal(barcode('').length, 0);
  assert.equal(barcode('ffff', 8), '████████');
});

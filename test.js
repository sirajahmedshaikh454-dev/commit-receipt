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

test('html escapes repo names and swaps the text barcode for an svg', async () => {
  const { renderHtml } = await import('./lib.js');
  const s = summarize([{ name: '<script>x</script>', commits: parseLog(LOG) }], 7);
  const html = renderHtml(s);
  assert.ok(!html.includes('<script>x'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.match(html, /<svg[^>]*>.*<rect/);
  assert.ok(!html.includes('█'));
});

test('price change and hex-speak coupon', async () => {
  const { change, coupon } = await import('./lib.js');
  assert.equal(change(12, 10), '+20%');
  assert.equal(change(5, 10), '-50%');
  assert.equal(change(3, 0), 'NEW');
  assert.equal(change(3, null), null);
  assert.deepEqual(coupon([{ hash: '1cafe99aaaa' }]), { word: 'cafe', hash: '1cafe99' });
  assert.equal(coupon([{ hash: '1234567cafe' }]), null); // only the visible short hash counts
  const s = summarize([{ name: 'r', commits: [{ ...parseLog(LOG)[0], hash: 'c0ffee1aaaa' }] }], 7, 4);
  const text = renderText(s);
  assert.match(text, /COUPON/);
  assert.match(text, /VS PREVIOUS 7 DAYS \(4\) +-75%/);
});

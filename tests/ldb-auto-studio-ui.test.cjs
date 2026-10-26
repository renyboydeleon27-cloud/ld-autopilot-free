/* LDB Auto Studio front-end guard: never silently disable approval gate. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('ldb-auto-studio.html', 'utf8');
const rawScript = html.match(/<script>([\s\S]*?)<\/script>/);
test('inline reviewer JavaScript parses', () => {
  assert.ok(rawScript, 'Reviewer inline script was not found');
  new vm.Script(rawScript[1], {filename: 'ldb-auto-studio.html'});
});
test('one-file bundle export and privacy warning are present', () => {
  assert.match(html, /id="exportBundle"/);
  assert.match(html, /'ldb-approved-bundle-v1'/);
  assert.match(html, /storyboard_utf8:rawStoryboard/);
  assert.match(html, /id="exportApproval"/);
  assert.match(html, /repository is PUBLIC/);
});
test('no paid render or remote execution in reviewer', () => {
  assert.match(html, /NO[T]? generated|No paid API|no paid API/i);
  assert.doesNotMatch(rawScript[1], /\bfetch\s*\(/);
  assert.doesNotMatch(rawScript[1], /\bXMLHttpRequest\b/);
  assert.doesNotMatch(rawScript[1], /\/api\//);
});

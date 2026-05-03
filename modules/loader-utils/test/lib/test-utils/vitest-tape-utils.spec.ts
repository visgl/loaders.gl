import test, {isBrowser, isNode, testIf, testIfBrowser, testIfNode} from 'tape-promise/tape';

test('vitest tape runtime utils#runtime flags are exclusive', t => {
  t.equal(isNode, !isBrowser);
  t.end();
});

testIf(true, 'vitest tape runtime utils#testIf runs enabled tests', t => {
  t.pass('testIf(true) registered the test body');
  t.end();
});

testIf(false, 'vitest tape runtime utils#testIf skips disabled tests', t => {
  t.fail('testIf(false) should skip this test body');
  t.end();
});

testIfNode('vitest tape runtime utils#testIfNode runs only in Node.js', t => {
  t.equal(isNode, true);
  t.equal(isBrowser, false);
  t.end();
});

testIfBrowser('vitest tape runtime utils#testIfBrowser runs only in browser runtimes', t => {
  t.equal(isBrowser, true);
  t.equal(isNode, false);
  t.end();
});

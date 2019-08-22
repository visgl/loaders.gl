import test from 'tape-promise/tape';
import {
  checkFetchResponseStatus,
  checkFetchResponseStatusSync
} from '@loaders.gl/core/lib/loader-utils/check-errors';

class MockResponse {
  get ok() {
    return false;
  }

  get status() {
    return 404;
  }

  async text() {
    return '{message: "server died"}';
  }
}

const response = new MockResponse();

test('checkFetchResponseStatus', t => {
  t.ok(checkFetchResponseStatus);
  // t.throws()
  t.end();
});

test('checkFetchResponseStatusSync', t => {
  t.throws(
    () => checkFetchResponseStatusSync(response),
    /404/,
    'throws a message that includes status code'
  );
  t.end();
});

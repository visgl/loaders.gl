import {expect, test} from 'vitest';
import {validateWorkerVersion} from '../../../src/lib/worker-api/validate-worker-version';
test('validateWorkerVersion', () => {
  expect(
    // @ts-ignore
    () => validateWorkerVersion({version: '1.9.0'}, null),
    'missing version is ignored'
  ).not.toThrow();
  // @ts-ignore
  expect(() => validateWorkerVersion({}, '1.10.0'), 'missing version is ignored').not.toThrow();
  // @ts-ignore
  expect(
    () => validateWorkerVersion({version: '1.10.0'}, '1.10.3'),
    'version is valid'
  ).not.toThrow();
});

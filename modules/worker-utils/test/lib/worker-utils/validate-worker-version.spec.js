import test from 'tape-promise/tape';
import {validateWorkerVersion} from '@loaders.gl/worker-utils';

test('validateWorkerVersion', t => {
  t.doesNotThrow(
    // @ts-ignore
    () => validateWorkerVersion({version: '1.9.0'}, null),
    'missing version is ignored'
  );
  // @ts-ignore
  t.doesNotThrow(() => validateWorkerVersion({}, '1.10.0'), 'missing version is ignored');
  // @ts-ignore
  t.doesNotThrow(() => validateWorkerVersion({version: '1.10.0'}, '1.10.3'), 'version is valid');
  // TODO enable when fixed
  // t.throws(() => validateWorkerVersion({version: '1.9.0'}, '1.10.0'), 'version is not valid');
  // t.throws(
  //   () => validateWorkerVersion({version: '1.10.0'}, '2.0.0-alpha.1'),
  //   'version is not valid'
  // );

  t.end();
});

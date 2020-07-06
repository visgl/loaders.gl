import test from 'tape-promise/tape';
import {validateLoaderVersion} from '@loaders.gl/loader-utils';

test('validateLoaderVersion', t => {
  t.doesNotThrow(
    () => validateLoaderVersion({version: '1.9.0'}, null),
    'missing version is ignored'
  );
  t.doesNotThrow(() => validateLoaderVersion({}, '1.10.0'), 'missing version is ignored');
  t.doesNotThrow(() => validateLoaderVersion({version: '1.10.0'}, '1.10.3'), 'version is valid');
  // TODO enable when fixed
  // t.throws(() => validateLoaderVersion({version: '1.9.0'}, '1.10.0'), 'version is not valid');
  // t.throws(
  //   () => validateLoaderVersion({version: '1.10.0'}, '2.0.0-alpha.1'),
  //   'version is not valid'
  // );

  t.end();
});

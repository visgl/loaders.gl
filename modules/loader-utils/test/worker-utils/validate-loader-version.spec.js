import test from 'tape-promise/tape';
import {validateLoaderVersion} from '@loaders.gl/loader-utils/lib/validate-loader-version';

test('validateLoaderVersion', t => {
  t.doesNotThrow(
    () => validateLoaderVersion(null, {version: '1.9.0'}),
    'missing version is ignored'
  );
  t.doesNotThrow(() => validateLoaderVersion('1.10.0', {}), 'missing version is ignored');
  t.doesNotThrow(() => validateLoaderVersion('1.10.3', {version: '1.10.0'}), 'version is valid');
  t.throws(() => validateLoaderVersion('1.10.0', {version: '1.9.0'}), 'version is not valid');
  t.throws(
    () => validateLoaderVersion('2.0.0-alpha.1', {version: '1.10.0'}),
    'version is not valid'
  );

  t.end();
});

import test from 'tape-promise/tape';

import {mergeLoaderOptions} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';

// NOTE: addAliases is not a public export, already used by test setup
// import {_addAliases} from '@loaders.gl/loader-utils';

test('mergeLoaderOptions', (t) => {
  const originalOptions: XMLLoaderOptions = {
    xml: {
      _fastXML: {
        allowBooleanAttributes: true,
        ignoreDeclaration: true,
        removeNSPrefix: true
      }
    }
  };

  // Set HTML parsing options
  const mergedOptions = mergeLoaderOptions(originalOptions, {
    xml: {
      _parser: 'fast-xml-parser',
      _fastXML: {
        htmlEntities: true
      }
    }
  });

  const expectedOptions = {
    xml: {
      _parser: 'fast-xml-parser',
      _fastXML: {
        allowBooleanAttributes: true,
        ignoreDeclaration: true,
        removeNSPrefix: true,
        htmlEntities: true
      }
    }
  };

  t.deepEqual(mergedOptions, expectedOptions, 'mergeLoaderOptions() returns correct value');

  t.end();
});

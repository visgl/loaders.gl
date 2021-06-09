import test from 'tape-promise/tape';
import {registerLoaders} from '@loaders.gl/core';
import {getRegisteredLoaders} from '@loaders.gl/core/lib/api/register-loaders';

test('registerLoaders', (t) => {
  const registeredLoadersCount = getRegisteredLoaders().length;

  registerLoaders({
    parseTextSync: (d) => d,
    extensions: ['ext1']
  });

  t.is(getRegisteredLoaders().length - registeredLoadersCount, 1, 'loader is registered');

  registerLoaders([
    {
      parseTextSync: (d) => d,
      extensions: ['ext2']
    },
    [
      {
        parseTextSync: (d) => d,
        extensions: ['ex3']
      },
      {
        textTransform: 'uppercase'
      }
    ]
  ]);

  t.is(getRegisteredLoaders().length - registeredLoadersCount, 3, 'loader is registered');

  const TestLoader = {
    parseTextSync: (d) => d,
    extensions: ['ext2']
  };

  t.doesNotThrow(
    () => registerLoaders(TestLoader),
    'registerLoaders() does not require array of loaders'
  );

  t.end();
});

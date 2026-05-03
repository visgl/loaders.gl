import {expect, test} from 'vitest';
import {registerLoaders} from '@loaders.gl/core';
import {getRegisteredLoaders} from '@loaders.gl/core/lib/api/register-loaders';
test('registerLoaders', () => {
  const registeredLoadersCount = getRegisteredLoaders().length;
  registerLoaders({
    // @ts-expect-error
    parseTextSync: d => d,
    extensions: ['ext1']
  });
  expect(getRegisteredLoaders().length - registeredLoadersCount, 'loader is registered').toBe(1);
  registerLoaders([
    {
      // @ts-expect-error
      parseTextSync: d => d,
      extensions: ['ext2']
    },
    // @ts-expect-error
    [
      {
        parseTextSync: d => d,
        extensions: ['ex3']
      },
      {
        textTransform: 'uppercase'
      }
    ]
  ]);
  expect(getRegisteredLoaders().length - registeredLoadersCount, 'loader is registered').toBe(3);
  const TestLoader = {
    parseTextSync: d => d,
    extensions: ['ext2']
  };
  expect(
    // @ts-expect-error
    () => registerLoaders(TestLoader),
    'registerLoaders() does not require array of loaders'
  ).not.toThrow();
});

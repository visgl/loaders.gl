import test from 'tape-promise/tape';
import {removeNontransferableOptions} from '@loaders.gl/worker-utils';

test('removeNontransferableOptions - Should return empty object if object is null', async (t) => {
  const options = null;

  const transferableData = removeNontransferableOptions(options);

  const expectedResult = {};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('removeNontransferableOptions - Should return empty object if object is function', async (t) => {
  const options = {
    func: () => {}
  };

  const transferableData = removeNontransferableOptions(options);

  const expectedResult = {func: {}};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('removeNontransferableOptions - Should return empty object if object is RegExp', async (t) => {
  const options = {
    reg: /ab+c/i,
    regWithConstructor: new RegExp(/ab+c/, 'i')
  };

  const transferableData = removeNontransferableOptions(options);

  const expectedResult = {reg: {}, regWithConstructor: {}};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('removeNontransferableOptions - Should return new object', async (t) => {
  const options = {test: {test1: 'test1'}};

  const transferableData = removeNontransferableOptions(options);

  const expectedResult = {test: {test1: 'test1'}};

  t.deepEqual(transferableData, expectedResult);
  t.ok(transferableData !== expectedResult);
  // @ts-expect-error
  t.ok(transferableData.test !== expectedResult.test);
  t.end();
});

test('removeNontransferableOptions - Should keep typedArray as it is', async (t) => {
  const options = {
    typedOption: new Uint32Array([1, 2, 3, 4, 5])
  };

  const transferableData = removeNontransferableOptions(options);

  const expectedResult = {typedOption: new Uint32Array([1, 2, 3, 4, 5])};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('removeNontransferableOptions - Should handle hested options.', async (t) => {
  const options = {
    one: {
      two: {
        three: 'first neseted option'
      }
    },
    four: {
      five: function test1() {}
    },
    six: {
      deep: {
        typed: new Uint32Array([1, 2, 3, 4, 5])
      }
    }
  };

  const transferableData = removeNontransferableOptions(options);

  const expectedResult = {
    one: {
      two: {
        three: 'first neseted option'
      }
    },
    four: {
      five: {}
    },
    six: {
      deep: {
        typed: new Uint32Array([1, 2, 3, 4, 5])
      }
    }
  };

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

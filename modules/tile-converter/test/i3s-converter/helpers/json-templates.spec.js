import test from 'tape-promise/tape';
import transform from 'json-map-transform';

const inputData = {
  a: 'Some string - a',
  b: {
    ba: 'Some string - ba',
    bb: 123.123
  }
};

test('tile-converter - Converters#json transform - should fill input data into the template', async (t) => {
  const template = {
    b: {
      path: 'b',
      transform: (val) => `${val.ba} - ${val.bb}`
    }
  };
  const result = transform(inputData, template);
  t.deepEqual(result, {
    b: 'Some string - ba - 123.123'
  });
  t.end();
});

test('cli - Converters#json transform - should fill the result object with the default value in absense of a corresponding value', async (t) => {
  const template = {
    b: {
      path: 'b',
      transform: (val) => `${val.ba} - ${val.bb}`
    },
    d: {
      path: 'd',
      default: 'Default text'
    }
  };
  const result = transform(inputData, template);
  t.deepEqual(result, {
    b: 'Some string - ba - 123.123',
    d: 'Default text'
  });
  t.end();
});

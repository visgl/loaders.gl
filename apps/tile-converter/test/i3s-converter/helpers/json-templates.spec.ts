import {expect, test} from 'vitest';
import transform from 'json-map-transform';
const inputData = {
  a: 'Some string - a',
  b: {
    ba: 'Some string - ba',
    bb: 123.123
  }
};
test('tile-converter(i3s)#json transform - should fill input data into the template', async () => {
  const template = {
    b: {
      path: 'b',
      transform: val => `${val.ba} - ${val.bb}`
    }
  };
  const result = transform(inputData, template);
  expect(result).toEqual({
    b: 'Some string - ba - 123.123'
  });
});
test('tile-converter(i3s)#json transform - should fill the result object with the default value in absense of a corresponding value', async () => {
  const template = {
    b: {
      path: 'b',
      transform: val => `${val.ba} - ${val.bb}`
    },
    d: {
      path: 'd',
      default: 'Default text'
    }
  };
  const result = transform(inputData, template);
  expect(result).toEqual({
    b: 'Some string - ba - 123.123',
    d: 'Default text'
  });
});

import test from 'tape-promise/tape';
import I3SAttributesLoader from '../src/i3s-attributes-loader';

const attributeStorageInfo = [
  {
    key: 'f_0',
    name: 'OBJECTID',
    header: [
      {
        property: 'count',
        valueType: 'UInt32'
      }
    ],
    ordering: ['attributeValues'],
    attributeValues: {
      valueType: 'Oid32',
      valuesPerElement: 1
    }
  },
  {
    key: 'f_1',
    name: 'NAME',
    header: [
      {
        property: 'count',
        valueType: 'UInt32'
      },
      {
        property: 'attributeValuesByteCount',
        valueType: 'UInt32'
      }
    ],
    ordering: ['attributeByteCounts', 'attributeValues'],
    attributeValues: {
      valueType: 'String',
      encoding: 'UTF-8',
      valuesPerElement: 1
    },
    attributeByteCounts: {
      valueType: 'UInt32',
      valuesPerElement: 1
    }
  },
  {
    key: 'f_2',
    name: 'HEIGHTROOF',
    header: [
      {
        property: 'count',
        valueType: 'UInt32'
      }
    ],
    ordering: ['attributeValues'],
    attributeValues: {
      valueType: 'Float64',
      valuesPerElement: 1
    }
  }
];

test('I3SAttributesLoader# should return tile without attributes if no attributeUrls in tile', async t => {
  const tile = {};
  const tileWithAtributes = await I3SAttributesLoader.parse(tile, attributeStorageInfo);
  t.notOk(tileWithAtributes.attributes);
  t.end();
});

test('I3SAttributesLoader# should return tile without attributes if no attributeStorageInfo', async t => {
  const tile = {};
  const tileWithAtributes = await I3SAttributesLoader.parse(tile, null);
  t.notOk(tileWithAtributes.attributes);
  t.end();
});

test('I3SAttributesLoader# should load attributes', async t => {
  const name602 = 'West End Building\0';
  const objecId0 = 979297;
  const heightRoof0 = 32.18;

  const objectIdsUrl = '@loaders.gl/i3s/test/data/attributes/f_0/0/index.bin';
  const namesUrl = '@loaders.gl/i3s/test/data/attributes/f_1/0/index.bin';
  const heightRoofUrl = '@loaders.gl/i3s/test/data/attributes/f_2/0/index.bin';
  const tile = {
    attributeUrls: [objectIdsUrl, namesUrl, heightRoofUrl]
  };
  const tileWithAtributes = await I3SAttributesLoader.parse(tile, attributeStorageInfo);
  t.ok(tileWithAtributes.attributes);
  t.ok(tileWithAtributes.attributes.OBJECTID);
  t.ok(tileWithAtributes.attributes.NAME);
  t.ok(tileWithAtributes.attributes.HEIGHTROOF);
  t.ok(tileWithAtributes.attributes.OBJECTID.length === tileWithAtributes.attributes.NAME.length);
  t.ok(
    tileWithAtributes.attributes.OBJECTID.length === tileWithAtributes.attributes.HEIGHTROOF.length
  );
  t.equal(tileWithAtributes.attributes.OBJECTID[0], objecId0);
  t.equal(tileWithAtributes.attributes.NAME[602], name602);
  t.equal(tileWithAtributes.attributes.HEIGHTROOF[0], heightRoof0);
  t.end();
});

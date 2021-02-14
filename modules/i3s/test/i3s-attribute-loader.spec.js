import test from 'tape-promise/tape';
import {I3SAttributeLoader} from '@loaders.gl/i3s/i3s-attribute-loader';
import {load} from '@loaders.gl/core';

const objectIdsUrl = '@loaders.gl/i3s/test/data/attributes/f_0/0/index.bin';
const namesUrl = '@loaders.gl/i3s/test/data/attributes/f_1/0/index.bin';
const heightRoofUrl = '@loaders.gl/i3s/test/data/attributes/f_2/0/index.bin';

const name602 = 'West End Building\0';
const objecId0 = 979297;
const heightRoof0 = 32.18;

test('I3SAttributeLoader# should return empty object if no attributeName provided', async t => {
  const options = {
    attributeType: 'Oid32'
  };
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.deepEqual(attributes, {});
  t.end();
});

test('I3SAttributeLoader# should return empty object if no attributeType provided', async t => {
  const options = {
    attributeName: 'OBJECTID'
  };
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.deepEqual(attributes, {});
  t.end();
});

test('I3SAttributeLoader# should return empty object if no attributeName and attributeType provided', async t => {
  const options = {};
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.deepEqual(attributes, {});
  t.end();
});

test('I3SAttributeLoader# should load OBJECTID attribute', async t => {
  const options = {
    attributeName: 'OBJECTID',
    attributeType: 'Oid32'
  };
  const attributes = await load(objectIdsUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.ok(attributes.OBJECTID);
  t.equal(attributes.OBJECTID[0], objecId0);
  t.end();
});

test('I3SAttributeLoader# should load string attribute', async t => {
  const options = {
    attributeName: 'NAME',
    attributeType: 'String'
  };
  const attributes = await load(namesUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.ok(attributes.NAME);
  t.equal(attributes.NAME[602], name602);
  t.end();
});

test('I3SAttributeLoader# should load float attribute', async t => {
  const options = {
    attributeName: 'HEIGHTROOF',
    attributeType: 'Float64'
  };
  const attributes = await load(heightRoofUrl, I3SAttributeLoader, options);
  t.ok(attributes);
  t.ok(attributes.HEIGHTROOF);
  t.equal(attributes.HEIGHTROOF[0], heightRoof0);
  t.end();
});

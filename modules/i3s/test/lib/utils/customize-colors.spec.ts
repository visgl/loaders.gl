import test from 'tape-promise/tape';
import {fetchFile, parse} from '@loaders.gl/core';
import {I3SContentLoader, customizeColors} from '@loaders.gl/i3s';

const NEW_YORK_TILE_CONTENT =
  '@loaders.gl/i3s/test/data/Buildings_NewYork_17/SceneServer/layers/0/nodes/2465/geometries/1';
const NEW_YORK_CONTENT_LOADER_OPTIONS =
  '@loaders.gl/i3s/test/data/Buildings_NewYork_17/i3s-content-loader-options.json';

// TODO v4.0 restore this test
test.skip('i3s-utils#customizeColors', async (t) => {
  const response = await fetchFile(NEW_YORK_TILE_CONTENT);
  const data = await response.arrayBuffer();
  const responseOptions = await fetchFile(NEW_YORK_CONTENT_LOADER_OPTIONS);
  const i3sLoaderOptions = await responseOptions.json();
  const content = await parse(data, I3SContentLoader, {
    i3s: i3sLoaderOptions
  });
  const attributeUrls = i3sLoaderOptions._tileOptions.attributeUrls;
  const fields = i3sLoaderOptions._tilesetOptions.fields;
  const attributeStorageInfo = i3sLoaderOptions._tilesetOptions.attributeStorageInfo;

  // test replace mode
  const colorsByAttribute = {
    attributeName: 'HEIGHTROOF',
    minValue: 0,
    maxValue: 100,
    minColor: [1, 0, 0, 255] as [number, number, number, number],
    maxColor: [100, 50, 25, 255] as [number, number, number, number],
    mode: 'replace'
  };
  const newColors = await customizeColors(
    content!.attributes.colors,
    content!.featureIds,
    attributeUrls,
    fields,
    attributeStorageInfo,
    colorsByAttribute
  );
  t.deepEquals(newColors.value.subarray(0, 8), [95, 48, 24, 255, 95, 48, 24, 255]);

  // test multiply mode
  colorsByAttribute.mode = 'multiply';
  content!.attributes.colors.value.set([200, 100, 50, 255, 150, 50, 50, 255]);
  const newColors2 = await customizeColors(
    content!.attributes.colors,
    content!.featureIds,
    attributeUrls,
    fields,
    attributeStorageInfo,
    colorsByAttribute
  );
  t.deepEquals(newColors2.value.subarray(0, 8), [74, 18, 4, 255, 55, 9, 4, 255]);

  // test colorsByAttribute is null
  const newColors3 = await customizeColors(
    content!.attributes.colors,
    content!.featureIds,
    attributeUrls,
    fields,
    attributeStorageInfo,
    null
  );
  t.deepEquals(content!.attributes.colors, newColors3);
  t.end();
});
